import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { apiRequest, authHeaders, getErrorMessage } from '../lib/api';

export default function Lists() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [lists, setLists] = useState([]);
  const [publicLists, setPublicLists] = useState([]);
  const [activeTab, setActiveTab] = useState('my-lists');
  const [error, setError] = useState('');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isWatchlist, setIsWatchlist] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }

    let ignore = false;

    const loadLists = async () => {
      try {
        const [myListsData, publicData] = await Promise.all([
           apiRequest('/lists/my-lists', { headers: authHeaders() }),
           apiRequest('/lists/public')
        ]);
        if (!ignore) {
          setLists(Array.isArray(myListsData) ? myListsData : []);
          setPublicLists(Array.isArray(publicData) ? publicData : []);
          setError('');
        }
      } catch (err) {
        if (!ignore) {
          setLists([]);
          setPublicLists([]);
          setError(getErrorMessage(err));
        }
      }
    };

    loadLists();
    return () => {
      ignore = true;
    };
  }, [authLoading, user, navigate]);

  const handleCreateList = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Title is required');
      return;
    }

    setCreating(true);
    setFormError('');

    try {
      const newList = await apiRequest('/lists', {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          isPublic,
          isWatchlist
        })
      });
      
      // Update local state by pushing to top
      setLists(prev => [newList, ...prev]);
      
      // Reset form
      setShowForm(false);
      setTitle('');
      setDescription('');
      setIsPublic(true);
      setIsWatchlist(false);
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  if (authLoading) return <div className="text-4xl font-mono font-black animate-pulse">LOADING...</div>;

  return (
    <div>
      <div className="flex justify-between items-end mb-8 border-b-8 border-ink pb-4">
        <h1 className="text-6xl md:text-8xl font-serif font-black uppercase m-0 leading-none">LISTS</h1>
        {activeTab === 'my-lists' && (
          <button 
            onClick={() => setShowForm(!showForm)}
            className="neo-btn px-6 py-3 text-xl font-bold uppercase"
          >
            {showForm ? 'CANCEL' : 'CREATE LIST'}
          </button>
        )}
      </div>

      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setActiveTab('my-lists')}
          className={`px-6 py-2 font-mono font-bold text-xl border-4 border-ink transition-colors ${activeTab === 'my-lists' ? 'bg-primary' : 'bg-surface-container hover:bg-surface-container-highest'}`}
        >
          MY LISTS
        </button>
        <button
          onClick={() => setActiveTab('public')}
          className={`px-6 py-2 font-mono font-bold text-xl border-4 border-ink transition-colors ${activeTab === 'public' ? 'bg-primary' : 'bg-surface-container hover:bg-surface-container-highest'}`}
        >
          PUBLIC LISTS
        </button>
      </div>

      {error && (
        <div className="font-mono font-black text-xl p-8 mb-8 bg-surface-container border-4 border-ink text-error">
          COULD NOT LOAD LISTS: {error}
        </div>
      )}

      {activeTab === 'my-lists' && showForm && (
        <div className="neo-card p-8 mb-12 bg-surface-container-lowest animate-fade-in-down border-primary">
          <h2 className="text-3xl font-serif font-black mb-6">CREATE A NEW LIST</h2>
          {formError && (
            <div className="bg-error text-white font-mono p-4 mb-6 border-4 border-ink font-bold">
              {formError}
            </div>
          )}
          <form onSubmit={handleCreateList} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="font-mono font-bold text-lg">TITLE *</label>
              <input 
                type="text" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                className="neo-input text-lg" 
                placeholder="E.g., Favorite Sci-Fi Movies"
                required
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="font-mono font-bold text-lg">DESCRIPTION</label>
              <textarea 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                className="neo-input text-lg min-h-[100px]" 
                placeholder="What's this list about?"
              />
            </div>

            <div className="flex items-center gap-8">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isPublic} 
                  onChange={e => setIsPublic(e.target.checked)} 
                  className="w-6 h-6 border-4 border-ink appearance-none checked:bg-primary cursor-pointer relative checked:after:content-['✓'] checked:after:absolute checked:after:text-ink checked:after:font-black checked:after:text-sm checked:after:left-[2px] checked:after:-top-[2px]"
                />
                <span className="font-mono font-bold text-lg">PUBLIC LIST</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isWatchlist} 
                  onChange={e => setIsWatchlist(e.target.checked)} 
                  className="w-6 h-6 border-4 border-ink appearance-none checked:bg-primary cursor-pointer relative checked:after:content-['✓'] checked:after:absolute checked:after:text-ink checked:after:font-black checked:after:text-sm checked:after:left-[2px] checked:after:-top-[2px]"
                />
                <span className="font-mono font-bold text-lg">SET AS WATCHLIST</span>
              </label>
            </div>

            <div className="mt-4">
              <button 
                type="submit" 
                disabled={creating}
                className="neo-btn w-full md:w-auto px-12 py-4 text-2xl font-black bg-primary text-ink border-4 border-ink hover:bg-white disabled:opacity-50"
              >
                {creating ? 'CREATING...' : 'CREATE LIST'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         {activeTab === 'my-lists' ? (
           lists.map(list => (
             <div key={list.List_ID} className="neo-card p-6 bg-surface-container flex flex-col">
                <h2 className="text-3xl font-serif font-black mb-2">{list.List_Title}</h2>
                <p className="font-mono text-lg mb-6 opacity-80">{list.L_Description || 'No description provided.'}</p>
                <div className="flex justify-between items-end mt-auto">
                   <span className="font-mono font-bold bg-surface-container-lowest border-4 border-ink px-3 py-1 text-lg">
                      {list.total_movies ?? 0} Movies
                   </span>
                   {list.is_watchlist ? <span className="text-primary font-bold font-mono px-2 py-1 bg-ink text-sm">WATCHLIST</span> : null}
                </div>
             </div>
           ))
         ) : (
           publicLists.map(list => (
             <div key={list.List_ID} className="neo-card p-6 bg-surface-container flex flex-col">
                <div className="flex justify-between items-start mb-2">
                   <h2 className="text-3xl font-serif font-black">{list.List_Title}</h2>
                </div>
                <p className="font-mono font-bold mb-4 opacity-80">By: @{list.Username}</p>
                <div className="flex justify-between items-end mt-auto">
                   <span className="font-mono font-bold bg-surface-container-lowest border-4 border-ink px-3 py-1 text-lg">
                      {list.total_movies ?? 0} Movies
                   </span>
                </div>
             </div>
           ))
         )}
         {activeTab === 'my-lists' && lists.length === 0 && !showForm && (
            <div className="font-mono font-black text-2xl p-12 bg-surface-container border-4 border-ink text-center col-span-full">NO LISTS CREATED YET.</div>
         )}
         {activeTab === 'public' && publicLists.length === 0 && (
            <div className="font-mono font-black text-2xl p-12 bg-surface-container border-4 border-ink text-center col-span-full">NO PUBLIC LISTS AVAILABLE.</div>
         )}
      </div>
    </div>
  );
}
