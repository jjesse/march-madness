import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import AlertMessage from '../components/AlertMessage';
import BracketRoundSection from '../components/BracketRoundSection';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import PageHeader from '../components/PageHeader';
import bracketService from '../services/bracketService';
import type { Bracket } from '../types';

function isGameLocked(status: string): boolean {
  return status !== 'not started';
}

export default function BracketDetailsPage() {
  const { id = '' } = useParams();
  const [bracket, setBracket] = useState<Bracket | null>(null);
  const [name, setName] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const loadBracket = async () => {
      setIsLoading(true);
      setError('');

      try {
        const data = await bracketService.getById(id);
        setBracket(data);
        setName(data.name);
        setIsPublic(Boolean(data.isPublic));
      } catch {
        setError('Unable to load bracket details.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadBracket();
  }, [id]);

  const groupedGames = useMemo(() => {
    const games = [...(bracket?.games || [])].sort((left, right) => {
      if (left.round !== right.round) {
        return left.round - right.round;
      }

      return `${left.region}-${left.id}`.localeCompare(`${right.region}-${right.id}`);
    });

    return games.reduce<Record<number, Bracket['games']>>((accumulator, game) => {
      const round = game.round || 0;
      accumulator[round] = accumulator[round] || [];
      accumulator[round].push(game);
      return accumulator;
    }, {});
  }, [bracket]);

  const handlePickSelection = (gameKey: string, selectedWinner: string) => {
    setBracket((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        games: current.games.map((game) => {
          const key = game._id || game.id;
          if (key !== gameKey || isGameLocked(game.status)) {
            return game;
          }

          return {
            ...game,
            userPick: selectedWinner,
            pickStatus: 'pending',
          };
        }),
      };
    });
    setSuccess('');
  };

  const handleClearPick = (gameKey: string) => {
    setBracket((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        games: current.games.map((game) => {
          const key = game._id || game.id;
          if (key !== gameKey || isGameLocked(game.status)) {
            return game;
          }

          return {
            ...game,
            userPick: undefined,
            pickStatus: 'pending',
          };
        }),
      };
    });
    setSuccess('');
  };

  const persistBracket = async () => {
    if (!bracket) {
      return;
    }

    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      const updated = await bracketService.update(id, {
        name,
        isPublic,
        games: bracket.games.map((game) => ({
          _id: game._id,
          id: game.id,
          userPick: game.userPick,
        })),
      });
      setBracket(updated);
      setName(updated.name);
      setIsPublic(Boolean(updated.isPublic));
      setSuccess('Bracket and picks saved successfully.');
    } catch {
      setError('Unable to save bracket changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await persistBracket();
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!bracket) {
    return (
      <div className="card empty-state">
        <h1>Bracket not found</h1>
        <Link to="/brackets" className="primary-button">
          Back to my brackets
        </Link>
      </div>
    );
  }

  return (
    <div className="grid" style={{ gap: '1rem' }}>
      <PageHeader
        title={bracket.name}
        description="Review your saved bracket, choose winners, and track how your picks perform."
      />

      <div className="grid two">
        <form className="card form-card form-grid" onSubmit={handleSave}>
          <AlertMessage type="error" message={error} />
          <AlertMessage type="success" message={success} />

          <div className="form-row">
            <label htmlFor="bracketName">Bracket name</label>
            <input
              id="bracketName"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={100}
              required
            />
          </div>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(event) => setIsPublic(event.target.checked)}
            />
            Public bracket
          </label>

          <button type="submit" className="primary-button" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save bracket & picks'}
          </button>
        </form>

        <div className="card">
          <h2>Summary</h2>
          <p>Year: {bracket.year}</p>
          <p>Total points: {bracket.totalPoints ?? 0}</p>
          <p>Linked games: {bracket.games?.length || 0}</p>
          <p>Games lock once they move to in progress or completed.</p>
        </div>
      </div>

      {Object.keys(groupedGames).length === 0 ? (
        <EmptyState
          title="No matchup data yet"
          description="This bracket is ready, but there are no tournament games linked yet. Once the backend syncs bracket games, your pick controls will appear here."
        />
      ) : (
        <div className="grid">
          {Object.entries(groupedGames).map(([round, games]) => (
            <BracketRoundSection
              key={round}
              round={round}
              games={games}
              onPickSelect={handlePickSelection}
              onClearPick={handleClearPick}
            />
          ))}

          <div className="inline-row">
            <button type="button" className="primary-button" onClick={() => void persistBracket()} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save picks'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
