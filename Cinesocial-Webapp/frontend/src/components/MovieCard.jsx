import { Link } from 'react-router-dom';

export default function MovieCard({ movie }) {
  return (
    <Link to={`/movie/${movie.Movie_ID}`} className="block">
      <div className="neo-card flex flex-col h-full hover:-translate-y-2 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 cursor-pointer group bg-surface">
        <div className="w-full h-80 border-b-4 border-ink mb-4 overflow-hidden bg-surface-container-lowest">
          {movie.Poster_URL ? (
            <img src={movie.Poster_URL} alt={movie.Title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-bold font-mono text-xl">NO IMAGE</div>
          )}
        </div>
        <h3 className="font-serif font-black text-2xl mb-2 line-clamp-2 leading-tight">{movie.Title}</h3>
        <div className="mt-auto flex justify-between items-center text-sm font-mono font-bold border-t-4 border-ink pt-4">
          <span>{movie.Release_date ? new Date(movie.Release_date).getFullYear() : 'N/A'}</span>
          <span className="bg-primary px-3 py-1 border-4 border-ink text-lg">★ {Number(movie.A_Rating).toFixed(1) || '0.0'}</span>
        </div>
      </div>
    </Link>
  );
}
