import { useEffect, useState } from 'react';
import MovieCard from '../components/MovieCard';

export default function Home() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/movies')
      .then(res => res.json())
      .then(data => {
        setMovies(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-4xl font-mono font-black animate-pulse bg-primary p-8 border-4 border-ink inline-block neo-shadow">LOADING MOVIES...</div>;

  return (
    <div>
      <div className="bg-primary p-8 border-4 border-ink neo-shadow mb-16">
        <h1 className="text-6xl md:text-8xl font-serif font-black uppercase" style={{ WebkitTextStroke: '2px black' }}>
          Explore Cinema
        </h1>
        <p className="mt-4 font-mono font-bold text-xl max-w-2xl">
          Discover, review, and curate your favorite films in a community of uncompromising critics.
        </p>
      </div>

      <h2 className="text-4xl font-serif font-black mb-8 border-b-8 border-ink pb-4">LATEST ADDITIONS</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-12">
        {movies.map(movie => (
          <MovieCard key={movie.Movie_ID} movie={movie} />
        ))}
      </div>
    </div>
  );
}
