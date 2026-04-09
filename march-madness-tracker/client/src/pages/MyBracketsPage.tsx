import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import bracketService from '../services/bracketService';
import LoadingSpinner from '../components/LoadingSpinner';
import type { Bracket } from '../types';

export default function MyBracketsPage() {
  const [brackets, setBrackets] = useState<Bracket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadBrackets = async () => {
    setIsLoading(true);
    setError('');

    try {
      const data = await bracketService.list();
      setBrackets(data);
    } catch {
      setError('Unable to load your brackets right now.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadBrackets();
  }, []);

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Delete this bracket? This cannot be undone.');
    if (!confirmed) {
      return;
    }

    try {
      await bracketService.remove(id);
      setBrackets((current) => current.filter((bracket) => (bracket._id || bracket.id) !== id));
    } catch {
      setError('Unable to delete the selected bracket.');
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="grid" style={{ gap: '1rem' }}>
      <div className="page-header">
        <h1>My brackets</h1>
        <p>Create, review, and manage your March Madness entries.</p>
      </div>

      <div className="inline-row">
        <Link to="/brackets/new" className="primary-button">
          Create new bracket
        </Link>
        <button type="button" className="secondary-button" onClick={() => void loadBrackets()}>
          Refresh
        </button>
      </div>

      {error ? <div className="alert error">{error}</div> : null}

      {brackets.length === 0 ? (
        <div className="card empty-state">
          <h2>No brackets yet</h2>
          <p>Create your first bracket to start tracking picks.</p>
          <Link to="/brackets/new" className="primary-button">
            Build my bracket
          </Link>
        </div>
      ) : (
        <div className="grid two">
          {brackets.map((bracket) => {
            const id = bracket._id || bracket.id || '';

            return (
              <article key={id} className="card">
                <h2>{bracket.name}</h2>
                <p>Year: {bracket.year}</p>
                <p>Games linked: {bracket.games?.length || 0}</p>
                <p>Total points: {bracket.totalPoints ?? 0}</p>
                <div className="inline-row">
                  <Link to={`/brackets/${id}`} className="primary-button">
                    View details
                  </Link>
                  <button type="button" className="danger-button" onClick={() => void handleDelete(id)}>
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
