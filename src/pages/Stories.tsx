import { Link } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta';

export interface FreeStory {
  id: string;
  icon: string;
  title: string;
  desc: string;
  ages?: string;
  active: boolean;
}

export default function Stories() {
  usePageMeta('Free Stories — Coming Soon', 'Free read-along Orthodox Christian stories for children, coming soon to Tiggy\'s Kingdom.');

  return (
    <div style={{ minHeight: '70vh', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 1.25rem' }}>
      <div style={{ maxWidth: 560, textAlign: 'center' }}>
        <div style={{ width: 180, margin: '0 auto 1.5rem' }}>
          <img src="/tiggy-point.png" alt="Tiggy pointing at a coming soon sign" style={{ width: '100%', objectFit: 'contain' }} onError={e => { (e.currentTarget as HTMLImageElement).src = '/tiggy.png'; }} />
        </div>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#FEF3C7',
          border: '2px dashed #C9922A', borderRadius: '0.75rem', padding: '0.5rem 1.25rem',
          marginBottom: '1.5rem', transform: 'rotate(-2deg)',
        }}>
          <span style={{ fontSize: '1.5rem' }}>🚧</span>
          <span style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 900, fontSize: '0.95rem', color: '#92620A', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Under Construction
          </span>
          <span style={{ fontSize: '1.5rem' }}>🚧</span>
        </div>

        <h1 style={{ color: 'var(--maroon)', margin: '0 0 0.875rem', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}>Free Stories — Coming Soon!</h1>
        <p style={{ color: 'var(--text-secondary)', fontWeight: 600, lineHeight: 1.7, margin: '0 auto 2rem', maxWidth: 460 }}>
          Tiggy is busy putting together free read-along stories for the whole family to enjoy. Check back soon — in the meantime, explore our episodes and activities!
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/episodes" className="btn-maroon" style={{ padding: '0.75rem 1.75rem', fontSize: '0.95rem' }}>▶ Watch Episodes</Link>
          <Link to="/activities" className="btn-gold" style={{ padding: '0.75rem 1.75rem', fontSize: '0.95rem', textDecoration: 'none' }}>🎨 Try Activities</Link>
        </div>
      </div>
    </div>
  );
}
