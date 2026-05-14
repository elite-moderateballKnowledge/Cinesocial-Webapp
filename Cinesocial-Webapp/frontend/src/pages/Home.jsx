import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiRequest } from '../lib/api';
import MovieCard from '../components/MovieCard';

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

const stagger = { show: { transition: { staggerChildren: 0.06 } } };

const sectionShadow = '8px 8px 0 0 #000';

const toMovieCardShape = (movie) => ({
  Movie_ID: movie?.movie_id,
  Title: movie?.title,
  Release_date: movie?.release_date,
  Poster_URL: movie?.poster_url,
  A_Rating: movie?.avg_rating,
  M_Type: movie?.genres?.[0] ?? 'FILM',
});

const formatDate = (date) => {
  if (!date) return 'UNPUBLISHED';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).toUpperCase();
};

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-12">
      <div className="h-96 border-4 border-ink bg-primary animate-pulse" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-96 border-4 border-ink bg-surface animate-pulse" />
        ))}
      </div>
    </div>
  );
}

function SectionHeader({ kicker, title, linkTo, linkLabel }) {
  return (
    <div className="mb-6 flex flex-col gap-3 border-b-4 border-ink pb-4 md:flex-row md:items-end md:justify-between">
      <div>
        {kicker && (
          <p className="mb-2 text-xs font-black uppercase opacity-65">
            {kicker}
          </p>
        )}
        <h2 className="text-3xl font-black uppercase leading-none md:text-5xl">
          {title}
        </h2>
      </div>
      {linkTo && (
        <Link
          to={linkTo}
          className="self-start border-4 border-ink bg-surface-container-lowest px-4 py-2 text-sm font-black uppercase transition-all hover:bg-primary md:self-auto"
          style={{ boxShadow: '4px 4px 0 0 #000' }}
        >
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

function HomeHero() {
  return (
    <section
      className="overflow-hidden border-4 border-ink bg-primary px-4 py-14 text-center md:px-8 md:py-20"
      style={{ boxShadow: sectionShadow }}
    >
      <div className="mx-auto flex max-w-5xl flex-col items-center">
        <h1 className="w-full font-serif font-black uppercase leading-none">
          <span className="block text-6xl leading-[0.78] sm:text-7xl md:text-8xl lg:text-9xl">
            Film.
          </span>
          <span
            className="block text-5xl leading-[0.82] sm:text-6xl md:text-8xl lg:text-9xl"
            style={{
              color: 'transparent',
              WebkitTextStroke: '2px #000',
              paintOrder: 'stroke fill',
            }}
          >
            Culture.
          </span>
          <span className="block text-5xl leading-[0.78] sm:text-7xl md:text-8xl lg:text-9xl">
            Obsession.
          </span>
        </h1>

        <div className="mt-10 flex w-full max-w-xl flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            to="/movies"
            className="border-4 border-ink bg-ink px-8 py-4 text-sm font-black uppercase text-primary transition-all hover:-translate-x-1 hover:-translate-y-1"
            style={{ boxShadow: '8px 8px 0 0 #000' }}
          >
            Explore Now
          </Link>
          <Link
            to="/search"
            className="border-4 border-ink bg-primary px-8 py-4 text-sm font-black uppercase transition-all hover:-translate-x-1 hover:-translate-y-1"
            style={{ boxShadow: '8px 8px 0 0 #000' }}
          >
            Our Picks
          </Link>
        </div>
      </div>
    </section>
  );
}

function FeaturedEditorial({ article }) {
  if (!article) return null;

  return (
    <Link to={`/articles/${article.slug}`} className="group block h-full">
      <article
        className="grid h-full overflow-hidden border-4 border-ink bg-surface-container-lowest transition-all duration-200 md:grid-cols-[0.9fr_1.1fr] group-hover:-translate-x-1 group-hover:-translate-y-1"
        style={{ boxShadow: sectionShadow }}
      >
        <div className="min-h-64 border-b-4 border-ink bg-accent-purple md:border-b-0 md:border-r-4">
          {article.cover_image_url ? (
            <img src={article.cover_image_url} alt={article.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full min-h-64 items-center justify-center p-8 text-center text-3xl font-black uppercase">
              {article.category || 'Editorial'}
            </div>
          )}
        </div>
        <div className="flex flex-col justify-between gap-6 p-6 md:p-8">
          <div>
            <p className="mb-3 text-xs font-black uppercase opacity-65">Editor's note</p>
            <h3 className="text-3xl font-black uppercase leading-none md:text-5xl">{article.title}</h3>
            {article.excerpt && (
              <p className="mt-4 max-w-2xl text-sm font-bold leading-relaxed opacity-75 md:text-base">
                {article.excerpt}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t-4 border-ink pt-4 text-xs font-black uppercase">
            <span>{article.author_username || 'CineSocial'}</span>
            <span>{formatDate(article.published_at)}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}

function MovieStrip({ movies }) {
  if (!movies?.length) return null;

  return (
    <motion.div variants={stagger} className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {movies.slice(0, 4).map((movie, index) => (
        <motion.div key={movie.movie_id ?? index} variants={fadeUp}>
          <MovieCard movie={toMovieCardShape(movie)} colorIndex={index} />
        </motion.div>
      ))}
    </motion.div>
  );
}

function EssayCard({ article, index }) {
  if (!article) return null;
  const colors = ['#6C3CE1', '#FF3D00', '#00A3E0', '#00C853'];
  const color = colors[index % colors.length];

  return (
    <motion.article variants={fadeUp}>
      <Link
        to={`/articles/${article.slug}`}
        className="group flex h-full flex-col border-4 border-ink bg-surface-container-lowest transition-all duration-200 hover:-translate-x-1 hover:-translate-y-1"
        style={{ boxShadow: `8px 8px 0 0 ${color}` }}
      >
        <div className="flex min-h-44 items-center justify-center border-b-4 border-ink p-5 text-center" style={{ backgroundColor: color }}>
          <span className="border-2 border-ink bg-primary px-3 py-1 text-xs font-black uppercase">
            {article.category || 'Essay'}
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-4 p-5">
          <h3 className="text-2xl font-black uppercase leading-tight">{article.title}</h3>
          {article.excerpt && (
            <p className="line-clamp-3 text-sm font-bold opacity-70">{article.excerpt}</p>
          )}
          <div className="mt-auto flex items-center justify-between gap-4 border-t-4 border-ink pt-3 text-xs font-black uppercase">
            <span>{article.author_username || 'CineSocial'}</span>
            <span>Read</span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

function ListPreview({ list, index }) {
  if (!list) return null;
  const posters = list.preview_posters ?? [];

  return (
    <motion.div variants={fadeUp}>
      <Link
        to={`/lists/${list.list_id}`}
        className="group flex h-full flex-col border-4 border-ink bg-surface transition-all duration-200 hover:-translate-x-1 hover:-translate-y-1"
        style={{ boxShadow: `8px 8px 0 0 ${index % 2 ? '#00A3E0' : '#000'}` }}
      >
        <div className="grid h-44 grid-cols-4 overflow-hidden border-b-4 border-ink bg-primary">
          {Array.from({ length: 4 }).map((_, posterIndex) => (
            posters[posterIndex] ? (
              <img
                key={posterIndex}
                src={posters[posterIndex]}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div key={posterIndex} className="border-r-2 border-ink last:border-r-0" />
            )
          ))}
        </div>
        <div className="flex flex-1 flex-col gap-4 p-5">
          <h3 className="text-2xl font-black uppercase leading-tight">{list.list_title}</h3>
          <div className="mt-auto flex items-center justify-between border-t-4 border-ink pt-3 text-xs font-black uppercase">
            <span>{list.owner_username}</span>
            <span>{list.movie_count ?? 0} movies</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function Home() {
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
    editorial_pick = null,
    latest_articles = [],
    new_lists = [],
    top_rated = [],
    trending = [],
  } = data ?? {};

  const spotlight = editorial_pick ?? latest_articles[0] ?? null;
  const essayRow = latest_articles.filter((article) => article?.slug !== spotlight?.slug).slice(0, 3);
  const picks = top_rated.length ? top_rated : trending;

  return (
    <div className="flex flex-col gap-14">
      <HomeHero />

      {error && (
        <div className="border-4 border-ink bg-surface-container-lowest p-5 text-sm font-black">
          Could not load the home feed: {error}
        </div>
      )}

      {trending.length > 0 && (
        <motion.section initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.08 }} variants={stagger}>
          <SectionHeader kicker="What people are circling" title="Trending Movies" linkTo="/movies" linkLabel="All movies" />
          <MovieStrip movies={trending} />
        </motion.section>
      )}

      <motion.section initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.08 }} variants={stagger} className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <SectionHeader kicker="Latest essays" title="Fresh Arguments" linkTo="/articles" linkLabel="All essays" />
          {essayRow.length > 0 ? (
            <motion.div variants={stagger} className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-1">
              {essayRow.map((article, index) => (
                <EssayCard key={article.article_id ?? article.slug} article={article} index={index} />
              ))}
            </motion.div>
          ) : (
            <div className="border-4 border-ink bg-surface p-8 text-xl font-black uppercase" style={{ boxShadow: sectionShadow }}>
              Essays will land here once the community starts publishing.
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <SectionHeader kicker="The long read" title="Editorial Pick" />
          <FeaturedEditorial article={spotlight} />
        </div>
      </motion.section>

      {picks.length > 0 && (
        <motion.section initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.08 }} variants={stagger}>
          <SectionHeader kicker="CineSocial picks" title="Worth Starting With" linkTo="/search" linkLabel="Find more" />
          <MovieStrip movies={picks.slice(0, 4)} />
        </motion.section>
      )}

      {new_lists.length > 0 && (
        <motion.section initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.08 }} variants={stagger}>
          <SectionHeader kicker="Community shelves" title="New Lists" linkTo="/lists" linkLabel="Browse lists" />
          <motion.div variants={stagger} className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {new_lists.slice(0, 3).map((list, index) => (
              <ListPreview key={list.list_id ?? index} list={list} index={index} />
            ))}
          </motion.div>
        </motion.section>
      )}
    </div>
  );
}
