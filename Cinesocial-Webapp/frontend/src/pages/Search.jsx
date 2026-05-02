import { useState } from 'react';
import MovieCard from '../components/MovieCard';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query) return;
    const res = await fetch(`http://localhost:5000/api/movies/search?q=${query}`);
    const data = await res.json();
    setResults(data);
    setSearched(true);
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
        <button type="submit" className="neo-btn px-12 text-2xl py-4">GO</button>
      </form>

      {searched && results.length === 0 && (
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
