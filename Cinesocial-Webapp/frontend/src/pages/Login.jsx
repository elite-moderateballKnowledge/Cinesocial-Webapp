import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest, getErrorMessage } from '../lib/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      login(data.user, data.token);
      navigate('/');
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20">
      <div className="neo-card p-12">
        <h1 className="text-5xl font-serif font-black mb-8 border-b-4 border-ink pb-4">LOGIN</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="font-mono font-black text-xl">EMAIL</label>
            <input 
              type="email" 
              className="neo-input text-lg" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-mono font-black text-xl">PASSWORD</label>
            <input 
              type="password" 
              className="neo-input text-lg" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" className="neo-btn py-4 text-2xl mt-8" disabled={submitting}>
            {submitting ? 'ENTERING' : 'ENTER'}
          </button>
        </form>
        <div className="mt-8 pt-6 border-t-4 border-ink font-mono font-bold text-lg">
          <span>NO ACCOUNT?</span>{' '}
          <Link to="/register" className="underline decoration-4 underline-offset-4">
            JOIN CINE SOCIAL
          </Link>
        </div>
      </div>
    </div>
  );
}
