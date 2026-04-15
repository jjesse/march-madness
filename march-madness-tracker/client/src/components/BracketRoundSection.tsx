import type { NormalizedGame } from '../types';
import { ROUND_LABELS } from '../utils/normalize';
import BracketMatchupCard from './BracketMatchupCard';

interface BracketRoundSectionProps {
  round: number;
  games: NormalizedGame[];
  onPickSelect: (gameKey: string, selectedWinner: string) => void;
  onClearPick: (gameKey: string) => void;
}

export default function BracketRoundSection({
  round,
  games,
  onPickSelect,
  onClearPick,
}: BracketRoundSectionProps) {
  return (
    <section className="card">
      <h2>{ROUND_LABELS[round] ?? `Round ${round}`}</h2>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Matchup</th>
              <th>Your pick</th>
              <th>Pick status</th>
              <th>Game status</th>
              <th>Score</th>
              <th>Winner</th>
            </tr>
          </thead>
          <tbody>
            {games.map((game) => {
              const gameKey = game.key;
              return (
                <BracketMatchupCard
                  key={gameKey}
                  game={game}
                  onPickSelect={(selectedWinner) => onPickSelect(gameKey, selectedWinner)}
                  onClearPick={() => onClearPick(gameKey)}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
