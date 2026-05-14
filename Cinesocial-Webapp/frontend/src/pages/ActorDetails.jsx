import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ImageWithFallback from '../components/ImageWithFallback';
import MovieCard from '../components/MovieCard';
import { apiRequest, getErrorMessage } from '../lib/api';

const formatYear = (d) => {
  const y = new Date(d).getFullYear();
  return Number.isFinite(y) ? y : null;
};

export default function ActorDetails() {
  const { id } = useParams();
  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      setLoading(true);
      try {
        const data = await apiRequest(`/persons/${id}`);
        if (!ignore) {
          setPerson(data);
          setError('');
        }
      } catch (err) {
        if (!ignore) {
          setPerson(null);
          setError(getErrorMessage(err));
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    run();
    return () => { ignore = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="h-64 border-4 border-ink" style={{ backgroundColor: '#6C3CE1' }} />
        <div className="h-10 border-4 border-ink bg-surface-container w-1/2" />
        <div className="h-32 border-4 border-ink bg-surface-container" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 border-4 border-ink neo-shadow" style={{ backgroundColor: '#FF3D00', color: '#fff' }}>
        <h2 className="text-3xl font-serif font-black mb-2">COULD NOT LOAD PROFILE</h2>
        <p style={{ fontFamily: 'var(--font-display)' }}>{error}</p>
        <Link to="/movies" className="inline-block mt-6 font-bold underline">Back to movies</Link>
      </div>
    );
  }

  if (!person) return null;

  const summaryText =
    (person.Bio && person.Bio.trim()) ||
    (person.wikiSummary && person.wikiSummary.trim()) ||
    'No biography available yet.';

  const birthYear = person.BDate ? formatYear(person.BDate) : null;

  return (
    <div className="flex flex-col gap-12 animate-fade-in">
      <div className="relative border-4 border-ink neo-shadow overflow-hidden" style={{ minHeight: 320 }}>
        <div className="absolute inset-0" style={{ backgroundColor: '#6C3CE1', opacity: 0.35 }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 100%)' }} />

        <div className="relative z-10 flex flex-col md:flex-row gap-8 p-8 md:p-10 items-start">
          <div
            className="shrink-0 w-44 h-44 md:w-52 md:h-52 border-4 border-ink overflow-hidden"
            style={{ borderRadius: '50%', boxShadow: '8px 8px 0 0 #A89200' }}
          >
            <ImageWithFallback
              src={person.Photo_URL}
              alt={person.Full_Name}
              className="w-full h-full object-cover"
              fallbackText={person.Full_Name?.charAt(0).toUpperCase() || '?'}
              isAvatar
            />
          </div>

          <div className="flex flex-col gap-4 flex-1 min-w-0">
            <h1
              className="text-4xl md:text-5xl font-serif font-black uppercase leading-tight"
              style={{ color: '#A89200', textShadow: '3px 3px 0 #000, -1px -1px 0 #000' }}
            >
              {person.Full_Name}
            </h1>

            <div className="flex flex-wrap gap-2">
              {person.age != null && (
                <span
                  className="px-3 py-1 border-4 border-ink text-sm font-bold"
                  style={{ backgroundColor: '#00A3E0', color: '#fff', fontFamily: 'var(--font-display)' }}
                >
                  AGE {person.age}
                </span>
              )}
              {birthYear != null && person.age == null && (
                <span
                  className="px-3 py-1 border-4 border-ink text-sm font-bold"
                  style={{ backgroundColor: '#00A3E0', color: '#fff', fontFamily: 'var(--font-display)' }}
                >
                  BORN {birthYear}
                </span>
              )}
              {person.gender && (
                <span
                  className="px-3 py-1 border-4 border-ink text-sm font-bold"
                  style={{ backgroundColor: '#FF3D00', color: '#fff', fontFamily: 'var(--font-display)' }}
                >
                  {person.gender.toUpperCase()}
                </span>
              )}
              {person.Nationality && (
                <span
                  className="px-3 py-1 border-4 border-ink text-sm font-bold"
                  style={{ backgroundColor: '#00C853', color: '#000', fontFamily: 'var(--font-display)' }}
                >
                  {person.Nationality.toUpperCase()}
                </span>
              )}
            </div>

            <p
              className="text-base md:text-lg leading-relaxed max-w-3xl"
              style={{ color: 'rgba(255,255,255,0.92)', fontFamily: 'var(--font-display)' }}
            >
              {summaryText}
            </p>

            {person.wikiSummary && person.Bio && person.Bio.trim() && person.wikiSummary !== person.Bio && (
              <p
                className="text-sm leading-relaxed max-w-3xl opacity-80 border-l-4 pl-4"
                style={{ borderColor: '#A89200', color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-display)' }}
              >
                {person.wikiSummary}
              </p>
            )}
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-4 mb-6">
          <h2
            className="text-3xl font-serif font-black px-4 py-1 border-4 border-ink"
            style={{ backgroundColor: '#A89200', color: '#000', boxShadow: '4px 4px 0 0 #000' }}
          >
            FILMOGRAPHY
          </h2>
          {person.movies?.length > 0 && (
            <span className="text-sm font-bold opacity-60" style={{ fontFamily: 'var(--font-display)' }}>
              {person.movies.length} CREDIT{person.movies.length !== 1 ? 'S' : ''}
            </span>
          )}
        </div>

        {person.movies?.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-12">
            {person.movies.map((m, i) => (
              <div key={m.Movie_ID} className="flex flex-col gap-2">
                <MovieCard movie={m} colorIndex={i} />
                {(m.Character_Name || m.Role_Type) && (
                  <p
                    className="text-xs font-bold text-center line-clamp-2 px-1"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    AS {m.Character_Name || m.Role_Type}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div
            className="p-8 border-4 border-ink font-black text-xl text-center"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            NO MOVIES LINKED IN DATABASE.
          </div>
        )}
      </div>
    </div>
  );
}
