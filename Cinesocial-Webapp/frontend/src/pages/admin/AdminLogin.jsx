import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // If already logged in, redirect to dashboard
  if (localStorage.getItem('adminToken')) {
    return <Navigate to="/admin/dashboard" />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/admin/login', { username, password });
      localStorage.setItem('adminToken', res.data.token);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center p-4 m-0 absolute top-0 left-0 z-50">
      <div className="bg-[#A89200] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 md:p-12 max-w-md w-full">
        <h1 className="text-4xl font-serif font-bold text-black text-center mb-8 uppercase tracking-widest">
          Admin Access
        </h1>
        {error && (
          <div className="bg-red-500 text-white font-mono p-3 mb-6 border-2 border-black font-bold">
            {error}
          </div>
        )}
        <form onSubmit={handleLogin} className="flex flex-col gap-6 font-mono">
          <div className="flex flex-col gap-2">
            <label className="font-bold text-black uppercase">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="p-3 border-4 border-black bg-white focus:outline-none focus:ring-0"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-bold text-black uppercase">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="p-3 border-4 border-black bg-white focus:outline-none focus:ring-0"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-black text-[#A89200] font-bold text-xl py-4 uppercase hover:bg-gray-900 transition-colors mt-4 border-2 border-black"
          >
            Log In
          </button>
        </form>
      </div>
    </div>
  );
}
