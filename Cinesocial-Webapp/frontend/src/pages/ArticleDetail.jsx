import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ArticleCard from '../components/ArticleCard';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

const CATEGORY_COLORS = {
  ESSAY: '#6C3CE1', EDITORIAL: '#FF3D00', ANALYSIS: '#00A3E0',
  REVIEW: '#00C853', 'HOT TAKE': '#FFD300',
};

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function ArticleBody({ text }) {
  if (!text) return null;
  return (
    <div className="space-y-5">
      {text.split(/\n\n+/).map((para, i) => (
        <p key={i} className="text-base leading-8 whitespace-pre-line"
          style={{ fontFamily: 'Georgia,serif', fontSize: '1.1rem', color: '#111' }}>
          {para}
        </p>
      ))}
    </div>
  );
}

export default function ArticleDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(null);
    fetch(`${API}/api/articles/${slug}`)
      .then(r => { if (!r.ok) throw new Error(r.status === 404 ? 'Article not found.' : 'Failed to load.'); return r.json(); })
      .then(j => { if (!cancelled) { setData(j); setLoading(false); } })
      .catch(e => { if (!cancelled) { setError(e.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="border-4 border-ink px-10 py-6 text-xl font-black animate-pulse" style={{ fontFamily: 'var(--font-display)' }}>
        LOADING ARTICLE…
      </div>
    </div>
  );

  if (error) return (
    <div className="border-4 border-ink p-12 text-center max-w-xl mx-auto mt-16">
      <p className="text-4xl font-black mb-4" style={{ fontFamily: 'var(--font-serif)' }}>404</p>
      <p className="mb-8 opacity-70" style={{ fontFamily: 'var(--font-mono)' }}>{error}</p>
      <button onClick={() => navigate('/articles')} className="neo-btn px-8 py-3">← BACK TO ESSAYS</button>
    </div>
  );

  const { article, related } = data;
  const catColor = CATEGORY_COLORS[article.Category] ?? '#FFD300';

  return (
    <article className="animate-fade-in max-w-5xl mx-auto">
      {/* Hero */}
      <div className="relative w-full border-4 border-ink mb-10 overflow-hidden flex items-end"
        style={{ minHeight: '420px', background: article.Cover_Image_URL ? undefined : catColor }}>
        {article.Cover_Image_URL && (
          <img src={article.Cover_Image_URL} alt={article.Title}
            className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0"
          style={{ background: article.Cover_Image_URL ? 'linear-gradient(to top,rgba(0,0,0,0.85) 0%,rgba(0,0,0,0.2) 60%,transparent 100%)' : 'rgba(0,0,0,0.08)' }} />
        <div className="relative z-10 p-8 md:p-12 w-full">
          <div className="inline-block px-3 py-1 border-2 border-ink text-xs font-black tracking-widest mb-4"
            style={{ backgroundColor: catColor, fontFamily: 'var(--font-display)' }}>
            {article.Category}
          </div>
          <h1 className="text-4xl md:text-6xl font-black leading-tight max-w-3xl"
            style={{
              fontFamily: 'var(--font-serif)',
              color: article.Cover_Image_URL ? '#fff' : '#000',
              textShadow: article.Cover_Image_URL ? '3px 3px 0 #000,-1px -1px 0 #000' : 'none',
            }}>
            {article.Title}
          </h1>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Main */}
        <div className="flex-1 min-w-0">
          {/* Author card */}
          <div className="border-4 border-ink p-5 mb-10 flex items-center gap-5"
            style={{ boxShadow: '6px 6px 0 0 #FFD300' }}>
            <div className="w-16 h-16 border-4 border-ink flex items-center justify-center flex-shrink-0 text-2xl font-black"
              style={{ backgroundColor: catColor }}>
              {article.Username?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-black text-lg" style={{ fontFamily: 'var(--font-display)' }}>{article.Username}</span>
                {article.flair_label && (
                  <span className="px-2 py-0.5 border-2 border-ink text-xs font-black" style={{ backgroundColor: '#FFD300' }}>
                    {article.flair_label}
                  </span>
                )}
              </div>
              <span className="text-xs font-bold tracking-widest opacity-60" style={{ fontFamily: 'var(--font-mono)' }}>CINEPHILE WRITER</span>
              <div className="mt-1 text-xs opacity-50" style={{ fontFamily: 'var(--font-mono)' }}>
                {formatDate(article.Published_At)} · {article.View_Count ?? 0} VIEWS
              </div>
            </div>
          </div>

          <div className="mb-12"><ArticleBody text={article.Body} /></div>

          <Link to="/articles"
            className="inline-block border-4 border-ink px-6 py-3 font-black text-sm hover:bg-primary transition-colors duration-150"
            style={{ fontFamily: 'var(--font-display)' }}>
            ← ALL ESSAYS
          </Link>
        </div>

        {/* Sidebar */}
        <aside className="lg:w-72 flex-shrink-0 space-y-6">
          {article.Movie_ID && article.Movie_Title && (
            <div className="border-4 border-ink p-5" style={{ boxShadow: '6px 6px 0 0 #000' }}>
              <p className="text-xs font-black tracking-widest border-b-4 border-ink pb-2 mb-4" style={{ fontFamily: 'var(--font-mono)' }}>
                ABOUT THIS FILM
              </p>
              <Link to={`/movie/${article.Movie_ID}`}
                className="block font-black text-xl hover:underline decoration-4 underline-offset-4"
                style={{ fontFamily: 'var(--font-serif)' }}>
                {article.Movie_Title}
              </Link>
              <div className="mt-3">
                <Link to={`/movie/${article.Movie_ID}`}
                  className="inline-block px-4 py-2 border-4 border-ink text-xs font-black bg-ink text-surface hover:bg-primary hover:text-ink transition-colors"
                  style={{ fontFamily: 'var(--font-display)' }}>
                  VIEW FILM →
                </Link>
              </div>
            </div>
          )}
          <div className="border-4 border-ink p-5">
            <p className="text-xs font-black tracking-widest border-b-4 border-ink pb-2 mb-4" style={{ fontFamily: 'var(--font-mono)' }}>
              ARTICLE INFO
            </p>
            <dl className="space-y-2 text-sm" style={{ fontFamily: 'var(--font-mono)' }}>
              <div className="flex justify-between">
                <dt className="opacity-60 font-bold">CATEGORY</dt>
                <dd className="font-black px-2 py-0.5 border-2 border-ink text-xs" style={{ backgroundColor: catColor }}>{article.Category}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="opacity-60 font-bold">PUBLISHED</dt>
                <dd className="font-bold text-right">{formatDate(article.Published_At)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="opacity-60 font-bold">VIEWS</dt>
                <dd className="font-bold">{article.View_Count ?? 0}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>

      {/* Related */}
      {related && related.length > 0 && (
        <section className="mt-16 border-t-4 border-ink pt-10">
          <h2 className="text-3xl font-black mb-8" style={{ fontFamily: 'var(--font-serif)' }}>MORE LIKE THIS</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {related.map((rel, i) => <ArticleCard key={rel.Article_ID} article={rel} colorIndex={i + 1} />)}
          </div>
        </section>
      )}
    </article>
  );
}
