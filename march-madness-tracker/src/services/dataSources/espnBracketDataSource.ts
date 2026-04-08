import axios from 'axios';
import { BracketDataSource, MasterBracketData } from './types';

function mapStatus(status?: string): 'not started' | 'in progress' | 'completed' {
  const normalized = (status || '').toLowerCase();

  if (normalized === 'pre' || normalized === 'scheduled') {
    return 'not started';
  }

  if (normalized === 'in' || normalized === 'live') {
    return 'in progress';
  }

  return 'completed';
}

function extractRound(name = ''): number {
  const normalized = name.toLowerCase();

  if (normalized.includes('first four') || normalized.includes('play-in')) return 0;
  if (normalized.includes('second round') || normalized.includes('round of 32')) return 2;
  if (normalized.includes('sweet 16') || normalized.includes('sweet sixteen')) return 3;
  if (normalized.includes('elite 8') || normalized.includes('elite eight')) return 4;
  if (normalized.includes('final four') || normalized.includes('semifinal')) return 5;
  if (normalized.includes('championship') || normalized.includes('final')) return 6;

  return 1;
}

function extractRegion(name = ''): string {
  const match = name.match(/\b(East|West|South|Midwest)\b/i);
  return match ? match[1] : 'Unknown';
}

export class EspnBracketDataSource implements BracketDataSource {
  public readonly type = 'espn' as const;
  private readonly apiUrl =
    process.env.ESPN_API_URL ||
    'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard';

  async fetchCurrentBracket(): Promise<MasterBracketData> {
    const response = await axios.get(this.apiUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'March-Madness-Tracker/1.0',
      },
    });

    const events = Array.isArray(response.data?.events) ? response.data.events : [];

    return {
      games: events
        .map((event: any) => {
          const competition = event?.competitions?.[0];
          const competitors = competition?.competitors || [];

          if (competitors.length !== 2) {
            return null;
          }

          const [team1, team2] = competitors;
          const winner = competitors.find((entry: any) => entry.winner);

          return {
            id: String(event.id),
            team1: {
              id: String(team1?.team?.id || team1?.id || `${event.id}-1`),
              name: team1?.team?.displayName || team1?.team?.name || 'TBD',
              score: Number(team1?.score || 0),
            },
            team2: {
              id: String(team2?.team?.id || team2?.id || `${event.id}-2`),
              name: team2?.team?.displayName || team2?.team?.name || 'TBD',
              score: Number(team2?.score || 0),
            },
            status: mapStatus(event?.status?.type?.state),
            round: extractRound(event?.name),
            region: extractRegion(event?.name),
            winnerId: winner?.team?.id ? String(winner.team.id) : undefined,
            winner: winner?.team?.id
              ? { id: String(winner.team.id), name: winner.team.displayName || winner.team.name }
              : undefined,
            startTime: event?.date || new Date().toISOString(),
          };
        })
        .filter((game): game is NonNullable<typeof game> => Boolean(game)),
    };
  }
}
