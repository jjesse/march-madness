import { BracketModel, Bracket } from '../models/bracket';
import { GameModel } from '../models/game';
import { TournamentModel } from '../models/tournament';

export class BracketService {
    private games: GameModel[] = [];
    private tournament: TournamentModel;

    constructor(tournament: TournamentModel) {
        this.tournament = tournament;
        this.games = tournament.games;
    }

    addGame(game: GameModel): void {
        this.games.push(game);
    }

    getGameData(gameId: string): GameModel | undefined {
        return this.games.find(game => game.id === gameId);
    }

    updateGameStatus(gameId: string, status: string): void {
        const game = this.getGameData(gameId);
        if (game) {
            game.status = status;
        }
    }

    getBracket(): GameModel[] {
        return this.games;
    }

    async createBracket(userId: string, bracketData: Partial<BracketModel>): Promise<BracketModel> {
        const bracket = new Bracket({
            ...bracketData,
            userId,
            year: new Date().getFullYear()
        });
        return await bracket.save();
    }

    async getUserBrackets(userId: string): Promise<BracketModel[]> {
        return await Bracket.find({ userId }).populate('games');
    }

    async updateBracket(bracketId: string, userId: string, updates: Partial<BracketModel>): Promise<BracketModel | null> {
        return await Bracket.findOneAndUpdate(
            { _id: bracketId, userId },
            updates,
            { new: true }
        ).populate('games');
    }

    async deleteBracket(bracketId: string, userId: string): Promise<boolean> {
        const result = await Bracket.deleteOne({ _id: bracketId, userId });
        return result.deletedCount > 0;
    }
}