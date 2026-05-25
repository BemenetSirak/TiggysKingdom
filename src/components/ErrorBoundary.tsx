import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { error: Error | null; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cream)', padding: '2rem' }}>
          <div style={{ maxWidth: 480, textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, margin: '0 auto 1.5rem', borderRadius: '50%', overflow: 'hidden' }}>
              <img src="/tiggy.png" alt="Tiggy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', color: 'var(--maroon)', fontSize: '1.75rem', margin: '0 0 0.75rem' }}>
              Something went wrong
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontWeight: 600, lineHeight: 1.65, margin: '0 0 1.75rem' }}>
              Tiggy stumbled! An unexpected error occurred. Try refreshing the page — if the problem persists, please get in touch.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => window.location.reload()}
                className="btn-maroon"
                style={{ padding: '0.6rem 1.5rem' }}
              >
                Reload page
              </button>
              <a href="/" className="btn-outline-maroon" style={{ padding: '0.6rem 1.5rem', textDecoration: 'none' }}>
                Go home
              </a>
            </div>
            {import.meta.env.DEV && (
              <pre style={{ marginTop: '2rem', textAlign: 'left', background: '#FEE2E2', color: '#991B1B', padding: '1rem', borderRadius: '0.75rem', fontSize: '0.75rem', overflow: 'auto', maxHeight: 200 }}>
                {this.state.error.message}
                {'\n'}
                {this.state.error.stack}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
