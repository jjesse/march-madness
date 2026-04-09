import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Layout() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'nav-link active' : 'nav-link';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <NavLink to="/" className="brand">
            🏀 March Madness Tracker
          </NavLink>

          <nav className="nav-links">
            <NavLink to="/" className={getNavLinkClass}>
              Home
            </NavLink>
            <NavLink to="/leaderboard" className={getNavLinkClass}>
              Leaderboard
            </NavLink>

            {isAuthenticated ? (
              <>
                <NavLink to="/brackets" className={getNavLinkClass}>
                  My Brackets
                </NavLink>
                <NavLink to="/brackets/new" className={getNavLinkClass}>
                  New Bracket
                </NavLink>
                <NavLink to="/results" className={getNavLinkClass}>
                  My Results
                </NavLink>
                <NavLink to="/profile" className={getNavLinkClass}>
                  Profile
                </NavLink>
                <span className="nav-link">{user?.username}</span>
                <button type="button" className="ghost-button" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={getNavLinkClass}>
                  Login
                </NavLink>
                <NavLink to="/register" className={getNavLinkClass}>
                  Register
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="page-container">
        <Outlet />
      </main>

      <footer className="footer">
        <div className="page-container">
          Track picks, watch standings, and manage your tournament brackets in one place.
        </div>
      </footer>
    </div>
  );
}
