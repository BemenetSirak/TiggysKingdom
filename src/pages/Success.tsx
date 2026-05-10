import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Success() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const plan = searchParams.get('plan');
  const isSubscription = Boolean(plan);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.25rem', background: 'var(--cream)' }}>
      <div
        style={{
          maxWidth: 520, width: '100%', textAlign: 'center',
          opacity: show ? 1 : 0, transform: show ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
        }}
      >
        {/* Checkmark */}
        <div style={{
          width: 96, height: 96, borderRadius: '50%', background: '#DCFCE7',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem', fontSize: '3rem',
          boxShadow: '0 0 0 8px #BBF7D0',
        }}>
          ✓
        </div>

        <h1 style={{ color: 'var(--maroon)', fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', margin: '0 0 0.5rem' }}>
          {isSubscription ? 'Welcome to the Kingdom!' : 'Order Confirmed!'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '1.05rem', margin: '0 0 0.5rem' }}>
          {user ? `Thank you, ${user.name.split(' ')[0]}!` : 'Thank you!'}
        </p>
        <p style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem', margin: '0 0 1rem', lineHeight: 1.6 }}>
          {isSubscription
            ? 'Your subscription is active. Enjoy unlimited access to all Kingdom content!'
            : 'A confirmation email is on its way. Your books will be lovingly packed and shipped within 2–3 business days.'}
        </p>
        {sessionId && !isSubscription && (
          <p style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.78rem', margin: '0 0 1.5rem', fontFamily: 'monospace' }}>
            Ref: {sessionId.slice(-12).toUpperCase()}
          </p>
        )}

        <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, #FEF3C7, white)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🐑</div>
          <p style={{ fontFamily: 'Playfair Display, serif', fontStyle: 'italic', color: 'var(--maroon)', fontWeight: 700, margin: 0, fontSize: '1rem' }}>
            "May these stories bring your family closer to God."
          </p>
          <p style={{ color: 'var(--gold-dark)', fontWeight: 700, fontSize: '0.8rem', margin: '0.5rem 0 0' }}>
            — Tiggy's Kingdom Team
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {user && !user.isGuest && (
            <Link to="/orders" className="btn-maroon" style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}>
              Track My Order
            </Link>
          )}
          <Link to="/shop" className="btn-outline-maroon" style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}>
            Continue Shopping
          </Link>
          <Link to="/" style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
