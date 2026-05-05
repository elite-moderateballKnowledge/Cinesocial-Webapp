import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../lib/api';
import ImageWithFallback from '../components/ImageWithFallback';

export default function Members() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const data = await apiRequest('/users');
        setMembers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, []);

  if (loading) return <div className="text-4xl font-mono font-black animate-pulse">LOADING...</div>;
  if (error) return <div className="text-xl font-mono font-black p-8 bg-surface-container border-4 border-ink">ERROR: {error}</div>;

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-6xl md:text-8xl font-serif font-black mb-12 border-b-8 border-ink pb-4 uppercase">
        MEMBERS
      </h1>
      
      <p className="font-mono text-xl mb-8">Recently joined CineSocial members.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {members.map(member => (
          <Link key={member.User_ID} to={`/profile/${member.User_ID}`} className="block group">
            <div className="neo-card p-6 flex flex-col items-center text-center gap-4 hover:bg-surface-container transition-colors h-full justify-center">
              <div className="w-24 h-24 border-4 border-ink overflow-hidden rounded-full shrink-0 group-hover:scale-105 transition-transform">
                <ImageWithFallback 
                  src={member.Profile_Pic_URL} 
                  fallbackText={member.Username[0]?.toUpperCase() || '?'} 
                  isAvatar 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div>
                <h3 className="font-serif font-black text-2xl">{member.Username}</h3>
                {member.flair_label && (
                  <span className="inline-block bg-secondary text-white px-2 py-1 mt-2 text-xs font-mono font-bold border-2 border-ink">
                    {member.flair_label}
                  </span>
                )}
                <p className="font-mono text-sm opacity-70 mt-2">
                  Joined: {new Date(member.Join_date).toLocaleDateString()}
                </p>
              </div>
              <div className="mt-4 neo-btn px-4 py-2 text-sm">
                VIEW PROFILE
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
