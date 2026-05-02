import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    const data = await res.json();
    if (res.ok) {
      alert('Registration successful! Please login.');
      navigate('/login');
    } else {
      alert(data.message);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20">
      <div className="neo-card p-12">
        <h1 className="text-5xl font-serif font-black mb-8 border-b-4 border-ink pb-4 bg-primary px-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-4 inline-block">JOIN</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 mt-8">
          <div className="flex flex-col gap-2">
            <label className="font-mono font-black text-xl">USERNAME</label>
            <input 
              type="text" 
              className="neo-input text-lg" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required 
            />
          </div>
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
          <button type="submit" className="neo-btn py-4 text-2xl mt-8">REGISTER</button>
        </form>
      </div>
    </div>
  );
}
