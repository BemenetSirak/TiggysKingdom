import { useState, type FormEvent, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

import { API } from '../lib/api';

type Step = 'email' | 'code' | 'done';

export default function ForgotPassword() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { addToast } = useToast();

  const handleRequestReset = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) { setError('Enter a valid email address.'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/request-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Email not found.'); return; }
      addToast('Check your email for a reset code.', 'success');
      setStep('code');
    } catch {
      setError('Cannot reach server. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyReset = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (code.length !== 6) { setError('Enter the 6-digit code from your email.'); return; }
    if (newPassword.length < 6) { setError('New password must be at least 6 characters.'); return; }
    if (newPassword !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/verify-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Invalid or expired code.'); return; }

      // Update password in localStorage
      const users = JSON.parse(localStorage.getItem('tk_users') || '[]');
      const idx = users.findIndex(u => u.email === email);
      if (idx !== -1) {
        users[idx].password = newPassword;
        localStorage.setItem('tk_users', JSON.stringify(users));
        // If currently logged in as this user, clear the session
        const current = JSON.parse(localStorage.getItem('tk_user') || 'null');
        if (current?.email === email) localStorage.removeItem('tk_user');
      }
      setStep('done');
    } catch {
      setError('Cannot reach server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: CSSProperties = { width: '100%', padding: '0.75rem 1rem', border: '2px solid var(--cream-border)', borderRadius: '0.75rem', fontFamily: 'Nunito, sans-serif', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.25rem', background: 'var(--cream)' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem', textDecoration: 'none' }}>
            <img src="/tiggy.png" alt="Tiggy" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--maroon)', flexShrink: 0 }} />
            <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.25rem', color: 'var(--maroon)', lineHeight: 1.1, textAlign: 'left' }}>
              Tiggy's<br /><span style={{ fontSize: '0.82rem', fontWeight: 400, color: 'var(--gold)', letterSpacing: '0.08em' }}>KINGDOM</span>
            </span>
          </Link>
          <h1 style={{ color: 'var(--maroon)', margin: '0 0 0.25rem', fontSize: '1.75rem' }}>
            {step === 'done' ? 'Password Reset!' : 'Reset Password'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontWeight: 600, margin: 0, fontSize: '0.9rem' }}>
            {step === 'email' && 'Enter your email to receive a reset code.'}
            {step === 'code' && `We sent a 6-digit code to ${email}`}
            {step === 'done' && 'Your password has been updated.'}
          </p>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          {step === 'done' ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✓</div>
              <p style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                You can now sign in with your new password.
              </p>
              <Link to="/login" className="btn-maroon" style={{ display: 'block', textAlign: 'center', padding: '0.875rem' }}>
                Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={step === 'email' ? handleRequestReset : handleVerifyReset} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {error && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '0.5rem', padding: '0.75rem', color: '#DC2626', fontWeight: 600, fontSize: '0.875rem' }}>
                  {error}
                </div>
              )}

              {step === 'email' && (
                <div>
                  <label style={{ display: 'block', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem', fontSize: '0.9rem' }}>Email Address</label>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com" style={inputStyle} required
                    onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                    onBlur={e => e.target.style.borderColor = 'var(--cream-border)'}
                  />
                </div>
              )}

              {step === 'code' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem', fontSize: '0.9rem' }}>6-Digit Code</label>
                    <input
                      type="text" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456" style={{ ...inputStyle, letterSpacing: '0.2em', textAlign: 'center', fontSize: '1.25rem' }} required
                      onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                      onBlur={e => e.target.style.borderColor = 'var(--cream-border)'}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem', fontSize: '0.9rem' }}>New Password</label>
                    <input
                      type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters" style={inputStyle} required
                      onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                      onBlur={e => e.target.style.borderColor = 'var(--cream-border)'}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem', fontSize: '0.9rem' }}>Confirm Password</label>
                    <input
                      type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                      placeholder="Re-enter new password" style={inputStyle} required
                      onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                      onBlur={e => e.target.style.borderColor = 'var(--cream-border)'}
                    />
                  </div>
                </>
              )}

              <button type="submit" disabled={loading} className="btn-maroon" style={{ width: '100%', justifyContent: 'center', padding: '0.875rem', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Please wait…' : step === 'email' ? 'Send Reset Code' : 'Set New Password'}
              </button>

              {step === 'code' && (
                <button type="button" onClick={() => setStep('email')} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', textAlign: 'center' }}>
                  ← Use a different email
                </button>
              )}
            </form>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          Remember it? <Link to="/login" style={{ color: 'var(--gold)' }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}
