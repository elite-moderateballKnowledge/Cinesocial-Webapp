import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiRequest } from '../lib/api';
import ArticleCard from '../components/ArticleCard';
import MovieCard from '../components/MovieCard';

// ── Animation variants ────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};
const stagger = { show: { transition: { staggerChildren: 0.09 } } };

// ── Section header ────────────────────────────────────────────
function SectionHeader({ label, linkTo, linkLabel }) {
  return (
    <div className="flex items-end justify-between border-b-4 border-ink pb-3 mb-8">
      <h2 className="text-3xl md:text-4xl font-black" style={{ fontFamily: 'var(--font-serif)' }}>
        {label}
      </h2>
      {linkTo && (
        <Link to={linkTo}
          className="text-sm font-black border-b-2 border-ink hover:bg-primary px-2 pb-0.5 transition-colors"
          style={{ fontFamily: 'var(--font-display)' }}>
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}

// ── Skeleton block ────────────────────────────────────────────
function Skel({ h = 'h-48', extra = '' }) {
  return <div className={`${h} ${extra} border-4 border-ink bg-surface-container animate-pulse`} />;
}

// ── Loading skeleton ──────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-16">
      <Skel h="h-56" extra="w-full" />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => <Skel key={i} h="h-64" />)}
      </div>
    </div>
  );
}

