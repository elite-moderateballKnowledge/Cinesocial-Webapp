import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { apiRequest, authHeaders, getErrorMessage } from '../lib/api';
import ImageWithFallback from '../components/ImageWithFallback';
import ReviewCard from '../components/ReviewCard';

export default function Profile() {
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [profile, setProfile] = useState(null);
  const [bio, setBio] = useState('');
  const [flair, setFlair] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // If we are viewing a specific ID and it's not the current user's ID
  const isMe = !id || id === 'me' || (user && user.userId == id);

  useEffect(() => {
    if (authLoading) return;
    if (isMe && !user) {
      navigate('/login');
      return;
    }

    let ignore = false;

    const loadProfile = async () => {
      try {
        const endpoint = id && id !== 'me' ? `/users/${id}` : '/users/me';
        const data = await apiRequest(endpoint, {
          headers: user ? authHeaders() : {}
        });
        if (ignore) return;
        setProfile(data);
        setBio(data.Bio || '');
        setFlair(data.flair_label || '');
        setError('');
      } catch (err) {
        if (!ignore) {
          setProfile(null);
          setError(getErrorMessage(err));
        }
      }
    };

    loadProfile();
    return () => {
      ignore = true;
    };
  }, [authLoading, user, navigate, id, isMe]);

  const updateProfile = async (e) => {
    e.preventDefault();
    if (!isMe) return;
    setSaving(true);
    try {
      await apiRequest('/users/me', {
        method: 'PUT',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ bio, flairLabel: flair })
      });
      alert('Profile updated!');
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) return <div className="text-4xl font-mono font-black animate-pulse">LOADING...</div>;
  if (error) {
    return (
      <div className="font-mono font-black text-xl p-8 bg-surface-container border-4 border-ink">
        COULD NOT LOAD PROFILE: {error}
      </div>
    );
  }
  if (!profile) return <div className="text-4xl font-mono font-black animate-pulse">LOADING...</div>;

  return (
    <div>
      <h1 className="text-6xl md:text-8xl font-serif font-black mb-12 border-b-8 border-ink pb-4 uppercase">
        {isMe ? 'MY PROFILE' : `${profile.Username}'S PROFILE`}
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
        <div className="neo-card p-8">
           <div className="flex items-center gap-8 mb-8">
              <div className="w-32 h-32 border-4 border-ink bg-primary flex items-center justify-center text-5xl font-bold shrink-0 overflow-hidden relative">
                 <ImageWithFallback 
                   src={profile.Profile_Pic_URL}
                   alt={profile.Username}
                   fallbackText={profile.Username?.charAt(0).toUpperCase() || '?'}
                   isAvatar
                 />
              </div>
              <div>
                 <h2 className="text-4xl font-mono font-black">{profile.Username}</h2>
                 {isMe && <p className="font-mono text-xl opacity-80">{profile.Email}</p>}
                 {profile.flair_label && (
                   <span className="inline-block mt-2 bg-secondary text-surface-container-lowest px-3 py-1 font-mono font-bold border-4 border-ink">
                     {profile.flair_label}
                   </span>
                 )}
                 {profile.Bio && (
                   <p className="mt-4 font-mono text-lg opacity-90">{profile.Bio}</p>
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
           
           {isMe && (
             <div className="mt-8 flex flex-col gap-4">
               <Link to="/friends" className="neo-btn py-3 px-6 text-lg w-full text-center">
                 MANAGE FRIENDS
               </Link>
               <button onClick={logout} className="neo-btn py-3 px-6 text-lg w-full bg-ink text-surface-container-lowest border-4 border-ink hover:bg-surface-container-lowest hover:text-ink">
                 LOG OUT
               </button>
             </div>
           )}

           {!isMe && user && profile.friendship_status !== undefined && (
             <div className="mt-8">
               {profile.friendship_status === 'none' && (
                 <button onClick={async () => {
                   try {
                     await apiRequest(`/friends/request/${profile.User_ID}`, { method: 'POST', headers: authHeaders() });
                     window.location.reload();
                   } catch (err) { alert(err.message); }
                 }} className="neo-btn py-3 px-6 text-lg w-full">
                   ADD FRIEND
                 </button>
               )}
               {profile.friendship_status === 'pending_sent' && (
                 <button disabled className="neo-btn py-3 px-6 text-lg w-full bg-surface-container text-ink opacity-70 cursor-not-allowed">
                   REQUEST SENT
                 </button>
               )}
               {profile.friendship_status === 'pending_received' && (
                 <button onClick={async () => {
                   try {
                     await apiRequest(`/friends/request/${profile.incoming_request_id}/accept`, { method: 'POST', headers: authHeaders() });
                     window.location.reload();
                   } catch (err) { alert(err.message); }
                 }} className="neo-btn py-3 px-6 text-lg w-full bg-[#00C853] text-ink">
                   ACCEPT REQUEST
                 </button>
               )}
               {profile.friendship_status === 'friends' && (
                 <div className="flex flex-col gap-4">
                   <button disabled className="neo-btn py-3 px-6 text-lg w-full bg-surface-container text-ink opacity-70 cursor-not-allowed">
                     FRIENDS ✓
                   </button>
                   <button onClick={async () => {
                     if (!confirm('Are you sure you want to remove this friend?')) return;
                     try {
                       await apiRequest(`/friends/${profile.User_ID}`, { method: 'DELETE', headers: authHeaders() });
                       window.location.reload();
                     } catch (err) { alert(err.message); }
                   }} className="text-red-600 font-bold font-display text-sm hover:underline text-center w-full">
                     REMOVE FRIEND
                   </button>
                 </div>
               )}
             </div>
           )}
        </div>
        
        {isMe && (
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
                <button type="submit" className="neo-btn py-4 text-2xl mt-4" disabled={saving}>
                  {saving ? 'SAVING' : 'SAVE CHANGES'}
                </button>
             </form>
          </div>
        )}
      </div>

      {/* TABS / SECTIONS */}
      <div className="flex flex-col gap-12">
        {/* Reviews */}
        <section>
          <h2 className="text-4xl font-serif font-black mb-6 border-b-4 border-ink pb-2">REVIEWS</h2>
          {profile.reviews && profile.reviews.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {profile.reviews.map(r => (
                <div key={r.Activity_ID} className="neo-card p-6 flex flex-col md:flex-row gap-6">
                  {r.Poster_URL && (
                    <div className="w-24 shrink-0 border-4 border-ink">
                      <ImageWithFallback src={r.Poster_URL} alt={r.Title} className="w-full h-auto" />
                    </div>
                  )}
                  <div className="flex-1">
                    <Link to={`/movies/${r.Movie_ID}`} className="text-2xl font-serif font-black hover:underline mb-2 block">{r.Title}</Link>
                    <ReviewCard review={{
                      Username: profile.Username,
                      Profile_Pic_URL: profile.Profile_Pic_URL,
                      ...r
                    }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="font-mono text-xl">No reviews written yet.</p>
          )}
        </section>

        {/* Lists */}
        <section>
          <h2 className="text-4xl font-serif font-black mb-6 border-b-4 border-ink pb-2">LISTS</h2>
          {profile.lists && profile.lists.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profile.lists.map(list => (
                <Link key={list.List_ID} to={`/lists/${list.List_ID}`} className="neo-card p-6 block hover:bg-surface-container transition-colors">
                  <h3 className="text-2xl font-serif font-black mb-2">{list.List_Title}</h3>
                  <p className="font-mono mb-4 line-clamp-2">{list.L_Description || 'No description.'}</p>
                  <div className="flex justify-between items-center mt-auto">
                    <span className="font-bold bg-surface-container-lowest border-2 border-ink px-2 py-1 text-sm">
                      {list.movie_count} MOVIES
                    </span>
                    {list.is_watchlist ? <span className="font-bold text-sm bg-primary px-2 py-1 border-2 border-ink">WATCHLIST</span> : null}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="font-mono text-xl">No lists created yet.</p>
          )}
        </section>

        {/* Friends */}
        <section>
          <h2 className="text-4xl font-serif font-black mb-6 border-b-4 border-ink pb-2">FRIENDS</h2>
          {profile.friends && profile.friends.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {profile.friends.map(f => (
                <Link key={f.User_ID} to={`/profile/${f.User_ID}`} className="neo-card p-4 flex flex-col items-center gap-3 min-w-[150px] shrink-0 hover:bg-surface-container">
                  <div className="w-16 h-16 border-4 border-ink overflow-hidden rounded-full shrink-0">
                    <ImageWithFallback src={f.Profile_Pic_URL} alt={f.Username} fallbackText={f.Username[0]?.toUpperCase() || '?'} isAvatar className="w-full h-full object-cover" />
                  </div>
                  <div className="text-center">
                    <div className="font-bold font-mono">{f.Username}</div>
                    {f.flair_label && <div className="text-xs bg-secondary text-white px-2 mt-1">{f.flair_label}</div>}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="font-mono text-xl">No friends added yet.</p>
          )}
        </section>

        {/* Parties */}
        <section>
          <h2 className="text-4xl font-serif font-black mb-6 border-b-4 border-ink pb-2">PARTIES ATTENDED</h2>
          {profile.parties_attended && profile.parties_attended.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {profile.parties_attended.map(p => (
                <div key={p.Party_ID} className="neo-card p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-serif font-black text-xl">{p.Party_Name}</h3>
                    <p className="font-mono text-sm opacity-80">Movie: {p.Title}</p>
                    <p className="font-mono text-sm opacity-80">Role: {p.Role}</p>
                  </div>
                  {p.Is_Active ? (
                    <span className="bg-primary border-2 border-ink font-bold px-2 py-1 text-sm animate-pulse">ACTIVE</span>
                  ) : (
                    <span className="bg-surface-container border-2 border-ink font-bold px-2 py-1 text-sm opacity-70">ENDED</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="font-mono text-xl">No parties attended yet.</p>
          )}
        </section>
      </div>
    </div>
  );
}
