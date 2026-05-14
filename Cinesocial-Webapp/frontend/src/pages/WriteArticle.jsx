import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';
const CATEGORIES = ['REVIEW', 'ESSAY', 'EDITORIAL', 'ANALYSIS', 'HOT TAKE'];

export default function WriteArticle() {
  const { user } = useAuth();
  const [isCinephile, setIsCinephile] = useState(null); // null = checking
  const [form, setForm] = useState({
    title: '', body: '', cover_image_url: '', movie_id: '', category: 'ESSAY', is_nsfw: false,
  });
  const [movieQuery, setMovieQuery] = useState('');
  const [movieResults, setMovieResults] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const movieDebounce = useRef(null);

  // Check if logged-in user has Cinephile plan
  useEffect(() => {
    if (!user) { setIsCinephile(false); return; }
    const token = localStorage.getItem('token');
    fetch(`${API}/api/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(profile => {
        const ok = profile.plan_name === 'Cinephile' && profile.sub_expiry && new Date(profile.sub_expiry) > new Date();
        setIsCinephile(ok);
      })
      .catch(() => setIsCinephile(false));
  }, [user]);

  // Movie search autocomplete
  useEffect(() => {
    if (!movieQuery.trim()) { setMovieResults([]); return; }
    clearTimeout(movieDebounce.current);
    movieDebounce.current = setTimeout(async () => {
      try {
        const r = await fetch(`${API}/api/movies/search?q=${encodeURIComponent(movieQuery)}`);
        const d = await r.json();
        setMovieResults(Array.isArray(d) ? d.slice(0, 6) : []);
      } catch { setMovieResults([]); }
    }, 350);
    return () => clearTimeout(movieDebounce.current);
  }, [movieQuery]);

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleMoviePick = movie => {
    setSelectedMovie(movie);
    setForm(prev => ({ ...prev, movie_id: movie.Movie_ID }));
    setMovieQuery(movie.Title);
    setMovieResults([]);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) {
      setError('Title and body are required.'); return;
    }
    setError(null); setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/articles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: form.title,
          body: form.body,
          cover_image_url: form.cover_image_url || undefined,
          movie_id: form.movie_id || undefined,
          category: form.category,
          is_nsfw: form.is_nsfw,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Submission failed.');
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Not logged in ──
  if (!user) return (
    <div className="max-w-2xl mx-auto mt-20 border-4 border-ink p-12 text-center" style={{ boxShadow: '8px 8px 0 0 #000' }}>
      <p className="text-4xl font-black mb-6" style={{ fontFamily: 'var(--font-serif)' }}>SIGN IN FIRST</p>
      <Link to="/login" className="neo-btn px-10 py-3">LOG IN →</Link>
    </div>
  );

  // ── Checking plan ──
  if (isCinephile === null) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="border-4 border-ink px-10 py-6 text-xl font-black animate-pulse" style={{ fontFamily: 'var(--font-display)' }}>
        CHECKING MEMBERSHIP…
      </div>
    </div>
  );

  // ── Not Cinephile ──
  if (!isCinephile) return (
    <div className="max-w-2xl mx-auto mt-20 border-4 border-ink text-center overflow-hidden" style={{ boxShadow: '8px 8px 0 0 #A89200' }}>
      <div className="p-4 bg-ink text-primary border-b-4 border-ink">
        <p className="text-xs font-black tracking-[0.3em]" style={{ fontFamily: 'var(--font-mono)' }}>ACCESS RESTRICTED</p>
      </div>
      <div className="p-12">
        <div className="text-7xl mb-6">🔒</div>
        <h1 className="text-4xl font-black mb-4" style={{ fontFamily: 'var(--font-serif)' }}>CINEPHILE MEMBERS ONLY</h1>
        <p className="opacity-70 mb-8 text-sm" style={{ fontFamily: 'var(--font-mono)' }}>
          Publishing articles is an exclusive feature for Cinephile subscribers.
          Upgrade your plan to start writing long-form cinema essays.
        </p>
        <Link to="/subscription" className="neo-btn px-10 py-3">UPGRADE TO CINEPHILE →</Link>
      </div>
    </div>
  );

  // ── Success confirmation ──
  if (submitted) return (
    <div className="max-w-2xl mx-auto mt-20 border-4 border-ink p-12 text-center" style={{ boxShadow: '8px 8px 0 0 #A89200' }}>
      <div className="text-6xl mb-6">✅</div>
      <h1 className="text-3xl font-black mb-4" style={{ fontFamily: 'var(--font-serif)' }}>ARTICLE SUBMITTED</h1>
      <p className="opacity-70 mb-2 text-sm" style={{ fontFamily: 'var(--font-mono)' }}>
        YOUR ARTICLE HAS BEEN SUBMITTED. An admin will review it soon.
      </p>
      <p className="opacity-50 mb-10 text-xs" style={{ fontFamily: 'var(--font-mono)' }}>
        You can track your submission status in your profile.
      </p>
      <div className="flex gap-4 justify-center flex-wrap">
        <Link to="/articles" className="neo-btn px-8 py-3">BROWSE ESSAYS</Link>
        <button onClick={() => { setSubmitted(false); setForm({ title: '', body: '', cover_image_url: '', movie_id: '', category: 'ESSAY', is_nsfw: false }); setSelectedMovie(null); setMovieQuery(''); }}
          className="border-4 border-ink px-8 py-3 font-black hover:bg-primary transition-colors" style={{ fontFamily: 'var(--font-display)' }}>
          WRITE ANOTHER
        </button>
      </div>
    </div>
  );

  // ── Editor form ──
  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up">
      <div className="mb-8">
        <p className="text-xs font-black tracking-[0.3em] mb-2 opacity-60" style={{ fontFamily: 'var(--font-mono)' }}>CINEPHILE PUBLISHING</p>
        <h1 className="text-5xl md:text-7xl font-black leading-none" style={{ fontFamily: 'var(--font-serif)' }}>WRITE YOUR<br />ARTICLE</h1>
        <div className="mt-4 h-1 bg-ink" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* Title */}
        <div>
          <label className="block text-xs font-black tracking-widest mb-2" style={{ fontFamily: 'var(--font-mono)' }}>
            TITLE *
          </label>
          <input
            name="title" value={form.title} onChange={handleChange}
            placeholder="Your compelling headline…"
            required maxLength={200}
            className="w-full neo-input text-2xl font-black py-4"
            style={{ fontFamily: 'var(--font-serif)' }}
          />
          <p className="text-xs opacity-50 mt-1 text-right" style={{ fontFamily: 'var(--font-mono)' }}>{form.title.length}/200</p>
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-black tracking-widest mb-3" style={{ fontFamily: 'var(--font-mono)' }}>CATEGORY *</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => {
              const active = form.category === cat;
              return (
                <button type="button" key={cat} onClick={() => setForm(p => ({ ...p, category: cat }))}
                  className="px-4 py-2 border-4 border-ink font-black text-sm tracking-widest transition-all duration-100"
                  style={{
                    fontFamily: 'var(--font-display)',
                    backgroundColor: active ? '#000' : 'transparent',
                    color: active ? '#A89200' : '#000',
                    boxShadow: active ? '4px 4px 0 0 #A89200' : '4px 4px 0 0 #000',
                    transform: active ? 'translate(-2px,-2px)' : '',
                  }}>
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Cover Image URL */}
        <div>
          <label className="block text-xs font-black tracking-widest mb-2" style={{ fontFamily: 'var(--font-mono)' }}>COVER IMAGE URL <span className="opacity-50">(OPTIONAL)</span></label>
          <input name="cover_image_url" value={form.cover_image_url} onChange={handleChange}
            placeholder="https://…" className="w-full neo-input" style={{ fontFamily: 'var(--font-mono)' }} />
          {form.cover_image_url && (
            <img src={form.cover_image_url} alt="Cover preview"
              className="mt-3 w-full max-h-48 object-cover border-4 border-ink"
              onError={e => { e.currentTarget.style.display = 'none'; }} />
          )}
        </div>

        {/* Movie search */}
        <div className="relative">
          <label className="block text-xs font-black tracking-widest mb-2" style={{ fontFamily: 'var(--font-mono)' }}>LINKED FILM <span className="opacity-50">(OPTIONAL)</span></label>
          <input value={movieQuery} onChange={e => { setMovieQuery(e.target.value); if (!e.target.value) { setSelectedMovie(null); setForm(p => ({ ...p, movie_id: '' })); } }}
            placeholder="Search movies…" className="w-full neo-input" style={{ fontFamily: 'var(--font-mono)' }} />
          {movieResults.length > 0 && (
            <div className="absolute z-20 top-full left-0 right-0 border-4 border-ink border-t-0 bg-surface">
              {movieResults.map(m => (
                <button type="button" key={m.Movie_ID}
                  className="w-full text-left px-4 py-3 border-b-2 border-ink hover:bg-primary font-bold text-sm transition-colors"
                  style={{ fontFamily: 'var(--font-display)' }}
                  onClick={() => handleMoviePick(m)}>
                  {m.Title} {m.Release_date ? `(${new Date(m.Release_date).getFullYear()})` : ''}
                </button>
              ))}
            </div>
          )}
          {selectedMovie && (
            <div className="mt-2 flex items-center gap-3 border-2 border-ink px-3 py-2 bg-primary">
              <span className="font-black text-sm" style={{ fontFamily: 'var(--font-display)' }}>✓ {selectedMovie.Title}</span>
              <button type="button" onClick={() => { setSelectedMovie(null); setMovieQuery(''); setForm(p => ({ ...p, movie_id: '' })); }}
                className="ml-auto text-xs font-black opacity-70 hover:opacity-100">✕</button>
            </div>
          )}
        </div>

        {/* NSFW Toggle */}
        <div className="flex items-center gap-3">
          <input 
            type="checkbox" 
            name="is_nsfw" 
            id="is_nsfw"
            checked={form.is_nsfw} 
            onChange={e => setForm(p => ({ ...p, is_nsfw: e.target.checked }))}
            className="w-6 h-6 border-4 border-ink accent-ink cursor-pointer"
          />
          <label htmlFor="is_nsfw" className="text-sm font-black tracking-widest cursor-pointer" style={{ fontFamily: 'var(--font-mono)' }}>
            MARK AS NSFW <span className="opacity-50 font-normal">(Contains mature content)</span>
          </label>
        </div>

        {/* Body */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-xs font-black tracking-widest" style={{ fontFamily: 'var(--font-mono)' }}>BODY *</label>
            <span className="text-xs opacity-50" style={{ fontFamily: 'var(--font-mono)' }}>{form.body.length} CHARS</span>
          </div>
          <textarea name="body" value={form.body} onChange={handleChange}
            placeholder="Write your article here. Use double line breaks for new paragraphs."
            required rows={22}
            className="w-full neo-input resize-y text-sm leading-7"
            style={{ fontFamily: 'var(--font-mono)', minHeight: '400px' }} />
        </div>

        {/* Error */}
        {error && (
          <div className="border-4 border-ink p-4 bg-secondary text-white font-bold text-sm" style={{ fontFamily: 'var(--font-display)' }}>
            ⚠ {error}
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-4 flex-wrap pb-8">
          <button type="submit" disabled={submitting}
            className="neo-btn px-10 py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#000', color: '#A89200' }}>
            {submitting ? 'SUBMITTING…' : 'SUBMIT FOR REVIEW →'}
          </button>
          <Link to="/articles" className="border-4 border-ink px-8 py-4 font-black text-sm hover:bg-surface-container transition-colors" style={{ fontFamily: 'var(--font-display)' }}>
            CANCEL
          </Link>
        </div>
      </form>
    </div>
  );
}
