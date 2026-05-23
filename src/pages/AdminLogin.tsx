import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API } from '../lib/api';

export default function AdminLogin() {
  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/admin/login`, {
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
      setError('Cannot reach server. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (hasError = false): React.CSSProperties => ({
    width: '100%',
    padding: '0.75rem 1rem',
    border: `2px solid ${hasError ? '#EF4444' : 'var(--cream-border)'}`,
    borderRadius: '0.75rem',
    fontFamily: 'Nunito, sans-serif',
    fontSize: '1rem',
    background: 'white',
    color: 'var(--text-primary)',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.25rem', background: 'var(--cream)' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo — same as user Login.tsx */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem', textDecoration: 'none' }}>
            <img src="/tiggy.png" alt="Tiggy" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--maroon)', flexShrink: 0 }} />
            <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.25rem', color: 'var(--maroon)', lineHeight: 1.1, textAlign: 'left' }}>
              Tiggy's<br /><span style={{ fontSize: '0.82rem', fontWeight: 400, color: 'var(--gold)', letterSpacing: '0.08em' }}>KINGDOM</span>
            </span>
          </Link>
          <h1 style={{ color: 'var(--maroon)', margin: '0 0 0.25rem', fontSize: '1.875rem' }}>Admin Portal</h1>
          <p style={{ color: 'var(--text-muted)', fontWeight: 600, margin: 0 }}>Sign in to manage Tiggy's Kingdom</p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '2rem' }}>

          {/* Admin badge */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <span style={{ background: 'var(--maroon)', color: 'white', borderRadius: '9999px', padding: '0.3rem 1rem', fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.08em' }}>
              ADMIN ACCESS
            </span>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '0.5rem', padding: '0.75rem', color: '#DC2626', fontWeight: 600, fontSize: '0.9rem' }}>
                {error}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                Admin Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="admin@admin.com"
                style={inputStyle(!!error)}
                onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                onBlur={e => e.target.style.borderColor = error ? '#EF4444' : 'var(--cream-border)'}
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                Password
              </label>
              <input
                type="password"
                value={form.password}
                onChange={set('password')}
                placeholder="••••••••"
                style={inputStyle(!!error)}
                onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                onBlur={e => e.target.style.borderColor = error ? '#EF4444' : 'var(--cream-border)'}
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-maroon"
              style={{ width: '100%', justifyContent: 'center', padding: '0.875rem', fontSize: '1rem', marginTop: '0.25rem', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Signing in…' : 'Sign In to Admin'}
            </button>

          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.25rem' }}>
          <Link to="/" style={{ color: 'var(--gold)', fontWeight: 700, fontSize: '0.875rem' }}>← Back to Tiggy's Kingdom</Link>
        </p>

      </div>
    </div>
  );
}
