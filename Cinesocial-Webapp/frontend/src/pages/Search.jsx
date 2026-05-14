import { useEffect, useState } from 'react';
import MovieCard from '../components/MovieCard';
import { apiRequest, getErrorMessage } from '../lib/api';

const currentYear = new Date().getFullYear();

export default function Search() {
  const [query, setQuery] = useState('');
  const [year, setYear] = useState('');
  const [genreId, setGenreId] = useState('');
  const [genres, setGenres] = useState([]);
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;

    apiRequest('/movies/genres')
      .then((data) => {
        if (!ignore) setGenres(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!ignore) setGenres([]);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    const trimmedQuery = query.trim();
    const trimmedYear = year.trim();

    if (!trimmedQuery && !trimmedYear && !genreId) return;

    setLoading(true);
    setError('');
    setSearched(true);

    try {
      const params = new URLSearchParams();
      if (trimmedQuery) params.set('q', trimmedQuery);
      if (trimmedYear) params.set('year', trimmedYear);
      if (genreId) params.set('genreId', genreId);

      const data = await apiRequest(`/movies/search?${params.toString()}`);
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      setResults([]);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setQuery('');
    setYear('');
    setGenreId('');
    setResults([]);
    setSearched(false);
    setError('');
  };

  return (
    <div>
      <div className="mb-10 border-b-8 border-ink pb-5">
        <p className="mb-2 text-sm font-black uppercase tracking-widest opacity-70">Find your next watch</p>
        <h1 className="text-6xl md:text-8xl font-serif font-black uppercase leading-none">Search</h1>
      </div>

      <form onSubmit={handleSearch} className="mb-12 grid gap-4 bg-surface-container p-6 md:grid-cols-[1fr_140px_220px_auto] md:p-8 border-4 border-ink neo-shadow">
        <label className="flex flex-col gap-2">
          <span className="text-xs font-black uppercase tracking-widest">Title, actor, or director</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies..."
            className="neo-input h-14 bg-surface-container-lowest text-lg"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-xs font-black uppercase tracking-widest">Year</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]{4}"
            maxLength="4"
            value={year}
            onChange={(e) => setYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder={String(Math.min(2024, currentYear))}
            className="neo-input h-14 bg-surface-container-lowest text-lg"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-xs font-black uppercase tracking-widest">Genre</span>
          <select
            value={genreId}
            onChange={(e) => setGenreId(e.target.value)}
            className="neo-input h-14 bg-surface-container-lowest text-lg"
          >
            <option value="">All genres</option>
            {genres.map((genre) => (
              <option key={genre.genre_id} value={genre.genre_id}>
                {genre.genre_name}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-end gap-3">
          <button type="submit" className="neo-btn h-14 px-8 text-lg uppercase" disabled={loading}>
            {loading ? 'Searching' : 'Go'}
          </button>
          {(query || year || genreId || searched) && (
            <button
              type="button"
              onClick={clearFilters}
              className="h-14 border-4 border-ink bg-surface-container-lowest px-4 text-sm font-black uppercase transition-colors hover:bg-primary"
            >
              Clear
            </button>
          )}
        </div>
      </form>

      {error && (
        <div className="font-mono font-black text-xl p-8 mb-8 bg-surface-container border-4 border-ink">
          Search failed: {error}
        </div>
      )}

      {searched && !loading && !error && results.length === 0 && (
        <div className="text-3xl font-mono font-black p-12 bg-surface-container border-4 border-ink text-center">
          No matches found.
        </div>
      )}

      {results.length > 0 && (
        <>
          <div className="mb-6 flex items-end justify-between border-b-4 border-ink pb-3">
            <h2 className="text-3xl font-black uppercase">Results</h2>
            <span className="text-sm font-black uppercase opacity-70">
              {results.length} {results.length === 1 ? 'movie' : 'movies'}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {results.map((movie, index) => (
              <MovieCard key={movie.Movie_ID} movie={movie} colorIndex={index} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
