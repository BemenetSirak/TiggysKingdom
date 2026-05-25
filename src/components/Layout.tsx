import { useState, useRef, useEffect, ReactNode, FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { API as NEWSLETTER_API } from '../lib/api';

const NAV_LINKS = [
  { label: 'Home',          to: '/'           },
  { label: 'Watch',         to: '/episodes'   },
  { label: 'Activities',    to: '/activities' },
  { label: 'Prayer Corner', to: '/calendar'   },
  { label: 'Parents',       to: '/subscribe'  },
  { label: 'Our Mission',   to: '/about'      },
];

const BREADCRUMB_LABELS: Record<string, string> = {
  '/episodes': 'Watch', '/lessons': 'Watch', '/shop': 'Shop', '/cart': 'Cart',
  '/orders': 'My Orders', '/success': 'Order Confirmed', '/dashboard': 'Dashboard',
  '/activities': 'Activities', '/subscribe': 'Parents', '/about': 'Our Mission',
  '/stories': 'Stories', '/calendar': 'Prayer Corner', '/terms': 'Terms of Service',
  '/privacy': 'Privacy Policy',
};

const FOOTER_COLS = [
  {
    heading: 'Explore',
    links: [
      { label: 'Watch Episodes',    to: '/episodes'   },
      { label: 'Activities for Kids', to: '/activities' },
      { label: 'Prayer Corner',     to: '/calendar'   },
      { label: 'Bookshop',          to: '/shop'       },
    ],
  },
  {
    heading: 'For Grown-Ups',
    links: [
      { label: 'Teacher Resources', to: '/about'      },
      { label: 'Our Mission',       to: '/about'      },
      { label: 'Safety & Values',   to: '/about'      },
      { label: 'Subscribe',         to: '/subscribe'  },
    ],
  },
  {
    heading: 'Kingdom Mail',
    links: [
      { label: 'Join the Newsletter', to: '/subscribe' },
      { label: 'Free Printables',     to: '/activities' },
      { label: 'Feast Reminders',     to: '/calendar'  },
      { label: 'Contact Us',          to: '/about'     },
    ],
  },
];

export default function Layout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen]   = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [badgeAnim, setBadgeAnim]     = useState(false);
  const [mobileEmail, setMobileEmail] = useState('');
  const [footerEmail, setFooterEmail] = useState('');
  const [showBackToTop, setShowBackToTop] = useState(false);

  const { user, logout }       = useAuth();
  const { cartCount }          = useCart();
  const { addToast }           = useToast();
  const navigate               = useNavigate();
  const location               = useLocation();
  const menuRef                = useRef<HTMLDivElement>(null);
  const searchInputRef         = useRef<HTMLInputElement>(null);
  const prevCartCount          = useRef(cartCount);

  const isActive = (to: string) => to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

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
    addToast("You've joined Tiggy's Kingdom Mail!", 'success');
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
    addToast("You've joined Tiggy's Kingdom Mail!", 'success');
    setMobileEmail('');
    setMobileOpen(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--cream)' }}>
      <a href="#main-content" style={{ position: 'absolute', top: -60, left: 0, background: 'var(--maroon)', color: 'white', padding: '0.5rem 1rem', fontWeight: 700, borderRadius: '0 0 0.5rem 0', zIndex: 9999, transition: 'top 0.2s' }} onFocus={e => e.currentTarget.style.top = '0'} onBlur={e => e.currentTarget.style.top = '-60px'}>Skip to content</a>

      {/* ===== ANNOUNCEMENT BAR ===== */}
      <div style={{ background: '#1B2A4A', padding: '0.45rem 1.25rem', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.04em' }}>
          + NEW STORY EVERY SUNDAY &nbsp;·&nbsp; <span style={{ color: '#F5C842' }}>FREE SHIPPING</span> OVER $40 &nbsp;·&nbsp; MADE FOR ORTHODOX FAMILIES +
        </p>
      </div>

      {/* ===== NAVBAR ===== */}
      <nav style={{ background: 'white', borderBottom: '1px solid var(--cream-border)', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.25rem', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>

          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none', flexShrink: 0 }}>
            <img src="/tiggy.png" alt="Tiggy" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--cream-border)' }} />
            <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.2rem', color: 'var(--maroon)', lineHeight: 1.1 }}>
              Tiggy's<br />
              <span style={{ fontSize: '0.78rem', fontWeight: 400, color: 'var(--gold)', letterSpacing: '0.08em' }}>KINGDOM</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="desktop-nav" style={{ alignItems: 'center', gap: '0.125rem', flex: 1, justifyContent: 'center' }}>
            {NAV_LINKS.map(l => (
              <Link
                key={l.to}
                to={l.to}
                style={{
                  padding: '0.45rem 0.875rem',
                  borderRadius: '0.5rem',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  color: isActive(l.to) ? 'var(--maroon)' : 'var(--text-secondary)',
                  background: isActive(l.to) ? 'var(--cream-dark)' : 'transparent',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => { if (!isActive(l.to)) (e.currentTarget as HTMLAnchorElement).style.color = 'var(--maroon)'; }}
                onMouseLeave={e => { if (!isActive(l.to)) (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-secondary)'; }}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Desktop right actions */}
          <div className="desktop-nav" style={{ alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>

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
                  style={{ width: 180, padding: '0.35rem 0.75rem', fontSize: '0.875rem' }}
                  onBlur={() => { if (!searchQuery.trim()) setSearchOpen(false); }}
                />
                <button type="submit" style={{ background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer', padding: '0.25rem', color: 'var(--text-muted)' }}>🔍</button>
                <button type="button" onClick={() => { setSearchOpen(false); setSearchQuery(''); }} style={{ background: 'none', border: 'none', fontSize: '0.875rem', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}>✕</button>
              </form>
            ) : (
              <button onClick={() => setSearchOpen(true)} style={{ background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer', padding: '0.4rem', borderRadius: '0.5rem', color: 'var(--text-muted)', opacity: 0.7 }} aria-label="Search">🔍</button>
            )}

            {/* Cart */}
            <Link to="/cart" style={{ position: 'relative', padding: '0.4rem', borderRadius: '0.5rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
              🛒
              {cartCount > 0 && (
                <span className={badgeAnim ? 'cart-badge-pop' : ''} style={{ position: 'absolute', top: 0, right: 0, background: 'var(--maroon)', color: 'white', borderRadius: '50%', width: 17, height: 17, fontSize: '0.6rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Shop Books — primary CTA */}
            <Link to="/shop" className="btn-gold" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}>
              Shop Books
            </Link>

            {/* User auth */}
            {user ? (
              <div ref={menuRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setUserMenuOpen(o => !o)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', cursor: 'pointer', padding: '0.3rem 0.5rem', borderRadius: '0.5rem' }}
                >
                  <div className="avatar-ring" style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--maroon)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '0.8rem' }}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{userMenuOpen ? '▲' : '▼'}</span>
                </button>
                {userMenuOpen && (
                  <div className="user-dropdown" style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: 'white', borderRadius: '0.875rem', boxShadow: '0 8px 32px rgba(107,32,32,0.15)', border: '1px solid var(--cream-border)', minWidth: 180, overflow: 'hidden', zIndex: 100 }}>
                    {[
                      { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
                      { to: '/orders',    icon: '📦', label: 'My Orders'  },
                    ].map(l => (
                      <Link key={l.to} to={l.to} onClick={() => setUserMenuOpen(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.625rem 1rem', fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-secondary)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--cream)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <span>{l.icon}</span> {l.label}
                      </Link>
                    ))}
                    <div style={{ borderTop: '1px solid var(--cream-border)' }} />
                    <button onClick={handleLogout}
                      style={{ display: 'flex', width: '100%', alignItems: 'center', gap: '0.625rem', padding: '0.625rem 1rem', fontWeight: 700, fontSize: '0.875rem', color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <span>↩</span> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-secondary)', padding: '0.4rem 0.625rem', borderRadius: '0.5rem' }}>
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile right */}
          <div className="mobile-nav-btn" style={{ alignItems: 'center', gap: '0.75rem' }}>
            <Link to="/cart" style={{ position: 'relative', color: 'var(--maroon)', fontSize: '1.25rem' }}>
              🛒
              {cartCount > 0 && (
                <span className={badgeAnim ? 'cart-badge-pop' : ''} style={{ position: 'absolute', top: -6, right: -6, background: 'var(--maroon)', color: 'white', borderRadius: '50%', width: 17, height: 17, fontSize: '0.6rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {cartCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMobileOpen(true)}
              style={{ background: 'none', border: 'none', fontSize: '1.4rem', color: 'var(--maroon)', padding: '0.25rem' }}
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
              <img src="/tiggy.png" alt="Tiggy" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} />
              <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.1rem', color: 'var(--maroon)' }}>Tiggy's Kingdom</span>
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button onClick={() => setMobileOpen(false)} style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--maroon)', color: 'white', border: 'none', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
          </div>

          <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {NAV_LINKS.map(l => (
              <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', padding: '0.875rem 1.25rem',
                  borderRadius: '0.875rem', background: isActive(l.to) ? 'var(--gold-pale)' : 'transparent',
                  color: 'var(--maroon)', fontWeight: 800, fontSize: '1.05rem',
                }}
              >
                {l.label}
              </Link>
            ))}
            <Link to="/shop" onClick={() => setMobileOpen(false)} className="btn-gold" style={{ marginTop: '0.5rem', justifyContent: 'center', textAlign: 'center' }}>
              Shop Books
            </Link>
          </div>

          <div style={{ padding: '0 1.25rem', borderTop: '1px solid var(--cream-border)', paddingTop: '1rem' }}>
            {user ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--cream)', borderRadius: '0.75rem', marginBottom: '0.25rem' }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--maroon)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '0.95rem', flexShrink: 0 }}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontWeight: 800, color: 'var(--maroon)', margin: 0, fontSize: '0.9rem' }}>{user.name}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, fontWeight: 600 }}>{user.email}</p>
                  </div>
                </div>
                {[{ to: '/dashboard', icon: '🏠', label: 'Dashboard' }, { to: '/orders', icon: '📦', label: 'My Orders' }].map(l => (
                  <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '0.75rem', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    <span>{l.icon}</span> {l.label}
                  </Link>
                ))}
                <button onClick={handleLogout} className="btn-outline-maroon" style={{ width: '100%', justifyContent: 'center', marginTop: '0.25rem' }}>Sign Out</button>
              </div>
            ) : (
              <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-maroon" style={{ width: '100%', justifyContent: 'center', textAlign: 'center' }}>
                Sign In / Register
              </Link>
            )}
          </div>

          <div style={{ padding: '1.5rem 1.25rem 0' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>Join Tiggy's Kingdom Mail for weekly stories!</p>
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

      {/* ===== FOOTER (dark navy) ===== */}
      <footer style={{ background: '#1B2A4A', paddingTop: '3.5rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.25rem' }}>

          {/* Top row — logo + tagline + social */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2.5rem', marginBottom: '3rem', alignItems: 'start' }}>
            <div>
              <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', marginBottom: '1rem' }}>
                <div style={{ width: 50, height: 50, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.2)', flexShrink: 0 }}>
                  <img src="/tiggy.png" alt="Tiggy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.35rem', color: 'white', lineHeight: 1.1 }}>
                  Tiggy's<br />
                  <span style={{ fontSize: '0.82rem', fontWeight: 400, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.1em' }}>KINGDOM</span>
                </span>
              </Link>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 500, fontSize: '0.875rem', lineHeight: 1.65, margin: '0 0 1.5rem', maxWidth: 260 }}>
                Orthodox Christian stories that help little hearts grow in faith, wonder, and love. Made with prayer by an Orthodox family.
              </p>
              <div style={{ display: 'flex', gap: '0.625rem' }}>
                {['▶', 'f', '📸', '✉'].map((icon, i) => (
                  <a key={i} href="#" style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.7)', fontWeight: 700, fontSize: '0.8rem', transition: 'background 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.2)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.1)'; }}
                  >{icon}</a>
                ))}
              </div>
            </div>

            {FOOTER_COLS.map(col => (
              <div key={col.heading}>
                <h4 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: '0.8rem', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.9)', margin: '0 0 1rem', textTransform: 'uppercase' }}>
                  {col.heading}
                </h4>
                {col.links.map(l => (
                  <p key={l.label} style={{ margin: '0.45rem 0' }}>
                    <Link to={l.to} style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600, fontSize: '0.875rem', transition: 'color 0.15s', textDecoration: 'none' }}
                      onMouseEnter={e => (e.target as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.9)'}
                      onMouseLeave={e => (e.target as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.5)'}
                    >{l.label}</Link>
                  </p>
                ))}
              </div>
            ))}

            {/* Newsletter column */}
            <div>
              <h4 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: '0.8rem', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.9)', margin: '0 0 0.625rem', textTransform: 'uppercase' }}>Newsletter</h4>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600, margin: '0 0 0.75rem', lineHeight: 1.5 }}>
                Weekly stories, free printables &amp; feast reminders.
              </p>
              <form style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }} onSubmit={handleFooterSubscribe}>
                <input type="email" placeholder="Your email" className="tk-input" style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem', background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.15)', color: 'white' }} value={footerEmail} onChange={e => setFooterEmail(e.target.value)} required />
                <button type="submit" className="btn-gold" style={{ padding: '0.5rem 0.875rem', fontSize: '0.85rem' }}>Subscribe</button>
              </form>
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '1.25rem 0', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
              © {new Date().getFullYear()} Tiggy's Kingdom ·{' '}
              <Link to="/privacy" style={{ color: 'rgba(255,255,255,0.35)' }}>Privacy</Link> ·{' '}
              <Link to="/terms" style={{ color: 'rgba(255,255,255,0.35)' }}>Terms</Link>
            </p>
            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
              {['✓ Theologically Reviewed', '✓ Ad-Free Always', '✓ Orthodox Values'].map(b => (
                <span key={b} style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{b}</span>
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
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        >↑</button>
      )}
    </div>
  );
}
