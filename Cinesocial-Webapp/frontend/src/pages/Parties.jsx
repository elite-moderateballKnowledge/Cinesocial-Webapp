import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { apiRequest, authHeaders, getErrorMessage } from '../lib/api';
import { CalendarClock, Film, MapPin, Search, Ticket, Users } from 'lucide-react';

const MIN_PARTY_MEMBERS = 4;

const toDateTimeLocalValue = (date) => {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const getDefaultPartyTime = () => {
  const date = new Date(Date.now() + 2 * 60 * 60 * 1000);
  date.setMinutes(0, 0, 0);
  return toDateTimeLocalValue(date);
};

const formatPartyTime = (value) => {
  if (!value) return 'TIME TBD';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'TIME TBD';

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
};

const getPartyField = (party, ...keys) => {
  for (const key of keys) {
    if (party[key] !== undefined && party[key] !== null) return party[key];
  }
  return '';
};

export default function Parties() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [parties, setParties] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [joiningParty, setJoiningParty] = useState(null);
  
  const [partyName, setPartyName] = useState('');
  const [movieId, setMovieId] = useState('');
  const [movieQuery, setMovieQuery] = useState('');
  const [movieResults, setMovieResults] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [maxMembers, setMaxMembers] = useState(10);
  const [inviteCode, setInviteCode] = useState('');
  const [location, setLocation] = useState('');
  const [scheduledAt, setScheduledAt] = useState(getDefaultPartyTime());

  const loadParties = async () => {
    const [data, noticeData] = await Promise.all([
      apiRequest('/parties', {
        headers: authHeaders()
      }),
      apiRequest('/parties/notifications', {
        headers: authHeaders()
      })
    ]);
    setParties(Array.isArray(data) ? data : []);
    setNotifications(Array.isArray(noticeData) ? noticeData : []);
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
        const [data, noticeData] = await Promise.all([
          apiRequest('/parties', {
            headers: authHeaders()
          }),
          apiRequest('/parties/notifications', {
            headers: authHeaders()
          })
        ]);
        if (!ignore) {
          setParties(Array.isArray(data) ? data : []);
          setNotifications(Array.isArray(noticeData) ? noticeData : []);
          setError('');
        }
      } catch (err) {
        if (!ignore) {
          setParties([]);
          setNotifications([]);
          setError(getErrorMessage(err));
        }
      }
    };

    run();
    return () => {
      ignore = true;
    };
  }, [authLoading, user, navigate]);

  useEffect(() => {
    const query = movieQuery.trim();

    if (selectedMovie && query === selectedMovie.Title) {
      setMovieResults([]);
      return;
    }

    if (query.length < 2) {
      setMovieResults([]);
      return;
    }

    let ignore = false;
    const timeout = setTimeout(async () => {
      try {
        const data = await apiRequest(`/movies/search?q=${encodeURIComponent(query)}`);
        if (!ignore) setMovieResults(Array.isArray(data) ? data.slice(0, 6) : []);
      } catch {
        if (!ignore) setMovieResults([]);
      }
    }, 250);

    return () => {
      ignore = true;
      clearTimeout(timeout);
    };
  }, [movieQuery, selectedMovie]);

  const createParty = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    if (Number(maxMembers) < MIN_PARTY_MEMBERS) {
      alert(`Max members must be at least ${MIN_PARTY_MEMBERS}.`);
      return;
    }

    if (!movieId) {
      alert('Please select a movie from search.');
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest('/parties', {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ partyName, movieId, maxMembers, inviteCode, location, scheduledAt })
      });
      alert('Party created!');
      setPartyName('');
      setMovieId('');
      setMovieQuery('');
      setMovieResults([]);
      setSelectedMovie(null);
      setMaxMembers(10);
      setInviteCode('');
      setLocation('');
      setScheduledAt(getDefaultPartyTime());
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

    const code = window.prompt('Enter the invite code for this party:');
    if (!code) return;

    setJoiningParty(partyId);
    try {
      await apiRequest(`/parties/${partyId}/join`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ inviteCode: code })
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

      {notifications.length > 0 && (
        <div className="mb-10 border-4 border-ink bg-secondary text-surface-container-lowest p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-3xl font-serif font-black mb-4">PARTY UPDATES</h2>
          <div className="flex flex-col gap-3">
            {notifications.map(notification => (
              <p key={notification.Activity_ID} className="font-mono font-bold">
                {notification.Details}
              </p>
            ))}
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
           <h2 className="text-4xl font-serif font-black mb-8">ACTIVE PARTIES</h2>
           <div className="flex flex-col gap-6">
              {parties.map(p => {
                const partyId = getPartyField(p, 'Party_ID', 'party_id');
                const partyNameDisplay = getPartyField(p, 'Party_Name', 'party_name');
                const currentMembers = Number(getPartyField(p, 'current_member_count', 'Current_Member_Count')) || 0;
                const maxMembersDisplay = Number(getPartyField(p, 'Max_Members', 'max_members')) || 0;
                const isFull = maxMembersDisplay > 0 && currentMembers >= maxMembersDisplay;

                return (
                <div key={partyId} className="neo-card flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-surface">
                   <div className="min-w-0">
                      <h3 className="text-3xl font-black font-serif uppercase mb-3 break-words">{partyNameDisplay}</h3>
                      <p className="font-mono text-lg font-bold">HOST: {getPartyField(p, 'host')}</p>
                      <p className="font-mono text-lg font-bold flex items-center gap-2"><Film size={20} /> {getPartyField(p, 'movie')}</p>
                      <p className="font-mono text-lg font-bold flex items-center gap-2"><MapPin size={20} /> {getPartyField(p, 'Location_Description', 'location_description')}</p>
                      <p className="font-mono text-lg font-bold flex items-center gap-2"><CalendarClock size={20} /> {formatPartyTime(getPartyField(p, 'Scheduled_At', 'scheduled_at'))}</p>
                   </div>
                   <div className="flex flex-col items-end gap-4 w-full md:w-auto">
                      <span className="font-mono font-bold bg-surface-container px-4 py-2 border-4 border-ink flex items-center gap-2">
                        <Users size={20} /> {currentMembers}/{maxMembersDisplay}
                      </span>
                      <button
                        type="button"
                        onClick={() => joinParty(partyId)}
                        className="neo-btn px-8 py-3 w-full md:w-auto text-xl"
                        disabled={joiningParty === partyId || isFull}
                      >
                        {isFull ? 'FULL' : joiningParty === partyId ? 'JOINING' : 'JOIN'}
                      </button>
                   </div>
                </div>
                );
              })}
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
                    <label className="font-mono font-black text-xl">MOVIE</label>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2" size={22} />
                      <input
                        type="search"
                        className="neo-input text-lg w-full pl-12"
                        value={movieQuery}
                        onChange={e => {
                          setMovieQuery(e.target.value);
                          setMovieId('');
                          setSelectedMovie(null);
                        }}
                        required
                      />
                      {movieResults.length > 0 && (
                        <div className="absolute z-20 mt-2 w-full border-4 border-ink bg-surface-container-lowest shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                          {movieResults.map(movie => (
                            <button
                              key={movie.Movie_ID}
                              type="button"
                              className="w-full px-4 py-3 text-left font-mono font-black border-b-4 border-ink last:border-b-0 hover:bg-primary"
                              onClick={() => {
                                setSelectedMovie(movie);
                                setMovieId(movie.Movie_ID);
                                setMovieQuery(movie.Title);
                                setMovieResults([]);
                              }}
                            >
                              {movie.Title}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {selectedMovie && (
                      <div className="font-mono font-black bg-accent-green px-4 py-2 border-4 border-ink">
                        SELECTED: {selectedMovie.Title}
                      </div>
                    )}
                 </div>
                 <div className="flex flex-col gap-2">
                    <label className="font-mono font-black text-xl">MAX MEMBERS</label>
                    <input type="number" className="neo-input text-lg" min={MIN_PARTY_MEMBERS} value={maxMembers} onChange={e => setMaxMembers(e.target.value)} required />
                 </div>
                 <div className="flex flex-col gap-2">
                    <label className="font-mono font-black text-xl">INVITE CODE</label>
                    <div className="relative">
                      <Ticket className="absolute left-4 top-1/2 -translate-y-1/2" size={22} />
                      <input type="text" className="neo-input text-lg w-full pl-12 uppercase" value={inviteCode} onChange={e => setInviteCode(e.target.value.toUpperCase())} maxLength={20} required />
                    </div>
                 </div>
                 <div className="flex flex-col gap-2">
                    <label className="font-mono font-black text-xl">LOCATION</label>
                    <input type="text" className="neo-input text-lg" value={location} onChange={e => setLocation(e.target.value)} required />
                 </div>
                 <div className="flex flex-col gap-2">
                    <label className="font-mono font-black text-xl">TIME</label>
                    <input type="datetime-local" className="neo-input text-lg" value={scheduledAt} min={toDateTimeLocalValue(new Date())} onChange={e => setScheduledAt(e.target.value)} required />
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
