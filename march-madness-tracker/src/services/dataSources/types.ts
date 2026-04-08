export interface AdapterTeamData {
  id: string;
  name: string;
  score: number;
}

export interface AdapterGameData {
  id: string;
  team1: AdapterTeamData;
  team2: AdapterTeamData;
  status: 'not started' | 'in progress' | 'completed';
  round: number;
  region: string;
  winnerId?: string;
  winner?: {
    id: string;
    name: string;
  };
  startTime: string;
}

export interface MasterBracketData {
  games: AdapterGameData[];
}

export interface BracketDataSource {
  readonly type: 'mock' | 'espn' | 'sportsradar' | 'manual';
  fetchCurrentBracket(): Promise<MasterBracketData>;
}
