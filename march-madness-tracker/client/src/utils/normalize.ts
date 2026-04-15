import type { Bracket, Game, NormalizedBracket, NormalizedGame } from '../types';

/**
 * Human-readable labels for each tournament round number.
 * Falls back to `"Round N"` in rendering code for any unknown value.
 */
export const ROUND_LABELS: Record<number, string> = {
  1: 'First Round',
  2: 'Second Round',
  3: 'Sweet Sixteen',
  4: 'Elite Eight',
  5: 'Final Four',
  6: 'Championship',
};

/**
 * Resolve a raw `Game` from the API into a `NormalizedGame` with guaranteed
 * stable key, always-defined `pickStatus`, and a computed `isLocked` flag.
 */
export function normalizeGame(raw: Game): NormalizedGame {
  return {
    ...raw,
    key: raw._id ?? raw.id,
    // Guard against missing scores from older API responses
    scoreA: raw.scoreA ?? 0,
    scoreB: raw.scoreB ?? 0,
    status: raw.status ?? 'not started',
    pickStatus: raw.pickStatus ?? 'pending',
    isLocked: raw.status !== 'not started',
  };
}

/**
 * Resolve a raw `Bracket` from the API into a `NormalizedBracket` with a
 * stable key, all games normalized, and optional fields defaulted.
 */
export function normalizeBracket(raw: Bracket): NormalizedBracket {
  return {
    ...raw,
    key: raw._id ?? raw.id ?? '',
    games: (raw.games ?? []).map(normalizeGame),
    totalPoints: raw.totalPoints ?? 0,
    isPublic: Boolean(raw.isPublic),
  };
}

/**
 * Group and sort a flat list of normalized games into an ordered Map keyed by
 * round number. Games within each round are sorted by region then by key.
 */
export function groupGamesByRound(games: NormalizedGame[]): Map<number, NormalizedGame[]> {
  const map = new Map<number, NormalizedGame[]>();

  const sorted = [...games].sort((a, b) => {
    if (a.round !== b.round) return a.round - b.round;
    return `${a.region}-${a.key}`.localeCompare(`${b.region}-${b.key}`);
  });

  for (const game of sorted) {
    const bucket = map.get(game.round) ?? [];
    bucket.push(game);
    map.set(game.round, bucket);
  }

  return map;
}
