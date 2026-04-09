import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import bracketService from '../services/bracketService';

export default function BracketPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('My 2026 Bracket');
  const [isPublic, setIsPublic] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const bracket = await bracketService.create({ name, isPublic });
      navigate(`/brackets/${bracket._id || bracket.id}`);
    } catch {
      setError('Unable to create your bracket.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid two">
      <div className="card form-card">
        <div className="page-header">
          <h1>Create a bracket</h1>
          <p>Set up a bracket entry now and connect matchup picks as tournament data loads.</p>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          {error ? <div className="alert error">{error}</div> : null}

          <div className="form-row">
            <label htmlFor="name">Bracket name</label>
            <input
              id="name"
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
            Make this bracket public
          </label>

          <button type="submit" className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create bracket'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2>MVP progress</h2>
        <p>
          The first frontend pass focuses on account access, bracket management, leaderboard
          visibility, and results tracking.
        </p>
        <ul>
          <li>Bracket creation is live</li>
          <li>Saved brackets can be reviewed, renamed, and updated</li>
          <li>Use the bracket details page to select winners and save picks</li>
        </ul>
      </div>
    </div>
  );
}
