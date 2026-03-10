import axios from 'axios';
import { Redis } from 'ioredis';
import { Bracket, BracketModel } from '../models/bracket';
import { Game } from '../models/game';
import { AppError } from '../types/errors';
import { RateLimiter } from 'limiter';

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
    private readonly API_KEY = process.env.SPORTSRADAR_API_KEY || process.env.NCAA_API_KEY;
    private readonly DATA_SOURCE = process.env.DATA_SOURCE_TYPE || 'mock';
    private readonly API_URL = this.getApiUrl();
    private readonly UPDATE_INTERVAL = process.env.NCAA_UPDATE_INTERVAL || 60000; // 1 minute default
    private readonly MAX_RETRIES = 3;
    private readonly BASE_DELAY = 1000; // 1 second

    private rateLimiter: RateLimiter;
    private updateTimer: NodeJS.Timeout | null = null;

    constructor(
        private readonly redis: Redis,
        maxRequestsPerMinute: number = 30
    ) {
        this.rateLimiter = new RateLimiter({
            tokensPerInterval: maxRequestsPerMinute,
            interval: 'minute'
        });
        this.startPolling();
    }

    private getApiUrl(): string {
        const dataSource = process.env.DATA_SOURCE_TYPE || 'mock';
        
        switch (dataSource) {
            case 'espn':
                return process.env.ESPN_API_URL || 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard';
            case 'sportsradar':
                return process.env.SPORTSRADAR_API_URL || 'https://api.sportradar.us/ncaamb/trial/v7/en';
            case 'manual':
                return 'manual'; // No external API
            case 'mock':
            default:
                return 'mock'; // Use mock data
        }
    }

    private async startPolling(): Promise<void> {
        // Clear any existing timer
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
        }

        // Different intervals based on game status
        const getPollingInterval = (): number => {
            const now = new Date();
            const hour = now.getHours();
            
            // During active game hours (typically afternoon/evening during tournament)
            if (hour >= 12 && hour <= 23) {
                return typeof this.UPDATE_INTERVAL === 'number' ? this.UPDATE_INTERVAL : parseInt(this.UPDATE_INTERVAL);
            }
            // Early morning hours - less frequent updates
            const interval = typeof this.UPDATE_INTERVAL === 'number' ? this.UPDATE_INTERVAL : parseInt(this.UPDATE_INTERVAL);
            return interval * 6;
        };

        this.updateTimer = setInterval(async () => {
            try {
                // Check if we have tokens available
                const hasToken = await this.rateLimiter.tryRemoveTokens(1);
                if (!hasToken) {
                    console.log('Rate limit reached, skipping update');
                    return;
                }

                await this.updateMasterBracketWithRetry();
            } catch (error) {
                console.error('Polling error:', error);
            }
        }, getPollingInterval());
    }

    private async updateMasterBracketWithRetry(retryCount = 0): Promise<BracketModel> {
        try {
            return await this.updateMasterBracket();
        } catch (error) {
            if (retryCount < this.MAX_RETRIES) {
                const delay = this.BASE_DELAY * Math.pow(2, retryCount);
                await new Promise(resolve => setTimeout(resolve, delay));
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
            const response = await axios.get(`${this.API_URL}/brackets/current`, {
                headers: { 'Authorization': `Bearer ${this.API_KEY}` }
            });

            const masterBracket = await this.saveMasterBracket(response.data);
            await this.redis.setex(this.CACHE_KEY, this.CACHE_TTL, JSON.stringify(masterBracket));
            return masterBracket;
        } catch (error) {
            throw new AppError(500, 'Failed to update master bracket');
        }
    }

    async getMasterBracket(): Promise<BracketModel> {
        const cached = await this.redis.get(this.CACHE_KEY);
        if (cached) {
            return JSON.parse(cached);
        }
        return this.updateMasterBracket();
    }

    async validateUserPick(gameId: string, userPickId: string): Promise<'correct' | 'incorrect' | 'pending'> {
        const masterBracket = await this.getMasterBracket();
        const game = masterBracket.games.find(g => g.id === gameId);
        
        if (!game || game.status !== 'completed') {
            return 'pending';
        }
        
        return game.winnerId === userPickId ? 'correct' : 'incorrect';
    }

    private async saveMasterBracket(data: any): Promise<BracketModel> {
        const games = data.games.map((game: any) => new Game({
            teamA: game.team1.name,
            teamB: game.team2.name,
            scoreA: game.team1.score,
            scoreB: game.team2.score,
            status: game.status,
            round: game.round,
            region: game.region,
            winnerId: game.winnerId,
            winnerName: game.winner?.name,
            finalScore: `${game.team1.score}-${game.team2.score}`,
            startTime: new Date(game.startTime)
        }));

        const masterBracket = new Bracket({
            name: 'Official Tournament Results',
            userId: 'system',
            year: new Date().getFullYear(),
            games: games,
            isPublic: true,
            isMaster: true
        });

        return await masterBracket.save();
    }
}
