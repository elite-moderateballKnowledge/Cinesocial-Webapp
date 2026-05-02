export default function ReviewCard({ review }) {
  return (
    <div className={`neo-card mb-6 ${review.Is_pinned ? 'border-primary border-4 bg-surface-container' : ''}`}>
      <div className="flex justify-between items-start mb-4 border-b-4 border-ink pb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 border-4 border-ink overflow-hidden bg-primary">
            {review.Profile_Pic_URL ? (
              <img src={review.Profile_Pic_URL} alt={review.Username} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-xl">{review.Username?.charAt(0).toUpperCase()}</div>
            )}
          </div>
          <div>
            <div className="font-bold font-mono flex items-center gap-2 text-lg">
              {review.Username}
              {review.Is_pinned && <span className="bg-primary text-xs px-2 py-0.5 border-4 border-ink">PINNED</span>}
            </div>
            <div className="text-sm font-mono">{new Date(review.Time_stamp).toLocaleDateString()}</div>
          </div>
        </div>
        <div className="text-3xl font-serif font-black bg-surface-container-lowest px-4 py-1 border-4 border-ink">
          {Number(review.Rating).toFixed(1)} / 5.0
        </div>
      </div>
      
      <div className="font-mono text-lg leading-relaxed">
        {review.Contains_spoiler ? (
          <details>
            <summary className="cursor-pointer font-bold text-secondary underline decoration-4 underline-offset-4 list-none text-xl">⚠️ Contains Spoilers (Click to Reveal)</summary>
            <p className="mt-4 bg-surface-container p-4 border-4 border-ink">{review.Review_text}</p>
          </details>
        ) : (
          <p>{review.Review_text}</p>
        )}
      </div>
    </div>
  );
}
