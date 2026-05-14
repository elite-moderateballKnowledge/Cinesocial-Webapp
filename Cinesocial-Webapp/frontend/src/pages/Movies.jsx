import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiRequest } from '../lib/api';
import MovieCard from '../components/MovieCard';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: 'easeOut' } },
};

const stagger = { show: { transition: { staggerChildren: 0.07 } } };

const formatYear = (date) => {
  const year = new Date(date).getFullYear();
  return Number.isFinite(year) ? year : 'N/A';
};

const toMovieCardShape = (movie) => ({
  Movie_ID: movie?.movie_id,
  Title: movie?.title,
  Release_date: movie?.release_date,
  Poster_URL: movie?.poster_url,
  A_Rating: movie?.avg_rating,
  M_Type: movie?.genres?.[0] ?? 'FILM',
});

function SectionHeader({ title, kicker, linkTo, linkLabel }) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between border-b-4 border-ink pb-4 mb-8">
      <div>
        {kicker && (
          <p className="text-xs font-black tracking-widest uppercase opacity-70" style={{ fontFamily: 'var(--font-display)' }}>
            {kicker}
          </p>
        )}
        <h2 className="text-3xl md:text-5xl font-black uppercase leading-none">
          {title}
        </h2>
      </div>
      {linkTo && (
        <Link
          to={linkTo}
          className="self-start md:self-auto border-4 border-ink bg-surface-container-lowest px-4 py-2 text-sm font-black transition-all hover:bg-primary"
          style={{ boxShadow: '4px 4px 0 0 #000', fontFamily: 'var(--font-display)' }}
        >
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-16">
      <div className="h-56 border-4 border-ink bg-surface-container animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-80 border-4 border-ink bg-surface-container animate-pulse" />
        ))}
      </div>
    </div>
  );
}

function TopTenCard({ movie, rank }) {
  if (!movie) return null;
  const cardMovie = toMovieCardShape(movie);

  return (
    <motion.div variants={fadeUp} className="relative">
      <div
        className="absolute left-3 top-3 z-20 border-4 border-ink bg-primary px-3 py-1 font-black text-2xl leading-none"
        style={{ boxShadow: '4px 4px 0 0 #000', fontFamily: 'var(--font-serif)' }}
      >
        #{rank}
      </div>
      <MovieCard movie={cardMovie} colorIndex={rank - 1} />
    </motion.div>
  );
}

