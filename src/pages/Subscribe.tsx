import { useState, type FormEvent } from 'react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:4242';

const PLAN_PRICES: Record<string, number> = { kingdom: 4.89, royal: 9.89 };

interface PlanFeature {
  label: string;
  value: string | boolean;
}

interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  desc: string;
  emoji: string;
  cta: string;
  ctaStyle: string;
  highlight?: boolean;
  features: PlanFeature[];
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    desc: 'Get started with Tiggy',
    emoji: '🐑',
    cta: 'Get Started',
    ctaStyle: 'outline',
    features: [
      { label: 'Episodes', value: '3 free' },
      { label: 'Activities', value: 'Limited' },
      { label: 'Downloads', value: 'None' },
      { label: 'Shop Discount', value: 'None' },
      { label: 'Child Profiles', value: '1' },
      { label: 'Newsletter', value: true },
    ],
  },
  {
    id: 'kingdom',
    name: 'Kingdom Family',
    price: '$4.89',
    period: '/month',
    desc: 'Perfect for growing families',
    emoji: '👑',
    cta: 'Start Free Trial',
    ctaStyle: 'gold',
    highlight: true,
    features: [
      { label: 'Episodes', value: true },
      { label: 'Activities', value: true },
      { label: 'Downloads', value: '10/month' },
      { label: 'Shop Discount', value: '10%' },
      { label: 'Child Profiles', value: '3' },
      { label: 'Newsletter', value: true },
    ],
  },
  {
    id: 'royal',
    name: 'Royal Family',
    price: '$9.89',
    period: '/month',
    desc: 'Unlimited access for the whole family',
    emoji: '✨',
    cta: 'Start Free Trial',
    ctaStyle: 'maroon',
    features: [
      { label: 'Episodes', value: true },
      { label: 'Activities', value: 'Unlimited' },
      { label: 'Downloads', value: 'Unlimited' },
      { label: 'Shop Discount', value: '15%' },
      { label: 'Child Profiles', value: '5' },
      { label: 'Live Events', value: true },
    ],
  },
  {
    id: 'monastery',
    name: 'Monastery Plan',
    price: '$29.98',
    period: '/month',
    desc: 'For parishes, schools & ministries',
    emoji: '⛪',
    cta: 'Contact Us',
    ctaStyle: 'purple',
    features: [
      { label: 'Episodes', value: true },
      { label: 'Activities', value: 'Unlimited' },
      { label: 'Downloads', value: 'Unlimited' },
      { label: 'Shop Discount', value: '20%' },
      { label: 'Child Profiles', value: 'Unlimited' },
      { label: 'VIP Access', value: true },
    ],
  },
];

function FeatureCheck({ value }: { value: string | boolean }) {
  if (value === true) return <span style={{ color: 'var(--green, #22C55E)', fontWeight: 800 }}>✓</span>;
  if (value === false || value === 'None') return <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>—</span>;
  return <span style={{ fontWeight: 700, color: 'var(--maroon)' }}>{value}</span>;
}

