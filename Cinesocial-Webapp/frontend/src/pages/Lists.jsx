import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function Lists() {
  const { user } = useAuth();
  const [lists, setLists] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/lists/my-lists', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
         if (Array.isArray(data)) setLists(data);
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <h1 className="text-6xl md:text-8xl font-serif font-black mb-12 border-b-8 border-ink pb-4 uppercase">MY LISTS</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         {lists.map(list => (
           <div key={list.List_ID} className="neo-card p-6 bg-surface-container">
              <h2 className="text-3xl font-serif font-black mb-2">{list.List_Title}</h2>
              <p className="font-mono text-lg mb-6 opacity-80">{list.L_Description || 'No description provided.'}</p>
              <div className="flex justify-between items-end mt-auto">
                 <span className="font-mono font-bold bg-surface-container-lowest border-4 border-ink px-3 py-1 text-lg">
                    {list.total_movies} Movies
                 </span>
                 {list.is_watchlist && <span className="text-primary font-bold font-mono px-2 py-1 bg-ink text-sm">WATCHLIST</span>}
              </div>
           </div>
         ))}
         {lists.length === 0 && (
            <div className="font-mono font-black text-2xl p-12 bg-surface-container border-4 border-ink text-center col-span-full">NO LISTS CREATED YET.</div>
         )}
      </div>
    </div>
  );
}
