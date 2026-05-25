import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { API } from '../lib/api';
import { usePageMeta } from '../hooks/usePageMeta';
import { COVER_COLORS, COVER_DARKS } from '../lib/constants';

const STORY_CATEGORIES = ['story', 'saint', 'prayer'];
const BADGE_COLORS: Record<string, string> = { BESTSELLER: '#7C3AED', NEW: '#22C55E', POPULAR: '#F97316' };
const AGE_FILTERS: { label: string; value: string | null }[] = [
  { label: 'All Ages', value: null },
  { label: '3–5', value: '3' },
  { label: '5–8', value: '5' },
  { label: '8–12', value: '8' },
];

interface Product {
  id: number;
  title: string;
  author?: string;
  price: number;
  originalPrice?: number;
  category: string;
  ages?: string;
  stock?: number;
  badge?: string | null;
}

export default function Stories() {
  usePageMeta('Stories & Books', 'Orthodox Christian picture books, saint lives, coloring books, and prayer books for children aged 3–12.');
  const [products, setProducts] = useState<Product[]>([]);
  const [ageFilter, setAgeFilter] = useState<string | null>(null);
  const { addToCart } = useCart();
  const { addToast } = useToast();

  useEffect(() => {
    fetch(`${API}/api/products`)
      .then(r => r.json())
      .then(data => setProducts(Array.isArray(data) ? data.filter(p => STORY_CATEGORIES.includes(p.category)) : []))
      .catch(() => {});
  }, []);

  const filtered = ageFilter
    ? products.filter(p => p.ages && Number(p.ages.split('-')[0]) <= Number(ageFilter) && Number(p.ages.split('-')[1]) >= Number(ageFilter))
    : products;

  const handleAdd = (product: Product) => {
    if (Number(product.stock) === 0) return;
    addToCart(product);
    addToast(`"${product.title}" added to cart!`, 'success');
  };

  return (
    <div style={{ minHeight: '70vh', background: 'var(--cream)' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, var(--cream-dark) 0%, var(--gold-pale) 100%)', padding: '3rem 1.25rem', textAlign: 'center', borderBottom: '2px solid var(--cream-border)' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
          <img src="/tiggy.png" alt="Tiggy" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--maroon)', flexShrink: 0 }} />
          <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.15rem', color: 'var(--maroon)', lineHeight: 1.1, textAlign: 'left' }}>
            Tiggy's<br /><span style={{ fontSize: '0.78rem', fontWeight: 400, color: 'var(--gold)', letterSpacing: '0.08em' }}>KINGDOM</span>
          </span>
        </div>
        <h1 style={{ color: 'var(--maroon)', margin: '0 0 0.75rem', fontSize: 'clamp(1.75rem, 4vw, 2.75rem)' }}>Sacred Stories</h1>
        <p style={{ color: 'var(--text-secondary)', fontWeight: 600, margin: '0 auto', maxWidth: 560 }}>
          Beautiful storybooks about Jesus, the saints, and the wonders of Orthodox faith — crafted with love for children ages 3–12.
        </p>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 1.25rem' }}>
        {/* Age filters */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem', justifyContent: 'center' }}>
          {AGE_FILTERS.map(f => (
            <button
              key={f.label}
              onClick={() => setAgeFilter(f.value)}
              style={{
                padding: '0.45rem 1.25rem', borderRadius: '9999px', cursor: 'pointer',
                border: ageFilter === f.value ? 'none' : '1.5px solid var(--cream-border)',
                background: ageFilter === f.value ? 'var(--maroon)' : 'white',
                color: ageFilter === f.value ? 'white' : 'var(--text-secondary)',
                fontWeight: 700, fontSize: '0.875rem', transition: 'all 0.15s',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Book grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📖</div>
            <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>No stories found for this age range.</p>
            <button onClick={() => setAgeFilter(null)} style={{ marginTop: '1rem', background: 'none', border: 'none', color: 'var(--gold)', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}>
              Show all stories →
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
            {filtered.map(product => {
              const outOfStock = Number(product.stock) === 0;
              const c = product.id % COVER_COLORS.length;
              return (
                <div key={product.id} className="card" style={{ position: 'relative', opacity: outOfStock ? 0.85 : 1 }}>
                  {/* Cover art */}
                  <div style={{
                    position: 'relative',
                    background: `linear-gradient(160deg, ${COVER_COLORS[c]}, ${COVER_DARKS[c]})`,
                    paddingTop: '60%',
                    borderRadius: '0.75rem 0.75rem 0 0',
                  }}>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>📖</div>
                    {product.badge && !outOfStock && (
                      <span style={{ position: 'absolute', top: 10, left: 10, background: BADGE_COLORS[product.badge] || 'var(--maroon)', color: 'white', borderRadius: '0.4rem', padding: '0.2rem 0.6rem', fontSize: '0.7rem', fontWeight: 900 }}>
                        {product.badge}
                      </span>
                    )}
                    {outOfStock && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0.75rem 0.75rem 0 0' }}>
                        <span style={{ color: 'white', fontWeight: 900, fontSize: '0.875rem', background: 'rgba(0,0,0,0.4)', padding: '0.4rem 0.875rem', borderRadius: '0.375rem' }}>OUT OF STOCK</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ padding: '1rem' }}>
                    <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: '0.95rem', margin: '0 0 0.25rem', color: 'var(--text-primary)' }}>{product.title}</h3>
                    <p style={{ margin: '0 0 0.625rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{product.author}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
                      <span style={{ background: '#DBEAFE', color: '#1D4ED8', borderRadius: '0.375rem', padding: '0.15rem 0.5rem', fontSize: '0.72rem', fontWeight: 700 }}>Ages {product.ages}</span>
                      <div>
                        <span style={{ fontWeight: 900, color: 'var(--maroon)', fontSize: '1.05rem' }}>${Number(product.price).toFixed(2)}</span>
                        {product.originalPrice && <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '0.78rem', marginLeft: '0.35rem' }}>${Number(product.originalPrice).toFixed(2)}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleAdd(product)}
                      disabled={outOfStock}
                      className={outOfStock ? '' : 'btn-maroon'}
                      style={outOfStock ? {
                        width: '100%', padding: '0.6rem', borderRadius: '0.625rem',
                        background: 'var(--cream-border)', color: 'var(--text-muted)',
                        border: 'none', fontWeight: 700, fontSize: '0.875rem', cursor: 'not-allowed',
                      } : { width: '100%', justifyContent: 'center', padding: '0.6rem', fontSize: '0.875rem' }}
                    >
                      {outOfStock ? 'Out of Stock' : '+ Add to Cart'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--cream-border)' }}>
          <p style={{ color: 'var(--text-muted)', fontWeight: 600, marginBottom: '1rem' }}>Looking for coloring books, gift bundles, or activity sets?</p>
          <Link to="/shop" className="btn-gold" style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}>Browse the Full Shop →</Link>
        </div>
      </div>
    </div>
  );
}
