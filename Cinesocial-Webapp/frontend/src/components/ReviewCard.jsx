import ImageWithFallback from './ImageWithFallback';

const formatDate = (date) => {
  const ts = new Date(date);
  return Number.isNaN(ts.getTime())
    ? 'Unknown date'
    : ts.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

/** Renders ★★★☆☆ from a 0.5–5.0 rating. */
function StarDisplay({ rating }) {
  const n = Math.round(Number(rating) || 0);
  return (
    <span style={{ fontSize: '1.3rem', letterSpacing: '2px' }}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < n ? 'star-filled' : 'star-empty'}>★</span>
      ))}
    </span>
  );
}

export default function ReviewCard({ review }) {
  const isPinned = review.is_pinned ?? review.Is_pinned;

  return (
    <div
      className={`neo-card mb-6 relative overflow-hidden animate-fade-in-up ${isPinned ? 'border-primary' : ''}`}
      style={isPinned ? { borderColor: '#FFD300' } : {}}
    >
      {/* Pinned accent bar */}
      {isPinned && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1.5"
          style={{ backgroundColor: '#FFD300' }}
        />
      )}

      <div className={`flex justify-between items-start mb-5 border-b-4 border-ink pb-4 gap-4 ${isPinned ? 'pl-3' : ''}`}>
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-12 h-12 border-4 border-ink overflow-hidden shrink-0 relative">
            <ImageWithFallback
              src={review.profile_pic_url ?? review.Profile_Pic_URL}
              alt={(review.username ?? review.Username) || 'Member'}
              className="w-full h-full object-cover"
              fallbackClassName="text-xl"
              fallbackText={(review.username ?? review.Username)?.charAt(0).toUpperCase() || '?'}
              isAvatar
            />
          </div>

          <div>
            <div className="font-bold flex items-center gap-2 text-base" style={{ fontFamily: 'var(--font-display)' }}>
              {(review.username ?? review.Username) || 'Unknown member'}
              {isPinned && (
                <span className="text-xs px-2 py-0.5 border-2 border-ink font-bold" style={{ backgroundColor: '#FFD300' }}>
                  PINNED
                </span>
              )}
            </div>
            <div className="text-sm opacity-70" style={{ fontFamily: 'var(--font-display)' }}>
              {formatDate(review.timestamp ?? review.Time_stamp)}
            </div>
          </div>
        </div>

        {/* Rating badge */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <StarDisplay rating={review.rating ?? review.Rating} />
          <span className="text-sm font-bold opacity-70" style={{ fontFamily: 'var(--font-display)' }}>
            {Number((review.rating ?? review.Rating) || 0).toFixed(1)} / 5.0
          </span>
        </div>
      </div>

      {/* Review text */}
      <div className="text-base leading-relaxed" style={{ fontFamily: 'var(--font-display)' }}>
        {review.contains_spoiler ?? review.Contains_spoiler ? (
          <details>
            <summary
              className="cursor-pointer font-bold underline decoration-4 underline-offset-4 list-none text-lg"
              style={{ color: '#FF3D00' }}
            >
              ⚠ Contains Spoilers — Click to Reveal
            </summary>
            <p className="mt-4 bg-surface-container p-4 border-4 border-ink">{review.review_text ?? review.Review_text}</p>
          </details>
        ) : (
          <p>{review.review_text ?? review.Review_text}</p>
        )}
      </div>
    </div>
  );
}
