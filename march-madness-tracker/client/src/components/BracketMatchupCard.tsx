import type { Game } from '../types';

interface BracketMatchupCardProps {
  game: Game;
  onPickSelect: (selectedWinner: string) => void;
  onClearPick: () => void;
}

function isGameLocked(status: string): boolean {
  return status !== 'not started';
}

export default function BracketMatchupCard({
  game,
  onPickSelect,
  onClearPick,
}: BracketMatchupCardProps) {
  const locked = isGameLocked(game.status);

  return (
    <tr>
      <td>
        <strong>
          {game.teamA} vs {game.teamB}
        </strong>
        <div className="pick-helper">{game.region} region</div>
      </td>
      <td>
        <div className="pick-group">
          <button
            type="button"
            className={`secondary-button pick-button ${game.userPick === game.teamA ? 'selected' : ''}`}
            disabled={locked}
            onClick={() => onPickSelect(game.teamA)}
          >
            {game.teamA}
          </button>
          <button
            type="button"
            className={`secondary-button pick-button ${game.userPick === game.teamB ? 'selected' : ''}`}
            disabled={locked}
            onClick={() => onPickSelect(game.teamB)}
          >
            {game.teamB}
          </button>
        </div>
        <div className="pick-helper">
          {game.userPick ? `Selected: ${game.userPick}` : 'No pick selected'}
          {locked ? ' • Locked' : ''}
        </div>
        {!locked && game.userPick ? (
          <button type="button" className="ghost-button small-button" onClick={onClearPick}>
            Clear pick
          </button>
        ) : null}
      </td>
      <td>
        <span className={`badge ${game.pickStatus || 'pending'}`}>{game.pickStatus || 'pending'}</span>
      </td>
      <td>{locked ? `${game.status} (locked)` : 'not started (editable)'}</td>
      <td>
        {game.scoreA} - {game.scoreB}
      </td>
      <td>{game.winnerName || 'TBD'}</td>
    </tr>
  );
}
