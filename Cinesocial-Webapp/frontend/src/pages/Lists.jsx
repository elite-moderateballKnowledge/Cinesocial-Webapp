import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { apiRequest, authHeaders, getErrorMessage } from '../lib/api';

const getListId = (list) => list.List_ID ?? list.list_id;
const getListTitle = (list) => list.List_Title ?? list.list_title;
const getListDescription = (list) => list.L_Description ?? list.description;
const getMovieCount = (list) => list.total_movies ?? list.movie_count ?? 0;
const getOwnerName = (list) => list.Username ?? list.owner_username;

export default function Lists() {
  const { user, loading: authLoading } = useAuth();
  const [lists, setLists] = useState([]);
  const [publicLists, setPublicLists] = useState([]);
  const [activeTab, setActiveTab] = useState(user ? 'my-lists' : 'public');
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) setActiveTab('public');

    let ignore = false;

    const loadLists = async () => {
      try {
        const myListsRequest = user
          ? apiRequest('/lists/my-lists', { headers: authHeaders() })
          : Promise.resolve([]);
        const [myListsData, publicData] = await Promise.all([
          myListsRequest,
          apiRequest('/lists/public'),
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
  }, [authLoading, user]);

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
        }),
      });

      setLists(prev => [newList, ...prev]);
      setPublicLists(prev => [newList, ...prev]);
      setShowForm(false);
      setTitle('');
      setDescription('');
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  if (authLoading) {
    return <div className="text-4xl font-mono font-black animate-pulse">LOADING...</div>;
  }

  const visibleLists = activeTab === 'my-lists' ? lists : publicLists;

  return (
    <div>
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between mb-8 border-b-8 border-ink pb-4">
        <h1 className="text-6xl md:text-8xl font-serif font-black uppercase m-0 leading-none">LISTS</h1>
        {user && activeTab === 'my-lists' && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="neo-btn inline-flex items-center justify-center gap-2 px-6 py-3 text-xl font-bold uppercase"
          >
            {!showForm && <Plus size={22} strokeWidth={3} />}
            {showForm ? 'CANCEL' : 'CREATE LIST'}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-4 mb-8">
        {user && (
          <button
            onClick={() => setActiveTab('my-lists')}
            className={`px-6 py-2 font-mono font-bold text-xl border-4 border-ink transition-colors ${activeTab === 'my-lists' ? 'bg-primary' : 'bg-surface-container hover:bg-surface-container-highest'}`}
          >
            MY LISTS
          </button>
        )}
        <button
          onClick={() => setActiveTab('public')}
          className={`px-6 py-2 font-mono font-bold text-xl border-4 border-ink transition-colors ${activeTab === 'public' ? 'bg-primary' : 'bg-surface-container hover:bg-surface-container-highest'}`}
        >
          PUBLIC LISTS
        </button>
        {!user && (
          <Link to="/login" className="px-6 py-2 font-mono font-bold text-xl border-4 border-ink bg-surface-container hover:bg-primary transition-colors">
            SIGN IN
          </Link>
        )}
      </div>

      {error && (
        <div className="font-mono font-black text-xl p-8 mb-8 bg-surface-container border-4 border-ink text-error">
          COULD NOT LOAD LISTS: {error}
        </div>
      )}

      {user && activeTab === 'my-lists' && showForm && (
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

            <div>
              <span className="inline-block border-4 border-ink bg-primary px-3 py-1 font-mono text-sm font-black">
                PUBLIC COLLECTION
              </span>
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
        {visibleLists.map(list => (
          <Link
            key={getListId(list)}
            to={`/lists/${getListId(list)}`}
            className="neo-card p-6 bg-surface-container flex flex-col hover:bg-surface-container-lowest transition-colors"
          >
            <h2 className="text-3xl font-serif font-black mb-2">{getListTitle(list)}</h2>
            <p className="font-mono text-lg mb-6 opacity-80 line-clamp-3">
              {getListDescription(list) || 'No description provided.'}
            </p>
            {activeTab === 'public' && (
              <p className="font-mono font-bold mb-4 opacity-80">By: @{getOwnerName(list)}</p>
            )}
            <div className="flex justify-between items-end mt-auto">
              <span className="font-mono font-bold bg-surface-container-lowest border-4 border-ink px-3 py-1 text-lg">
                {getMovieCount(list)} Movies
              </span>
              {list.is_watchlist ? (
                <span className="text-primary font-bold font-mono px-2 py-1 bg-ink text-sm">WATCHLIST</span>
              ) : null}
            </div>
          </Link>
        ))}

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
