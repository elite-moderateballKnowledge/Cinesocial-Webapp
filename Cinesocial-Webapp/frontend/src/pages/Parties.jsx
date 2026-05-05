import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { apiRequest, authHeaders, getErrorMessage } from '../lib/api';

export default function Parties() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [parties, setParties] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [joiningParty, setJoiningParty] = useState(null);
  
  const [partyName, setPartyName] = useState('');
  const [movieId, setMovieId] = useState('');
  const [maxMembers, setMaxMembers] = useState(10);
  const [inviteCode, setInviteCode] = useState('');

  const loadParties = async () => {
    const data = await apiRequest('/parties', {
      headers: authHeaders()
    });
    setParties(Array.isArray(data) ? data : []);
    setError('');
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }

    let ignore = false;

    const run = async () => {
      try {
        const data = await apiRequest('/parties', {
          headers: authHeaders()
        });
        if (!ignore) {
          setParties(Array.isArray(data) ? data : []);
          setError('');
        }
      } catch (err) {
        if (!ignore) {
          setParties([]);
          setError(getErrorMessage(err));
        }
      }
    };

    run();
    return () => {
      ignore = true;
    };
  }, [authLoading, user, navigate]);

  const createParty = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest('/parties', {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ partyName, movieId, maxMembers, inviteCode })
      });
      alert('Party created!');
      setPartyName('');
      setMovieId('');
      setMaxMembers(10);
      setInviteCode('');
      await loadParties();
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const joinParty = async (partyId) => {
    if (!user) {
      navigate('/login');
      return;
    }

    setJoiningParty(partyId);
    try {
      await apiRequest(`/parties/${partyId}/join`, {
        method: 'POST',
        headers: authHeaders()
      });
      alert('Joined party successfully!');
      await loadParties();
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setJoiningParty(null);
    }
  };

  if (authLoading) return <div className="text-4xl font-mono font-black animate-pulse">LOADING...</div>;

  return (
    <div>
      <h1 className="text-6xl md:text-8xl font-serif font-black mb-12 border-b-8 border-ink pb-4 uppercase">WATCH PARTIES</h1>
      {error && (
        <div className="font-mono font-black text-xl p-8 mb-8 bg-surface-container border-4 border-ink">
          COULD NOT LOAD PARTIES: {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
           <h2 className="text-4xl font-serif font-black mb-8">ACTIVE PARTIES</h2>
           <div className="flex flex-col gap-6">
              {parties.map(p => (
                <div key={p.Party_ID} className="neo-card flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-surface">
                   <div>
                      <h3 className="text-3xl font-black font-serif uppercase mb-2">{p.Party_Name}</h3>
                      <p className="font-mono text-lg font-bold">HOST: {p.host}</p>
                      <p className="font-mono text-lg font-bold">MOVIE: {p.movie}</p>
                   </div>
                   <div className="flex flex-col items-end gap-4 w-full md:w-auto">
                      <span className="font-mono font-bold bg-surface-container px-4 py-2 border-4 border-ink">MAX: {p.Max_Members}</span>
                      <button
                        type="button"
                        onClick={() => joinParty(p.Party_ID)}
                        className="neo-btn px-8 py-3 w-full md:w-auto text-xl"
                        disabled={joiningParty === p.Party_ID}
                      >
                        {joiningParty === p.Party_ID ? 'JOINING' : 'JOIN'}
                      </button>
                   </div>
                </div>
              ))}
              {parties.length === 0 && (
                <div className="font-mono font-black text-2xl p-12 bg-surface-container border-4 border-ink text-center">NO ACTIVE PARTIES.</div>
              )}
           </div>
        </div>
        
        <div className="lg:col-span-1">
           <div className="neo-card bg-surface-container-lowest sticky top-32 p-8 border-4 border-ink shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <h2 className="text-4xl font-serif font-black mb-8 border-b-4 border-ink pb-2">HOST A PARTY</h2>
              <form onSubmit={createParty} className="flex flex-col gap-6">
                 <div className="flex flex-col gap-2">
                    <label className="font-mono font-black text-xl">PARTY NAME</label>
                    <input type="text" className="neo-input text-lg" value={partyName} onChange={e => setPartyName(e.target.value)} required />
                 </div>
                 <div className="flex flex-col gap-2">
                    <label className="font-mono font-black text-xl">MOVIE ID</label>
                    <input type="number" className="neo-input text-lg" value={movieId} onChange={e => setMovieId(e.target.value)} required />
                 </div>
                 <div className="flex flex-col gap-2">
                    <label className="font-mono font-black text-xl">MAX MEMBERS</label>
                    <input type="number" className="neo-input text-lg" value={maxMembers} onChange={e => setMaxMembers(e.target.value)} required />
                 </div>
                 <div className="flex flex-col gap-2">
                    <label className="font-mono font-black text-xl">INVITE CODE</label>
                    <input type="text" className="neo-input text-lg" value={inviteCode} onChange={e => setInviteCode(e.target.value)} required />
                 </div>
                 <button type="submit" className="neo-btn py-4 mt-4 text-2xl" disabled={submitting}>
                  {submitting ? 'CREATING' : 'CREATE PARTY'}
                 </button>
              </form>
           </div>
        </div>
      </div>
    </div>
  );
}
