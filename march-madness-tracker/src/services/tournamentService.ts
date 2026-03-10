import { TournamentModel } from '../models/tournament';
import { Redis } from 'ioredis';

export class TournamentService {
    private tournamentData: TournamentModel | undefined;
    private apiUrl: string;
    private cache: Redis;
    private readonly CACHE_TTL = 300; // 5 minutes

    constructor(apiUrl: string) {
        this.apiUrl = apiUrl;
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        this.cache = new Redis(redisUrl);
    }

    public async fetchTournamentData(): Promise<TournamentModel> {
        try {
            // Check cache first
            const cached = await this.cache.get('tournament');
            if (cached) {
                return JSON.parse(cached);
            }

            const response = await fetch(this.apiUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data: TournamentModel = await response.json();
            this.tournamentData = data;
            
            // Cache the result
            await this.cache.setex('tournament', this.CACHE_TTL, JSON.stringify(data));
            
            return data;
        } catch (error: unknown) {
            // Add logging
            console.error('Tournament fetch error:', error);
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
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to update tournament data: ${message}`);
        }
    }
}