import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [bio, setBio] = useState('');
  const [flair, setFlair] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetch(`http://localhost:5000/api/users/me`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        setProfile(data);
        setBio(data.Bio || '');
        setFlair(data.flair_label || '');
      });
  }, [user, navigate]);

  const updateProfile = async (e) => {
    e.preventDefault();
    const res = await fetch(`http://localhost:5000/api/users/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ bio, flairLabel: flair })
    });
    if (res.ok) {
      alert('Profile updated!');
    } else {
      const data = await res.json();
      alert(data.message);
    }
  };

  if (!profile) return <div className="text-4xl font-mono font-black animate-pulse">LOADING...</div>;

  return (
    <div>
      <h1 className="text-6xl md:text-8xl font-serif font-black mb-12 border-b-8 border-ink pb-4 uppercase">PROFILE</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="neo-card p-8">
           <div className="flex items-center gap-8 mb-8">
              <div className="w-32 h-32 border-4 border-ink bg-primary flex items-center justify-center text-5xl font-bold">
                 {profile.Username.charAt(0).toUpperCase()}
              </div>
              <div>
                 <h2 className="text-4xl font-mono font-black">{profile.Username}</h2>
                 <p className="font-mono text-xl opacity-80">{profile.Email}</p>
                 {profile.flair_label && (
                   <span className="inline-block mt-2 bg-secondary text-surface-container-lowest px-3 py-1 font-mono font-bold border-4 border-ink">
                     {profile.flair_label}
                   </span>
                 )}
              </div>
           </div>
           
           <div className="border-t-4 border-ink pt-8">
             <h3 className="text-2xl font-serif font-black mb-4">SUBSCRIPTION STATUS</h3>
             {profile.Plan_Name ? (
               <div className="font-mono text-xl p-4 bg-surface-container border-4 border-ink">
                 <p><strong>PLAN:</strong> {profile.Plan_Name}</p>
                 <p><strong>EXPIRES:</strong> {new Date(profile.sub_exp).toLocaleDateString()}</p>
               </div>
             ) : (
               <div className="font-mono text-xl p-4 bg-surface-container border-4 border-ink">FREE TIER</div>
             )}
           </div>
        </div>
        
        <div className="neo-card p-8">
           <h3 className="text-3xl font-serif font-black mb-6">EDIT PROFILE</h3>
           <form onSubmit={updateProfile} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="font-mono font-black text-xl">BIO</label>
                <textarea 
                  className="neo-input min-h-[120px] text-lg" 
                  value={bio} 
                  onChange={e => setBio(e.target.value)} 
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-mono font-black text-xl">PROFILE FLAIR (PREMIUM ONLY)</label>
                <input 
                  type="text" 
                  className="neo-input text-lg" 
                  value={flair} 
                  onChange={e => setFlair(e.target.value)} 
                  disabled={!profile.Has_Profile_Flair}
                  placeholder={!profile.Has_Profile_Flair ? "Requires Premium Plan" : "Enter custom flair"}
                />
              </div>
              <button type="submit" className="neo-btn py-4 text-2xl mt-4">SAVE CHANGES</button>
           </form>
        </div>
      </div>
    </div>
  );
}
