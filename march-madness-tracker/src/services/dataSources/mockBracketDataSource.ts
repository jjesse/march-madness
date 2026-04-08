import { BracketDataSource, MasterBracketData } from './types';

export class MockBracketDataSource implements BracketDataSource {
  public readonly type = 'mock' as const;

  async fetchCurrentBracket(): Promise<MasterBracketData> {
    const now = new Date().toISOString();

    return {
      games: [
        {
          id: 'mock-east-1',
          team1: { id: 'uconn', name: 'UConn', score: 78 },
          team2: { id: 'stetson', name: 'Stetson', score: 52 },
          status: 'completed',
          round: 1,
          region: 'East',
          winnerId: 'uconn',
          winner: { id: 'uconn', name: 'UConn' },
          startTime: now,
        },
        {
          id: 'mock-east-2',
          team1: { id: 'fau', name: 'Florida Atlantic', score: 71 },
          team2: { id: 'northwestern', name: 'Northwestern', score: 68 },
          status: 'completed',
          round: 1,
          region: 'East',
          winnerId: 'fau',
          winner: { id: 'fau', name: 'Florida Atlantic' },
          startTime: now,
        },
        {
          id: 'mock-midwest-1',
          team1: { id: 'houston', name: 'Houston', score: 82 },
          team2: { id: 'longwood', name: 'Longwood', score: 61 },
          status: 'completed',
          round: 1,
          region: 'Midwest',
          winnerId: 'houston',
          winner: { id: 'houston', name: 'Houston' },
          startTime: now,
        },
        {
          id: 'mock-final-four-1',
          team1: { id: 'uconn', name: 'UConn', score: 75 },
          team2: { id: 'houston', name: 'Houston', score: 69 },
          status: 'completed',
          round: 5,
          region: 'Final Four',
          winnerId: 'uconn',
          winner: { id: 'uconn', name: 'UConn' },
          startTime: now,
        },
      ],
    };
  }
}
