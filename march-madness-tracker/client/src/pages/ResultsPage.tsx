import { useEffect, useState } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import scoreboardService from '../services/scoreboardService';
import type { ScoreboardEntry } from '../types';

export default function ResultsPage() {
  const [scores, setScores] = useState<ScoreboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadScores = async () => {
    setIsLoading(true);
    setError('');

    try {
      const data = await scoreboardService.getUserScores();
      setScores(data);
    } catch {
      setError('Unable to load your score history.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadScores();
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="grid" style={{ gap: '1rem' }}>
      <div className="page-header">
        <h1>My results</h1>
        <p>Track your bracket performance and total points as games are completed.</p>
      </div>

      <div className="inline-row">
        <button type="button" className="secondary-button" onClick={() => void loadScores()}>
          Refresh results
        </button>
      </div>

      {error ? <div className="alert error">{error}</div> : null}

      {scores.length === 0 ? (
        <div className="card empty-state">
          <h2>No score data yet</h2>
          <p>Your bracket results will show up here once scoring records are available.</p>
        </div>
      ) : (
        <div className="grid two">
          {scores.map((entry, index) => (
            <article key={`${entry.userId}-${entry.year}-${index}`} className="card">
              <h2>{entry.username}</h2>
              <p>Year: {entry.year}</p>
              <p>Total correct picks: {entry.totalCorrect}</p>
              <p>Total points: {entry.totalPoints}</p>

              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Round</th>
                      <th>Correct</th>
                      <th>Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(entry.roundScores || []).map((roundScore) => (
                      <tr key={roundScore.round}>
                        <td>{roundScore.round}</td>
                        <td>{roundScore.correct}</td>
                        <td>{roundScore.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
