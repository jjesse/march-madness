// filepath: /march-madness-tracker/src/services/bracketIngestionService.ts
import axios from 'axios';
import logger from '../config/logger';
import { Tournament } from '../models/tournament';
import { Team } from '../models/team';
import { Game } from '../models/game';
import mongoose from 'mongoose';

export class BracketIngestionService {
    private readonly ESPN_SCOREBOARD_URL = 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard';
    // Tournament dates: March Madness typically runs from Selection Sunday to Final
    private readonly TOURNAMENT_START_DATE = new Date(Date.UTC(2026, 2, 15)); // March 15, 2026
    private readonly TOURNAMENT_END_DATE = new Date(Date.UTC(2026, 3, 10)); // April 10, 2026
    
    constructor() {}

    /**
     * Fetch and sync the entire tournament bracket from ESPN using scoreboard API
     */
    public async syncBracket(): Promise<void> {
        try {
            logger.info('Starting bracket sync from ESPN Scoreboard API');
            
            const year = 2026;
            
            // Find or create tournament
            let tournament = await Tournament.findOne({ year });
            
            if (!tournament) {
                tournament = new Tournament({
                    year,
                    name: `NCAA Men's Basketball Tournament ${year}`,
                    status: 'upcoming',
                    startDate: this.TOURNAMENT_START_DATE,
                    endDate: this.TOURNAMENT_END_DATE,
                    games: []
                });
                await tournament.save();
                logger.info(`Created new tournament for year ${year}`);
            }

            // Fetch games for the entire tournament period
            const allGames: mongoose.Types.ObjectId[] = [];
            const dateRange = this.getDateRange(this.TOURNAMENT_START_DATE, this.TOURNAMENT_END_DATE);
            
            logger.info(`Fetching games for ${dateRange.length} days of the tournament`);
            
            for (const date of dateRange) {
                const dateStr = this.formatDate(date);
                logger.info(`Fetching games for ${dateStr}`);
                
                try {
                    const gamesForDate = await this.fetchGamesForDate(dateStr, tournament._id);
                    allGames.push(...gamesForDate);
                    
                    // Small delay to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 200));
                } catch (error) {
                    logger.warn(`Failed to fetch games for ${dateStr}:`, error);
                }
            }

            // Update tournament with all games
            tournament.games = allGames;
            tournament.status = await this.determineTournamentStatusFromGames(allGames);
            await tournament.save();

            logger.info(`Bracket sync completed successfully. Synced ${allGames.length} games.`);
        } catch (error) {
            logger.error('Error syncing bracket from ESPN:', error);
            throw new Error(`Bracket sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Fetch games for a specific date
     */
    private async fetchGamesForDate(date: string, tournamentId: mongoose.Types.ObjectId): Promise<mongoose.Types.ObjectId[]> {
        const url = `${this.ESPN_SCOREBOARD_URL}?dates=${date}`;
        
        const response = await axios.get(url, {
            timeout: 10000,
            headers: {
                'User-Agent': 'March-Madness-Tracker/1.0'
            }
        });

        const events = response.data.events || [];
        const gameIds: mongoose.Types.ObjectId[] = [];
        
        for (const event of events) {
            const gameId = await this.processScoreboardEvent(event, tournamentId);
            if (gameId) {
                gameIds.push(gameId);
            }
        }
        
        return gameIds;
    }

    /**
     * Generate date range between start and end dates
     */
    private getDateRange(startDate: Date, endDate: Date): Date[] {
        const dates: Date[] = [];
        const currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
            dates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return dates;
    }

    /**
     * Fetch and update live scores for ongoing games
     */
    public async syncLiveScores(date?: string): Promise<void> {
        try {
            const dateParam = date || this.formatDate(new Date());
            const url = `${this.ESPN_SCOREBOARD_URL}?dates=${dateParam}`;
            
            logger.info(`Syncing live scores for date: ${dateParam}`);
            
            const response = await axios.get(url, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'March-Madness-Tracker/1.0'
                }
            });

            const events = response.data.events || [];
            
            for (const event of events) {
                await this.updateGameScore(event);
            }

            logger.info(`Live scores sync completed. Updated ${events.length} games.`);
        } catch (error) {
            logger.error('Error syncing live scores:', error);
            throw new Error(`Live scores sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Process a single event from ESPN scoreboard data
     */
    private async processScoreboardEvent(
        event: any,
        tournamentId: mongoose.Types.ObjectId
    ): Promise<mongoose.Types.ObjectId | null> {
        try {
            const gameId = event.id;
            const competition = event.competitions[0];
            
            if (!competition || competition.competitors.length !== 2) {
                logger.warn(`Event ${gameId} does not have valid competition data, skipping`);
                return null;
            }

            const competitors = competition.competitors;
            
            // Get team data (competitors[0] is home, competitors[1] is away)
            const team1 = competitors[0].team;
            const team2 = competitors[1].team;

            // Ensure teams exist in database
            await this.ensureTeamExists(team1, competitors[0].seed);
            await this.ensureTeamExists(team2, competitors[1].seed);

            // Determine game status
            const gameStatus = this.mapESPNStatus(event.status.type.state);
            
            // Get scores
            const score1 = parseInt(competitors[0].score) || 0;
            const score2 = parseInt(competitors[1].score) || 0;

            // Determine winner
            let winnerId: string | undefined;
            let winnerName: string | undefined;
            
            if (gameStatus === 'completed') {
                const winner = competitors.find((c: any) => c.winner);
                if (winner) {
                    winnerId = winner.team.id;
                    winnerName = winner.team.displayName;
                }
            }

            // Extract round and region from event notes or name
            const round = this.extractRound(event.name, event.season?.type);
            const region = this.extractRegion(event.name);

            // Find or create game
            let game = await Game.findOne({ id: gameId });

            if (game) {
                // Update existing game
                game.teamA = team1.displayName;
                game.teamB = team2.displayName;
                game.scoreA = score1;
                game.scoreB = score2;
                game.status = gameStatus;
                game.round = round;
                game.region = region;
                game.winnerId = winnerId;
                game.winnerName = winnerName;
                game.startTime = new Date(event.date);
                await game.save();
                
                logger.debug(`Updated game ${gameId}: ${team1.displayName} vs ${team2.displayName}`);
            } else {
                // Create new game
                game = new Game({
                    id: gameId,
                    teamA: team1.displayName,
                    teamB: team2.displayName,
                    scoreA: score1,
                    scoreB: score2,
                    status: gameStatus,
                    round,
                    region,
                    winnerId,
                    winnerName,
                    startTime: new Date(event.date),
                    bracketId: tournamentId
                });
                await game.save();
                
                logger.debug(`Created game ${gameId}: ${team1.displayName} vs ${team2.displayName}`);
            }

            return game._id;
        } catch (error) {
            logger.error(`Error processing event ${event.id}:`, error);
            return null;
        }
    }

    /**
     * Extract round number from event name or season data
     */
    private extractRound(eventName: string, seasonType?: any): number {
        const name = eventName.toLowerCase();
        
        // Match round keywords
        if (name.includes('first four') || name.includes('play-in')) return 0;
        if (name.includes('first round') || name.includes('round of 64')) return 1;
        if (name.includes('second round') || name.includes('round of 32')) return 2;
        if (name.includes('sweet 16') || name.includes('sweet sixteen')) return 3;
        if (name.includes('elite 8') || name.includes('elite eight')) return 4;
        if (name.includes('final four') || name.includes('semifinal')) return 5;
        if (name.includes('championship') || name.includes('final')) return 6;
        
        // Default to round 1 if unclear
        return 1;
    }

    /**
     * Update game scores from live scoreboard data
     */
    private async updateGameScore(event: any): Promise<void> {
        try {
            const gameId = event.id;
            const competitors = event.competitions[0]?.competitors || [];
            
            if (competitors.length !== 2) {
                return;
            }

            const game = await Game.findOne({ id: gameId });
            
            if (!game) {
                logger.debug(`Game ${gameId} not found in database, skipping score update`);
                return;
            }

            // Update scores
            game.scoreA = parseInt(competitors[0].score) || 0;
            game.scoreB = parseInt(competitors[1].score) || 0;
            
            // Update status
            const status = event.status?.type?.state || 'pre';
            game.status = this.mapESPNStatus(status);

            // Update winner if game is completed
            if (game.status === 'completed') {
                const winner = competitors.find((c: any) => c.winner);
                if (winner) {
                    game.winnerId = winner.team.id;
                    game.winnerName = winner.team.displayName;
                }
            }

            await game.save();
            logger.debug(`Updated scores for game ${gameId}`);
        } catch (error) {
            logger.error(`Error updating game score for event ${event.id}:`, error);
        }
    }

    /**
     * Ensure a team exists in the database
     */
    private async ensureTeamExists(espnTeam: any, seed?: number): Promise<void> {
        try {
            const existingTeam = await Team.findOne({ name: espnTeam.displayName });
            
            if (!existingTeam) {
                const team = new Team({
                    name: espnTeam.displayName,
                    seed: seed || espnTeam.seed || 16, // Use provided seed, then team seed, default to 16
                    abbreviation: espnTeam.abbreviation,
                    mascot: espnTeam.name || espnTeam.displayName
                });
                await team.save();
                logger.debug(`Created team: ${espnTeam.displayName}`);
            } else if (seed && existingTeam.seed !== seed) {
                // Update seed if provided and different
                existingTeam.seed = seed;
                await existingTeam.save();
            }
        } catch (error) {
            logger.error(`Error ensuring team exists for ${espnTeam.displayName}:`, error);
        }
    }

    /**
     * Map ESPN status to our game status
     */
    private mapESPNStatus(espnStatus: string): 'not started' | 'in progress' | 'completed' {
        const statusLower = espnStatus.toLowerCase();
        
        if (statusLower === 'pre' || statusLower === 'scheduled') {
            return 'not started';
        } else if (statusLower === 'in' || statusLower === 'live') {
            return 'in progress';
        } else {
            return 'completed';
        }
    }

    /**
     * Extract region from game name
     */
    private extractRegion(gameName: string): string {
        const regionMatch = gameName.match(/\b(East|West|South|Midwest)\b/i);
        return regionMatch ? regionMatch[1] : 'Unknown';
    }

    /**
     * Determine tournament status based on games
     */
    private async determineTournamentStatusFromGames(gameIds: mongoose.Types.ObjectId[]): Promise<'upcoming' | 'in-progress' | 'completed'> {
        if (gameIds.length === 0) {
            return 'upcoming';
        }

        const games = await Game.find({ _id: { $in: gameIds } });
        
        const hasStarted = games.some((g) => 
            g.status !== 'not started'
        );
        
        const allCompleted = games.every((g) => g.status === 'completed');
        
        if (allCompleted && games.length > 0) {
            return 'completed';
        } else if (hasStarted) {
            return 'in-progress';
        } else {
            return 'upcoming';
        }
    }

    /**
     * Format date for ESPN API (YYYYMMDD)
     */
    private formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const monthStr = month < 10 ? '0' + month : String(month);
        const dayStr = day < 10 ? '0' + day : String(day);
        return `${year}${monthStr}${dayStr}`;
    }
}
