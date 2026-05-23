import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import EmptyState from '../components/EmptyState';

import { API } from '../lib/api';
import { STATUS_COLORS } from '../lib/constants';

const STATUS_STEPS = ['placed', 'processing', 'shipped', 'delivered'];

interface OrderItem {
  id: number;
  title: string;
  price: number;
  quantity?: number;
}

interface Order {
  id: string;
  status: string;
  total?: number;
  createdAt?: string;
  items?: OrderItem[];
  cancellationRequested?: boolean;
}

function StatusTracker({ status }: { status: string }) {
  if (status === 'cancelled') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#EF4444', fontWeight: 700, fontSize: '0.85rem' }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444', display: 'inline-block' }} />
        Order Cancelled
      </div>
    );
  }
  const current = STATUS_STEPS.indexOf(status);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {STATUS_STEPS.map((step, i) => {
        const done = i <= current;
        const active = i === current;
        return (
          <div key={step} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: done ? STATUS_COLORS[step] : 'var(--cream-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', color: done ? 'white' : 'var(--text-muted)',
                fontWeight: 800, boxShadow: active ? `0 0 0 3px ${STATUS_COLORS[step]}33` : 'none',
                transition: 'all 0.3s',
              }}>
                {done ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: done ? STATUS_COLORS[step] : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                {step.charAt(0).toUpperCase() + step.slice(1)}
              </span>
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div style={{ width: 32, height: 2, background: i < current ? STATUS_COLORS[STATUS_STEPS[i + 1]] : 'var(--cream-border)', margin: '0 2px', marginBottom: '1.1rem', transition: 'background 0.3s' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Orders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.isGuest) { navigate('/login', { state: { from: '/orders' } }); return; }
    fetch(`${API}/api/orders/user/${user.id}`)
      .then(r => r.json())
      .then(data => { setOrders(Array.isArray(data) ? data : []); })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const requestCancel = async (orderId: string) => {
    if (!window.confirm('Submit a cancellation request for this order? Our team will review it shortly.')) return;
    setCancellingId(orderId);
    try {
      const res = await fetch(`${API}/api/orders/${orderId}/cancel-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, cancellationRequested: true } : o));
      }
    } catch { /* silent — UI unchanged */ }
    setCancellingId(null);
  };

  return (
    <div style={{ minHeight: '70vh', background: 'var(--cream)' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, var(--cream-dark) 0%, var(--gold-pale) 100%)', padding: '2.5rem 1.25rem', textAlign: 'center', borderBottom: '2px solid var(--cream-border)' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
          <img src="/tiggy.png" alt="Tiggy" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--maroon)', flexShrink: 0 }} />
          <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.15rem', color: 'var(--maroon)', lineHeight: 1.1, textAlign: 'left' }}>
            Tiggy's<br /><span style={{ fontSize: '0.78rem', fontWeight: 400, color: 'var(--gold)', letterSpacing: '0.08em' }}>KINGDOM</span>
          </span>
        </div>
        <h1 style={{ color: 'var(--maroon)', margin: 0, fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}>Order History</h1>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '2rem 1.25rem' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🐑</div>
            <p style={{ fontWeight: 700 }}>Loading your orders...</p>
          </div>
        )}

        {!loading && orders.length === 0 && (
          <EmptyState
            title="No orders yet"
            message="When you place an order, it will appear here. Browse our shop to find something special!"
            action={{ label: 'Browse the Shop', to: '/shop' }}
          />
        )}

        {!loading && orders.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {orders.map(order => (
              <div key={order.id} className="card" style={{ padding: '1.5rem' }}>
                {/* Order header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.9rem', color: 'var(--maroon)' }}>{order.id}</span>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                    </p>
                  </div>
                  <span style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--maroon)' }}>
                    ${(order.total || 0).toFixed(2)}
                  </span>
                </div>

                {/* Status tracker */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <StatusTracker status={order.status} />
                </div>

                {/* Items */}
                <div style={{ borderTop: '1px solid var(--cream-border)', paddingTop: '1rem' }}>
                  <p style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.625rem' }}>Items</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {(order.items || []).map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                          <span style={{ fontSize: '1.25rem' }}>📖</span>
                          <div>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{item.title}</p>
                            {item.quantity > 1 && <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Qty: {item.quantity}</p>}
                          </div>
                        </div>
                        <span style={{ fontWeight: 800, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                          ${(item.price * (item.quantity || 1)).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cancellation */}
                {(order.status === 'placed' || order.status === 'processing') && (
                  <div style={{ borderTop: '1px solid var(--cream-border)', paddingTop: '0.875rem', marginTop: '0.875rem' }}>
                    {order.cancellationRequested ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#FEF3C7', borderRadius: '0.5rem', padding: '0.625rem 0.875rem' }}>
                        <span style={{ fontSize: '1rem' }}>⏳</span>
                        <div>
                          <p style={{ margin: 0, fontWeight: 800, fontSize: '0.825rem', color: '#92400E' }}>Cancellation Requested</p>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: '#A16207', fontWeight: 600 }}>Our team will review and confirm shortly.</p>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => requestCancel(order.id)}
                        disabled={cancellingId === order.id}
                        style={{ background: 'none', border: '1.5px solid #FCA5A5', borderRadius: '0.5rem', padding: '0.45rem 1rem', color: '#DC2626', fontWeight: 700, fontSize: '0.825rem', cursor: 'pointer', opacity: cancellingId === order.id ? 0.6 : 1 }}
                      >
                        {cancellingId === order.id ? 'Submitting…' : 'Request Cancellation'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link to="/" style={{ color: 'var(--gold)', fontWeight: 700, fontSize: '0.9rem' }}>← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
