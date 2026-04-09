import type { Game } from '../types';
import BracketMatchupCard from './BracketMatchupCard';

interface BracketRoundSectionProps {
  round: string;
  games: Game[];
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
      <h2>Round {round}</h2>
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
              const gameKey = game._id || game.id;
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
