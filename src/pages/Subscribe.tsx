import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { API } from '../lib/api';

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
    desc: 'Start your journey with Tiggy',
    emoji: '🐑',
    cta: 'Get Started Free',
    ctaStyle: 'outline',
    features: [
      { label: 'Episodes', value: '3 free' },
      { label: 'Activities', value: 'Limited' },
      { label: 'Downloads', value: false },
      { label: 'Shop Discount', value: false },
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
  if (value === true) return <span style={{ color: '#22C55E', fontWeight: 900, fontSize: '1rem' }}>✓</span>;
  if (value === false) return <span style={{ color: 'var(--cream-border)', fontWeight: 700, fontSize: '1.1rem' }}>—</span>;
  return <span style={{ fontWeight: 800, color: 'var(--maroon)', fontSize: '0.875rem' }}>{value}</span>;
}

export default function Subscribe() {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const { addToast } = useToast();
  const { user } = useAuth();

  const handleNewsletter = async (e: FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterLoading(true);
    try {
      await fetch(`${API}/api/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail, name: '', source: 'subscribe-page' }),
      });
      addToast("You've joined Tiggy's Flock! Check your inbox.", 'success');
      setNewsletterEmail('');
    } catch {
      addToast('Something went wrong. Please try again.', 'error');
    } finally {
      setNewsletterLoading(false);
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
    <div style={{ minHeight: '70vh', background: 'var(--cream)' }}>

      {/* ── Page header — matches other pages ── */}
      <div style={{ background: 'linear-gradient(135deg, var(--cream-dark) 0%, var(--gold-pale) 100%)', padding: '3rem 1.25rem', textAlign: 'center', borderBottom: '2px solid var(--cream-border)' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
          <img src="/tiggy.png" alt="Tiggy" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--maroon)', flexShrink: 0 }} />
          <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.15rem', color: 'var(--maroon)', lineHeight: 1.1, textAlign: 'left' }}>
            Tiggy's<br /><span style={{ fontSize: '0.78rem', fontWeight: 400, color: 'var(--gold)', letterSpacing: '0.08em' }}>KINGDOM</span>
          </span>
        </div>
        <h1 style={{ color: 'var(--maroon)', margin: '0 0 0.75rem', fontSize: 'clamp(1.75rem, 4vw, 2.75rem)' }}>
          Join the Flock
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontWeight: 600, margin: '0 auto', maxWidth: 520, lineHeight: 1.7 }}>
          Explore all episodes, download activities, and grow in faith — together as a family.
        </p>
      </div>

      {/* ── Newsletter strip ── */}
      <section style={{ background: 'var(--gold-pale)', borderBottom: '2px solid var(--cream-border)', padding: '2.5rem 1.25rem' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3.5rem', lineHeight: 1 }}>✉️</div>
              <p style={{ color: 'var(--maroon)', fontWeight: 800, margin: '0.5rem 0 0', fontSize: '1rem', fontFamily: 'Playfair Display, serif' }}>
                Weekly Blessings
              </p>
              <p style={{ color: 'var(--gold-dark)', fontWeight: 700, margin: '0.25rem 0 0', fontSize: '0.85rem' }}>
                🎁 Free coloring book when you join!
              </p>
            </div>
            <div>
              <h2 style={{ color: 'var(--maroon)', margin: '0 0 0.5rem', fontSize: '1.35rem' }}>
                Free Newsletter
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontWeight: 600, margin: '0 0 1rem', lineHeight: 1.6, fontSize: '0.9rem' }}>
                Saint stories, activities &amp; blessings delivered straight to your inbox every week.
              </p>
              <form onSubmit={handleNewsletter} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={e => setNewsletterEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="tk-input"
                  style={{ flex: 1, minWidth: 200, padding: '0.65rem 1rem', fontSize: '0.9rem' }}
                  required
                />
                <button type="submit" className="btn-maroon" disabled={newsletterLoading} style={{ padding: '0.65rem 1.5rem', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                  {newsletterLoading ? 'Joining…' : 'Join Free'}
                </button>
              </form>
              <p style={{ margin: '0.5rem 0 0', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600 }}>
                No spam, ever. Unsubscribe anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing plans ── */}
      <section style={{ background: 'var(--cream)', padding: '3.5rem 1.25rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>

          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', background: 'var(--gold-pale)', padding: '0.35rem 1rem', borderRadius: '9999px' }}>
              <img src="/tiggy.png" alt="Tiggy" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
              <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, color: 'var(--maroon)', fontSize: '0.9rem' }}>
                Tiggy's <span style={{ color: 'var(--gold)', letterSpacing: '0.05em' }}>KINGDOM</span>
              </span>
            </div>
            <h2 style={{ color: 'var(--maroon)', margin: '0 0 0.5rem', fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)' }}>
              Choose Your Family's Plan
            </h2>
            <p style={{ color: 'var(--text-muted)', fontWeight: 600, margin: 0, fontSize: '0.95rem' }}>
              All paid plans include a 7-day free trial · Cancel anytime
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(235px, 1fr))', gap: '1.25rem', alignItems: 'start' }}>
            {PLANS.map(plan => (
              <div
                key={plan.id}
                style={{
                  background: 'white',
                  borderRadius: '1.5rem',
                  padding: '2rem 1.5rem',
                  position: 'relative',
                  border: plan.highlight ? '2px solid var(--gold)' : '1.5px solid var(--cream-border)',
                  marginTop: plan.highlight ? 0 : '0.75rem',
                  boxShadow: plan.highlight
                    ? '0 12px 40px rgba(201,146,42,0.18)'
                    : '0 2px 12px rgba(107,32,32,0.07)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; }}
              >
                {plan.highlight && (
                  <div style={{
                    position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                    background: 'linear-gradient(90deg, var(--gold-dark), var(--gold))',
                    color: 'white', borderRadius: '9999px', padding: '0.3rem 1.125rem',
                    fontSize: '0.72rem', fontWeight: 900, whiteSpace: 'nowrap', letterSpacing: '0.05em',
                  }}>
                    ✦ MOST POPULAR
                  </div>
                )}

                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <div style={{
                    width: 60, height: 60, borderRadius: '50%', margin: '0 auto 0.875rem',
                    background: plan.highlight ? 'var(--gold-pale)' : 'var(--cream)',
                    border: plan.highlight ? '2px solid var(--gold)' : '2px solid var(--cream-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem',
                  }}>
                    {plan.emoji}
                  </div>
                  <h3 style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, color: 'var(--maroon)', margin: '0 0 0.2rem', fontSize: '1.15rem' }}>
                    {plan.name}
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, margin: '0 0 1rem', lineHeight: 1.4 }}>
                    {plan.desc}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '0.1rem' }}>
                    <span style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: '2.5rem', color: 'var(--maroon)', lineHeight: 1 }}>
                      {plan.price}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
                      {plan.period}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handlePlanCTA(plan)}
                  disabled={checkoutLoading === plan.id}
                  className={ctaClass[plan.ctaStyle]}
                  style={{ width: '100%', justifyContent: 'center', marginBottom: '1.5rem', fontSize: '0.95rem', padding: '0.75rem', opacity: checkoutLoading === plan.id ? 0.7 : 1 }}
                >
                  {checkoutLoading === plan.id ? 'Loading…' : plan.cta}
                </button>

                <div style={{ borderTop: '1px solid var(--cream-border)', paddingTop: '1.125rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                  {plan.features.map(f => (
                    <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem' }}>{f.label}</span>
                      <FeatureCheck value={f.value} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust + sign-in footer ── */}
      <section style={{ background: 'var(--maroon)', padding: '3rem 1.25rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', justifyContent: 'center', marginBottom: '2rem' }}>
            {[
              ['✓', 'Theologically Reviewed'],
              ['🔒', 'Ad-Free Always'],
              ['✝', 'Orthodox Values'],
              ['↩', '30-Day Money Back'],
              ['🛡', 'Secure Checkout'],
            ].map(([icon, label]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.9)', fontWeight: 700, fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--gold)', fontSize: '1rem' }}>{icon}</span>
                {label}
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '1.5rem', display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontWeight: 600, margin: 0, fontSize: '0.9rem' }}>
              Already have an account?
            </p>
            <Link
              to="/login"
              style={{ color: 'var(--gold)', fontWeight: 800, fontSize: '0.95rem', border: '1.5px solid rgba(201,146,42,0.5)', borderRadius: '9999px', padding: '0.45rem 1.25rem' }}
            >
              Sign In →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
