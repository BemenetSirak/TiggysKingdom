import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cream)', padding: '2rem 1.25rem' }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        {/* Confused Tiggy */}
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '7rem', lineHeight: 1 }}>🐑</div>
          <div style={{ position: 'absolute', top: -20, right: -20, background: 'white', borderRadius: '9999px', padding: '0.5rem 0.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontSize: '1.5rem' }}>
            ?
          </div>
        </div>

        <h1 style={{ color: 'var(--maroon)', margin: '0 0 0.5rem', fontSize: 'clamp(1.75rem, 5vw, 2.5rem)' }}>
          Oops! We can't find that page
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontWeight: 600, lineHeight: 1.7, margin: '0 0 2.5rem', fontSize: '1rem' }}>
          Looks like this page wandered off like a lost sheep.
          <br />
          Let's get you back to the flock!
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {[
            { label: '🏠 Go to Home', to: '/' },
            { label: '🔍 Search', to: '/shop' },
            { label: '📖 Browse Books', to: '/shop' },
            { label: '▶ Watch Episodes', to: '/episodes' },
          ].map(btn => (
            <Link
              key={btn.label}
              to={btn.to}
              style={{
                display: 'block',
                padding: '0.875rem',
                borderRadius: '0.875rem',
                border: '2px solid var(--cream-border)',
                background: 'white',
                color: 'var(--maroon)',
                fontWeight: 800,
                fontSize: '0.9rem',
                transition: 'all 0.2s',
                textDecoration: 'none',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--maroon)'; e.currentTarget.style.background = 'var(--cream-dark)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--cream-border)'; e.currentTarget.style.background = 'white'; }}
            >
              {btn.label}
            </Link>
          ))}
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
          Error 404 &mdash; Page not found
        </p>
      </div>
    </div>
  );
}
