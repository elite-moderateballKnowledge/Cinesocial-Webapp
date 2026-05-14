import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Logo from './Logo';

function NavLink({ to, children }) {
  const { pathname } = useLocation();
  const active = pathname === to || (to !== '/' && pathname.startsWith(to));
  return (
    <Link
      to={to}
      className="relative font-bold transition-all duration-150 px-1 py-0.5"
      style={{
        fontFamily: 'var(--font-display)',
        color: active ? '#000' : '#000',
        textDecoration: 'none',
      }}
    >
      {active && (
        <span
          className="absolute inset-0 -z-10"
          style={{ backgroundColor: '#A89200', transform: 'rotate(-1deg)', borderRadius: '2px' }}
        />
      )}
      <span className={active ? 'relative' : 'hover:underline decoration-4 underline-offset-4'}>
        {children}
      </span>
    </Link>
  );
}

export default function NavBar() {
  const { user, logout } = useAuth();

  return (
    <nav
      className="border-b-4 border-ink px-8 py-4 flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-center sticky top-0 z-50"
      style={{ backgroundColor: '#A89200' }}
    >
      {/* Brand */}
      <Logo variant="dark" />

      {/* Links */}
      <div className="flex gap-5 md:gap-7 items-center flex-wrap text-sm">
        <NavLink to="/movies">MOVIES</NavLink>
        <NavLink to="/search">SEARCH</NavLink>
        <NavLink to="/articles">ESSAYS</NavLink>
        <NavLink to="/members">MEMBERS</NavLink>
        <NavLink to="/lists">LISTS</NavLink>
        {user ? (
          <>
            <NavLink to="/parties">PARTIES</NavLink>
            <NavLink to="/profile">PROFILE</NavLink>
            <button
              onClick={logout}
              className="neo-btn px-5 py-1.5 text-sm"
            >
              LOGOUT
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login">LOGIN</NavLink>
            <Link to="/register" className="neo-btn px-5 py-1.5 text-sm">
              JOIN
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
