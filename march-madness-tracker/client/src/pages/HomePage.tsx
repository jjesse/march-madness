import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="grid" style={{ gap: '1.5rem' }}>
      <section className="hero">
        <div className="card hero-copy">
          <h1>Make picks. Track results. Win your pool.</h1>
          <p>
            This MVP frontend connects to the March Madness backend so you can register, create
            brackets, monitor results, and keep an eye on the leaderboard.
          </p>

          <div className="hero-actions">
            {isAuthenticated ? (
              <>
                <Link to="/brackets" className="primary-button">
                  View My Brackets
                </Link>
                <Link to="/results" className="secondary-button">
                  Track My Results
                </Link>
              </>
            ) : (
              <>
                <Link to="/register" className="primary-button">
                  Create Account
                </Link>
                <Link to="/login" className="secondary-button">
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="card hero-copy">
          <h2>{isAuthenticated ? `Welcome back, ${user?.username}` : 'MVP status'}</h2>
          <p>
            The first version focuses on auth, bracket management, leaderboard visibility, and
            score tracking.
          </p>
          <ul>
            <li>Create and save brackets</li>
            <li>Review standings and results</li>
            <li>Manage your picks as the tournament progresses</li>
          </ul>
        </div>
      </section>

      <section className="grid three">
        <article className="stat-card card">
          <h3>Authentication</h3>
          <p>Register, log in, keep your session, and access protected pages.</p>
        </article>
        <article className="stat-card card">
          <h3>Bracket management</h3>
          <p>Create a bracket now and wire in matchup picking as live game data grows.</p>
        </article>
        <article className="stat-card card">
          <h3>Leaderboard tracking</h3>
          <p>View total points, correct picks, and current standings.</p>
        </article>
      </section>
    </div>
  );
}
