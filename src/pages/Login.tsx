import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setErrors(er => ({ ...er, [field]: '' }));
  };

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (mode === 'register' && !form.name.trim()) errs.name = 'Name is required.';
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errs.email = 'Enter a valid email.';
    if (form.password.length < 6) errs.password = 'Password must be at least 6 characters.';
    if (mode === 'register' && form.password !== form.confirm) errs.confirm = 'Passwords do not match.';
    return errs;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    await new Promise(r => setTimeout(r, 400)); // brief UX delay

    let result;
    if (mode === 'login') {
      result = login(form.email, form.password);
    } else {
      result = register(form.name, form.email, form.password);
    }

    setLoading(false);
    if (result.success) {
      if (mode === 'register') {
        addToast(`Welcome to Tiggy's Kingdom, ${form.name}! 🐑`, 'success');
        navigate(from, { replace: true });
      } else {
        // Resume where they left off
        const storedUser = JSON.parse(localStorage.getItem('tk_user') || '{}');
        const activity = storedUser.id
          ? JSON.parse(localStorage.getItem(`tk_activity_${storedUser.id}`) || 'null')
          : null;

        if (activity?.type === 'episode') {
          addToast(`Welcome back! Resuming: ${activity.title}`, 'success');
          navigate('/episodes', { state: { resumeVideoId: activity.videoId }, replace: true });
        } else if (activity?.type === 'order') {
          addToast('Welcome back! Here are your recent orders.', 'success');
          navigate('/orders', { replace: true });
        } else {
          addToast('Welcome back! 🐑', 'success');
          navigate(from, { replace: true });
        }
      }
    } else {
      setErrors({ general: result.error });
    }
  };

  const inputStyle = (field: string): React.CSSProperties => ({
    width: '100%',
    padding: '0.75rem 1rem',
    border: `2px solid ${errors[field] ? '#EF4444' : 'var(--cream-border)'}`,
    borderRadius: '0.75rem',
    fontFamily: 'Fredoka, sans-serif',
    fontSize: '1rem',
    background: 'white',
    color: 'var(--text-primary)',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  });

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.25rem', background: 'var(--cream)' }}>
      <div style={{ width: '100%', maxWidth: 440 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem', textDecoration: 'none' }}>
            <img src="/tiggy.png" alt="Tiggy" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--maroon)', flexShrink: 0 }} />
            <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '1.25rem', color: 'var(--maroon)', lineHeight: 1.1, textAlign: 'left' }}>
              Tiggy's<br /><span style={{ fontSize: '0.82rem', fontWeight: 400, color: 'var(--gold)', letterSpacing: '0.08em' }}>KINGDOM</span>
            </span>
          </Link>
          <h1 style={{ color: 'var(--maroon)', margin: '0 0 0.25rem', fontSize: '1.875rem' }}>
            {mode === 'login' ? 'Welcome Back!' : "Join Tiggy's Kingdom"}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontWeight: 600, margin: 0 }}>
            {mode === 'login' ? 'Sign in to continue your adventure' : 'Create your free account today'}
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '2rem' }}>

          {/* Mode switcher */}
          <div style={{ display: 'flex', background: 'var(--cream)', borderRadius: '0.75rem', padding: '0.25rem', marginBottom: '1.5rem' }}>
            {['login', 'register'].map(m => (
              <button
                key={m}
                onClick={() => { setMode(m as 'login' | 'register'); setErrors({}); }}
                style={{
                  flex: 1,
                  padding: '0.6rem',
                  borderRadius: '0.6rem',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  background: mode === m ? 'white' : 'transparent',
                  color: mode === m ? 'var(--maroon)' : 'var(--text-muted)',
                  boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                }}
              >
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {errors.general && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '0.5rem', padding: '0.75rem', color: '#DC2626', fontWeight: 600, fontSize: '0.9rem' }}>
                {errors.general}
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label style={{ display: 'block', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={set('name')}
                  placeholder="Your full name"
                  style={inputStyle('name')}
                  onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                  onBlur={e => e.target.style.borderColor = errors.name ? '#EF4444' : 'var(--cream-border)'}
                />
                {errors.name && <p style={{ color: '#EF4444', fontSize: '0.8rem', margin: '0.25rem 0 0', fontWeight: 600 }}>{errors.name}</p>}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                Email Address
              </label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="your@email.com"
                style={inputStyle('email')}
                onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                onBlur={e => e.target.style.borderColor = errors.email ? '#EF4444' : 'var(--cream-border)'}
              />
              {errors.email && <p style={{ color: '#EF4444', fontSize: '0.8rem', margin: '0.25rem 0 0', fontWeight: 600 }}>{errors.email}</p>}
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                Password
              </label>
              <input
                type="password"
                value={form.password}
                onChange={set('password')}
                placeholder={mode === 'register' ? 'At least 6 characters' : 'Your password'}
                style={inputStyle('password')}
                onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                onBlur={e => e.target.style.borderColor = errors.password ? '#EF4444' : 'var(--cream-border)'}
              />
              {errors.password && <p style={{ color: '#EF4444', fontSize: '0.8rem', margin: '0.25rem 0 0', fontWeight: 600 }}>{errors.password}</p>}
            </div>

            {mode === 'register' && (
              <div>
                <label style={{ display: 'block', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={form.confirm}
                  onChange={set('confirm')}
                  placeholder="Re-enter password"
                  style={inputStyle('confirm')}
                  onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                  onBlur={e => e.target.style.borderColor = errors.confirm ? '#EF4444' : 'var(--cream-border)'}
                />
                {errors.confirm && <p style={{ color: '#EF4444', fontSize: '0.8rem', margin: '0.25rem 0 0', fontWeight: 600 }}>{errors.confirm}</p>}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-maroon"
              style={{ width: '100%', justifyContent: 'center', padding: '0.875rem', fontSize: '1rem', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? '...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>

            {mode === 'login' && (
              <p style={{ textAlign: 'center', margin: 0 }}>
                <Link to="/forgot-password" style={{ color: 'var(--gold)', fontWeight: 700, fontSize: '0.875rem' }}>Forgot your password?</Link>
              </p>
            )}
          </form>
        </div>

        {mode === 'register' && (
          <p style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
            By creating an account you agree to our{' '}
            <Link to="/terms" style={{ color: 'var(--gold)' }}>Terms of Service</Link> and{' '}
            <Link to="/privacy" style={{ color: 'var(--gold)' }}>Privacy Policy</Link>.
          </p>
        )}
      </div>
    </div>
  );
}
