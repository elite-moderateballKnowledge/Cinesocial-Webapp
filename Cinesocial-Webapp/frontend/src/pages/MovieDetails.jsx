import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ReviewCard from '../components/ReviewCard';
import ImageWithFallback from '../components/ImageWithFallback';
import { apiRequest, authHeaders, getErrorMessage } from '../lib/api';

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatRating = (r) => {
  const n = Number(r);
  return Number.isFinite(n) ? n.toFixed(1) : '0.0';
};

const formatYear = (d) => {
  const y = new Date(d).getFullYear();
  return Number.isFinite(y) ? y : 'N/A';
};

const formatRuntime = (mins) => {
  if (!mins) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

// ─── Sub-components ──────────────────────────────────────────────────────────

/** ★★★☆☆ star display */
function StarDisplay({ rating, size = '1.4rem' }) {
  const n = Math.round(Number(rating) || 0);
  return (
    <span style={{ fontSize: size, letterSpacing: '3px' }}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < n ? 'star-filled' : 'star-empty'}>★</span>
      ))}
    </span>
  );
}

/** Clickable star picker for the review form */
function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || Math.round(value);
  return (
    <div className="flex gap-1" style={{ fontSize: '2rem', cursor: 'pointer' }}>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={i < display ? 'star-filled' : 'star-empty'}
          style={{ transition: 'color 0.1s, transform 0.1s', transform: i < display ? 'scale(1.15)' : 'scale(1)' }}
          onMouseEnter={() => setHovered(i + 1)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(i + 1)}
        >
          ★
        </span>
      ))}
      <span
        className="text-sm font-bold self-end mb-1 ml-2"
        style={{ fontFamily: 'var(--font-display)', opacity: 0.7 }}
      >
        {value}.0 / 5.0
      </span>
    </div>
  );
}

/** Genre pill */
function GenrePill({ name, idx }) {
  const COLORS = ['#FFD300', '#FF3D00', '#6C3CE1', '#00A3E0', '#00C853', '#FF6B35'];
  const bg = COLORS[idx % COLORS.length];
  const fg = bg === '#FFD300' || bg === '#00C853' ? '#000' : '#fff';
  return (
    <span
      className="px-3 py-1 border-4 border-ink text-sm font-bold"
      style={{ backgroundColor: bg, color: fg, fontFamily: 'var(--font-display)' }}
    >
      {name}
    </span>
  );
}

