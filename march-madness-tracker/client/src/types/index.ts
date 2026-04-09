export type UserRole = 'user' | 'admin';
export type PickStatus = 'correct' | 'incorrect' | 'pending';
export type GameStatus = 'not started' | 'in progress' | 'completed';

export interface User {
  id: string;
  email: string;
  username: string;
  role?: UserRole;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Game {
  _id?: string;
  id: string;
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  status: GameStatus;
  round: number;
  region: string;
  winnerId?: string;
  winnerName?: string;
  startTime?: string;
  userPick?: string;
  pickStatus?: PickStatus;
}

export interface Bracket {
  _id?: string;
  id?: string;
  name: string;
  userId?: string;
  year: number;
  games: Game[];
  totalPoints?: number;
  isPublic?: boolean;
  isMaster?: boolean;
}

export interface ScoreboardEntry {
  _id?: string;
  userId: string;
  username: string;
  totalCorrect: number;
  totalPoints: number;
  bracketId?: string | Bracket;
  year: number;
  rank?: number;
  roundScores?: Array<{
    round: number;
    correct: number;
    points: number;
  }>;
}

export interface ApiError {
  error?: string;
  message?: string;
}
