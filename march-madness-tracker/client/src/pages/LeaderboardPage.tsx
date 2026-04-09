import { useEffect, useState } from 'react';
import EmptyState from '../components/EmptyState';
import LeaderboardTable from '../components/LeaderboardTable';
import LoadingSpinner from '../components/LoadingSpinner';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../hooks/useAuth';
import scoreboardService from '../services/scoreboardService';
import type { ScoreboardEntry } from '../types';

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [entries, setEntries] = useState<ScoreboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadLeaderboard = async (selectedYear?: number) => {
    setIsLoading(true);
    setError('');

    try {
      const data = await scoreboardService.getLeaderboard(selectedYear);
      setEntries(data);
    } catch {
      setError('Unable to load leaderboard data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadLeaderboard(Number(year));
  }, []);

  const handleRefresh = async () => {
    const parsedYear = Number(year);
    await loadLeaderboard(Number.isInteger(parsedYear) ? parsedYear : undefined);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="grid" style={{ gap: '1rem' }}>
      <PageHeader
        title="Leaderboard"
        description="See who is climbing the standings across the tournament."
      />

      <div className="card inline-row">
        <div className="form-row" style={{ minWidth: '180px' }}>
          <label htmlFor="year">Tournament year</label>
          <input id="year" value={year} onChange={(event) => setYear(event.target.value)} />
        </div>
        <button type="button" className="primary-button" onClick={() => void handleRefresh()}>
          Load standings
        </button>
      </div>

      {error ? <div className="alert error">{error}</div> : null}

      {entries.length === 0 ? (
        <EmptyState
          title="No standings available"
          description="Try a different year or come back after scores have been calculated."
        />
      ) : (
        <LeaderboardTable entries={entries} currentUser={user} />
      )}
    </div>
  );
}
