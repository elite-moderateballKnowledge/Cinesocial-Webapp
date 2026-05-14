import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import ImageWithFallback from '../components/ImageWithFallback';
import { apiRequest, authHeaders, getErrorMessage } from '../lib/api';

const formatYear = (date) => {
  const year = new Date(date).getFullYear();
  return Number.isFinite(year) ? year : 'N/A';
};

const formatRating = (rating) => {
  const n = Number(rating);
  return Number.isFinite(n) ? n.toFixed(1) : '0.0';
};

function MovieTile({ movie, canEdit, removing, onRemove }) {
  return (
    <div className="relative border-4 border-ink bg-surface-container-lowest shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      {canEdit && (
        <button
          type="button"
          onClick={() => onRemove(movie.Movie_ID)}
          disabled={removing}
          className="absolute right-3 top-3 z-10 border-4 border-ink bg-surface-container-lowest p-2 transition-colors hover:bg-secondary hover:text-white disabled:opacity-60"
          title="Remove from list"
          aria-label={`Remove ${movie.Title} from list`}
        >
          <Trash2 size={18} strokeWidth={3} />
        </button>
      )}

      <Link to={`/movie/${movie.Movie_ID}`} className="group block h-full">
        <div className="h-80 overflow-hidden border-b-4 border-ink bg-surface-container">
          <ImageWithFallback
            src={movie.Poster_URL}
            alt={movie.Title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            fallbackText={movie.Title}
          />
        </div>
        <div className="flex min-h-40 flex-col gap-3 p-4">
          <h3 className="text-2xl font-serif font-black leading-tight line-clamp-2">{movie.Title}</h3>
          <div className="mt-auto flex items-center justify-between gap-3 border-t-4 border-ink pt-3">
            <span className="font-mono text-xs font-black uppercase opacity-70">
              {formatYear(movie.Release_date)}
            </span>
            <span className="border-2 border-ink bg-primary px-2 py-1 font-mono text-sm font-black">
              Star {formatRating(movie.A_Rating)}
            </span>
          </div>
          {movie.Watch_status && (
            <span className="self-start border-2 border-ink bg-ink px-2 py-1 font-mono text-xs font-black uppercase text-primary">
              {movie.Watch_status}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}

export default function ListDetails() {
  const { id } = useParams();
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState('');
  const [savingMovieId, setSavingMovieId] = useState(null);
  const [removingMovieId, setRemovingMovieId] = useState(null);

  useEffect(() => {
    let ignore = false;

    const loadList = async () => {
      setLoading(true);
      try {
        const data = await apiRequest(`/lists/${id}`, { headers: authHeaders() });
        if (!ignore) {
          setList(data);
          setError('');
        }
      } catch (err) {
        if (!ignore) {
          setList(null);
          setError(getErrorMessage(err));
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadList();
    return () => {
      ignore = true;
    };
  }, [id]);

  useEffect(() => {
    if (!list?.can_edit || query.trim().length < 2) {
      setSearchResults([]);
      setSearchError('');
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const data = await apiRequest(`/movies/search?q=${encodeURIComponent(query.trim())}`);
        setSearchResults(Array.isArray(data) ? data.slice(0, 8) : []);
        setSearchError('');
      } catch (err) {
        setSearchResults([]);
        setSearchError(getErrorMessage(err));
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [query, list?.can_edit]);

  const movieIds = useMemo(() => new Set((list?.movies || []).map(movie => movie.Movie_ID)), [list]);
  const canEdit = Boolean(list?.can_edit);

  const addMovie = async (movie) => {
    setSavingMovieId(movie.Movie_ID);
    try {
      const addedMovie = await apiRequest(`/lists/${id}/movies`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ movieId: movie.Movie_ID }),
      });

      setList(prev => ({
        ...prev,
        total_movies: Number(prev.total_movies || 0) + 1,
        movies: [addedMovie, ...(prev.movies || [])],
      }));
      setQuery('');
      setSearchResults([]);
      setSearchError('');
    } catch (err) {
      setSearchError(getErrorMessage(err));
    } finally {
      setSavingMovieId(null);
    }
  };

  const removeMovie = async (movieId) => {
    setRemovingMovieId(movieId);
    try {
      await apiRequest(`/lists/${id}/movies/${movieId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });

      setList(prev => ({
        ...prev,
        total_movies: Math.max(0, Number(prev.total_movies || 0) - 1),
        movies: (prev.movies || []).filter(movie => movie.Movie_ID !== movieId),
      }));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setRemovingMovieId(null);
    }
  };

  if (loading) {
    return <div className="text-4xl font-mono font-black animate-pulse">LOADING...</div>;
  }

  if (error && !list) {
    return (
      <div className="flex flex-col gap-6">
        <Link to="/lists" className="inline-flex items-center gap-2 font-mono text-lg font-black underline decoration-4 underline-offset-4">
          <ArrowLeft size={20} strokeWidth={3} /> BACK TO LISTS
        </Link>
        <div className="font-mono font-black text-xl p-8 bg-surface-container border-4 border-ink">
          COULD NOT LOAD LIST: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <Link to="/lists" className="inline-flex items-center gap-2 self-start font-mono text-lg font-black underline decoration-4 underline-offset-4">
        <ArrowLeft size={20} strokeWidth={3} /> BACK TO LISTS
      </Link>

      <header className="border-b-8 border-ink pb-6">
        <div className="mb-4 flex flex-wrap gap-3">
          <span className="border-4 border-ink bg-primary px-3 py-1 font-mono text-sm font-black">
            {list.is_watchlist ? 'PRIVATE WATCHLIST' : 'PUBLIC COLLECTION'}
          </span>
          <span className="border-4 border-ink bg-surface-container-lowest px-3 py-1 font-mono text-sm font-black">
            {list.total_movies ?? list.movies?.length ?? 0} MOVIES
          </span>
        </div>
        <h1 className="text-5xl md:text-8xl font-serif font-black uppercase leading-none">
          {list.List_Title}
        </h1>
        <div className="mt-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <p className="max-w-3xl font-mono text-xl opacity-85">
            {list.L_Description || 'No description provided.'}
          </p>
          <Link to={`/profile/${list.U_ID}`} className="font-mono text-lg font-black underline decoration-4 underline-offset-4">
            @{list.Username}
          </Link>
        </div>
      </header>

      {canEdit && (
        <section className="border-4 border-ink bg-surface-container-lowest p-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <label className="mb-3 block font-mono text-lg font-black">ADD MOVIE</label>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="neo-input w-full text-lg"
            placeholder="Search for a movie..."
          />
          {searchError && (
            <p className="mt-3 font-mono font-black text-secondary">{searchError}</p>
          )}
          {searchResults.length > 0 && (
            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
              {searchResults.map(movie => {
                const alreadyAdded = movieIds.has(movie.Movie_ID);
                return (
                  <div key={movie.Movie_ID} className="flex items-center gap-4 border-4 border-ink bg-surface-container p-3">
                    <div className="h-20 w-14 shrink-0 overflow-hidden border-2 border-ink bg-surface-container-lowest">
                      <ImageWithFallback
                        src={movie.Poster_URL}
                        alt={movie.Title}
                        className="h-full w-full object-cover"
                        fallbackText={movie.Title}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-base font-black">{movie.Title}</p>
                      <p className="font-mono text-xs font-bold opacity-70">{formatYear(movie.Release_date)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => addMovie(movie)}
                      disabled={alreadyAdded || savingMovieId === movie.Movie_ID}
                      className="border-4 border-ink bg-primary p-2 transition-colors hover:bg-surface-container-lowest disabled:cursor-not-allowed disabled:opacity-50"
                      title={alreadyAdded ? 'Already in list' : 'Add to list'}
                      aria-label={`Add ${movie.Title} to list`}
                    >
                      <Plus size={20} strokeWidth={3} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {error && (
        <div className="font-mono font-black text-xl p-5 bg-surface-container border-4 border-ink">
          {error}
        </div>
      )}

      {list.movies?.length > 0 ? (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {list.movies.map(movie => (
            <MovieTile
              key={movie.Movie_ID}
              movie={movie}
              canEdit={canEdit}
              removing={removingMovieId === movie.Movie_ID}
              onRemove={removeMovie}
            />
          ))}
        </div>
      ) : (
        <div className="border-4 border-ink bg-surface-container p-12 text-center font-mono text-2xl font-black">
          NO MOVIES IN THIS LIST YET.
        </div>
      )}
    </div>
  );
}
