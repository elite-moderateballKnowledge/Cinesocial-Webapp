import { Link } from 'react-router-dom';

// Category → accent colour mapping
const CATEGORY_COLORS = {
  ESSAY:      '#6C3CE1',
  EDITORIAL:  '#FF3D00',
  ANALYSIS:   '#00A3E0',
  REVIEW:     '#00C853',
  'HOT TAKE': '#FFD300',
};

function formatDate(dateStr) {
  if (!dateStr) return 'UNPUBLISHED';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: '2-digit',
  }).toUpperCase();
}

export default function ArticleCard({ article, colorIndex = 0 }) {
  if (!article) return null;

  const {
    Slug, Title, Category, Cover_Image_URL,
    Published_At, Username, flair_label,
    Body,
  } = article;

  const catColor  = CATEGORY_COLORS[Category] ?? '#FFD300';
  // Cycle shadow colours like MovieCard does
  const SHADOWS   = ['rgba(0,0,0,1)', '#FFD300', '#FF3D00', '#6C3CE1', '#00A3E0', '#00C853'];
  const shadow    = SHADOWS[colorIndex % SHADOWS.length];
  const excerpt   = Body ? Body.replace(/\n/g, ' ').substring(0, 120) : '';

  return (
    <Link to={`/articles/${Slug}`} className="block group">
      <article
        className="flex flex-col h-full border-4 border-ink bg-surface transition-all duration-200 cursor-pointer"
        style={{ boxShadow: `8px 8px 0px 0px ${shadow}` }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translate(-4px,-4px)';
          e.currentTarget.style.boxShadow = `12px 12px 0px 0px ${shadow}`;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = '';
          e.currentTarget.style.boxShadow = `8px 8px 0px 0px ${shadow}`;
        }}
      >
        {/* ── Cover image or coloured fallback ── */}
        <div className="relative w-full h-48 border-b-4 border-ink overflow-hidden flex-shrink-0">
          {Cover_Image_URL ? (
            <img
              src={Cover_Image_URL}
              alt={Title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={e => { e.currentTarget.style.display = 'none'; }}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ backgroundColor: catColor }}
            >
              <span
                className="text-xl font-black text-ink tracking-widest border-2 border-ink px-3 py-1"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {Category}
              </span>
            </div>
          )}

          {/* Category pill */}
          <div
            className="absolute top-3 left-3 px-2 py-0.5 border-2 border-ink text-xs font-black tracking-widest"
            style={{ backgroundColor: catColor, fontFamily: 'var(--font-display)' }}
          >
            {Category}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="p-4 flex flex-col flex-1 gap-2">
          <h3
            className="font-serif font-black text-lg leading-tight line-clamp-2"
          >
            {Title}
          </h3>

          {/* Author row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xs font-bold opacity-70"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {Username}
            </span>
            {flair_label && (
              <span
                className="px-1.5 py-0.5 border-2 border-ink text-[10px] font-black"
                style={{ backgroundColor: '#FFD300', fontFamily: 'var(--font-display)' }}
              >
                {flair_label}
              </span>
            )}
          </div>

          {/* Excerpt */}
          {excerpt && (
            <p
              className="text-sm opacity-70 line-clamp-3 flex-1"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {excerpt}{excerpt.length >= 120 ? '…' : ''}
            </p>
          )}

          {/* Footer row */}
          <div className="flex items-center justify-between border-t-4 border-ink pt-3 mt-auto">
            <span
              className="text-xs font-bold opacity-60"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {formatDate(Published_At)}
            </span>
            <span
              className="text-xs font-black border-2 border-ink px-2 py-0.5 bg-ink text-surface group-hover:bg-primary group-hover:text-ink transition-colors duration-150"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              READ →
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
