import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function Subscription() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/subscriptions')
      .then(res => res.json())
      .then(data => setPlans(data));
  }, []);

  const handleSubscribe = async (planId) => {
    if (!user) {
       navigate('/login');
       return;
    }
    const res = await fetch('http://localhost:5000/api/subscriptions/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ planId })
    });
    if (res.ok) {
      alert('Subscription successful!');
      navigate('/profile');
    } else {
      const data = await res.json();
      alert(data.message);
    }
  };

  return (
    <div>
      <div className="text-center mb-16 bg-primary p-12 border-4 border-ink shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
        <h1 className="text-6xl md:text-8xl font-serif font-black uppercase" style={{ WebkitTextStroke: '2px black' }}>CINE PREMIUM</h1>
        <p className="font-mono text-2xl font-bold mt-4">Unleash the full potential of your cinephile experience.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
        {plans.map(plan => (
          <div key={plan.Subscription_ID} className="neo-card flex flex-col bg-surface hover:-translate-y-4 transition-transform duration-300">
            <h2 className="text-4xl font-serif font-black mb-2 text-center border-b-4 border-ink pb-4">{plan.Plan_Name}</h2>
            <div className="text-5xl font-mono font-black text-center my-6">${Number(plan.Price).toFixed(2)}</div>
            <div className="font-mono font-bold text-center mb-8 bg-surface-container py-2 border-y-4 border-ink">
               {plan.Duration_Days} Days Access
            </div>
            
            <ul className="flex flex-col gap-4 font-mono text-lg mb-8 flex-1">
              <li className="flex items-center gap-2">
                 <span className="text-2xl">✓</span> Pin Reviews: {plan.Can_Pin_Reviews ? 'Yes' : 'No'}
              </li>
              <li className="flex items-center gap-2">
                 <span className="text-2xl">✓</span> Profile Flair: {plan.Has_Profile_Flair ? 'Yes' : 'No'}
              </li>
              <li className="flex items-center gap-2">
                 <span className="text-2xl">✓</span> Watch Parties: {plan.Can_Join_Parties ? 'Yes' : 'No'}
              </li>
            </ul>
            
            <button onClick={() => handleSubscribe(plan.Subscription_ID)} className="neo-btn py-4 text-2xl w-full mt-auto">
               CHOOSE PLAN
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
