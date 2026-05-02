import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ReviewCard from '../components/ReviewCard';

export default function MovieDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [movie, setMovie] = useState(null);
  const [reviews, setReviews] = useState([]);
  
  const [rating, setRating] = useState(5.0);
  const [reviewText, setReviewText] = useState('');
  const [spoiler, setSpoiler] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:5000/api/movies/${id}`)
      .then(res => res.json())
      .then(data => setMovie(data));
      
    fetch(`http://localhost:5000/api/reviews/movie/${id}`)
      .then(res => res.json())
      .then(data => setReviews(data));
  }, [id]);

  const submitReview = async (e) => {
    e.preventDefault();
    const res = await fetch(`http://localhost:5000/api/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ movieId: id, rating, reviewText, containsSpoiler: spoiler })
    });
    if (res.ok) {
      alert('Review added!');
      window.location.reload();
    } else {
      const data = await res.json();
      alert(data.message);
    }
  };

  if (!movie) return <div className="text-4xl font-mono font-black animate-pulse bg-primary p-8 border-4 border-ink inline-block neo-shadow">LOADING...</div>;

  return (
    <div className="flex flex-col gap-12">
      {/* Movie Header */}
      <div className="flex flex-col md:flex-row gap-8 bg-surface-container border-4 border-ink neo-shadow p-8">
        <div className="w-full md:w-1/3 border-4 border-ink bg-surface-container-lowest">
          {movie.Poster_URL && <img src={movie.Poster_URL} alt={movie.Title} className="w-full h-auto object-cover" />}
        </div>
        <div className="w-full md:w-2/3 flex flex-col">
          <h1 className="text-5xl md:text-7xl font-serif font-black uppercase border-b-8 border-ink pb-4 mb-4">{movie.Title}</h1>
          <div className="flex gap-4 mb-6 font-mono font-bold text-lg flex-wrap">
            <span className="bg-primary px-4 py-1 border-4 border-ink">★ {Number(movie.A_Rating).toFixed(1)}</span>
            <span className="bg-surface-container-lowest px-4 py-1 border-4 border-ink">{movie.Runtime} MIN</span>
            <span className="bg-surface-container-lowest px-4 py-1 border-4 border-ink">{new Date(movie.Release_date).getFullYear()}</span>
          </div>
          <p className="font-mono text-xl leading-relaxed mb-8 bg-surface-container-lowest p-6 border-4 border-ink">
            {movie.Synopsis}
          </p>
          <div className="mt-auto flex gap-2 flex-wrap">
             {movie.genres?.map(g => (
               <span key={g.G_ID} className="bg-secondary text-surface-container-lowest px-3 py-1 font-mono font-bold border-4 border-ink">
                 {g.G_Name}
               </span>
             ))}
          </div>
        </div>
      </div>

      {/* Cast & Reviews Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="md:col-span-1">
          <h2 className="text-4xl font-serif font-black mb-6 border-b-4 border-ink pb-2 bg-primary px-4 inline-block border-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">CAST</h2>
          <div className="flex flex-col gap-4">
            {movie.cast?.map(c => (
              <div key={c.Person_ID} className="flex gap-4 bg-surface-container border-4 border-ink p-4">
                 <div className="w-16 h-16 border-4 border-ink overflow-hidden bg-primary shrink-0">
                    {c.Photo_URL && <img src={c.Photo_URL} alt={c.Full_Name} className="w-full h-full object-cover"/>}
                 </div>
                 <div className="flex flex-col justify-center">
                    <span className="font-mono font-bold text-lg leading-tight">{c.Full_Name}</span>
                    <span className="font-mono text-sm opacity-80">{c.Character_Name}</span>
                 </div>
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          <h2 className="text-4xl font-serif font-black mb-6 border-b-4 border-ink pb-2 bg-primary px-4 inline-block border-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">REVIEWS</h2>
          
          {user && (
            <div className="neo-card mb-8 p-8 bg-surface-container-lowest border-4 border-ink shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="text-3xl font-serif font-black mb-6">WRITE A REVIEW</h3>
              <form onSubmit={submitReview} className="flex flex-col gap-6">
                <div className="flex gap-4 items-center">
                  <label className="font-mono font-black text-xl">RATING (0.5-5.0):</label>
                  <input type="number" step="0.1" min="0.5" max="5.0" className="neo-input w-28 text-xl" value={rating} onChange={e => setRating(e.target.value)} required />
                </div>
                <textarea className="neo-input min-h-[160px] text-lg" placeholder="What did you think?" value={reviewText} onChange={e => setReviewText(e.target.value)} required />
                <div className="flex items-center gap-3 font-mono font-black text-lg">
                  <input type="checkbox" id="spoiler" checked={spoiler} onChange={e => setSpoiler(e.target.checked)} className="w-8 h-8 border-4 border-ink accent-primary" />
                  <label htmlFor="spoiler">CONTAINS SPOILERS</label>
                </div>
                <button type="submit" className="neo-btn py-4 mt-4 text-2xl">SUBMIT REVIEW</button>
              </form>
            </div>
          )}

          <div className="flex flex-col">
            {reviews.length === 0 ? (
              <div className="font-mono font-black text-2xl p-12 bg-surface-container border-4 border-ink text-center">NO REVIEWS YET. BE THE FIRST.</div>
            ) : (
              reviews.map(r => <ReviewCard key={r.Activity_ID} review={r} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
