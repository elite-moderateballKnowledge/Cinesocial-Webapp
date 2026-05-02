import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t-4 border-ink bg-surface-container px-8 py-12 mt-20">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 font-mono text-sm font-bold text-ink">
        <div className="flex flex-col gap-2">
          <Link to="/movies" className="hover:underline decoration-4 underline-offset-4">MOVIES</Link>
          <Link to="/lists" className="hover:underline decoration-4 underline-offset-4">LISTS</Link>
          <Link to="/members" className="hover:underline decoration-4 underline-offset-4">MEMBERS</Link>
        </div>
        <div className="flex flex-col gap-2">
          <Link to="/parties" className="hover:underline decoration-4 underline-offset-4">PARTIES</Link>
          <Link to="/subscription" className="hover:underline decoration-4 underline-offset-4">PREMIUM</Link>
        </div>
        <div className="flex flex-col gap-2">
          <Link to="/about" className="hover:underline decoration-4 underline-offset-4">ABOUT</Link>
          <Link to="/contact" className="hover:underline decoration-4 underline-offset-4">CONTACT</Link>
        </div>
        <div className="flex flex-col gap-2">
          <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:underline decoration-4 underline-offset-4">TWITTER</a>
          <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:underline decoration-4 underline-offset-4">INSTAGRAM</a>
          <Link to="/terms" className="hover:underline decoration-4 underline-offset-4">TERMS</Link>
          <Link to="/privacy" className="hover:underline decoration-4 underline-offset-4">PRIVACY</Link>
        </div>
      </div>
      <div className="mt-12 text-center">
         <span className="font-serif font-black text-6xl text-primary" style={{ WebkitTextStroke: '2px black' }}>
          CINE
         </span>
      </div>
    </footer>
  );
}
