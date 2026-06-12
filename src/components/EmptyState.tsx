import { Link } from 'react-router-dom';

interface EmptyStateProps {
  title?: string;
  message: string;
  action?: { label: string; to: string };
  icon?: string;
}

export default function EmptyState({ title, message, action, icon }: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '3.5rem 1.25rem', textAlign: 'center',
    }}>
      <div style={{
        width: 90, height: 90, borderRadius: '50%', overflow: 'hidden',
        border: '3px solid var(--gold)', boxShadow: '0 4px 20px rgba(201,146,42,0.2)',
        marginBottom: '1.25rem', flexShrink: 0,
      }}>
        {icon
          ? <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', background: 'var(--gold-pale)' }}>{icon}</div>
          : <img src="/tiggy.png" alt="Tiggy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
        }
      </div>
      {title && (
        <h3 style={{ fontFamily: 'Fraunces, serif', color: 'var(--maroon)', margin: '0 0 0.5rem', fontSize: '1.25rem' }}>
          {title}
        </h3>
      )}
      <p style={{ color: 'var(--text-muted)', fontWeight: 600, maxWidth: 340, margin: '0 0 1.5rem', lineHeight: 1.6 }}>
        {message}
      </p>
      {action && (
        <Link to={action.to} className="btn-gold" style={{ padding: '0.65rem 1.5rem', fontSize: '0.9rem' }}>
          {action.label}
        </Link>
      )}
    </div>
  );
}
