import type { ScoreboardEntry, User } from '../types';

interface LeaderboardTableProps {
  entries: ScoreboardEntry[];
  currentUser?: User | null;
}

export default function LeaderboardTable({ entries, currentUser }: LeaderboardTableProps) {
  return (
    <div className="card table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>User</th>
            <th>Correct picks</th>
            <th>Total points</th>
            <th>Year</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => {
            const isCurrentUser =
              entry.userId === currentUser?.id || entry.username === currentUser?.username;

            return (
              <tr
                key={`${entry.userId}-${entry.year}-${index}`}
                style={isCurrentUser ? { background: 'rgba(37, 99, 235, 0.14)' } : undefined}
              >
                <td>{entry.rank ?? index + 1}</td>
                <td>
                  {entry.username}
                  {isCurrentUser ? ' (you)' : ''}
                </td>
                <td>{entry.totalCorrect}</td>
                <td>{entry.totalPoints}</td>
                <td>{entry.year}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
