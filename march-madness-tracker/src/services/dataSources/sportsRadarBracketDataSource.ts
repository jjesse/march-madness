import axios from 'axios';
import { BracketDataSource, MasterBracketData } from './types';

export class SportsRadarBracketDataSource implements BracketDataSource {
  public readonly type = 'sportsradar' as const;
  private readonly apiKey = process.env.SPORTSRADAR_API_KEY || process.env.NCAA_API_KEY;
  private readonly apiUrl = process.env.SPORTSRADAR_API_URL || 'https://api.sportradar.us/ncaamb/trial/v7/en';

  async fetchCurrentBracket(): Promise<MasterBracketData> {
    if (!this.apiKey) {
      throw new Error('SportsRadar data source requires SPORTSRADAR_API_KEY (or NCAA_API_KEY)');
    }

    const response = await axios.get(`${this.apiUrl}/games/current.json`, {
      params: { api_key: this.apiKey },
      timeout: 10000,
    });

    const games = Array.isArray(response.data?.games) ? response.data.games : [];

    return {
      games: games.map((game: any) => ({
        id: String(game.id),
        team1: {
          id: String(game.home?.id || `${game.id}-home`),
          name: game.home?.name || 'TBD',
          score: Number(game.home_points || 0),
        },
        team2: {
          id: String(game.away?.id || `${game.id}-away`),
          name: game.away?.name || 'TBD',
          score: Number(game.away_points || 0),
        },
        status: game.status === 'closed' ? 'completed' : game.status === 'inprogress' ? 'in progress' : 'not started',
        round: Number(game.round || 1),
        region: game.venue?.region || 'Unknown',
        winnerId: game.winner?.id ? String(game.winner.id) : undefined,
        winner: game.winner?.id ? { id: String(game.winner.id), name: game.winner.name } : undefined,
        startTime: game.scheduled || new Date().toISOString(),
      })),
    };
  }
}
