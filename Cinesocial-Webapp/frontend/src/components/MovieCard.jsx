import { Link } from 'react-router-dom';
import ImageWithFallback from './ImageWithFallback';

const SHADOW_COLORS = ['rgba(0,0,0,1)', '#FFD300', '#FF3D00', '#6C3CE1', '#00A3E0', '#00C853'];

const formatYear = (date) => {
  const y = new Date(date).getFullYear();
  return Number.isFinite(y) ? y : 'N/A';
};

const formatRating = (rating) => {
  const n = Number(rating);
  return Number.isFinite(n) ? n.toFixed(1) : '0.0';
};

export default function MovieCard({ movie, colorIndex = 0 }) {
  const shadowColor = SHADOW_COLORS[colorIndex % SHADOW_COLORS.length];

  return (
    <Link to={`/movie/${movie.Movie_ID}`} className="block group animate-fade-in-up">
      <div
        className="flex flex-col h-full border-4 border-ink bg-surface transition-all duration-200 cursor-pointer"
        style={{
          boxShadow: `8px 8px 0px 0px ${shadowColor}`,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translate(-4px, -4px)';
          e.currentTarget.style.boxShadow = `12px 12px 0px 0px ${shadowColor}`;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = '';
          e.currentTarget.style.boxShadow = `8px 8px 0px 0px ${shadowColor}`;
        }}
      >
        {/* Poster */}
        <div className="relative w-full h-80 border-b-4 border-ink overflow-hidden bg-surface-container-lowest">
          <ImageWithFallback
            src={movie.Poster_URL}
            alt={movie.Title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            fallbackText={movie.Title || 'NO IMAGE'}
          />
          {/* Year badge */}
          <div
            className="absolute top-3 left-3 border-2 border-ink px-2 py-0.5 text-xs font-bold"
            style={{ backgroundColor: '#FFD300', fontFamily: 'var(--font-display)' }}
          >
            {movie.Release_date ? formatYear(movie.Release_date) : 'N/A'}
          </div>
        </div>

        {/* Info */}
        <div className="p-4 flex flex-col flex-1">
          <h3
            className="font-serif font-black text-xl mb-3 line-clamp-2 leading-tight"
          >
            {movie.Title}
          </h3>
          <div className="mt-auto flex justify-between items-center border-t-4 border-ink pt-3 gap-2">
            <span
              className="text-sm font-bold opacity-60"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {movie.M_Type || 'FILM'}
            </span>
            <span
              className="px-3 py-1 border-2 border-ink text-sm font-bold"
              style={{ backgroundColor: '#FFD300', fontFamily: 'var(--font-display)' }}
            >
              ★ {formatRating(movie.A_Rating)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