/** Single actor card in the filmstrip */
function CastCard({ person, idx }) {
  const BORDER_COLORS = ['#FFD300', '#FF3D00', '#6C3CE1', '#00A3E0', '#00C853'];
  const borderColor = BORDER_COLORS[idx % BORDER_COLORS.length];
  return (
    <Link
      to={`/person/${person.Person_ID}`}
      className="flex-shrink-0 w-36 flex flex-col items-center border-4 border-ink bg-surface p-3 animate-fade-in-up no-underline text-inherit cursor-pointer"
      style={{
        animationDelay: `${idx * 60}ms`,
        scrollSnapAlign: 'start',
        boxShadow: `4px 4px 0 0 ${borderColor}`,
        transition: 'transform 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translate(-2px,-2px)';
        e.currentTarget.style.boxShadow = `6px 6px 0 0 ${borderColor}`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = `4px 4px 0 0 ${borderColor}`;
      }}
    >
      {/* Circle photo */}
      <div
        className="w-20 h-20 border-4 border-ink overflow-hidden mb-3 relative"
        style={{ borderRadius: '50%', borderColor }}
      >
        <ImageWithFallback
          src={person.Photo_URL}
          alt={person.Full_Name}
          className="w-full h-full object-cover"
          fallbackText={person.Full_Name?.charAt(0).toUpperCase() || '?'}
          isAvatar
        />
      </div>
      <span
        className="font-bold text-xs text-center leading-tight line-clamp-2 w-full"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {person.Full_Name}
      </span>
      <span
        className="text-xs text-center opacity-60 mt-0.5 line-clamp-1 w-full"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {person.Character_Name || person.Role_Type}
      </span>
    </Link>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function MovieDetails() {
  const { id } = useParams();
  const { user } = useAuth();

  const [movie, setMovie] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Review form state
  const [rating, setRating] = useState(4);
  const [reviewText, setReviewText] = useState('');
  const [spoiler, setSpoiler] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    const movieData = await apiRequest(`/movies/${id}`);
    setMovie(movieData);
    setReviews(movieData.reviews ?? []);
    setError('');
  }, [id]);

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      setLoading(true);
      try {
        const movieData = await apiRequest(`/movies/${id}`);
        if (!ignore) {
          setMovie(movieData);
          setReviews(movieData.reviews ?? []);
          setError('');
        }
      } catch (err) {
        if (!ignore) {
          setMovie(null);
          setReviews([]);
          setError(getErrorMessage(err));
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    run();
    return () => { ignore = true; };
  }, [id]);

  const submitReview = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiRequest('/reviews', {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ movieId: id, rating, reviewText, containsSpoiler: spoiler }),
      });
      setRating(4);
      setReviewText('');
      setSpoiler(false);
      await loadData();
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Render states ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="h-96 border-4 border-ink" style={{ backgroundColor: '#FFD300' }} />
        <div className="h-8 border-4 border-ink bg-surface-container w-2/3" />
        <div className="h-8 border-4 border-ink bg-surface-container w-1/2" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 border-4 border-ink neo-shadow" style={{ backgroundColor: '#FF3D00', color: '#fff' }}>
        <h2 className="text-3xl font-serif font-black mb-2">COULD NOT LOAD MOVIE</h2>
        <p style={{ fontFamily: 'var(--font-display)' }}>{error}</p>
      </div>
    );
  }

  if (!movie) return null;

  const title = movie.title ?? movie.Title ?? 'Unknown';
  const cast = movie.cast ?? [];
  const genres = movie.genres ?? [];
  const trailerUrl = movie.trailer_url ?? movie.Trailer_URL ?? null;
  const posterUrl = movie.poster_url ?? movie.Poster_URL ?? null;
  const avgRating = movie.avg_rating ?? movie.A_Rating ?? 0;
  const reviewCount = movie.review_count ?? movie.reviewCount ?? 0;
  const synopsis = movie.synopsis ?? movie.Synopsis ?? 'No synopsis available.';
  const runtime = movie.runtime ?? movie.Runtime ?? null;
  const releaseDate = movie.release_date ?? movie.Release_date ?? null;

  return (
    <div className="flex flex-col gap-12 animate-fade-in">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="relative border-4 border-ink neo-shadow overflow-hidden" style={{ minHeight: 480 }}>
        {/* Blurred backdrop */}
        {posterUrl && (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${posterUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center top',
              filter: 'blur(18px) brightness(0.35) saturate(1.4)',
              transform: 'scale(1.08)',
            }}
          />
        )}
        {/* Dark overlay for readability */}
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.35)' }} />

        {/* Content row */}
        <div className="relative z-10 flex flex-col md:flex-row gap-8 p-8 md:p-10">
          {/* Poster */}
          <div
            className="shrink-0 w-48 md:w-60 border-4 border-ink self-start animate-slide-left"
            style={{ boxShadow: '8px 8px 0 0 #FFD300' }}
          >
            <div className="aspect-[2/3]">
              <ImageWithFallback
                src={posterUrl}
                alt={title}
                className="w-full h-full object-cover"
                fallbackText={title || 'NO IMAGE'}
              />
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col gap-4 flex-1 animate-fade-in-up delay-150">
            <h1
              className="text-4xl md:text-6xl font-serif font-black uppercase leading-none"
              style={{ color: '#FFD300', textShadow: '3px 3px 0 #000, -1px -1px 0 #000' }}
            >
              {title}
            </h1>

            {/* Rating + meta row */}
            <div className="flex flex-wrap gap-3 items-center">
              <div
                className="flex items-center gap-2 px-4 py-2 border-4 border-ink font-black text-xl"
                style={{ backgroundColor: '#FFD300', color: '#000' }}
              >
                <StarDisplay rating={avgRating} size="1.2rem" />
                <span style={{ fontFamily: 'var(--font-display)' }}>{formatRating(avgRating)}</span>
              </div>
              {formatRuntime(runtime) && (
                <div
                  className="px-4 py-2 border-4 border-ink font-bold"
                  style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', fontFamily: 'var(--font-display)', backdropFilter: 'blur(4px)' }}
                >
                  ⏱ {formatRuntime(runtime)}
                </div>
              )}
              {releaseDate && (
                <div
                  className="px-4 py-2 border-4 border-ink font-bold"
                  style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', fontFamily: 'var(--font-display)', backdropFilter: 'blur(4px)' }}
                >
                  {formatYear(releaseDate)}
                </div>
              )}
              {reviewCount != null && (
                <div
                  className="px-4 py-2 border-4 border-ink font-bold"
                  style={{ backgroundColor: '#FF3D00', color: '#fff', fontFamily: 'var(--font-display)' }}
                >
                  {reviewCount} REVIEW{reviewCount !== 1 ? 'S' : ''}
                </div>
              )}
            </div>

            {/* Synopsis */}
            <p
              className="text-base md:text-lg leading-relaxed max-w-2xl"
              style={{ color: 'rgba(255,255,255,0.92)', fontFamily: 'var(--font-display)' }}
            >
              {synopsis}
            </p>

            {/* Genre pills */}
            {genres.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-auto">
                {genres.map((g, i) => <GenrePill key={g.G_ID || g.genre_id} name={g.G_Name || g.genre_name} idx={i} />)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Trailer Section ───────────────────────────────────────────────── */}
      {trailerUrl && (
        <div className="animate-fade-in-up delay-150">
          <div className="flex items-center gap-4 mb-5">
            <h2
              className="text-3xl font-serif font-black px-4 py-1 border-4 border-ink"
              style={{ backgroundColor: '#00A3E0', color: '#fff', boxShadow: '4px 4px 0 0 #000' }}
            >
              TRAILER
            </h2>
          </div>
          {trailerUrl.includes('youtube.com') || trailerUrl.includes('youtu.be') ? (
            <div className="border-4 border-ink neo-shadow bg-ink aspect-video w-full max-w-4xl">
              <iframe
                src={trailerUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')}
                title="Trailer"
                className="w-full h-full"
                allowFullScreen
              />
            </div>
          ) : (
            <a
              href={trailerUrl}
              target="_blank"
              rel="noreferrer"
              className="neo-btn py-3 px-8 text-lg self-start inline-block"
            >
              WATCH TRAILER
            </a>
          )}
        </div>
      )}

      {/* ── Cast Filmstrip ────────────────────────────────────────────────── */}
      <div className="animate-fade-in-up delay-200">
        <div className="flex items-center gap-4 mb-5">
          <h2
            className="text-3xl font-serif font-black px-4 py-1 border-4 border-ink"
            style={{ backgroundColor: '#6C3CE1', color: '#fff', boxShadow: '4px 4px 0 0 #000' }}
          >
            CAST
          </h2>
          {cast.length > 0 && (
            <span
              className="text-sm font-bold opacity-60"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {cast.length} MEMBER{cast.length !== 1 ? 'S' : ''}
            </span>
          )}
        </div>

        {cast.length ? (
          <div
            className="cast-strip flex gap-4 overflow-x-auto pb-3"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {cast.map((c, i) => (
              <CastCard key={`${c.Person_ID || c.person_id}-${c.Character_Name || c.Role_Type || c.character_name}`} person={c} idx={i} />
            ))}
          </div>
        ) : (
          <div
            className="p-8 border-4 border-ink font-black text-xl text-center"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            NO CAST LISTED.
          </div>
        )}
      </div>

      {/* ── Reviews ───────────────────────────────────────────────────────── */}
      <div className="animate-fade-in-up delay-300">
        <div className="flex items-center gap-4 mb-6">
          <h2
            className="text-3xl font-serif font-black px-4 py-1 border-4 border-ink"
            style={{ backgroundColor: '#FF3D00', color: '#fff', boxShadow: '4px 4px 0 0 #000' }}
          >
            REVIEWS
          </h2>
          {reviews.length > 0 && (
            <span
              className="text-sm font-bold opacity-60"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {reviews.length} REVIEW{reviews.length !== 1 ? 'S' : ''}
            </span>
          )}
        </div>

        {/* Write a review */}
        {user && (
          <div
            className="mb-10 border-4 border-ink p-8"
            style={{ backgroundColor: '#F5F5F0', boxShadow: '8px 8px 0 0 #FFD300' }}
          >
            <h3 className="text-2xl font-serif font-black mb-6">WRITE A REVIEW</h3>
            <form onSubmit={submitReview} className="flex flex-col gap-6">
              {/* Star picker */}
              <div>
                <label
                  className="block text-sm font-bold mb-3 uppercase"
                  style={{ fontFamily: 'var(--font-display)', letterSpacing: '1px' }}
                >
                  Your Rating
                </label>
                <StarPicker value={rating} onChange={setRating} />
              </div>

              <textarea
                className="neo-input min-h-[140px] text-base w-full resize-y"
                placeholder="What did you think of this film?"
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
                required
                style={{ fontFamily: 'var(--font-display)' }}
              />

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="spoiler"
                  checked={spoiler}
                  onChange={e => setSpoiler(e.target.checked)}
                  className="w-6 h-6 border-4 border-ink accent-secondary"
                />
                <label
                  htmlFor="spoiler"
                  className="font-bold cursor-pointer"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Contains Spoilers
                </label>
              </div>

              <button
                type="submit"
                className="neo-btn py-3 px-8 text-lg self-start"
                disabled={submitting}
              >
                {submitting ? 'POSTING...' : 'POST REVIEW'}
              </button>
            </form>
          </div>
        )}

        {/* Review list */}
        <div className="flex flex-col">
          {reviews.length === 0 ? (
            <div
              className="p-12 border-4 border-ink text-center font-black text-xl"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              NO REVIEWS YET. BE THE FIRST.
            </div>
          ) : (
            reviews.map(r => <ReviewCard key={r.Activity_ID} review={r} />)
          )}
        </div>
      </div>

    </div>
  );
}
