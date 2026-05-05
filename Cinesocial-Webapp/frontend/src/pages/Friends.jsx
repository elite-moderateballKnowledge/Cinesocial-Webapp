import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest, authHeaders } from '../lib/api';
import ImageWithFallback from '../components/ImageWithFallback';

export default function Friends() {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search state
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef(null);

  const fetchData = async () => {
    try {
      const [friendsData, requestsData] = await Promise.all([
        apiRequest('/friends', { headers: authHeaders() }),
        apiRequest('/friends/requests', { headers: authHeaders() })
      ]);
      setFriends(friendsData);
      setRequests(requestsData);
    } catch (err) {
      console.error('Failed to load friends data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Search
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(async () => {
      try {
        const data = await apiRequest(`/friends/search?q=${encodeURIComponent(query)}`, {
          headers: authHeaders()
        });
        setSearchResults(data);
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout.current);
  }, [query]);

  const sendRequest = async (userId) => {
    try {
      await apiRequest(`/friends/request/${userId}`, {
        method: 'POST',
        headers: authHeaders()
      });
      // Re-trigger search to update status
      setQuery(q => q + ' ');
      setTimeout(() => setQuery(q => q.trim()), 10);
    } catch (err) {
      alert(err.message);
    }
  };

  const acceptRequest = async (requestId) => {
    try {
      await apiRequest(`/friends/request/${requestId}/accept`, {
        method: 'POST',
        headers: authHeaders()
      });
      fetchData(); // Refresh friends and requests
    } catch (err) {
      alert(err.message);
    }
  };

  const declineRequest = async (requestId) => {
    try {
      await apiRequest(`/friends/request/${requestId}/decline`, {
        method: 'POST',
        headers: authHeaders()
      });
      fetchData(); // Refresh requests
    } catch (err) {
      alert(err.message);
    }
  };

  const removeFriend = async (friendId) => {
    if (!confirm('Are you sure you want to remove this friend?')) return;
    try {
      await apiRequest(`/friends/${friendId}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      fetchData(); // Refresh friends
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="text-4xl font-mono font-black animate-pulse">LOADING...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
      {/* LEFT COLUMN - MY FRIENDS */}
      <div className="lg:col-span-2 flex flex-col gap-8">
        <div className="flex items-center gap-4 border-b-4 border-ink pb-4">
          <h2 className="text-4xl font-serif font-black uppercase">MY FRIENDS</h2>
          <span className="bg-ink text-surface-container-lowest font-mono font-bold px-3 py-1 border-2 border-ink">
            {friends.length}
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            className="neo-input w-full font-mono text-lg"
            placeholder="FIND SOMEONE..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          
          {/* Search Results Dropdown */}
          {query.trim() && (
            <div className="absolute top-full left-0 w-full bg-surface-container border-4 border-ink border-t-0 z-10 max-h-96 overflow-y-auto">
              {isSearching ? (
                <div className="p-4 font-mono font-bold">Searching...</div>
              ) : searchResults.length === 0 ? (
                <div className="p-4 font-mono font-bold text-gray-600">No users found.</div>
              ) : (
                searchResults.map(user => (
                  <div key={user.user_id} className="p-4 border-b-2 border-ink flex items-center justify-between hover:bg-surface transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 border-2 border-ink overflow-hidden rounded-full shrink-0">
                        <ImageWithFallback src={user.profile_pic_url} fallbackText={user.username[0]?.toUpperCase() || '?'} isAvatar className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="font-bold font-mono">{user.username}</div>
                        {user.flair_label && <div className="text-xs bg-secondary text-white px-2 mt-1 inline-block">{user.flair_label}</div>}
                      </div>
                    </div>
                    <div>
                      {user.friendship_status === 'friends' && (
                        <button disabled className="bg-gray-300 border-2 border-ink font-bold px-4 py-1 text-sm font-display cursor-not-allowed text-gray-600">
                          FRIENDS ✓
                        </button>
                      )}
                      {user.friendship_status === 'pending_sent' && (
                        <button disabled className="bg-gray-300 border-2 border-ink font-bold px-4 py-1 text-sm font-display cursor-not-allowed text-gray-600">
                          REQUEST SENT
                        </button>
                      )}
                      {user.friendship_status === 'pending_received' && (
                        <div className="flex gap-2">
                          <button onClick={() => acceptRequest(user.incoming_request_id)} className="bg-green-400 hover:bg-green-500 border-2 border-ink font-bold px-4 py-1 text-sm font-display text-ink transition-colors">
                            ACCEPT
                          </button>
                          <button onClick={() => declineRequest(user.incoming_request_id)} className="bg-red-400 hover:bg-red-500 border-2 border-ink font-bold px-4 py-1 text-sm font-display text-white transition-colors">
                            DECLINE
                          </button>
                        </div>
                      )}
                      {user.friendship_status === 'none' && (
                        <button onClick={() => sendRequest(user.user_id)} className="neo-btn px-4 py-1 text-sm font-display">
                          ADD FRIEND
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Friend List */}
        <div>
          {friends.length === 0 ? (
            <p className="font-mono text-xl p-8 bg-surface-container border-4 border-ink text-center">NO FRIENDS YET. Search above to find people.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {friends.map(f => (
                <div key={f.Friend_ID} className="neo-card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 border-4 border-ink overflow-hidden rounded-full shrink-0">
                      <ImageWithFallback src={f.Profile_Pic_URL} fallbackText={f.Username[0]?.toUpperCase() || '?'} isAvatar className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="font-bold font-mono text-xl">{f.Username}</div>
                      {f.flair_label && <div className="text-xs bg-secondary text-white px-2 mt-1 inline-block border-2 border-ink">{f.flair_label}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Link to={`/profile/${f.Friend_ID}`} className="border-2 border-ink px-4 py-2 font-display font-bold text-sm hover:bg-surface-container transition-colors">
                      VIEW PROFILE
                    </Link>
                    <button onClick={() => removeFriend(f.Friend_ID)} className="text-red-600 font-bold font-display text-sm hover:underline">
                      REMOVE
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN - FRIEND REQUESTS */}
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-4 border-b-4 border-ink pb-4">
          <h2 className="text-3xl font-serif font-black uppercase">REQUESTS</h2>
          <span className="bg-[#FFD300] text-ink font-mono font-bold px-3 py-1 border-2 border-ink">
            {requests.length}
          </span>
        </div>

        <div>
          {requests.length === 0 ? (
            <p className="font-mono text-lg p-6 bg-surface-container border-4 border-ink text-center">NO PENDING REQUESTS.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {requests.map(req => (
                <div key={req.Request_ID} className="neo-card p-4 flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 border-2 border-ink overflow-hidden rounded-full shrink-0">
                      <ImageWithFallback src={req.sender_pic} fallbackText={req.sender_username[0]?.toUpperCase() || '?'} isAvatar className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <Link to={`/profile/${req.Sender_ID}`} className="font-bold font-mono hover:underline block">{req.sender_username}</Link>
                      {req.sender_flair && <div className="text-[10px] bg-secondary text-white px-2 mt-1 inline-block">{req.sender_flair}</div>}
                    </div>
                    <div className="ml-auto font-mono text-xs opacity-60">
                      {req.time_ago}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => acceptRequest(req.Request_ID)} className="flex-1 bg-ink text-[#FFD300] font-black font-display text-sm py-2 border-2 border-ink" style={{ boxShadow: '4px 4px 0 0 #000' }}>
                      ACCEPT
                    </button>
                    <button onClick={() => declineRequest(req.Request_ID)} className="flex-1 bg-surface hover:bg-red-500 hover:text-white font-black font-display text-sm py-2 border-2 border-ink transition-colors">
                      DECLINE
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
