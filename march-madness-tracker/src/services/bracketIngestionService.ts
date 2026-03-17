// filepath: /march-madness-tracker/src/services/bracketIngestionService.ts
import axios from 'axios';
import logger from '../config/logger';
import { Tournament } from '../models/tournament';
import { Team } from '../models/team';
import { Game } from '../models/game';
import mongoose from 'mongoose';

interface ESPNTeam {
    id: string;
    uid: string;
    location: string;
    name: string;
    displayName: string;
    abbreviation: string;
    logo?: string;
    seed?: number;
}

interface ESPNCompetitor {
    id: string;
    uid: string;
    type: string;
    order: number;
    homeAway: string;
    winner: boolean;
    team: ESPNTeam;
    score?: string;
}

interface ESPNGame {
    id: string;
    uid: string;
    date: string;
    name: string;
    shortName: string;
    season: {
        year: number;
        type: number;
    };
    competitors: ESPNCompetitor[];
    status: {
        type: {
            id: string;
            name: string;
            state: string;
            completed: boolean;
            description: string;
            detail: string;
            shortDetail: string;
        };
    };
    round?: number;
    region?: string;
}

interface ESPNBracketResponse {
    season: {
        year: number;
        type: number;
        name: string;
    };
    bracket: {
        rounds: Array<{
            number: number;
            name: string;
            games: ESPNGame[];
        }>;
    };
}

export class BracketIngestionService {
    private readonly ESPN_BRACKET_URL = 'https://site.api.espn.com/apis/v2/sports/basketball/mens-college-basketball/tournament/1/bracket';
    private readonly ESPN_SCOREBOARD_URL = 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard';
    
    constructor() {}

    /**
     * Fetch and sync the entire tournament bracket from ESPN
     */
    public async syncBracket(): Promise<void> {
        try {
            logger.info('Starting bracket sync from ESPN API');
            
            const response = await axios.get<ESPNBracketResponse>(this.ESPN_BRACKET_URL, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'March-Madness-Tracker/1.0'
                }
            });

            const bracketData = response.data;
            const year = bracketData.season.year;

            logger.info(`Fetched bracket data for year ${year}`);

            // Find or create tournament
            let tournament = await Tournament.findOne({ year });
            
            if (!tournament) {
                tournament = new Tournament({
                    year,
                    name: `NCAA Men's Basketball Tournament ${year}`,
                    status: 'upcoming',
                    startDate: new Date(Date.UTC(year, 2, 18)), // March 18
                    endDate: new Date(Date.UTC(year, 3, 8)), // April 8
                    games: []
                });
                await tournament.save();
                logger.info(`Created new tournament for year ${year}`);
            }

            // Process all rounds and games
            const allGames: mongoose.Types.ObjectId[] = [];
            
            for (const round of bracketData.bracket.rounds) {
                logger.info(`Processing round ${round.number}: ${round.name}`);
                
                for (const espnGame of round.games) {
                    const gameId = await this.processGame(espnGame, round.number, tournament._id);
                    if (gameId) {
                        allGames.push(gameId);
                    }
                }
            }

            // Update tournament with all games
            tournament.games = allGames;
            tournament.status = this.determineTournamentStatus(bracketData);
            await tournament.save();

            logger.info(`Bracket sync completed successfully. Synced ${allGames.length} games.`);
        } catch (error) {
            logger.error('Error syncing bracket from ESPN:', error);
            throw new Error(`Bracket sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
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
     * Process a single game from ESPN data
     */
    private async processGame(
        espnGame: ESPNGame, 
        round: number, 
        tournamentId: mongoose.Types.ObjectId
    ): Promise<mongoose.Types.ObjectId | null> {
        try {
            const competitors = espnGame.competitors;
            
            if (competitors.length !== 2) {
                logger.warn(`Game ${espnGame.id} does not have exactly 2 competitors, skipping`);
                return null;
            }

            // Get team data
            const team1 = competitors[0].team;
            const team2 = competitors[1].team;

            // Ensure teams exist in database
            await this.ensureTeamExists(team1);
            await this.ensureTeamExists(team2);

            // Determine game status
            const gameStatus = this.mapESPNStatus(espnGame.status.type.state);
            
            // Get scores
            const score1 = competitors[0].score ? parseInt(competitors[0].score) : 0;
            const score2 = competitors[1].score ? parseInt(competitors[1].score) : 0;

            // Determine winner
            let winnerId: string | undefined;
            let winnerName: string | undefined;
            
            if (gameStatus === 'completed') {
                const winner = competitors.find(c => c.winner);
                if (winner) {
                    winnerId = winner.team.id;
                    winnerName = winner.team.displayName;
                }
            }

            // Extract region from game name or shortName
            const region = this.extractRegion(espnGame.name);

            // Find or create game
            let game = await Game.findOne({ 
                id: espnGame.id 
            });

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
                game.startTime = new Date(espnGame.date);
                await game.save();
                
                logger.debug(`Updated game ${espnGame.id}: ${team1.displayName} vs ${team2.displayName}`);
            } else {
                // Create new game
                game = new Game({
                    id: espnGame.id,
                    teamA: team1.displayName,
                    teamB: team2.displayName,
                    scoreA: score1,
                    scoreB: score2,
                    status: gameStatus,
                    round,
                    region,
                    winnerId,
                    winnerName,
                    startTime: new Date(espnGame.date),
                    bracketId: tournamentId
                });
                await game.save();
                
                logger.debug(`Created game ${espnGame.id}: ${team1.displayName} vs ${team2.displayName}`);
            }

            return game._id;
        } catch (error) {
            logger.error(`Error processing game ${espnGame.id}:`, error);
            return null;
        }
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
    private async ensureTeamExists(espnTeam: ESPNTeam): Promise<void> {
        try {
            const existingTeam = await Team.findOne({ name: espnTeam.displayName });
            
            if (!existingTeam) {
                const team = new Team({
                    name: espnTeam.displayName,
                    seed: espnTeam.seed || 16, // Default to 16 if seed not available
                    abbreviation: espnTeam.abbreviation,
                    mascot: espnTeam.name
                });
                await team.save();
                logger.debug(`Created team: ${espnTeam.displayName}`);
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
    private determineTournamentStatus(bracketData: ESPNBracketResponse): 'upcoming' | 'in-progress' | 'completed' {
        const allGames: ESPNGame[] = [];
        for (const round of bracketData.bracket.rounds) {
            allGames.push(...round.games);
        }
        
        const hasStarted = allGames.some((g: ESPNGame) => 
            g.status.type.state !== 'pre' && g.status.type.state !== 'scheduled'
        );
        
        const allCompleted = allGames.every((g: ESPNGame) => g.status.type.completed);
        
        if (allCompleted) {
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
