import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import ArticleCard from '../components/ArticleCard';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

const CATEGORIES = ['ALL', 'ESSAY', 'EDITORIAL', 'ANALYSIS', 'REVIEW', 'HOT TAKE'];

export default function Articles() {
  const [articles, setArticles]     = useState([]);
  const [category, setCategory]     = useState('ALL');
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [hasMore, setHasMore]       = useState(true);

  const LIMIT = 12;

  const fetchArticles = useCallback(async (cat, pg) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: LIMIT, page: pg });
      if (cat !== 'ALL') params.set('category', cat);

      const res  = await fetch(`${API}/api/articles?${params}`);
      if (!res.ok) throw new Error('Failed to load articles');
      const data = await res.json();

      setArticles(prev => pg === 1 ? data : [...prev, ...data]);
      setHasMore(data.length === LIMIT);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    setArticles([]);
    fetchArticles(category, 1);
  }, [category, fetchArticles]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchArticles(category, next);
  };

  return (
    <div className="animate-fade-in-up" style={{ maxWidth: '1280px', margin: '0 auto' }}>
      {/* ── Page header ── */}
      <div className="mb-10">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <p
              className="text-xs font-black tracking-[0.3em] mb-2 opacity-60"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              CINESOCIAL PUBLISHING
            </p>
            <h1
              className="text-6xl md:text-8xl font-black leading-none tracking-tight"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              ESSAYS &amp;<br />EDITORIALS
            </h1>
          </div>
          <Link
            to="/write"
            className="neo-btn px-6 py-3 text-sm self-end"
          >
            ✍ WRITE AN ARTICLE
          </Link>
        </div>

        {/* Decorative rule */}
        <div className="mt-6 h-1 w-full bg-ink" />
      </div>

      {/* ── Category filter tabs ── */}
      <div className="flex flex-wrap gap-2 mb-10">
        {CATEGORIES.map(cat => {
          const active = cat === category;
          return (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className="px-4 py-2 border-4 border-ink font-black text-sm tracking-widest transition-all duration-100"
              style={{
                fontFamily: 'var(--font-display)',
                backgroundColor: active ? '#000' : 'transparent',
                color:           active ? '#FFD300' : '#000',
                boxShadow:       active ? '4px 4px 0 0 #FFD300' : '4px 4px 0 0 #000',
                transform:       active ? 'translate(-2px,-2px)' : '',
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* ── Error state ── */}
      {error && (
        <div className="border-4 border-ink p-6 mb-8 bg-secondary text-white font-bold text-center">
          {error}
        </div>
      )}

      {/* ── Article grid ── */}
      {articles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article, i) => (
            <ArticleCard key={article.Article_ID} article={article} colorIndex={i} />
          ))}
        </div>
      ) : !loading ? (
        <div className="border-4 border-ink p-16 text-center animate-fade-in">
          <p
            className="text-3xl font-black mb-4"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            NO ARTICLES YET
          </p>
          <p
            className="opacity-60 text-sm mb-8"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {category !== 'ALL'
              ? `No ${category} articles have been published yet.`
              : 'Be the first Cinephile to write one.'}
          </p>
          <Link to="/write" className="neo-btn px-8 py-3">
            WRITE THE FIRST ONE →
          </Link>
        </div>
      ) : null}

      {/* ── Loading skeleton ── */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="border-4 border-ink"
              style={{ boxShadow: '8px 8px 0 0 rgba(0,0,0,1)', animationDelay: `${i * 60}ms` }}
            >
              <div className="h-48 bg-surface-container animate-pulse" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-surface-container animate-pulse w-1/3" />
                <div className="h-6 bg-surface-container animate-pulse" />
                <div className="h-4 bg-surface-container animate-pulse w-2/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Load more ── */}
      {hasMore && !loading && articles.length > 0 && (
        <div className="flex justify-center mt-12">
          <button onClick={loadMore} className="neo-btn px-12 py-3 text-sm">
            LOAD MORE →
          </button>
        </div>
      )}
    </div>
  );
}
