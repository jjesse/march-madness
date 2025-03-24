import { TournamentModel } from '../models/tournament';
import { Redis } from 'ioredis';

export class TournamentService {
    private tournamentData: TournamentModel;
    private apiUrl: string;
    private cache: Redis;
    private readonly CACHE_TTL = 300; // 5 minutes

    constructor(apiUrl: string) {
        this.apiUrl = apiUrl;
        this.cache = new Redis(process.env.REDIS_URL);
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
            
            this.tournamentData = await response.json();
            
            // Cache the result
            await this.cache.setex('tournament', this.CACHE_TTL, JSON.stringify(this.tournamentData));
            
            return this.tournamentData;
        } catch (error) {
            // Add logging
            console.error('Tournament fetch error:', error);
            throw new Error(`Failed to fetch tournament data: ${error.message}`);
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
            this.tournamentData = await response.json();
        } catch (error) {
            throw new Error(`Failed to update tournament data: ${error.message}`);
        }
    }
}