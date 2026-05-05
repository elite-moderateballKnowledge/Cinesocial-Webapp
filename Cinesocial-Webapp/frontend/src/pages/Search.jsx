import { useState } from 'react';
import MovieCard from '../components/MovieCard';
import { apiRequest, getErrorMessage } from '../lib/api';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    setLoading(true);
    setError('');
    setSearched(true);

    try {
      const data = await apiRequest(`/movies/search?q=${encodeURIComponent(trimmedQuery)}`);
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      setResults([]);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-6xl md:text-8xl font-serif font-black mb-12 border-b-8 border-ink pb-4 uppercase">SEARCH</h1>
      
      <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 mb-12 bg-surface-container p-8 border-4 border-ink neo-shadow">
        <input 
          type="text" 
          value={query} 
          onChange={e => setQuery(e.target.value)} 
          placeholder="Search by title, actor, or director..." 
          className="neo-input flex-1 text-2xl py-4 bg-surface-container-lowest"
        />
        <button type="submit" className="neo-btn px-12 text-2xl py-4" disabled={loading}>
          {loading ? 'SEARCHING' : 'GO'}
        </button>
      </form>

      {error && (
        <div className="font-mono font-black text-xl p-8 mb-8 bg-surface-container border-4 border-ink">
          SEARCH FAILED: {error}
        </div>
      )}

      {searched && !loading && !error && results.length === 0 && (
        <div className="text-3xl font-mono font-black p-12 bg-surface-container border-4 border-ink text-center">
          NO MATCHES FOUND.
        </div>
      )}

      {results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {results.map(movie => (
            <MovieCard key={movie.Movie_ID} movie={movie} />
          ))}
        </div>
      )}
    </div>
  );
}