// ── Grid cell: Editorial pick ─────────────────────────────────
function EditorialCell({ article }) {
  if (!article) return <div className="border-4 border-ink bg-surface-container h-full min-h-64" />;
  return (
    <Link to={`/articles/${article.slug}`} className="block group h-full">
      <div className="border-4 border-ink h-full min-h-64 p-6 flex flex-col justify-between transition-all duration-200 hover:-translate-x-1 hover:-translate-y-1"
        style={{ backgroundColor: '#7f1d1d', boxShadow: '8px 8px 0 0 #000', color: '#fff' }}>
        <div>
          <span className="inline-block px-2 py-0.5 border-2 border-white text-xs font-black tracking-widest mb-4"
            style={{ backgroundColor: '#FF3D00', fontFamily: 'var(--font-display)' }}>
            {article.category}
          </span>
          <h3 className="text-2xl font-black leading-tight mb-3"
            style={{ fontFamily: 'var(--font-serif)' }}>
            {article.title}
          </h3>
          <p className="text-sm opacity-70 line-clamp-3" style={{ fontFamily: 'var(--font-mono)' }}>
            {article.excerpt}
          </p>
        </div>
        <div className="mt-4">
          <span className="text-xs font-black opacity-70 block mb-3" style={{ fontFamily: 'var(--font-mono)' }}>
            {article.author_username}
          </span>
          <span className="inline-block border-2 border-white px-4 py-1.5 text-xs font-black group-hover:bg-white group-hover:text-ink transition-colors"
            style={{ fontFamily: 'var(--font-display)' }}>
            READ ESSAY →
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── Grid cell: Featured spotlight ─────────────────────────────
function FeaturedCell({ movie }) {
  if (!movie) return <div className="border-4 border-ink bg-surface-container h-full min-h-96" />;
  return (
    <Link to={`/movie/${movie.movie_id}`} className="block group relative h-full min-h-96 overflow-hidden border-4 border-ink">
      {movie.poster_url
        ? <img src={movie.poster_url} alt={movie.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        : <div className="absolute inset-0 bg-surface-container" />}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.92) 0%,rgba(0,0,0,0.35) 55%,transparent 100%)' }} />
      <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
        <div className="inline-block px-2 py-0.5 border-2 border-ink text-xs font-black mb-3"
          style={{ backgroundColor: '#FFD300', fontFamily: 'var(--font-display)' }}>
          FEATURED
        </div>
        <h3 className="text-2xl md:text-3xl font-black text-white leading-tight mb-2"
          style={{ fontFamily: 'var(--font-serif)', textShadow: '2px 2px 0 #000' }}>
          {movie.title}
        </h3>
        <div className="flex items-center gap-3 mb-4">
          <span className="px-2 py-0.5 border-2 border-ink text-sm font-black"
            style={{ backgroundColor: '#FFD300', fontFamily: 'var(--font-display)' }}>
            ★ {Number(movie.avg_rating).toFixed(1)}
          </span>
        </div>
        <span className="inline-block border-2 border-white text-white px-4 py-1.5 text-xs font-black group-hover:bg-white group-hover:text-ink transition-colors"
          style={{ fontFamily: 'var(--font-display)' }}>
          READ REVIEWS →
        </span>
      </div>
    </Link>
  );
}

// ── Grid cell: article (yellow) ───────────────────────────────
function ArticleGridCell({ article, bg = '#FFD300' }) {
  if (!article) return <div className="border-4 border-ink bg-surface-container h-full min-h-48" />;
  return (
    <Link to={`/articles/${article.slug}`} className="block group h-full">
      <div className="border-4 border-ink h-full min-h-48 p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-x-1 hover:-translate-y-1"
        style={{ backgroundColor: bg, boxShadow: '6px 6px 0 0 #000' }}>
        <div>
          <span className="inline-block px-2 py-0.5 border-2 border-ink text-xs font-black tracking-widest mb-3"
            style={{ backgroundColor: '#000', color: '#FFD300', fontFamily: 'var(--font-display)' }}>
            {article.category}
          </span>
          <h4 className="text-lg font-black leading-snug line-clamp-3"
            style={{ fontFamily: 'var(--font-serif)' }}>
            {article.title}
          </h4>
        </div>
        <span className="text-xs font-black opacity-70 mt-3" style={{ fontFamily: 'var(--font-mono)' }}>
          {article.author_username}
        </span>
      </div>
    </Link>
  );
}

// ── Grid cell: list preview ───────────────────────────────────
function ListGridCell({ list }) {
  if (!list) return <div className="border-4 border-ink bg-surface-container h-full min-h-48" />;
  const posters = list.preview_posters ?? [];
  return (
    <Link to="/lists" className="block group h-full">
      <div className="border-4 border-ink h-full min-h-48 p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-x-1 hover:-translate-y-1 bg-surface"
        style={{ boxShadow: '6px 6px 0 0 #FFD300' }}>
        <div>
          <span className="inline-block px-2 py-0.5 border-2 border-ink text-xs font-black tracking-widest mb-3"
            style={{ backgroundColor: '#FFD300', fontFamily: 'var(--font-display)' }}>
            NEW LIST
          </span>
          <h4 className="text-base font-black leading-snug line-clamp-2 mb-1"
            style={{ fontFamily: 'var(--font-serif)' }}>
            {list.list_title}
          </h4>
          <p className="text-xs opacity-60 font-bold" style={{ fontFamily: 'var(--font-mono)' }}>
            by {list.owner_username} · {list.movie_count} films
          </p>
        </div>
        {/* 2×2 poster grid */}
        <div className="grid grid-cols-2 gap-1 mt-3">
          {[0,1,2,3].map(i => (
            <div key={i} className="aspect-[2/3] border-2 border-ink overflow-hidden bg-surface-container">
              {posters[i]
                ? <img src={posters[i]} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full" style={{ backgroundColor: ['#FFD300','#FF3D00','#6C3CE1','#00A3E0'][i] }} />}
            </div>
          ))}
        </div>
      </div>
    </Link>
  );
}

// ── Compact movie cell (grid use) ─────────────────────────────
function MovieGridCell({ movie, index = 0 }) {
  if (!movie) return <div className="border-4 border-ink bg-surface-container h-full min-h-48" />;
  return <MovieCard movie={{
    Movie_ID: movie.movie_id, Title: movie.title,
    Release_date: movie.release_date, Poster_URL: movie.poster_url,
    A_Rating: movie.avg_rating, M_Type: movie.genres?.[0] ?? 'FILM',
  }} colorIndex={index} />;
}

// ── Section C: Community list card ───────────────────────────
function CommunityListCard({ list }) {
  const posters = list.preview_posters ?? [];
  return (
    <motion.div variants={fadeUp}>
      <Link to="/lists" className="block group">
        <div className="border-4 border-ink bg-surface flex flex-col h-full transition-all duration-200 hover:-translate-x-1 hover:-translate-y-1"
          style={{ boxShadow: '8px 8px 0 0 #000' }}>
          {/* 2×2 poster strip */}
          <div className="grid grid-cols-2 border-b-4 border-ink">
            {[0,1,2,3].map(i => (
              <div key={i} className={`aspect-[3/2] overflow-hidden bg-surface-container ${i < 2 ? '' : 'border-t-2 border-ink'} ${i % 2 === 0 ? '' : 'border-l-2 border-ink'}`}>
                {posters[i]
                  ? <img src={posters[i]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  : <div className="w-full h-full" style={{ backgroundColor: ['#FFD300','#FF3D00','#6C3CE1','#00A3E0'][i % 4] }} />}
              </div>
            ))}
          </div>
          <div className="p-4 flex flex-col flex-1 gap-2">
            <h3 className="font-black text-lg leading-snug line-clamp-2" style={{ fontFamily: 'var(--font-serif)' }}>
              {list.list_title}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold opacity-70" style={{ fontFamily: 'var(--font-mono)' }}>
                {list.owner_username}
              </span>
              {list.owner_flair && (
                <span className="px-1.5 py-0.5 border-2 border-ink text-[10px] font-black"
                  style={{ backgroundColor: '#FFD300' }}>{list.owner_flair}</span>
              )}
            </div>
            <div className="flex items-center justify-between border-t-4 border-ink pt-3 mt-auto">
              <span className="text-xs font-black opacity-60" style={{ fontFamily: 'var(--font-mono)' }}>
                {list.movie_count} FILMS
              </span>
              <span className="text-xs font-black border-2 border-ink px-2 py-0.5 bg-ink text-surface group-hover:bg-primary group-hover:text-ink transition-colors"
                style={{ fontFamily: 'var(--font-display)' }}>
                VIEW LIST →
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ── Section D: Canon card ─────────────────────────────────────
function CanonCard({ movie, rank }) {
  const rankStr = String(rank).padStart(2, '0');
  return (
    <Link to={`/movie/${movie.movie_id}`} className="block group flex-shrink-0 w-48">
      <div className="border-4 border-ink bg-surface transition-all duration-200 hover:-translate-x-1 hover:-translate-y-1"
        style={{ boxShadow: '6px 6px 0 0 #000' }}>
        <div className="relative h-64 border-b-4 border-ink overflow-hidden bg-surface-container">
          {movie.poster_url
            ? <img src={movie.poster_url} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            : <div className="w-full h-full bg-surface-container" />}
          <div className="absolute top-0 left-0 p-2 leading-none font-black"
            style={{ fontSize: '3rem', fontFamily: 'var(--font-serif)', color: '#FFD300', textShadow: '3px 3px 0 #000', lineHeight: 1 }}>
            {rankStr}
          </div>
        </div>
        <div className="p-3">
          <h4 className="font-black text-sm leading-snug line-clamp-2 mb-2" style={{ fontFamily: 'var(--font-serif)' }}>
            {movie.title}
          </h4>
          <span className="inline-block px-2 py-0.5 border-2 border-ink text-xs font-black"
            style={{ backgroundColor: '#FFD300', fontFamily: 'var(--font-display)' }}>
            ★ {Number(movie.avg_rating || 0).toFixed(1)}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── Main component ────────────────────────────────────────────
export default function Home() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    let ignore = false;
    apiRequest('/home')
      .then(d => { if (!ignore) { setData(d); setLoading(false); } })
      .catch(e => { if (!ignore) { setError(e.message); setLoading(false); } });
    return () => { ignore = true; };
  }, []);

  if (loading) return <LoadingSkeleton />;

  const {
    featured       = null,
    trending       = [],
    latest_articles = [],
    new_lists      = [],
    editorial_pick = null,
    top_rated      = [],
  } = data ?? {};

  return (
    <div className="flex flex-col gap-20">

      {/* ── HERO (preserved exactly) ── */}
      <div className="relative p-8 md:p-12 border-4 border-ink overflow-hidden animate-fade-in-up"
        style={{ backgroundColor: '#FFD300', boxShadow: '8px 8px 0 0 #000' }}>
        <div className="absolute top-0 right-0 w-64 h-full opacity-10"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg,#000 0,#000 2px,transparent 0,transparent 50%)', backgroundSize: '12px 12px' }} />
        <h1 className="text-5xl md:text-8xl font-serif font-black uppercase relative z-10" style={{ lineHeight: 1.05 }}>
          Explore Cinema
        </h1>
        <p className="mt-4 text-lg md:text-xl max-w-xl relative z-10 font-medium" style={{ fontFamily: 'var(--font-display)' }}>
          Discover, review, and curate your favourite films with a community of uncompromising critics.
        </p>
        {error && (
          <div className="mt-4 relative z-10 border-4 border-ink bg-white px-4 py-2 text-sm font-bold inline-block">
            ⚠ Could not load content: {error}
          </div>
        )}
      </div>

      {/* ── MARQUEE TICKER ── */}
      <div className="border-y-4 border-ink overflow-hidden -my-10 py-3" style={{ backgroundColor: '#000' }}>
        <div className="flex gap-12 animate-[marquee_22s_linear_infinite] whitespace-nowrap">
          {['★ DISCOVER CINEMA', '· WRITE ESSAYS', '· JOIN WATCH PARTIES', '· CURATE LISTS', '· RATE FILMS', '★ CINEPHILE COMMUNITY'].concat(
           ['★ DISCOVER CINEMA', '· WRITE ESSAYS', '· JOIN WATCH PARTIES', '· CURATE LISTS', '· RATE FILMS', '★ CINEPHILE COMMUNITY']
          ).map((t, i) => (
            <span key={i} className="text-sm font-black tracking-widest" style={{ color: '#FFD300', fontFamily: 'var(--font-display)' }}>{t}</span>
          ))}
        </div>
      </div>

      {/* ─── SECTION A: THE GRID ─── */}
      <motion.section initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.08 }} variants={stagger}>
        <motion.div variants={fadeUp}>
          <SectionHeader label="THIS WEEK" />
        </motion.div>
        <motion.div variants={fadeUp}
          className="grid gap-4"
          style={{ gridTemplateColumns: 'repeat(5, 1fr)', gridTemplateRows: 'auto auto' }}>

          {/* Col 1 — Editorial (row-span 2) */}
          <div style={{ gridRow: 'span 2' }}>
            <EditorialCell article={editorial_pick} />
          </div>

          {/* Col 2 row 1 — trending[0] */}
          <MovieGridCell movie={trending[0]} index={0} />
          {/* Col 3 row 1+2 — Featured spotlight */}
          <div style={{ gridRow: 'span 2' }}>
            <FeaturedCell movie={featured} />
          </div>
          {/* Col 4 row 1 — trending[1] */}
          <MovieGridCell movie={trending[1]} index={1} />
          {/* Col 5 row 1 — article yellow */}
          <ArticleGridCell article={latest_articles[0]} bg="#FFD300" />

          {/* Row 2 */}
          {/* Col 2 row 2 — trending[2] */}
          <MovieGridCell movie={trending[2]} index={2} />
          {/* Col 3 spanned above */}
          {/* Col 4 row 2 — new list */}
          <ListGridCell list={new_lists[0]} />
          {/* Col 5 row 2 — article[1] */}
          <ArticleGridCell article={latest_articles[1]} bg="#E0F2FE" />
        </motion.div>
      </motion.section>

      {/* ─── SECTION B: LATEST ESSAYS ─── */}
      {latest_articles.length > 0 && (
        <motion.section initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }} variants={stagger}>
          <motion.div variants={fadeUp}>
            <SectionHeader label="LATEST ESSAYS & EDITORIALS" linkTo="/articles" linkLabel="SEE ALL ESSAYS" />
          </motion.div>
          <motion.div variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {latest_articles.map((a, i) => (
              <motion.div key={a.article_id ?? i} variants={fadeUp}>
                <ArticleCard article={{
                  Article_ID: a.article_id, Slug: a.slug, Title: a.title,
                  Category: a.category, Body: a.excerpt, Cover_Image_URL: a.cover_image_url,
                  Published_At: a.published_at, Username: a.author_username, flair_label: a.author_flair,
                }} colorIndex={i} />
              </motion.div>
            ))}
          </motion.div>
        </motion.section>
      )}

      {/* ─── SECTION C: COMMUNITY LISTS ─── */}
      {new_lists.length > 0 && (
        <motion.section initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }} variants={stagger}>
          <motion.div variants={fadeUp}>
            <SectionHeader label="FRESH FROM THE COMMUNITY" linkTo="/lists" linkLabel="ALL LISTS" />
          </motion.div>
          <motion.div variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {new_lists.map((list, i) => <CommunityListCard key={list.list_id ?? i} list={list} />)}
          </motion.div>
        </motion.section>
      )}

      {/* ─── SECTION D: THE CANON ─── */}
      {top_rated.length > 0 && (
        <motion.section initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }} variants={stagger}>
          <motion.div variants={fadeUp}>
            <SectionHeader label="THE CANON" />
            <p className="text-sm font-bold opacity-60 -mt-4 mb-8" style={{ fontFamily: 'var(--font-mono)' }}>
              HIGHEST RATED BY OUR COMMUNITY
            </p>
          </motion.div>
          <div className="flex gap-6 overflow-x-auto pb-4"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#000 transparent' }}>
            {top_rated.map((m, i) => <CanonCard key={m.movie_id ?? i} movie={m} rank={i + 1} />)}
          </div>
        </motion.section>
      )}

      {/* ─── TRENDING GRID (fallback full movie grid) ─── */}
      {trending.length > 3 && (
        <motion.section initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.08 }} variants={stagger}>
          <motion.div variants={fadeUp}>
            <SectionHeader label="TRENDING NOW" linkTo="/movies" linkLabel="ALL FILMS" />
          </motion.div>
          <motion.div variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {trending.slice(3).map((m, i) => (
              <motion.div key={m.movie_id ?? i} variants={fadeUp}>
                <MovieGridCell movie={m} index={i + 3} />
              </motion.div>
            ))}
          </motion.div>
        </motion.section>
      )}

    </div>
  );
}
