import { Link } from 'react-router-dom';

interface GuestBannerProps {
  message?: string;
}

export default function GuestBanner({ message = 'Create a free account to save your progress, favorites, and watch history across all your devices.' }: GuestBannerProps) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #1B2A4A 0%, #2D4A7A 100%)',
      borderRadius: '1rem',
      padding: '1.25rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      flexWrap: 'wrap',
      marginBottom: '1.5rem',
    }}>
      <div style={{ width: 52, height: 58, flexShrink: 0, overflow: 'hidden' }}>
        <img src="/tiggy-wave.png" alt="Tiggy" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }} onError={e => { (e.currentTarget as HTMLImageElement).src = '/tiggy.png'; }} />
      </div>
      <p style={{ flex: 1, margin: 0, color: 'rgba(255,255,255,0.85)', fontWeight: 600, fontSize: '0.9rem', lineHeight: 1.55, minWidth: 180 }}>
        {message}
      </p>
      <div style={{ display: 'flex', gap: '0.625rem', flexShrink: 0 }}>
        <Link
          to="/login"
          state={{ mode: 'register' }}
          style={{ background: 'var(--gold)', color: 'white', borderRadius: '9999px', padding: '0.5rem 1.25rem', fontWeight: 800, fontSize: '0.875rem', textDecoration: 'none', whiteSpace: 'nowrap' }}
        >
          Create Account
        </Link>
        <Link
          to="/login"
          style={{ background: 'rgba(255,255,255,0.12)', color: 'white', borderRadius: '9999px', padding: '0.5rem 1rem', fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none', whiteSpace: 'nowrap', border: '1px solid rgba(255,255,255,0.2)' }}
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}
