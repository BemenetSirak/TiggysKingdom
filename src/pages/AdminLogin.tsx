import { useState, type FormEvent, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';

import { API } from '../lib/api';

export default function AdminLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Login failed'); return; }
      localStorage.setItem('tk_admin_token', data.token);
      localStorage.setItem('tk_admin_user', data.email);
      navigate('/admin');
    } catch {
      setError('Cannot reach server. Make sure the backend is running on port 4242.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: CSSProperties = {
    width: '100%', padding: '0.75rem 1rem', border: '2px solid var(--cream-border)',
    borderRadius: '0.75rem', fontFamily: 'Nunito, sans-serif', fontSize: '1rem',
    background: 'white', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--maroon)', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem', fontSize: '2rem' }}>🐑</div>
          <h1 style={{ color: 'white', fontFamily: 'Playfair Display, serif', margin: '0 0 0.25rem', fontSize: '1.5rem' }}>Admin Panel</h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontWeight: 600, margin: 0, fontSize: '0.9rem' }}>Tiggy's Kingdom</p>
        </div>

        <div style={{ background: 'white', borderRadius: '1.5rem', padding: '2rem', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '0.5rem', padding: '0.75rem', color: '#DC2626', fontWeight: 600, fontSize: '0.875rem' }}>
                {error}
              </div>
            )}
            <div>
              <label style={{ display: 'block', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem', fontSize: '0.9rem' }}>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="admin@example.com"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                onBlur={e => e.target.style.borderColor = 'var(--cream-border)'}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem', fontSize: '0.9rem' }}>Password</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                onBlur={e => e.target.style.borderColor = 'var(--cream-border)'}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{ background: 'var(--maroon)', color: 'white', padding: '0.875rem', borderRadius: '0.75rem', fontWeight: 800, fontSize: '1rem', border: 'none', cursor: 'pointer', opacity: loading ? 0.7 : 1, marginTop: '0.25rem' }}
            >
              {loading ? 'Signing in...' : 'Sign In to Admin'}
            </button>
          </form>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, margin: '1rem 0 0' }}>
            Sign in with your admin email
          </p>
        </div>
      </div>
    </div>
  );
}
