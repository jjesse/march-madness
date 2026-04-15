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

/** A `Game` whose ambiguous fields have been resolved into stable, always-defined values. */
export interface NormalizedGame extends Omit<Game, 'pickStatus'> {
  /** Stable composite key: `_id ?? id`. Use this as the React `key` and for game lookups. */
  key: string;
  /** Always defined — defaults to `'pending'`. */
  pickStatus: PickStatus;
  /** `true` when the game status is anything other than `'not started'`. */
  isLocked: boolean;
}

/** A `Bracket` with all games normalized and optional fields resolved to concrete values. */
export interface NormalizedBracket extends Omit<Bracket, 'games' | 'totalPoints' | 'isPublic'> {
  /** Stable composite key: `_id ?? id ?? ''`. */
  key: string;
  games: NormalizedGame[];
  totalPoints: number;
  isPublic: boolean;
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