function GenreWinnerCard({ item, index }) {
  const movie = item?.movie;
  if (!movie) return null;

  return (
    <motion.div variants={fadeUp}>
      <Link to={`/movie/${movie.movie_id}`} className="group block h-full">
        <div
          className="flex h-full flex-col border-4 border-ink bg-surface-container-lowest transition-all duration-200 group-hover:-translate-x-1 group-hover:-translate-y-1"
          style={{ boxShadow: `8px 8px 0 0 ${['#000', '#FF3D00', '#6C3CE1', '#00A3E0', '#00C853'][index % 5]}` }}
        >
          <div className="relative h-72 overflow-hidden border-b-4 border-ink bg-surface-container">
            {movie.poster_url ? (
              <img
                src={movie.poster_url}
                alt={movie.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center p-6 text-center text-xl font-black">
                {movie.title}
              </div>
            )}
            <div className="absolute left-3 top-3 border-2 border-ink bg-primary px-2 py-1 text-xs font-black uppercase">
              #{index + 1} in {item.genre_name}
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-3 p-4">
            <h3 className="text-2xl font-black leading-tight line-clamp-2">
              {movie.title}
            </h3>
            <div className="mt-auto flex items-center justify-between gap-3 border-t-4 border-ink pt-3">
              <span className="text-xs font-black uppercase opacity-70">
                {formatYear(movie.release_date)}
              </span>
              <span className="border-2 border-ink bg-primary px-2 py-1 text-sm font-black">
                Star {Number(movie.avg_rating || 0).toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function CompactMovieStrip({ movies }) {
  if (!movies.length) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {movies.map((movie, index) => (
        <motion.div key={movie.movie_id ?? index} variants={fadeUp}>
          <MovieCard movie={toMovieCardShape(movie)} colorIndex={index + 2} />
        </motion.div>
      ))}
    </div>
  );
}

export default function Movies() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;

    apiRequest('/home')
      .then((payload) => {
        if (!ignore) {
          setData(payload);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  if (loading) return <LoadingSkeleton />;

  const {
    featured = null,
    top_rated = [],
    top_by_genre = [],
    new_releases = [],
    trending = [],
  } = data ?? {};

  return (
    <div className="flex flex-col gap-18">
      <section
        className="grid gap-8 border-4 border-ink bg-surface-container-lowest p-6 md:grid-cols-[1.3fr_0.7fr] md:p-8"
        style={{ boxShadow: '8px 8px 0 0 #000' }}
      >
        <div className="flex flex-col justify-between gap-8">
          <div>
            <p className="mb-3 text-sm font-black uppercase tracking-widest opacity-70">CineSocial movies</p>
            <h1 className="text-5xl md:text-7xl font-black uppercase leading-none">
              Find the films worth talking about.
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/search" className="neo-btn px-5 py-3 text-sm uppercase">
              Search movies
            </Link>
            <Link to="/lists" className="border-4 border-ink bg-surface px-5 py-3 text-sm font-black uppercase transition-all hover:bg-primary">
              Browse lists
            </Link>
          </div>
        </div>

        {featured && (
          <Link to={`/movie/${featured.movie_id}`} className="group block">
            <div className="relative min-h-96 overflow-hidden border-4 border-ink bg-ink">
              {featured.poster_url && (
                <img
                  src={featured.poster_url}
                  alt={featured.title}
                  className="absolute inset-0 h-full w-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <span className="mb-3 inline-block border-2 border-ink bg-primary px-2 py-1 text-xs font-black uppercase text-ink">
                  Featured pick
                </span>
                <h2 className="text-3xl font-black leading-tight">{featured.title}</h2>
                <p className="mt-2 text-sm font-black opacity-80">
                  Rated {Number(featured.avg_rating || 0).toFixed(1)}
                </p>
              </div>
            </div>
          </Link>
        )}
      </section>

      {error && (
        <div className="border-4 border-ink bg-surface-container-lowest p-5 text-sm font-black">
          Could not load the movie homepage: {error}
        </div>
      )}

      {top_rated.length > 0 && (
        <motion.section initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.08 }} variants={stagger}>
          <SectionHeader title="Top 10 Rated Movies" kicker="Community canon" />
          <motion.div variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
            {top_rated.slice(0, 10).map((movie, index) => (
              <TopTenCard key={movie.movie_id ?? index} movie={movie} rank={index + 1} />
            ))}
          </motion.div>
        </motion.section>
      )}

      {top_by_genre.length > 0 && (
        <motion.section initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.08 }} variants={stagger}>
          <SectionHeader title="Top 5 By Genre" kicker="Best in class" />
          <motion.div variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {top_by_genre.slice(0, 5).map((item, index) => (
              <GenreWinnerCard key={`${item.genre_id}-${item.movie?.movie_id ?? index}`} item={item} index={index} />
            ))}
          </motion.div>
        </motion.section>
      )}

      {new_releases.length > 0 && (
        <motion.section initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.08 }} variants={stagger}>
          <SectionHeader title="New Releases" kicker="Fresh arrivals" linkTo="/search" linkLabel="Filter movies" />
          <CompactMovieStrip movies={new_releases.slice(0, 8)} />
        </motion.section>
      )}

      {trending.length > 0 && (
        <motion.section initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.08 }} variants={stagger}>
          <SectionHeader title="Trending Now" kicker="Most discussed" />
          <CompactMovieStrip movies={trending.slice(0, 8)} />
        </motion.section>
      )}
    </div>
  );
}
