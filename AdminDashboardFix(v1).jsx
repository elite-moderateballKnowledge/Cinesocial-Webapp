import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import { LogOut, LayoutDashboard, Users, Film, FileText, Star, Settings, Check, X, Search as SearchIcon, Eye, Trash2 } from 'lucide-react';
import Logo from '../../components/Logo';

// Setup axios instance for admin
const adminApi = axios.create({
  baseURL: 'http://localhost:5000/api/admin',
});
adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [stats, setStats] = useState(null);

  if (!localStorage.getItem('adminToken')) {
    return <Navigate to="/admin/login" />;
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  useEffect(() => {
    if (activeTab === 'DASHBOARD') {
      adminApi.get('/stats').then(res => setStats(res.data)).catch(console.error);
    }
  }, [activeTab]);

  const tabs = [
    { id: 'DASHBOARD', icon: LayoutDashboard },
    { id: 'USERS', icon: Users },
    { id: 'MOVIES', icon: Film },
    { id: 'ARTICLES', icon: FileText, badge: stats?.pending_articles > 0 ? stats.pending_articles : null },
    { id: 'REVIEWS', icon: Star },
    { id: 'SETTINGS', icon: Settings },
  ];

  return (
    <div className="min-h-screen w-full bg-[#1a1a1a] text-white flex absolute top-0 left-0 z-50 font-mono">
      {/* Sidebar */}
      <aside className="w-[220px] fixed h-screen border-r border-gray-800 bg-[#111] flex flex-col pt-6 pb-6">
        <div className="px-6 mb-10 text-[#FFD300]">
          <Logo variant="light" className="text-3xl" />
        </div>
        <nav className="flex-1 flex flex-col gap-2 px-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-between p-3 text-sm tracking-widest ${
                  isActive 
                    ? 'border-l-4 border-[#FFD300] bg-gray-800/50 text-[#FFD300] font-bold' 
                    : 'border-l-4 border-transparent text-gray-400 hover:text-white hover:bg-gray-800/30'
                } transition-colors`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} />
                  <span>{tab.id}</span>
                </div>
                {tab.badge && (
                  <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="px-4 mt-auto">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 p-3 text-red-500 hover:bg-red-500/10 w-full text-left text-sm tracking-widest transition-colors font-bold"
          >
            <LogOut size={18} />
            LOGOUT
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-[220px] p-8 md:p-12 overflow-y-auto min-h-screen">
        {activeTab === 'DASHBOARD' && <DashboardPanel stats={stats} setActiveTab={setActiveTab} />}
        {activeTab === 'USERS' && <UsersPanel />}
        {activeTab === 'MOVIES' && <MoviesPanel />}
        {activeTab === 'ARTICLES' && <ArticlesPanel />}
        {activeTab === 'REVIEWS' && <ReviewsPanel />}
        {activeTab === 'SETTINGS' && (
          <div className="p-8 border border-gray-800 bg-[#111] text-center">
            <h2 className="text-xl text-gray-400 font-bold">Settings Coming Soon</h2>
          </div>
        )}
      </main>
    </div>
  );
}

// ── Dashboard Panel ──────────────────────────────────────────────────────────
function DashboardPanel({ stats, setActiveTab }) {
  if (!stats) return <div className="text-center p-12 text-gray-500 font-mono">Loading stats...</div>;

  const statCards = [
    { label: 'TOTAL USERS', value: stats.total_users },
    { label: 'ACTIVE USERS', value: stats.active_users },
    { label: 'BANNED USERS', value: stats.banned_users },
    { label: 'CINEPHILE SUBS', value: stats.cinephile_users },
    { label: 'NEW USERS (7D)', value: stats.new_users_this_week },
    { label: 'TOTAL MOVIES', value: stats.total_movies },
    { label: 'TOTAL REVIEWS', value: stats.total_reviews },
    { label: 'TOTAL ARTICLES', value: stats.total_articles },
    { label: 'WATCH PARTIES', value: stats.total_parties },
  ];

  return (
    <div className="flex flex-col gap-8">
      {stats.pending_articles > 0 && (
        <div className="bg-[#FFD300] border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between text-black">
          <div className="flex items-center gap-4">
            <span className="text-3xl">⚠</span>
            <span className="text-xl font-bold font-mono tracking-wider">{stats.pending_articles} ARTICLES AWAITING REVIEW</span>
          </div>
          <button 
            onClick={() => setActiveTab('ARTICLES')}
            className="bg-black text-white px-6 py-3 font-bold hover:bg-gray-800 transition-colors"
          >
            REVIEW NOW →
          </button>
        </div>
      )}

      <h1 className="text-3xl font-serif font-bold text-white uppercase tracking-widest border-b border-gray-800 pb-4">
        Overview
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((s, i) => (
          <div key={i} className="bg-[#111] border-2 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-2">
            <span className="text-5xl font-serif text-[#FFD300] font-bold">{s.value}</span>
            <span className="text-gray-400 text-sm tracking-widest">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Users Panel ─────────────────────────────────────────────────────────────
function UsersPanel() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUsers = () => {
    adminApi.get(`/users?page=${page}&search=${search}`)
      .then(res => {
        setUsers(res.data.users);
        setTotalPages(res.data.totalPages);
      }).catch(console.error);
  };

  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  const handleBanToggle = async (user) => {
    try {
      if (user.is_banned) {
        await adminApi.post(`/users/${user.user_id}/unban`);
      } else {
        const reason = prompt("Enter reason for ban:");
        if (reason === null) return;
        await adminApi.post(`/users/${user.user_id}/ban`, { reason });
      }
      fetchUsers();
    } catch (err) {
      alert("Action failed");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center border-b border-gray-800 pb-4">
        <h1 className="text-3xl font-serif font-bold text-white uppercase tracking-widest">Users</h1>
        <div className="relative w-64">
          <input 
            type="text" 
            placeholder="Search users..." 
            value={search}
            onChange={(e) => {setSearch(e.target.value); setPage(1);}}
            className="w-full bg-[#111] border border-gray-700 p-2 pl-10 text-white focus:outline-none focus:border-[#FFD300]"
          />
          <SearchIcon size={16} className="absolute left-3 top-3 text-gray-500" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-800 text-gray-400 text-sm tracking-wider">
              <th className="p-3 font-normal">USERNAME</th>
              <th className="p-3 font-normal">EMAIL</th>
              <th className="p-3 font-normal">JOIN DATE</th>
              <th className="p-3 font-normal">PLAN</th>
              <th className="p-3 font-normal">STATUS</th>
              <th className="p-3 font-normal">REVIEWS</th>
              <th className="p-3 font-normal text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.user_id} className="border-b border-gray-800 hover:bg-[#111] transition-colors text-sm">
                <td className="p-3 font-bold">{u.username}</td>
                <td className="p-3 text-gray-400">{u.email}</td>
                <td className="p-3 text-gray-400">{new Date(u.join_date).toLocaleDateString()}</td>
                <td className="p-3"><span className="bg-gray-800 px-2 py-1 text-xs">{u.plan_name || 'Free'}</span></td>
                <td className="p-3">
                  {u.is_banned ? (
                    <span className="text-red-500 border border-red-500 px-2 py-0.5 text-xs font-bold">BANNED</span>
                  ) : (
                    <span className="text-green-500 border border-green-500 px-2 py-0.5 text-xs font-bold">ACTIVE</span>
                  )}
                </td>
                <td className="p-3">{u.review_count}</td>
                <td className="p-3 flex justify-end gap-2">
                  <button 
                    onClick={() => handleBanToggle(u)}
                    className={`px-3 py-1 text-xs font-bold border ${u.is_banned ? 'border-green-500 text-green-500 hover:bg-green-500/10' : 'border-red-500 text-red-500 hover:bg-red-500/10'}`}
                  >
                    {u.is_banned ? 'UNBAN' : 'BAN'}
                  </button>
                  <a href={`/profile?user=${u.username}`} target="_blank" rel="noreferrer" className="px-3 py-1 text-xs font-bold border border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 flex items-center gap-1">
                    <Eye size={12} /> VIEW
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="flex gap-2 justify-center mt-4">
        <button disabled={page === 1} onClick={() => setPage(p => p-1)} className="px-4 py-2 border border-gray-700 disabled:opacity-50 hover:bg-gray-800">&lt;</button>
        <span className="px-4 py-2 text-gray-400">Page {page} of {totalPages || 1}</span>
        <button disabled={page >= totalPages} onClick={() => setPage(p => p+1)} className="px-4 py-2 border border-gray-700 disabled:opacity-50 hover:bg-gray-800">&gt;</button>
      </div>
    </div>
  );
}

// ── Movies Panel ────────────────────────────────────────────────────────────
function MoviesPanel() {
  const [movies, setMovies] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editingMovie, setEditingMovie] = useState(null);

  const fetchMovies = () => {
    adminApi.get(`/movies?page=${page}&search=${search}`)
      .then(res => setMovies(res.data)).catch(console.error);
  };

  useEffect(() => {
    fetchMovies();
  }, [page, search]);

  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure you want to delete or hide this movie?")) return;
    try {
      await adminApi.delete(`/movies/${id}`);
      fetchMovies();
    } catch(err) {
      alert("Delete failed");
    }
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await adminApi.put(`/movies/${editingMovie.Movie_ID}`, {
        title: editingMovie.Title,
        mType: editingMovie.M_Type,
        releaseDate: editingMovie.Release_date,
        runtime: editingMovie.Runtime,
        synopsis: editingMovie.Synopsis,
        mLanguage: editingMovie.M_Language,
        posterUrl: editingMovie.Poster_URL,
        trailerUrl: editingMovie.Trailer_URL
      });
      setEditingMovie(null);
      fetchMovies();
    } catch(err) {
      alert("Update failed");
    }
  };

  return (
    <div className="flex flex-col gap-6 relative">
      {editingMovie && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border-2 border-gray-800 p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold font-serif text-[#FFD300]">EDIT MOVIE</h2>
              <button onClick={() => setEditingMovie(null)} className="text-gray-400 hover:text-white"><X size={24} /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="flex flex-col gap-4 text-sm">
              <div className="flex flex-col gap-1">
                <label className="text-gray-400">Title</label>
                <input required type="text" value={editingMovie.Title || ''} onChange={e => setEditingMovie({...editingMovie, Title: e.target.value})} className="bg-black border border-gray-700 p-2 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-gray-400">Type</label>
                  <input type="text" value={editingMovie.M_Type || ''} onChange={e => setEditingMovie({...editingMovie, M_Type: e.target.value})} className="bg-black border border-gray-700 p-2 text-white" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-gray-400">Release Date</label>
                  <input type="date" value={editingMovie.Release_date ? new Date(editingMovie.Release_date).toISOString().split('T')[0] : ''} onChange={e => setEditingMovie({...editingMovie, Release_date: e.target.value})} className="bg-black border border-gray-700 p-2 text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-gray-400">Runtime (mins)</label>
                  <input type="number" value={editingMovie.Runtime || ''} onChange={e => setEditingMovie({...editingMovie, Runtime: e.target.value})} className="bg-black border border-gray-700 p-2 text-white" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-gray-400">Language</label>
                  <input type="text" value={editingMovie.M_Language || ''} onChange={e => setEditingMovie({...editingMovie, M_Language: e.target.value})} className="bg-black border border-gray-700 p-2 text-white" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-gray-400">Synopsis</label>
                <textarea rows={4} value={editingMovie.Synopsis || ''} onChange={e => setEditingMovie({...editingMovie, Synopsis: e.target.value})} className="bg-black border border-gray-700 p-2 text-white resize-none" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-gray-400">Poster URL</label>
                <input type="text" value={editingMovie.Poster_URL || ''} onChange={e => setEditingMovie({...editingMovie, Poster_URL: e.target.value})} className="bg-black border border-gray-700 p-2 text-white" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-gray-400">Trailer URL</label>
                <input type="text" value={editingMovie.Trailer_URL || ''} onChange={e => setEditingMovie({...editingMovie, Trailer_URL: e.target.value})} className="bg-black border border-gray-700 p-2 text-white" />
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setEditingMovie(null)} className="px-4 py-2 border border-gray-700 text-gray-400 hover:bg-gray-800">CANCEL</button>
                <button type="submit" className="px-4 py-2 bg-[#FFD300] text-black font-bold border-2 border-black hover:bg-yellow-400">SAVE CHANGES</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center border-b border-gray-800 pb-4">
        <h1 className="text-3xl font-serif font-bold text-white uppercase tracking-widest">Movies</h1>
        <div className="flex gap-4">
          <div className="relative w-64">
            <input 
              type="text" 
              placeholder="Search movies..." 
              value={search}
              onChange={(e) => {setSearch(e.target.value); setPage(1);}}
              className="w-full bg-[#111] border border-gray-700 p-2 pl-10 text-white focus:outline-none focus:border-[#FFD300]"
            />
            <SearchIcon size={16} className="absolute left-3 top-3 text-gray-500" />
          </div>
          <button className="bg-[#FFD300] text-black px-4 font-bold border-2 border-black hover:bg-yellow-400 flex items-center gap-2">
            + ADD MOVIE
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-800 text-gray-400 text-sm tracking-wider">
              <th className="p-3 font-normal w-12">POSTER</th>
              <th className="p-3 font-normal">TITLE</th>
              <th className="p-3 font-normal">YEAR</th>
              <th className="p-3 font-normal">RATING</th>
              <th className="p-3 font-normal text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {movies.map(m => (
              <tr key={m.Movie_ID} className="border-b border-gray-800 hover:bg-[#111] transition-colors text-sm">
                <td className="p-3">
                  {m.Poster_URL ? <img src={m.Poster_URL} alt="" className="w-10 h-14 object-cover" /> : <div className="w-10 h-14 bg-gray-800"></div>}
                </td>
                <td className="p-3 font-bold text-base">{m.Title}</td>
                <td className="p-3 text-gray-400">{m.Release_date ? new Date(m.Release_date).getFullYear() : 'N/A'}</td>
                <td className="p-3 text-[#FFD300] font-bold">{parseFloat(m.A_Rating || 0).toFixed(1)}</td>
                <td className="p-3 flex justify-end gap-2 items-center h-14">
                  <button onClick={() => setEditingMovie(m)} className="px-3 py-1 text-xs font-bold border border-gray-600 text-gray-400 hover:text-white">EDIT</button>
                  <button onClick={() => handleDelete(m.Movie_ID)} className="px-3 py-1 text-xs font-bold border border-red-500 text-red-500 hover:bg-red-500/10">DELETE</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2 justify-center mt-4">
        <button disabled={page === 1} onClick={() => setPage(p => p-1)} className="px-4 py-2 border border-gray-700 disabled:opacity-50 hover:bg-gray-800">&lt;</button>
        <span className="px-4 py-2 text-gray-400">Page {page}</span>
        <button onClick={() => setPage(p => p+1)} className="px-4 py-2 border border-gray-700 hover:bg-gray-800">&gt;</button>
      </div>
    </div>
  );
}

// ── Articles Panel ──────────────────────────────────────────────────────────
function ArticlesPanel() {
  const [tab, setTab] = useState('PENDING');
  const [articles, setArticles] = useState([]);

  const fetchPending = () => {
    adminApi.get('/articles/pending').then(res => setArticles(res.data)).catch(console.error);
  };

  useEffect(() => {
    if (tab === 'PENDING') fetchPending();
  }, [tab]);

  const handleApprove = async (id) => {
    try {
      await adminApi.post(`/articles/${id}/approve`);
      fetchPending();
    } catch (err) {
      alert('Failed to approve');
    }
  };

  const handleReject = async (id) => {
    const note = prompt("Enter rejection reason:");
    if (!note) return;
    try {
      await adminApi.post(`/articles/${id}/reject`, { rejection_note: note });
      fetchPending();
    } catch (err) {
      alert('Failed to reject');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-end border-b border-gray-800 pb-4">
        <h1 className="text-3xl font-serif font-bold text-white uppercase tracking-widest">Articles</h1>
        <div className="flex gap-4">
          <button onClick={() => setTab('PENDING')} className={`pb-4 border-b-2 font-bold px-2 ${tab === 'PENDING' ? 'border-[#FFD300] text-[#FFD300]' : 'border-transparent text-gray-500'}`}>PENDING</button>
          <button onClick={() => setTab('ALL')} className={`pb-4 border-b-2 font-bold px-2 ${tab === 'ALL' ? 'border-[#FFD300] text-[#FFD300]' : 'border-transparent text-gray-500'}`}>ALL ARTICLES</button>
        </div>
      </div>

      {tab === 'PENDING' ? (
        <div className="flex flex-col gap-6">
          {articles.length === 0 ? (
            <div className="text-gray-500 p-12 text-center border border-gray-800 border-dashed">No pending articles.</div>
          ) : articles.map(a => (
            <div key={a.Article_ID} className="bg-[#111] border-2 border-gray-800 p-6 flex flex-col md:flex-row gap-6 hover:border-gray-600 transition-colors">
              <div className="flex-1 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="bg-[#FFD300] text-black px-2 py-0.5 text-xs font-bold uppercase">{a.Category}</span>
                  <span className="text-gray-500 text-sm">{new Date(a.Created_At).toLocaleString()}</span>
                </div>
                <h2 className="text-2xl font-serif font-bold">{a.Title}</h2>
                <div className="text-sm text-gray-400">By <span className="text-[#FFD300] font-bold">@{a.Username}</span></div>
                <p className="text-gray-300 text-sm leading-relaxed mt-2">{a.Excerpt}...</p>
              </div>
              <div className="flex flex-col gap-3 justify-center min-w-[140px]">
                <button 
                  onClick={() => handleApprove(a.Article_ID)}
                  className="bg-[#FFD300] text-black font-bold py-3 flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform"
                >
                  <Check size={18} /> APPROVE
                </button>
                <button 
                  onClick={() => handleReject(a.Article_ID)}
                  className="bg-red-600 text-white font-bold py-3 flex items-center justify-center gap-2 hover:bg-red-700 transition-colors"
                >
                  <X size={18} /> REJECT
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-gray-500 p-12 text-center border border-gray-800 border-dashed">All Articles view coming soon...</div>
      )}
    </div>
  );
}

// ── Reviews Panel ───────────────────────────────────────────────────────────
function ReviewsPanel() {
  const [reviews, setReviews] = useState([]);
  
  const fetchReviews = () => {
    adminApi.get('/activity').then(res => {
      // Activity endpoint currently returns generic activity. 
      // For a real app, we'd have a specific /reviews endpoint or filter here.
      // Let's filter for reviews if they exist in the payload
      setReviews(res.data.filter(a => a.ActivityType === 'REVIEW'));
    }).catch(console.error);
  };

  useEffect(() => { fetchReviews(); }, []);

  const handleDelete = async (id) => {
    if(!window.confirm('Delete this review permanently?')) return;
    try {
      await adminApi.delete(`/reviews/${id}`);
      fetchReviews();
    } catch(err) {
      alert("Failed to delete review");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-gray-800 pb-4">
        <h1 className="text-3xl font-serif font-bold text-white uppercase tracking-widest">Recent Reviews</h1>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-800 text-gray-400 text-sm tracking-wider">
              <th className="p-3 font-normal">USER ID</th>
              <th className="p-3 font-normal">DATE</th>
              <th className="p-3 font-normal text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {reviews.slice(0, 50).map((r, i) => (
              <tr key={i} className="border-b border-gray-800 hover:bg-[#111] transition-colors text-sm">
                <td className="p-3 font-bold">{r.User_ID}</td>
                <td className="p-3 text-gray-400">{new Date(r.Time_stamp).toLocaleString()}</td>
                <td className="p-3 text-right">
                  {r.Activity_ID && (
                    <button onClick={() => handleDelete(r.Activity_ID)} className="text-red-500 hover:underline">DELETE</button>
                  )}
                </td>
              </tr>
            ))}
            {reviews.length === 0 && (
              <tr><td colSpan="3" className="p-8 text-center text-gray-500">No recent reviews found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
