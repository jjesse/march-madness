import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="card empty-state">
      <h1>Page not found</h1>
      <p>The page you requested does not exist.</p>
      <Link to="/" className="primary-button">
        Return home
      </Link>
    </div>
  );
}
