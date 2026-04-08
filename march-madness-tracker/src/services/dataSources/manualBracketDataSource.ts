import { Game } from '../../models/game';
import { BracketDataSource, MasterBracketData } from './types';

export class ManualBracketDataSource implements BracketDataSource {
  public readonly type = 'manual' as const;

  async fetchCurrentBracket(): Promise<MasterBracketData> {
    const games = await Game.find({})
      .sort({ round: 1, startTime: 1 })
      .limit(67)
      .lean();

    return {
      games: games.map((game) => ({
        id: game.id,
        team1: {
          id: `${game.id}-team-a`,
          name: game.teamA,
          score: game.scoreA,
        },
        team2: {
          id: `${game.id}-team-b`,
          name: game.teamB,
          score: game.scoreB,
        },
        status: game.status,
        round: game.round,
        region: game.region,
        winnerId: game.winnerId,
        winner: game.winnerId && game.winnerName ? { id: game.winnerId, name: game.winnerName } : undefined,
        startTime: game.startTime?.toISOString?.() || new Date().toISOString(),
      })),
    };
  }
}
