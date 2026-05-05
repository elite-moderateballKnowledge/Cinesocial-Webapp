import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { apiRequest, authHeaders, getErrorMessage } from '../lib/api';

const formatPrice = (price) => {
  const numericPrice = Number(price);
  return Number.isFinite(numericPrice) ? numericPrice.toFixed(2) : '0.00';
};

export default function Subscription() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [currentPlanId, setCurrentPlanId] = useState(null);
  const [error, setError] = useState('');
  const [submittingPlan, setSubmittingPlan] = useState(null);

  useEffect(() => {
    let ignore = false;

    const loadData = async () => {
      try {
        const [plansData, profileData] = await Promise.all([
          apiRequest('/subscriptions'),
          user ? apiRequest('/users/me', { headers: authHeaders() }).catch(() => null) : Promise.resolve(null)
        ]);
        if (!ignore) {
          setPlans(Array.isArray(plansData) ? plansData : []);
          if (profileData) {
            setCurrentPlanId(profileData.sub_ID || 1); // Defaults to 1 (Basic/Free) if null
          }
          setError('');
        }
      } catch (err) {
        if (!ignore) {
          setPlans([]);
          setError(getErrorMessage(err));
        }
      }
    };

    loadData();
    return () => {
      ignore = true;
    };
  }, [user]);

  const handleSubscribe = async (planId) => {
    if (!user) {
       navigate('/login');
       return;
    }
    setSubmittingPlan(planId);
    try {
      await apiRequest('/subscriptions/subscribe', {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ planId })
      });
      alert('Subscription successful!');
      navigate('/profile');
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setSubmittingPlan(null);
    }
  };

  return (
    <div>
      <div className="text-center mb-16 bg-primary p-12 border-4 border-ink shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
        <h1 className="text-6xl md:text-8xl font-serif font-black uppercase" style={{ WebkitTextStroke: '2px black' }}>CINE PREMIUM</h1>
        <p className="font-mono text-2xl font-bold mt-4">Unleash the full potential of your cinephile experience.</p>
      </div>

      {error && (
        <div className="font-mono font-black text-xl p-8 mb-8 bg-surface-container border-4 border-ink">
          COULD NOT LOAD PLANS: {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
        {plans.map(plan => (
          <div key={plan.Subscription_ID} className="neo-card flex flex-col bg-surface hover:-translate-y-4 transition-transform duration-300">
            <h2 className="text-4xl font-serif font-black mb-2 text-center border-b-4 border-ink pb-4">{plan.Plan_Name}</h2>
            <div className="text-5xl font-mono font-black text-center my-6">${formatPrice(plan.Price)}</div>
            <div className="font-mono font-bold text-center mb-8 bg-surface-container py-2 border-y-4 border-ink">
               {plan.Duration_Days} Days Access
            </div>

            <ul className="flex flex-col gap-4 font-mono text-lg mb-8 flex-1">
              <li className="flex items-center gap-2">
                 <span className="font-black">OK</span> Pin Reviews: {plan.Can_Pin_Reviews ? 'Yes' : 'No'}
              </li>
              <li className="flex items-center gap-2">
                 <span className="font-black">OK</span> Profile Flair: {plan.Has_Profile_Flair ? 'Yes' : 'No'}
              </li>
              <li className="flex items-center gap-2">
                 <span className="font-black">OK</span> Watch Parties: {plan.Can_Join_Parties ? 'Yes' : 'No'}
              </li>
            </ul>

            <button
              type="button"
              onClick={() => handleSubscribe(plan.Subscription_ID)}
              className={`neo-btn py-4 text-2xl w-full mt-auto ${currentPlanId === plan.Subscription_ID ? 'bg-surface-container opacity-50 cursor-not-allowed' : ''}`}
              disabled={submittingPlan === plan.Subscription_ID || currentPlanId === plan.Subscription_ID}
            >
               {submittingPlan === plan.Subscription_ID ? 'WORKING' : currentPlanId === plan.Subscription_ID ? 'CURRENT PLAN' : 'CHOOSE PLAN'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
