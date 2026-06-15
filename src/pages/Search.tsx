import { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { API } from '../lib/api';
import { usePageMeta } from '../hooks/usePageMeta';
import { COVER_COLORS, COVER_DARKS } from '../lib/constants';

interface Product {
  id: number;
  title: string;
  author?: string;
  price: number;
  category: string;
  stock?: number;
  badge?: string | null;
}

interface Episode {
  id: string;
  videoId: string;
  title: string;
  description?: string;
  ages?: string;
  category?: string;
}

interface Activity {
  id: string;
  icon: string;
  title: string;
  desc: string;
  tags: string[];
  cta: string;
  ctaColor: string;
  active: boolean;
}

type ResultSection = { products: Product[]; episodes: Episode[]; activities: Activity[] };

const EMPTY: ResultSection = { products: [], episodes: [], activities: [] };

export default function Search() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const [query, setQuery] = useState(q);
  const [results, setResults] = useState<ResultSection>(EMPTY);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addToCart } = useCart();
  const { addToast } = useToast();

  usePageMeta(q ? `Search: "${q}"` : 'Search', 'Search Tiggy\'s Kingdom for books, episodes, and activities.');

  useEffect(() => {
    setQuery(q);
    if (!q.trim()) { setResults(EMPTY); return; }
    setLoading(true);

    const term = q.trim().toLowerCase();

    // Pull YouTube videos from the local cache set by the Lessons page
    const ytCached: { id: string; title: string; description?: string }[] = (() => {
      try {
        const s = localStorage.getItem('tk_yt_lessons_v6');
        if (!s) return [];
        const { data } = JSON.parse(s);
        return Array.isArray(data) ? data : [];
      } catch { return []; }
    })();

    Promise.all([
      fetch(`${API}/api/products`).then(r => r.json()).catch(() => []),
      fetch(`${API}/api/episodes`).then(r => r.json()).catch(() => []),
    ]).then(([allProducts, allSupabaseEpisodes]) => {
      const products = (Array.isArray(allProducts) ? allProducts : []).filter((p: Product) =>
        p.title?.toLowerCase().includes(term) ||
        p.author?.toLowerCase().includes(term) ||
        p.category?.toLowerCase().includes(term)
      );

      // Merge Supabase episodes + YouTube cache, deduplicate by videoId/id
      const supabaseEps: Episode[] = (Array.isArray(allSupabaseEpisodes) ? allSupabaseEpisodes : []).filter((e: Episode) =>
        e.title?.toLowerCase().includes(term) ||
        e.description?.toLowerCase().includes(term) ||
        e.category?.toLowerCase().includes(term)
      );
      const ytEps: Episode[] = ytCached
        .filter(v => v.title?.toLowerCase().includes(term) || v.description?.toLowerCase().includes(term))
        .map(v => ({ id: v.id, videoId: v.id, title: v.title, description: v.description }));

      const seenIds = new Set(supabaseEps.map(e => e.videoId || e.id));
      const episodes = [...supabaseEps, ...ytEps.filter(e => !seenIds.has(e.videoId))];

      const rawActivities: Activity[] = (() => {
        try { return JSON.parse(localStorage.getItem('tk_activities') || '[]'); } catch { return []; }
      })();
      const activities = rawActivities.filter(a =>
        a.active &&
        (a.title?.toLowerCase().includes(term) ||
         a.desc?.toLowerCase().includes(term) ||
         a.tags?.some(t => t.toLowerCase().includes(term)))
      );

      setResults({ products, episodes, activities });
      setLoading(false);
    });
  }, [q]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) setParams({ q: query.trim() });
  };

  const total = results.products.length + results.episodes.length + results.activities.length;

  return (
    <div style={{ minHeight: '70vh', background: 'var(--cream)' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, var(--cream-dark) 0%, var(--gold-pale) 100%)', padding: '3rem 1.25rem 2.5rem', textAlign: 'center', borderBottom: '2px solid var(--cream-border)' }}>
        <h1 style={{ color: 'var(--maroon)', margin: '0 0 1.25rem', fontSize: 'clamp(1.5rem, 3vw, 2.25rem)' }}>
          {q ? <>Results for "<span style={{ color: 'var(--gold-dark)' }}>{q}</span>"</> : 'Search Tiggy\'s Kingdom'}
        </h1>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', maxWidth: 520, margin: '0 auto' }}>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search books, episodes, activities…"
            className="tk-input"
            style={{ flex: 1, padding: '0.75rem 1rem', fontSize: '1rem' }}
            autoFocus
          />
          <button type="submit" className="btn-maroon" style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}>Search</button>
        </form>
        {q && !loading && (
          <p style={{ margin: '0.75rem 0 0', fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {total === 0 ? 'No results found.' : `${total} result${total !== 1 ? 's' : ''} found`}
          </p>
        )}
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 1.25rem' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔍</div>
            <p style={{ fontWeight: 700 }}>Searching…</p>
          </div>
        )}

        {!loading && !q && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🐑</div>
            <p style={{ fontWeight: 700, fontSize: '1.05rem' }}>What are you looking for?</p>
            <p style={{ fontWeight: 600, fontSize: '0.9rem', marginTop: '0.5rem' }}>Try searching for a saint, a topic, or "coloring".</p>
          </div>
        )}

        {!loading && q && total === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😔</div>
            <p style={{ fontWeight: 800, color: 'var(--maroon)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Nothing matched "{q}"</p>
            <p style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Try different words, or browse our sections below.</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
              {[['Watch Episodes', '/episodes'], ['Stories & Books', '/stories'], ['Activities', '/activities'], ['Prayer Corner', '/calendar']].map(([label, to]) => (
                <Link key={to} to={to} className="btn-gold" style={{ padding: '0.55rem 1.25rem', fontSize: '0.875rem', textDecoration: 'none' }}>{label}</Link>
              ))}
            </div>
          </div>
        )}

        {!loading && results.products.length > 0 && (
          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ color: 'var(--maroon)', margin: '0 0 1.25rem', fontSize: '1.25rem', borderBottom: '2px solid var(--cream-border)', paddingBottom: '0.5rem' }}>
              📖 Books &amp; Products ({results.products.length})
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
              {results.products.map(p => {
                const outOfStock = Number(p.stock) === 0;
                const c = p.id % COVER_COLORS.length;
                return (
                  <div key={p.id} className="card" style={{ position: 'relative', opacity: outOfStock ? 0.8 : 1 }}>
                    <Link to={`/shop/${p.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                      <div style={{ background: `linear-gradient(160deg, ${COVER_COLORS[c]}, ${COVER_DARKS[c]})`, paddingTop: '55%', borderRadius: '0.75rem 0.75rem 0 0', position: 'relative' }}>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>📖</div>
                      </div>
                    </Link>
                    <div style={{ padding: '0.875rem' }}>
                      <p style={{ margin: '0 0 0.25rem', fontWeight: 800, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{p.title}</p>
                      {p.author && <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{p.author}</p>}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 900, color: 'var(--maroon)' }}>${Number(p.price).toFixed(2)}</span>
                        <button
                          onClick={() => { if (outOfStock) return; addToCart(p); addToast(`"${p.title}" added!`, 'success'); }}
                          disabled={outOfStock}
                          className={outOfStock ? '' : 'btn-maroon'}
                          style={outOfStock ? { background: 'var(--cream-border)', color: 'var(--text-muted)', border: 'none', borderRadius: '0.4rem', padding: '0.3rem 0.6rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'not-allowed' } : { padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                        >
                          {outOfStock ? 'Out of stock' : '+ Cart'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {!loading && results.episodes.length > 0 && (
          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ color: 'var(--maroon)', margin: '0 0 1.25rem', fontSize: '1.25rem', borderBottom: '2px solid var(--cream-border)', paddingBottom: '0.5rem' }}>
              ▶ Episodes ({results.episodes.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {results.episodes.map(ep => (
                <Link key={ep.id} to="/episodes" state={{ resumeVideoId: ep.videoId }} style={{ textDecoration: 'none' }}>
                  <div className="card" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'white' }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--cream-dark)'}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'white'}
                  >
                    <div style={{ width: 88, height: 52, borderRadius: '0.5rem', overflow: 'hidden', flexShrink: 0, background: '#1A4FA0', position: 'relative' }}>
                      <img src={`https://i.ytimg.com/vi/${ep.videoId}/mqdefault.jpg`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)' }}>
                        <span style={{ color: 'white', fontSize: '1.1rem' }}>▶</span>
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.925rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ep.title}</p>
                      {ep.description && <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ep.description}</p>}
                    </div>
                    {ep.ages && <span style={{ background: 'var(--cream)', padding: '0.15rem 0.5rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0 }}>{ep.ages}</span>}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {!loading && results.activities.length > 0 && (
          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ color: 'var(--maroon)', margin: '0 0 1.25rem', fontSize: '1.25rem', borderBottom: '2px solid var(--cream-border)', paddingBottom: '0.5rem' }}>
              🎨 Activities ({results.activities.length})
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
              {results.activities.map(a => (
                <Link key={a.id} to="/activities" style={{ textDecoration: 'none' }}>
                  <div className="card" style={{ padding: '1.25rem', background: 'white' }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--cream-dark)'}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'white'}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: '0.625rem', background: `${a.ctaColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', marginBottom: '0.75rem' }}>{a.icon}</div>
                    <p style={{ margin: '0 0 0.375rem', fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{a.title}</p>
                    <p style={{ margin: '0 0 0.625rem', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, lineHeight: 1.5 }}>{a.desc}</p>
                    <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                      {a.tags.map(tag => <span key={tag} style={{ background: 'var(--cream-dark)', color: 'var(--text-muted)', borderRadius: '9999px', padding: '0.1rem 0.5rem', fontSize: '0.7rem', fontWeight: 700 }}>{tag}</span>)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
