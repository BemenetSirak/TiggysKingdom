import { useState, useRef, useEffect, ReactNode, FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

const NEWSLETTER_API = 'http://localhost:4242';

const NAV_LINKS = [
  { label: 'Episodes', to: '/episodes', icon: '▶' },
  { label: 'Stories', to: '/stories', icon: '📖' },
  { label: 'Shop', to: '/shop', icon: '🛍' },
  { label: 'Activities', to: '/activities', icon: '✏️' },
  { label: 'Calendar', to: '/calendar', icon: '📅' },
  { label: 'About', to: '/about', icon: 'ℹ' },
];

const BREADCRUMB_LABELS: Record<string, string> = {
  '/episodes': 'Episodes', '/lessons': 'Episodes', '/shop': 'Shop', '/cart': 'Cart',
  '/orders': 'My Orders', '/success': 'Order Confirmed', '/dashboard': 'Dashboard',
  '/activities': 'Activities', '/subscribe': 'Subscribe', '/about': 'About',
  '/stories': 'Stories', '/calendar': 'Calendar',
};

const FOOTER_COLS = [
  {
    heading: 'EXPLORE',
    links: [
      { label: 'Episodes',   to: '/episodes' },
      { label: 'Stories',    to: '/stories' },
      { label: 'Activities', to: '/activities' },
      { label: 'Calendar',   to: '/calendar' },
    ],
  },
  {
    heading: 'SHOP',
    links: [
      { label: 'Books',     to: '/stories' },
      { label: 'Shop All',  to: '/shop' },
      { label: 'Subscribe', to: '/subscribe' },
      { label: 'Cart',      to: '/cart' },
    ],
  },
  {
    heading: 'LEARN',
    links: [
      { label: 'About Us',    to: '/about' },
      { label: 'Episodes',    to: '/episodes' },
      { label: 'Activities',  to: '/activities' },
      { label: 'Subscribe',   to: '/subscribe' },
    ],
  },
  {
    heading: 'SUPPORT',
    links: [
      { label: 'My Orders',  to: '/orders' },
      { label: 'Dashboard',  to: '/dashboard' },
      { label: 'Sign In',    to: '/login' },
      { label: 'About',      to: '/about' },
    ],
  },
];

export default function Layout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [badgeAnim, setBadgeAnim] = useState(false);
  const [mobileEmail, setMobileEmail] = useState('');
  const [footerEmail, setFooterEmail] = useState('');
  const [showBackToTop, setShowBackToTop] = useState(false);

  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const prevCartCount = useRef(cartCount);

  const isActive = (to: string) => location.pathname === to;

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    setUserMenuOpen(false);
    navigate('/');
  };

  useEffect(() => {
    if (cartCount > prevCartCount.current) {
      setBadgeAnim(true);
      const t = setTimeout(() => setBadgeAnim(false), 420);
      return () => clearTimeout(t);
    }
    prevCartCount.current = cartCount;
  }, [cartCount]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
    setSearchOpen(false);
    setSearchQuery('');
  };

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleFooterSubscribe = async (e: FormEvent) => {
    e.preventDefault();
    if (!footerEmail) return;
    try {
      await fetch(`${NEWSLETTER_API}/api/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: footerEmail, source: 'footer' }),
      });
    } catch { /* silent */ }
    addToast("You've joined Tiggy's Flock!", 'success');
    setFooterEmail('');
  };

  const handleMobileNewsletter = async (e: FormEvent) => {
    e.preventDefault();
    if (!mobileEmail) return;
    try {
      await fetch(`${NEWSLETTER_API}/api/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: mobileEmail, source: 'mobile-menu' }),
      });
    } catch { /* silent */ }
    addToast("You've joined Tiggy's Flock! 🐑", 'success');
    setMobileEmail('');
    setMobileOpen(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--cream)' }}>
      <a href="#main-content" style={{ position: 'absolute', top: -60, left: 0, background: 'var(--maroon)', color: 'white', padding: '0.5rem 1rem', fontWeight: 700, borderRadius: '0 0 0.5rem 0', zIndex: 9999, transition: 'top 0.2s' }} onFocus={e => e.currentTarget.style.top = '0'} onBlur={e => e.currentTarget.style.top = '-60px'}>Skip to content</a>

      {/* ===== NAVBAR ===== */}
      <nav style={{ background: 'var(--cream)', borderBottom: '2px solid var(--cream-border)', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.25rem', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
            <img src="/tiggy.png" alt="Tiggy" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.25rem', color: 'var(--maroon)', lineHeight: 1.1 }}>
              Tiggy's<br />
              <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--gold)', letterSpacing: '0.05em' }}>KINGDOM</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            {NAV_LINKS.map(l => (
              <Link
                key={l.to}
                to={l.to}
                style={{
                  padding: '0.5rem 0.875rem',
                  borderRadius: '0.5rem',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  color: isActive(l.to) ? 'var(--maroon)' : 'var(--text-secondary)',
                  background: isActive(l.to) ? 'var(--cream-dark)' : 'transparent',
                  transition: 'all 0.15s',
                }}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Desktop right */}
          <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>

            {/* Search */}
            {searchOpen ? (
              <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <input
                  ref={searchInputRef}
                  type="search"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search books…"
                  className="tk-input search-expand"
                  style={{ width: 200, padding: '0.4rem 0.75rem', fontSize: '0.875rem' }}
                  onBlur={() => { if (!searchQuery.trim()) setSearchOpen(false); }}
                />
                <button type="submit" style={{ background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', padding: '0.25rem' }}>🔍</button>
                <button type="button" onClick={() => { setSearchOpen(false); setSearchQuery(''); }} style={{ background: 'none', border: 'none', fontSize: '0.9rem', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}>✕</button>
              </form>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                style={{ background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', padding: '0.5rem', borderRadius: '0.5rem', color: 'var(--text-secondary)' }}
                aria-label="Search"
              >🔍</button>
            )}

            <Link to="/cart" style={{ position: 'relative', padding: '0.5rem', borderRadius: '0.5rem', color: 'var(--maroon)', display: 'flex', alignItems: 'center' }}>
              🛒
              {cartCount > 0 && (
                <span className={badgeAnim ? 'cart-badge-pop' : ''} style={{ position: 'absolute', top: 0, right: 0, background: 'var(--maroon)', color: 'white', borderRadius: '50%', width: 18, height: 18, fontSize: '0.65rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <div ref={menuRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setUserMenuOpen(o => !o)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', padding: '0.35rem 0.625rem', borderRadius: '0.5rem' }}
                >
                  <div className="avatar-ring" style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--maroon)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '0.875rem' }}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontWeight: 700, color: 'var(--maroon)', fontSize: '0.9rem' }}>{user.name.split(' ')[0]}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{userMenuOpen ? '▲' : '▼'}</span>
                </button>
                {userMenuOpen && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: 'white', borderRadius: '0.875rem', boxShadow: '0 8px 32px rgba(107,32,32,0.15)', border: '1px solid var(--cream-border)', minWidth: 180, overflow: 'hidden', zIndex: 100 }}>
                    {[
                      { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
                      { to: '/orders', icon: '📦', label: 'My Orders' },
                    ].map(l => (
                      <Link
                        key={l.to}
                        to={l.to}
                        onClick={() => setUserMenuOpen(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.625rem 1rem', fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-secondary)', transition: 'background 0.1s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--cream)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <span>{l.icon}</span> {l.label}
                      </Link>
                    ))}
                    <div style={{ borderTop: '1px solid var(--cream-border)' }} />
                    <button
                      onClick={handleLogout}
                      style={{ display: 'flex', width: '100%', alignItems: 'center', gap: '0.625rem', padding: '0.625rem 1rem', fontWeight: 700, fontSize: '0.875rem', color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <span>↩</span> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn-maroon" style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}>
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile right */}
          <div className="mobile-nav-btn" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link to="/cart" style={{ position: 'relative', color: 'var(--maroon)', fontSize: '1.3rem' }}>
              🛒
              {cartCount > 0 && (
                <span className={badgeAnim ? 'cart-badge-pop' : ''} style={{ position: 'absolute', top: -6, right: -6, background: 'var(--maroon)', color: 'white', borderRadius: '50%', width: 18, height: 18, fontSize: '0.65rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {cartCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMobileOpen(true)}
              style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: 'var(--maroon)', padding: '0.25rem' }}
              aria-label="Open navigation menu"
            >
              ☰
            </button>
          </div>
        </div>
      </nav>

      {/* ===== MOBILE MENU ===== */}
      {mobileOpen && (
        <div className="mobile-menu-overlay" style={{ paddingBottom: '2rem' }}>
          <div style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--cream-border)' }}>
            <Link to="/" onClick={() => setMobileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <img src="/tiggy.png" alt="Tiggy" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.1rem', color: 'var(--maroon)' }}>Tiggy's Kingdom</span>
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--maroon)', color: 'white', border: 'none', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ✕
            </button>
          </div>

          <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {NAV_LINKS.map(l => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem 1.25rem',
                  borderRadius: '1rem',
                  background: isActive(l.to) ? 'var(--gold-pale)' : 'transparent',
                  color: 'var(--maroon)',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                }}
              >
                <span style={{ fontSize: '1.3rem' }}>{l.icon}</span>
                {l.label}
              </Link>
            ))}
          </div>

          <div style={{ padding: '0 1.25rem', borderTop: '1px solid var(--cream-border)', paddingTop: '1rem' }}>
            {user ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--cream)', borderRadius: '0.75rem', marginBottom: '0.25rem' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--maroon)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '1rem', flexShrink: 0 }}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontWeight: 800, color: 'var(--maroon)', margin: 0, fontSize: '0.95rem' }}>{user.name}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, fontWeight: 600 }}>{user.email}</p>
                  </div>
                </div>
                {[{ to: '/dashboard', icon: '🏠', label: 'Dashboard' }, { to: '/orders', icon: '📦', label: 'My Orders' }].map(l => (
                  <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '0.75rem', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                    <span>{l.icon}</span> {l.label}
                  </Link>
                ))}
                <button onClick={handleLogout} className="btn-outline-maroon" style={{ width: '100%', justifyContent: 'center', marginTop: '0.25rem' }}>
                  Sign Out
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-maroon" style={{ width: '100%', justifyContent: 'center', textAlign: 'center' }}>
                  Sign In / Register
                </Link>
              </div>
            )}
          </div>

          <div style={{ padding: '1.5rem 1.25rem 0' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
              Join Tiggy's flock for weekly blessings!
            </p>
            <form style={{ display: 'flex', gap: '0.5rem' }} onSubmit={handleMobileNewsletter}>
              <input type="email" placeholder="Email" className="tk-input" style={{ flex: 1, padding: '0.6rem 0.875rem' }} value={mobileEmail} onChange={e => setMobileEmail(e.target.value)} required />
              <button type="submit" className="btn-gold" style={{ padding: '0.6rem 1rem', whiteSpace: 'nowrap' }}>Subscribe</button>
            </form>
          </div>
        </div>
      )}

      {/* ===== BREADCRUMB ===== */}
      {BREADCRUMB_LABELS[location.pathname] && (
        <div style={{ background: 'var(--cream-dark)', borderBottom: '1px solid var(--cream-border)', padding: '0.4rem 1.25rem' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            <Link to="/" style={{ color: 'var(--gold-dark)', fontWeight: 700 }}>Home</Link>
            <span>›</span>
            <span style={{ color: 'var(--maroon)', fontWeight: 700 }}>{BREADCRUMB_LABELS[location.pathname]}</span>
          </div>
        </div>
      )}

      {/* ===== MAIN CONTENT ===== */}
      <main id="main-content" style={{ flex: 1 }}>
        {children}
      </main>

      {/* ===== FOOTER ===== */}
      <footer style={{ background: 'var(--cream)', borderTop: '2px solid var(--cream-border)', paddingTop: '3rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.25rem' }}>

          {/* Top - logo */}
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', margin: '0 auto 0.75rem', border: '3px solid var(--maroon)', boxShadow: '0 4px 16px rgba(107,32,32,0.2)' }}>
              <img src="/tiggy.png" alt="Tiggy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <h3 style={{ fontFamily: 'Playfair Display, serif', color: 'var(--maroon)', margin: 0, fontSize: '1.5rem' }}>Tiggy's Kingdom</h3>
            <p style={{ color: 'var(--gold)', fontWeight: 700, margin: '0.25rem 0 0', fontSize: '0.95rem' }}>Where Faith &amp; Wonder Meet ✦</p>
          </div>

          {/* Link columns */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
            {FOOTER_COLS.map(col => (
              <div key={col.heading}>
                <h4 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: '0.8rem', letterSpacing: '0.1em', color: 'var(--maroon)', margin: '0 0 0.75rem' }}>
                  {col.heading}
                </h4>
                {col.links.map(l => (
                  <p key={l.label} style={{ margin: '0.4rem 0' }}>
                    <Link to={l.to} style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem', transition: 'color 0.15s', textDecoration: 'none' }}
                      onMouseEnter={e => (e.target as HTMLAnchorElement).style.color = 'var(--maroon)'}
                      onMouseLeave={e => (e.target as HTMLAnchorElement).style.color = 'var(--text-secondary)'}
                    >{l.label}</Link>
                  </p>
                ))}
              </div>
            ))}

            {/* Social + newsletter */}
            <div>
              <h4 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: '0.8rem', letterSpacing: '0.1em', color: 'var(--maroon)', margin: '0 0 0.75rem' }}>NEWSLETTER</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, margin: '0 0 0.5rem' }}>Join Tiggy's Flock</p>
              <form style={{ display: 'flex', gap: '0.4rem' }} onSubmit={handleFooterSubscribe}>
                <input type="email" placeholder="Email" className="tk-input" style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }} value={footerEmail} onChange={e => setFooterEmail(e.target.value)} required />
                <button type="submit" className="btn-gold" style={{ padding: '0.5rem 0.875rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>Join</button>
              </form>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                {['𝕏', '✉', 'f', '📸', '▶'].map((icon, i) => (
                  <a key={i} href="#" style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--cream-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--maroon)', fontWeight: 700, fontSize: '0.85rem', transition: 'background 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'var(--maroon)'; (e.currentTarget as HTMLAnchorElement).style.color = 'white'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'var(--cream-dark)'; (e.currentTarget as HTMLAnchorElement).style.color = 'var(--maroon)'; }}
                  >{icon}</a>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ borderTop: '1px solid var(--cream-border)', padding: '1.25rem 0', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              © 2025 Tiggy's Kingdom · <a href="#" style={{ color: 'var(--text-muted)' }}>Privacy</a> · <a href="#" style={{ color: 'var(--text-muted)' }}>Terms</a> · <a href="#" style={{ color: 'var(--text-muted)' }}>Cookies</a>
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {['✓ Theologically Reviewed', '✓ Ad-Free Always', '✓ Orthodox Values'].map(b => (
                <span key={b} style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--gold-dark)' }}>{b}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>
      {/* ===== BACK TO TOP ===== */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Back to top"
          style={{
            position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 50,
            width: 44, height: 44, borderRadius: '50%',
            background: 'var(--maroon)', color: 'white', border: 'none',
            fontSize: '1.2rem', cursor: 'pointer', boxShadow: '0 4px 16px rgba(107,32,32,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(107,32,32,0.45)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(107,32,32,0.35)'; }}
        >↑</button>
      )}
    </div>
  );
}
