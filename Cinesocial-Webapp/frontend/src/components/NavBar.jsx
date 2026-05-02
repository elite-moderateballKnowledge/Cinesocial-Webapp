import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function NavBar() {
  const { user, logout } = useAuth();

  return (
    <nav className="border-b-4 border-ink bg-primary px-8 py-4 flex justify-between items-center sticky top-0 z-50">
      <Link to="/" className="text-3xl font-serif font-black tracking-tighter text-primary hover:scale-105 transition-transform" style={{ WebkitTextStroke: '2px black' }}>
        CINE
      </Link>
      <div className="flex gap-6 font-mono font-bold items-center text-ink">
        <Link to="/movies" className="hover:underline decoration-4 underline-offset-4">MOVIES</Link>
        <Link to="/search" className="hover:underline decoration-4 underline-offset-4">SEARCH</Link>
        {user ? (
          <>
            <Link to="/lists" className="hover:underline decoration-4 underline-offset-4">LISTS</Link>
            <Link to="/parties" className="hover:underline decoration-4 underline-offset-4">PARTIES</Link>
            <Link to="/profile" className="hover:underline decoration-4 underline-offset-4">PROFILE</Link>
            <button onClick={logout} className="neo-btn px-6 py-2 text-sm bg-surface rounded-full">LOGOUT</button>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:underline decoration-4 underline-offset-4">LOGIN</Link>
            <Link to="/register" className="neo-btn px-6 py-2 text-sm bg-surface rounded-full">JOIN</Link>
          </>
        )}
      </div>
    </nav>
  );
}