export default function Subscribe() {
  const [email, setEmail] = useState('');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const { addToast } = useToast();
  const { user } = useAuth();

  const handleNewsletter = async (e: FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;

    try {
      await fetch(
        'https://script.google.com/macros/s/AKfycbw6-JssONppM2E4Fj5GEHSmi3R1crvnkQFQAG5a7xzJ_YCcclBmurF8vjap5ezaVUHVhQ/exec',
        {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: newsletterEmail }),
        }
      );
      addToast("You've joined Tiggy's Flock! Check your inbox for the free coloring book.", 'success');
      setNewsletterEmail('');
    } catch {
      addToast('Something went wrong. Please try again.', 'error');
    }
  };

  const handlePlanCTA = async (plan: Plan) => {
    if (plan.id === 'free') {
      addToast('Welcome! Your free account is ready.', 'success');
      return;
    }
    if (plan.id === 'monastery') {
      addToast("We'll be in touch! Email us at hello@tiggyskingdom.com", 'info');
      return;
    }
    // Paid plans → Stripe subscription checkout
    setCheckoutLoading(plan.id);
    try {
      const res = await fetch(`${API}/create-subscription-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          planName: plan.name,
          priceMonthly: PLAN_PRICES[plan.id],
          userId: user?.id || null,
          customerEmail: user?.email || null,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        addToast('Could not start checkout. Please try again.', 'error');
      }
    } catch {
      addToast('Server offline. Please make sure the backend is running.', 'warning');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const ctaClass: Record<string, string> = { gold: 'btn-gold', maroon: 'btn-maroon', purple: 'btn-purple', outline: 'btn-outline-maroon' };

  return (
    <div>
      {/* Newsletter Hero */}
      <section style={{ background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 50%, #FEF3C7 100%)', padding: '4rem 1.25rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2.5rem', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '5rem', marginBottom: '0.5rem' }}>🐑</div>
            <div style={{ fontSize: '2.5rem' }}>✉️</div>
            <p style={{ color: 'var(--maroon)', fontWeight: 800, margin: '0.5rem 0 0', fontSize: '1.05rem' }}>
              Weekly blessings delivered!
            </p>
          </div>
          <div>
            <h1 style={{ color: 'var(--purple)', margin: '0 0 0.5rem', fontSize: 'clamp(1.75rem, 4vw, 2.25rem)' }}>
              Join Tiggy's Flock
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontWeight: 600, lineHeight: 1.7, margin: '0 0 1.5rem' }}>
              Receive weekly blessings, saint stories &amp; free activities delivered straight to your inbox.
            </p>
            <form onSubmit={handleNewsletter} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input
                type="email"
                value={newsletterEmail}
                onChange={e => setNewsletterEmail(e.target.value)}
                placeholder="your@email.com"
                className="tk-input"
                style={{ flex: 1, minWidth: 200 }}
                required
              />
              <button type="submit" className="btn-purple">Subscribe</button>
            </form>
            <p style={{ margin: '0.75rem 0 0', color: 'var(--gold-dark)', fontWeight: 700, fontSize: '0.85rem' }}>
              🎁 Get a free coloring book instantly when you subscribe!
            </p>
            <p style={{ margin: '0.35rem 0 0', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600 }}>
              We respect your privacy. Unsubscribe anytime. No spam, ever.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section style={{ background: 'var(--cream)', padding: '4rem 1.25rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--gold-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>🐑</div>
              <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, color: 'var(--maroon)', fontSize: '1.1rem' }}>
                Tiggy's KINGDOM
              </span>
            </div>
            <h2 style={{ color: 'var(--maroon)', margin: '0 0 0.5rem', fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)' }}>
              Choose Your Family's Plan
            </h2>
            <p style={{ color: 'var(--text-muted)', fontWeight: 600, margin: 0 }}>All plans include a 7-day free trial</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', alignItems: 'start' }}>
            {PLANS.map(plan => (
              <div
                key={plan.id}
                className="card"
                style={{
                  padding: '1.75rem 1.5rem',
                  position: 'relative',
                  border: plan.highlight ? '2px solid var(--gold)' : '2px solid transparent',
                  marginTop: plan.highlight ? 0 : '0.75rem',
                }}
              >
                {plan.highlight && (
                  <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: 'var(--gold)', color: 'white', borderRadius: '9999px', padding: '0.25rem 1rem', fontSize: '0.75rem', fontWeight: 900, whiteSpace: 'nowrap' }}>
                    MOST POPULAR
                  </div>
                )}
                <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{plan.emoji}</div>
                  <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900, color: 'var(--maroon)', margin: '0 0 0.25rem', fontSize: '1.05rem' }}>{plan.name}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, margin: '0 0 0.75rem' }}>{plan.desc}</p>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '0.15rem' }}>
                    <span style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: '2rem', color: 'var(--maroon)' }}>{plan.price}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>{plan.period}</span>
                  </div>
                </div>

                <button
                  onClick={() => handlePlanCTA(plan)}
                  disabled={checkoutLoading === plan.id}
                  className={ctaClass[plan.ctaStyle]}
                  style={{ width: '100%', justifyContent: 'center', marginBottom: '1.25rem', fontSize: '0.9rem', padding: '0.6rem', opacity: checkoutLoading === plan.id ? 0.7 : 1 }}
                >
                  {checkoutLoading === plan.id ? 'Loading…' : plan.cta}
                </button>

                <div style={{ borderTop: '1px solid var(--cream-border)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {plan.features.map(f => (
                    <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' }}>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{f.label}</span>
                      <FeatureCheck value={f.value} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section style={{ background: 'var(--cream-dark)', padding: '2.5rem 1.25rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'center' }}>
          {[
            ['✓', 'Theologically Reviewed'],
            ['🔒', 'Ad-Free Always'],
            ['✝', 'Orthodox Values'],
            ['↩', '30-Day Money Back'],
            ['🔒', 'Secure Checkout'],
          ].map(([icon, label]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--maroon)', fontWeight: 700, fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--gold)' }}>{icon}</span> {label}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
