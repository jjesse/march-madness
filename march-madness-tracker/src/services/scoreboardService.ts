import { Scoreboard, ScoreboardModel } from '../models/scoreboard';
import { BracketModel } from '../models/bracket';
import { GameModel } from '../models/game';
import { MetricsService } from './metricsService';
import { AppError } from '../types/errors';
import { MasterBracketService } from './masterBracketService';

export class ScoreboardService {
    private readonly POINTS_PER_ROUND = {
        1: 1,  // First Round
        2: 2,  // Second Round
        3: 4,  // Sweet 16
        4: 8,  // Elite 8
        5: 16, // Final Four
        6: 32  // Championship
    };

    constructor(
        private readonly metricsService: MetricsService,
        private readonly masterBracketService: MasterBracketService
    ) {}

    async updateUserScore(bracketId: string, userId: string): Promise<ScoreboardModel> {
        try {
            const [userBracket, masterBracket] = await Promise.all([
                Bracket.findById(bracketId).populate('games'),
                this.masterBracketService.getMasterBracket()
            ]);

            if (!userBracket) {
                throw new AppError(404, 'Bracket not found');
            }

            let totalCorrect = 0;
            let totalPoints = 0;
            const roundScores = [];

            for (let round = 1; round <= 6; round++) {
                const masterGames = masterBracket.games.filter(game => game.round === round);
                const userGames = userBracket.games.filter(game => game.round === round);
                
                const roundCorrect = this.calculateCorrectPicks(masterGames, userGames);
                const roundPoints = roundCorrect * this.POINTS_PER_ROUND[round];

                totalCorrect += roundCorrect;
                totalPoints += roundPoints;
                roundScores.push({ round, correct: roundCorrect, points: roundPoints });
            }

            // Update pick status for each game
            for (const userGame of userBracket.games) {
                const masterGame = masterBracket.games.find(g => g.id === userGame.id);
                if (masterGame && masterGame.status === 'completed') {
                    userGame.pickStatus = userGame.userPick === masterGame.winnerId ? 'correct' : 'incorrect';
                    await userGame.save();
                }
            }

            this.metricsService.incrementScoreUpdate();
            return await Scoreboard.findOneAndUpdate(
                { bracketId, userId },
                { 
                    totalCorrect,
                    totalPoints,
                    roundScores,
                    year: new Date().getFullYear()
                },
                { new: true, upsert: true }
            );
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(500, 'Failed to update score');
        }
    }

    async getLeaderboard(year?: number): Promise<ScoreboardModel[]> {
        const query = year ? { year } : { year: new Date().getFullYear() };
        return await Scoreboard
            .find(query)
            .sort({ totalPoints: -1, totalCorrect: -1 })
            .limit(100)
            .populate('userId', 'username');
    }

    async getPickStatus(bracketId: string): Promise<Array<{gameId: string, status: string, pick: string, actual: string}>> {
        const [bracket, masterBracket] = await Promise.all([
            Bracket.findById(bracketId).populate('games'),
            this.masterBracketService.getMasterBracket()
        ]);

        return bracket.games.map(game => {
            const masterGame = masterBracket.games.find(g => g.id === game.id);
            return {
                gameId: game.id,
                status: game.pickStatus,
                pick: game.userPick ? `${game.userPick} (${game.pickStatus})` : 'No pick',
                actual: masterGame?.winnerName || 'Not completed'
            };
        });
    }

    private calculateCorrectPicks(masterGames: GameModel[], userGames: GameModel[]): number {
        return masterGames.reduce((correct, masterGame) => {
            const userGame = userGames.find(g => g.id === masterGame.id);
            if (userGame && masterGame.status === 'completed') {
                return correct + (userGame.winnerId === masterGame.winnerId ? 1 : 0);
            }
            return correct;
        }, 0);
    }

    private isCorrectPick(game: GameModel): boolean {
        return game.status === 'completed' && game.winnerId === game.userPick;
    }
}
