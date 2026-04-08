import mongoose from 'mongoose';
import { Redis } from 'ioredis';
import { RateLimiter } from 'limiter';
import logger from '../config/logger';
import { getRedisClient } from '../config/redis';
import { Bracket, BracketModel } from '../models/bracket';
import { Game } from '../models/game';
import { AppError } from '../types/errors';
import { createBracketDataSource } from './dataSources/factory';
import { BracketDataSource, MasterBracketData } from './dataSources/types';

/**
 * MasterBracketService - Manages official tournament results
 *
 * IMPORTANT: The NCAA does not provide a public API for March Madness data.
 * This service is designed to work with multiple data sources:
 *
 * 1. Mock data (for development)
 * 2. ESPN unofficial API (free but unsupported)
 * 3. SportsRadar API (commercial, requires subscription)
 * 4. Manual data entry through admin endpoints
 *
 * Configure your data source via the DATA_SOURCE_TYPE environment variable.
 * See README.md for detailed setup instructions for each option.
 */
export class MasterBracketService {
    private readonly CACHE_KEY = 'master_bracket';
    private readonly CACHE_TTL = 300; // 5 minutes
    private readonly UPDATE_INTERVAL = Number(process.env.NCAA_UPDATE_INTERVAL || 60000);
    private readonly MAX_RETRIES = 3;
    private readonly BASE_DELAY = 1000; // 1 second
    private readonly SYSTEM_USER_ID = new mongoose.Types.ObjectId('000000000000000000000001');

    private rateLimiter: RateLimiter;
    private updateTimer: NodeJS.Timeout | null = null;

    constructor(
        private readonly redis: Redis = getRedisClient(),
        maxRequestsPerMinute: number = 30,
        private readonly dataSource: BracketDataSource = createBracketDataSource(),
        startPollingOnInit: boolean = process.env.NODE_ENV !== 'test'
    ) {
        this.rateLimiter = new RateLimiter({
            tokensPerInterval: maxRequestsPerMinute,
            interval: 'minute'
        });

        if (startPollingOnInit) {
            void this.startPolling();
        }
    }

    private async readCache(): Promise<BracketModel | null> {
        try {
            const cached = await this.redis.get(this.CACHE_KEY);
            return cached ? (JSON.parse(cached) as BracketModel) : null;
        } catch (error) {
            logger.warn(`Redis cache read failed, continuing without cache: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return null;
        }
    }

    private async writeCache(bracket: BracketModel): Promise<void> {
        try {
            await this.redis.setex(this.CACHE_KEY, this.CACHE_TTL, JSON.stringify(bracket));
        } catch (error) {
            logger.warn(`Redis cache write failed, continuing without cache: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async startPolling(): Promise<void> {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
        }

        const getPollingInterval = (): number => {
            const hour = new Date().getHours();

            if (hour >= 12 && hour <= 23) {
                return this.UPDATE_INTERVAL;
            }

            return this.UPDATE_INTERVAL * 6;
        };

        this.updateTimer = setInterval(async () => {
            try {
                const hasToken = await this.rateLimiter.tryRemoveTokens(1);
                if (!hasToken) {
                    logger.warn('Rate limit reached, skipping master bracket update');
                    return;
                }

                await this.updateMasterBracketWithRetry();
            } catch (error) {
                logger.error('Polling error:', error);
            }
        }, getPollingInterval());
    }

    private async updateMasterBracketWithRetry(retryCount = 0): Promise<BracketModel> {
        try {
            return await this.updateMasterBracket();
        } catch (error) {
            if (retryCount < this.MAX_RETRIES) {
                const delay = this.BASE_DELAY * Math.pow(2, retryCount);
                await new Promise((resolve) => setTimeout(resolve, delay));
                return this.updateMasterBracketWithRetry(retryCount + 1);
            }
            throw error;
        }
    }

    public stopPolling(): void {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
        }
    }

    async updateMasterBracket(): Promise<BracketModel> {
        try {
            const bracketData = await this.dataSource.fetchCurrentBracket();
            const masterBracket = await this.saveMasterBracket(bracketData);
            await this.writeCache(masterBracket);
            return masterBracket;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new AppError(500, `Failed to update master bracket from ${this.dataSource.type}: ${message}`);
        }
    }

    async getMasterBracket(): Promise<BracketModel> {
        const cached = await this.readCache();
        if (cached) {
            return cached;
        }

        return this.updateMasterBracket();
    }

    async validateUserPick(gameId: string, userPickId: string): Promise<'correct' | 'incorrect' | 'pending'> {
        const masterBracket = await this.getMasterBracket();
        const game = masterBracket.games.find((entry) => entry.id === gameId);

        if (!game || game.status !== 'completed') {
            return 'pending';
        }

        return game.winnerId === userPickId ? 'correct' : 'incorrect';
    }

    private async saveMasterBracket(data: MasterBracketData): Promise<BracketModel> {
        const year = new Date().getFullYear();
        const masterBracket = await Bracket.findOneAndUpdate(
            { year, isMaster: true },
            {
                name: 'Official Tournament Results',
                userId: this.SYSTEM_USER_ID,
                year,
                isPublic: true,
                isMaster: true
            },
            {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true
            }
        );

        if (!masterBracket) {
            throw new AppError(500, 'Unable to create or update the master bracket');
        }

        const gameIds: mongoose.Types.ObjectId[] = [];

        for (const game of data.games) {
            const savedGame = await Game.findOneAndUpdate(
                { id: game.id, bracketId: masterBracket._id },
                {
                    id: game.id,
                    teamA: game.team1.name,
                    teamB: game.team2.name,
                    scoreA: game.team1.score,
                    scoreB: game.team2.score,
                    status: game.status,
                    round: game.round,
                    region: game.region,
                    winnerId: game.winnerId,
                    winnerName: game.winner?.name,
                    startTime: new Date(game.startTime),
                    bracketId: masterBracket._id
                },
                {
                    new: true,
                    upsert: true,
                    setDefaultsOnInsert: true
                }
            );

            if (savedGame) {
                gameIds.push(savedGame._id);
            }
        }

        await Game.deleteMany({
            bracketId: masterBracket._id,
            id: { $nin: data.games.map((game) => game.id) }
        });

        masterBracket.games = gameIds as any;
        await masterBracket.save();

        return await masterBracket.populate('games');
    }
}
