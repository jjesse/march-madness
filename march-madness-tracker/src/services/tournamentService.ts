import { Redis } from 'ioredis';
import logger from '../config/logger';
import { getRedisClient } from '../config/redis';
import { TournamentModel } from '../models/tournament';

export class TournamentService {
    private tournamentData: TournamentModel | undefined;
    private readonly CACHE_TTL = 300; // 5 minutes

    constructor(
        private readonly apiUrl: string,
        private readonly cache: Redis = getRedisClient()
    ) {}

    private async getCachedTournament(): Promise<TournamentModel | null> {
        try {
            const cached = await this.cache.get('tournament');
            return cached ? (JSON.parse(cached) as TournamentModel) : null;
        } catch (error) {
            logger.warn(`Redis cache read failed for tournament data: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return null;
        }
    }

    private async cacheTournament(data: TournamentModel): Promise<void> {
        try {
            await this.cache.setex('tournament', this.CACHE_TTL, JSON.stringify(data));
        } catch (error) {
            logger.warn(`Redis cache write failed for tournament data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    public async fetchTournamentData(): Promise<TournamentModel> {
        try {
            const cached = await this.getCachedTournament();
            if (cached) {
                return cached;
            }

            const response = await fetch(this.apiUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: TournamentModel = await response.json();
            this.tournamentData = data;
            await this.cacheTournament(data);

            return data;
        } catch (error: unknown) {
            logger.error('Tournament fetch error:', error);
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to fetch tournament data: ${message}`);
        }
    }

    public async updateTournamentData(newData: Partial<TournamentModel>): Promise<void> {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newData)
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data: TournamentModel = await response.json();
            this.tournamentData = data;
            await this.cacheTournament(data);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to update tournament data: ${message}`);
        }
    }
}