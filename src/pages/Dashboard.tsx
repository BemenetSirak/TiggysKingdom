import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const API = 'http://localhost:4242';

interface Order {
  id: string;
  status: string;
  total?: number;
  createdAt?: string;
  items?: Array<{ id: number; title: string; price: number; quantity?: number }>;
  cancellationRequested?: boolean;
}

const STATUS_COLORS: Record<string, string> = { placed: '#3B82F6', processing: '#F97316', shipped: '#7C3AED', delivered: '#22C55E', cancelled: '#EF4444' };

export default function Dashboard() {
  const { user, logout, getLastActivity, getWatchHistory } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [editName, setEditName] = useState(false);
  const [newName, setNewName] = useState('');
  const [savingName, setSavingName] = useState(false);

  const activity = user ? getLastActivity(user.id) : null;
  const watchHistory = user ? getWatchHistory(user.id) : [];

  function formatTime(secs: number) {
    if (!secs || secs <= 0) return '';
    return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  }

  useEffect(() => {
    if (!user || user.isGuest) { navigate('/login', { state: { from: '/dashboard' } }); return; }
    setNewName(user.name);
    fetch(`${API}/api/orders/user/${user.id}`)
      .then(r => r.json())
      .then(d => setOrders(Array.isArray(d) ? d.slice(0, 3) : []))
      .catch(() => setOrders([]))
      .finally(() => setOrdersLoading(false));
  }, [user, navigate]);

  const handleSaveName = async () => {
    if (!newName.trim() || newName.trim() === user.name) { setEditName(false); return; }
    setSavingName(true);
    const users = JSON.parse(localStorage.getItem('tk_users') || '[]');
    const idx = users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      users[idx].name = newName.trim();
      localStorage.setItem('tk_users', JSON.stringify(users));
      const updated = { ...user, name: newName.trim() };
      localStorage.setItem('tk_user', JSON.stringify(updated));
      // Reload page to reflect new name in navbar
      window.location.reload();
    }
    setSavingName(false);
    setEditName(false);
    addToast('Name updated!', 'success');
  };

  if (!user || user.isGuest) return null;

  const joined = user.joinedDate ? new Date(user.joinedDate) : new Date();
  const daysSince = Math.floor((Date.now() - joined.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div style={{ background: 'var(--cream)', minHeight: '80vh' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, var(--maroon) 0%, #8B2E2E 100%)', padding: '2.5rem 1.25rem' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <div className="avatar-ring" style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', fontWeight: 900, color: 'white', flexShrink: 0 }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 style={{ color: 'white', margin: 0, fontSize: 'clamp(1.25rem, 3vw, 1.75rem)' }}>
              Welcome back, {user.name.split(' ')[0]}! 🐑
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', margin: '0.25rem 0 0', fontWeight: 600, fontSize: '0.9rem' }}>
              {user.email} · Member for {daysSince < 1 ? 'less than a day' : `${daysSince} day${daysSince !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button onClick={() => { logout(); navigate('/'); }} style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.15)', color: 'white', border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: '0.5rem', padding: '0.4rem 1rem', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
            Sign Out
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Quick stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
          {[
            { icon: '🛒', label: 'Orders', value: orders.length + (ordersLoading ? '…' : ''), color: '#C9922A' },
            { icon: '▶', label: 'Videos Watched', value: watchHistory.length > 0 ? `${watchHistory.length} episode${watchHistory.length !== 1 ? 's' : ''}` : 'None yet', color: '#3B82F6' },
            { icon: '📅', label: 'Member Since', value: joined.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), color: '#7C3AED' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: '0.75rem', background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.35rem', flexShrink: 0 }}>
                {s.icon}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
                <p style={{ margin: '0.1rem 0 0', fontWeight: 800, color: s.color, fontSize: '0.95rem' }}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Continue watching */}
        {activity?.type === 'episode' && (
          <div className="card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)', color: 'white' }}>
            <p style={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.8, margin: '0 0 0.5rem' }}>Continue Watching</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.05rem', fontWeight: 800 }}>
                  Ep. {activity.episodeNum} — {activity.title}
                </h3>
                <p style={{ margin: 0, opacity: 0.75, fontWeight: 600, fontSize: '0.85rem' }}>
                  {activity.timestamp > 0 ? `Stopped at ${formatTime(activity.timestamp)} · ` : ''}
                  {new Date(activity.savedAt).toLocaleDateString()}
                </p>
              </div>
              <Link
                to="/episodes"
                state={{ resumeVideoId: activity.videoId }}
                style={{ background: 'white', color: '#1D4ED8', borderRadius: '9999px', padding: '0.5rem 1.25rem', fontWeight: 800, fontSize: '0.9rem', whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                {activity.timestamp > 0 ? `▶ Resume at ${formatTime(activity.timestamp)}` : '▶ Resume'}
              </Link>
            </div>
          </div>
        )}

        {/* Watch history */}
        {watchHistory.length > 1 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
              <h2 style={{ color: 'var(--maroon)', fontSize: '1.05rem', margin: 0 }}>Watch History</h2>
              <Link to="/episodes" style={{ color: 'var(--gold)', fontWeight: 700, fontSize: '0.85rem' }}>Browse all →</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {watchHistory.slice(0, 5).map((entry, i) => {
                const pct = entry.timestamp > 0 && entry.duration > 0
                  ? Math.min(100, (entry.timestamp / entry.duration) * 100) : 0;
                return (
                  <div key={entry.videoId} className="card" style={{ padding: '0.875rem 1.125rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img
                      src={`https://i.ytimg.com/vi/${entry.videoId}/default.jpg`}
                      alt={entry.title}
                      style={{ width: 72, height: 54, objectFit: 'cover', borderRadius: '0.375rem', flexShrink: 0, background: 'var(--cream-dark)' }}
                      onError={e => { e.currentTarget.style.display = 'none'; }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: '0 0 0.2rem', fontWeight: 800, fontSize: '0.875rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        Ep. {entry.episodeNum} — {entry.title}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {entry.timestamp > 0 && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                            {formatTime(entry.timestamp)} watched
                          </span>
                        )}
                        {pct > 0 && (
                          <div style={{ flex: 1, height: 3, background: 'var(--cream-border)', borderRadius: 9999, maxWidth: 80 }}>
                            <div style={{ height: '100%', background: 'var(--gold)', width: `${pct}%`, borderRadius: 9999 }} />
                          </div>
                        )}
                      </div>
                    </div>
                    <Link
                      to="/episodes"
                      state={{ resumeVideoId: entry.videoId }}
                      style={{ background: 'var(--cream)', color: 'var(--maroon)', borderRadius: '0.5rem', padding: '0.35rem 0.75rem', fontWeight: 800, fontSize: '0.75rem', whiteSpace: 'nowrap', flexShrink: 0 }}
                    >
                      {entry.timestamp > 0 ? `▶ ${formatTime(entry.timestamp)}` : '▶ Watch'}
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick links */}
        <div>
          <h2 style={{ color: 'var(--maroon)', fontSize: '1.05rem', margin: '0 0 0.875rem' }}>Explore</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
            {[
              { to: '/episodes', icon: '▶', label: 'Episodes', color: '#3B82F6' },
              { to: '/shop', icon: '📖', label: 'Shop', color: '#C9922A' },
              { to: '/activities', icon: '✏️', label: 'Activities', color: '#22C55E' },
              { to: '/orders', icon: '📦', label: 'My Orders', color: '#7C3AED' },
            ].map(l => (
              <Link
                key={l.to}
                to={l.to}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                  padding: '1.25rem 0.75rem', background: 'white', borderRadius: '1rem',
                  boxShadow: '0 2px 8px rgba(107,32,32,0.06)', fontWeight: 700, color: l.color, fontSize: '0.875rem',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(107,32,32,0.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 8px rgba(107,32,32,0.06)'; }}
              >
                <span style={{ fontSize: '1.75rem' }}>{l.icon}</span>
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Recent orders */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
            <h2 style={{ color: 'var(--maroon)', fontSize: '1.05rem', margin: 0 }}>Recent Orders</h2>
            <Link to="/orders" style={{ color: 'var(--gold)', fontWeight: 700, fontSize: '0.85rem' }}>View all →</Link>
          </div>

          {ordersLoading && <p style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>Loading…</p>}

          {!ordersLoading && orders.length === 0 && (
            <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontWeight: 600, margin: '0 0 1rem' }}>No orders yet.</p>
              <Link to="/shop" className="btn-gold" style={{ padding: '0.55rem 1.25rem', fontSize: '0.875rem' }}>Shop Now</Link>
            </div>
          )}

          {!ordersLoading && orders.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {orders.map(o => (
                <div key={o.id} className="card" style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.85rem', color: 'var(--maroon)' }}>{o.id}</span>
                    <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {o.items?.map(i => i.title).join(', ').slice(0, 50)}{(o.items?.map(i => i.title).join(', ').length || 0) > 50 ? '…' : ''}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                    <span style={{ fontWeight: 900, color: 'var(--maroon)', fontSize: '1rem' }}>${(o.total || 0).toFixed(2)}</span>
                    <span style={{ background: `${STATUS_COLORS[o.status] || '#9B7070'}18`, color: STATUS_COLORS[o.status] || '#9B7070', borderRadius: '9999px', padding: '0.2rem 0.6rem', fontSize: '0.72rem', fontWeight: 800 }}>
                      {o.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Account settings */}
        <div>
          <h2 style={{ color: 'var(--maroon)', fontSize: '1.05rem', margin: '0 0 0.875rem' }}>Account Settings</h2>
          <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Display Name</p>
                {editName ? (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem' }}>
                    <input
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      style={{ padding: '0.45rem 0.75rem', border: '2px solid var(--gold)', borderRadius: '0.5rem', fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: '0.9rem', outline: 'none' }}
                      autoFocus
                      onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditName(false); }}
                    />
                    <button onClick={handleSaveName} disabled={savingName} className="btn-gold" style={{ padding: '0.45rem 0.875rem', fontSize: '0.85rem' }}>Save</button>
                    <button onClick={() => setEditName(false)} className="btn-outline-maroon" style={{ padding: '0.45rem 0.875rem', fontSize: '0.85rem' }}>Cancel</button>
                  </div>
                ) : (
                  <p style={{ margin: '0.2rem 0 0', fontWeight: 800, color: 'var(--text-primary)', fontSize: '1rem' }}>{user.name}</p>
                )}
              </div>
              {!editName && (
                <button onClick={() => setEditName(true)} style={{ background: 'none', border: '1.5px solid var(--cream-border)', borderRadius: '0.5rem', padding: '0.4rem 0.875rem', fontWeight: 700, fontSize: '0.8rem', color: 'var(--maroon)', cursor: 'pointer' }}>
                  Edit
                </button>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--cream-border)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</p>
                <p style={{ margin: '0.2rem 0 0', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{user.email}</p>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--cream-border)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</p>
                <p style={{ margin: '0.2rem 0 0', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>••••••••</p>
              </div>
              <Link to="/forgot-password" style={{ background: 'none', border: '1.5px solid var(--cream-border)', borderRadius: '0.5rem', padding: '0.4rem 0.875rem', fontWeight: 700, fontSize: '0.8rem', color: 'var(--maroon)', cursor: 'pointer' }}>
                Change
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
