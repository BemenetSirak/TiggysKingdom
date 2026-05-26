import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useAuth, type OrderActivity } from '../context/AuthContext';
import { usePageMeta } from '../hooks/usePageMeta';

import { API } from '../lib/api';
import { COVER_COLORS, COVER_DARKS } from '../lib/constants';

interface Product {
  id: number;
  title: string;
  author?: string;
  price: number;
  originalPrice?: number | null;
  category: string;
  badge?: string | null;
  badgeColor?: string | null;
  ages?: string;
  rating?: number;
  reviews?: number;
  sold?: number;
  stock?: number;
  active?: boolean;
  quantity?: number;
}

const BADGE_COLORS: Record<string, string> = {
  'BESTSELLER': '#7C3AED',
  'NEW': '#22C55E',
  'FREE ACTIVITY': '#3B82F6',
  'POPULAR': '#F5C842',
  'SAVE 28%': '#EF4444',
};

const CATEGORIES = [
  { id: 'all', label: '📚 All', color: '#EF4444' },
  { id: 'story', label: '📖 Story Books', color: '#F97316' },
  { id: 'coloring', label: '🎨 Coloring Books', color: '#3B82F6' },
  { id: 'prayer', label: '⭐ Prayer Books', color: '#F5C842' },
  { id: 'saint', label: '✝ Saint Lives', color: '#7C3AED' },
  { id: 'gift', label: '🎁 Gift Sets', color: '#22C55E' },
];

const PRODUCTS = [
  { id: 1, title: 'Saint Yared: The Gift of Song', author: 'By Maria Tesnaye', price: 14.99, originalPrice: 19.99, category: 'saint', badge: 'BESTSELLER', badgeColor: '#7C3AED', ages: '5-8', rating: 4.8, reviews: 186 },
  { id: 2, title: "Tiggy's First Fast", author: 'By Sarah Alemu', price: 12.99, originalPrice: null, category: 'story', badge: 'NEW', badgeColor: '#22C55E', ages: '4-7', rating: 5.0, reviews: 43 },
  { id: 3, title: 'The Good Shepherd Coloring Book', author: "Tiggy's Kingdom", price: 9.99, originalPrice: null, category: 'coloring', badge: 'FREE ACTIVITY', badgeColor: '#3B82F6', ages: '4-10', rating: 4.7, reviews: 89 },
  { id: 4, title: "Saint Nicholas: Keeper of Hope", author: 'By Fr. Daniel Yosef', price: 14.99, originalPrice: 17.99, category: 'saint', badge: null, badgeColor: null, ages: '5-9', rating: 4.9, reviews: 112 },
  { id: 5, title: 'The Holy Liturgy for Little Ones', author: "Tiggy's Kingdom", price: 11.99, originalPrice: null, category: 'prayer', badge: 'POPULAR', badgeColor: '#F5C842', ages: '3-8', rating: 4.8, reviews: 67 },
  { id: 6, title: 'Advent Coloring Journey', author: 'By Hana Tesfaye', price: 8.99, originalPrice: 12.99, category: 'coloring', badge: null, badgeColor: null, ages: '5-12', rating: 4.6, reviews: 34 },
  { id: 7, title: "Saint Mary's Story", author: 'By Sister Miriam', price: 14.99, originalPrice: null, category: 'saint', badge: 'NEW', badgeColor: '#22C55E', ages: '4-8', rating: 4.9, reviews: 28 },
  { id: 8, title: 'Faith Family Gift Bundle', author: '4 books + activity set', price: 49.99, originalPrice: 69.99, category: 'gift', badge: 'SAVE 28%', badgeColor: '#EF4444', ages: '4-12', rating: 5.0, reviews: 21 },
];

const SORT_OPTIONS = [
  { id: 'popular', label: 'Most Popular' },
  { id: 'new', label: 'Newest First' },
  { id: 'price-asc', label: 'Price: Low to High' },
  { id: 'price-desc', label: 'Price: High to Low' },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <span style={{ color: '#F5C842', fontSize: '0.85rem' }}>
      {'★'.repeat(Math.floor(rating))}
      {rating % 1 >= 0.5 ? '½' : ''}
    </span>
  );
}

const CATEGORY_ICONS: Record<string, string> = { saint: '✝', story: '✦', prayer: '🙏', coloring: '🎨', gift: '🎁' };

function BookCover({ product }: { product: Product }) {
  const c = product.id % COVER_COLORS.length;
  const icon = CATEGORY_ICONS[product.category] || '✦';
  const authorShort = (product.author || '').replace(/^By\s+/i, '');
  return (
    <div style={{
      width: 108, height: 152,
      background: `linear-gradient(160deg, ${COVER_COLORS[c]}, ${COVER_DARKS[c]})`,
      borderRadius: '3px 6px 6px 3px',
      boxShadow: '4px 6px 16px rgba(0,0,0,0.35), inset -2px 0 4px rgba(0,0,0,0.2)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'space-between', padding: '0.6rem 0.5rem 0.5rem',
      overflow: 'hidden', position: 'relative',
    }}>
      {/* Spine shadow */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, background: 'rgba(0,0,0,0.25)', borderRadius: '3px 0 0 3px' }} />
      {/* Top gold stripe */}
      <div style={{ position: 'absolute', top: 0, left: 6, right: 0, height: 4, background: 'rgba(201,146,42,0.6)' }} />
      {/* Category icon */}
      <span style={{ fontSize: '1.1rem', opacity: 0.85, zIndex: 1 }}>{icon}</span>
      {/* Title */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0.25rem 0', zIndex: 1 }}>
        <p style={{
          color: 'white', fontFamily: 'Playfair Display, serif', fontWeight: 700,
          fontSize: '0.52rem', lineHeight: 1.35, margin: 0, textAlign: 'center',
          display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          textShadow: '0 1px 3px rgba(0,0,0,0.4)',
        }}>
          {product.title}
        </p>
      </div>
      {/* Author */}
      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.42rem', margin: 0, textAlign: 'center', fontWeight: 600, zIndex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
        {authorShort}
      </p>
      {/* Bottom gold stripe */}
      <div style={{ position: 'absolute', bottom: 0, left: 6, right: 0, height: 3, background: 'rgba(201,146,42,0.4)' }} />
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', pointerEvents: 'none' }}>
      <div style={{ padding: '2rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
        <div className="skeleton" style={{ width: 108, height: 152, borderRadius: '0.4rem' }} />
      </div>
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div className="skeleton" style={{ height: 13, width: '55%', borderRadius: '0.3rem' }} />
        <div className="skeleton" style={{ height: 18, width: '90%', borderRadius: '0.3rem' }} />
        <div className="skeleton" style={{ height: 14, width: '60%', borderRadius: '0.3rem' }} />
        <div className="skeleton" style={{ height: 20, width: '45%', marginTop: '0.5rem', borderRadius: '0.3rem' }} />
        <div className="skeleton" style={{ height: 40, borderRadius: '9999px' }} />
      </div>
    </div>
  );
}

function ProductCard({ product, onAddToCart }: { product: Product; onAddToCart: (p: Product) => void }) {
  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null;
  const outOfStock = Number(product.stock) === 0;
  const lowStock = !outOfStock && Number(product.stock) > 0 && Number(product.stock) <= 5;
  const badgeColor = product.badgeColor || BADGE_COLORS[product.badge] || '#7C3AED';

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', opacity: outOfStock ? 0.85 : 1 }}>
      {/* Book cover area */}
      <Link to={`/shop/${product.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{
        background: `linear-gradient(135deg, ${COVER_COLORS[product.id % COVER_COLORS.length]}18, ${COVER_COLORS[product.id % COVER_COLORS.length]}40)`,
        padding: '2rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', minHeight: 200,
      }}>
        <BookCover product={product} />

        {outOfStock && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ background: '#1a1a1a', color: 'white', borderRadius: '0.5rem', padding: '0.35rem 0.875rem', fontSize: '0.8rem', fontWeight: 900, letterSpacing: '0.05em' }}>
              OUT OF STOCK
            </span>
          </div>
        )}

        {product.badge && !outOfStock && (
          <span style={{ position: 'absolute', top: 10, left: 10, background: badgeColor, color: badgeColor === '#F5C842' ? '#1C0A0A' : 'white', borderRadius: '0.5rem', padding: '0.2rem 0.6rem', fontSize: '0.7rem', fontWeight: 900 }}>
            {product.badge}
          </span>
        )}
        <button style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1rem' }}>
          🤍
        </button>
      </div>
      </Link>

      {/* Info */}
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '0.4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <StarRating rating={product.rating} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>({product.sold || product.reviews || 0})</span>
        </div>
        <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: '0.95rem', margin: 0, lineHeight: 1.3 }}>
          <Link to={`/shop/${product.id}`} style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>
            {product.title}
          </Link>
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, fontWeight: 600 }}>{product.author}</p>
        {lowStock && (
          <span style={{ background: '#FEF3C7', color: '#92400E', borderRadius: '9999px', padding: '0.15rem 0.5rem', fontSize: '0.72rem', fontWeight: 800 }}>
            Only {product.stock} left!
          </span>
        )}

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.5rem' }}>
          <span style={{ fontSize: '1.25rem', fontWeight: 900, color: outOfStock ? 'var(--text-muted)' : 'var(--maroon)' }}>${product.price.toFixed(2)}</span>
          {product.originalPrice && (
            <>
              <span style={{ fontSize: '0.85rem', textDecoration: 'line-through', color: 'var(--text-muted)' }}>${product.originalPrice.toFixed(2)}</span>
              {!outOfStock && <span style={{ background: '#FEE2E2', color: '#DC2626', borderRadius: '9999px', padding: '0.1rem 0.4rem', fontSize: '0.72rem', fontWeight: 800 }}>Save {discount}%</span>}
            </>
          )}
        </div>

        {outOfStock ? (
          <div style={{ width: '100%', padding: '0.65rem', borderRadius: '9999px', background: 'var(--cream-border)', color: 'var(--text-muted)', fontWeight: 800, fontSize: '0.9rem', textAlign: 'center' }}>
            Out of Stock
          </div>
        ) : (
          <button
            onClick={() => onAddToCart(product)}
            className="btn-gold"
            style={{ width: '100%', justifyContent: 'center', padding: '0.65rem', fontSize: '0.9rem' }}
          >
            🛒 Add to Cart
          </button>
        )}
      </div>
    </div>
  );
}

export default function Shop() {
  usePageMeta('Shop', 'Browse Orthodox children\'s books, coloring books, prayer books, and gift sets — crafted with love for ages 4+.');

  const [searchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState('all');
  const [sort, setSort] = useState('popular');
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [productsLoading, setProductsLoading] = useState(true);

  const { addToCart, cartCount } = useCart();
  const { addToast } = useToast();
  const { user, saveActivity } = useAuth();

  // Sync search from URL param (e.g. from nav search bar)
  useEffect(() => {
    const q = searchParams.get('q') || '';
    setSearch(q);
  }, [searchParams]);

  useEffect(() => {
    fetch(`${API}/api/products`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data) && data.length > 0) setProducts(data); })
      .catch(() => { /* keep hardcoded fallback */ })
      .finally(() => setProductsLoading(false));
  }, []);

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    addToast(`"${product.title}" added to cart!`, 'success');
  };

  const handleStripeCheckout = async (product: Product) => {
    const items = [product];
    try {
      const response = await fetch(`${API}/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          userId: user?.id || null,
          customerName: user?.name || null,
          customerEmail: user?.email || null,
        }),
      });
      const data = await response.json();
      if (data.url) {
        // Save order activity so login can resume here
        saveActivity(user?.id, {
          type: 'order',
          items: items.map(i => ({ id: i.id, title: i.title, price: i.price })),
          total: items.reduce((s, i) => s + i.price * (i.quantity || 1), 0),
        } as OrderActivity);
        window.location.href = data.url;
      } else {
        addToast('Could not create checkout session.', 'error');
      }
    } catch {
      addToast('Server offline. Cart saved locally.', 'warning');
      handleAddToCart(product);
    }
  };

  let filtered = products.filter(p => {
    const matchCat = activeCategory === 'all' || p.category === activeCategory;
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) || (p.author || '').toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  if (sort === 'price-asc') filtered = [...filtered].sort((a, b) => a.price - b.price);
  if (sort === 'price-desc') filtered = [...filtered].sort((a, b) => b.price - a.price);
  if (sort === 'new') filtered = [...filtered].sort((a, b) => b.id - a.id);
  if (sort === 'popular') filtered = [...filtered].sort((a, b) => (b.sold || b.reviews || 0) - (a.sold || a.reviews || 0));

  return (
    <div>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, var(--gold-pale), #FDE68A)', padding: '3rem 1.25rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
          <img src="/tiggy.png" alt="Tiggy" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--maroon)', flexShrink: 0 }} />
          <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.15rem', color: 'var(--maroon)', lineHeight: 1.1, textAlign: 'left' }}>
            Tiggy's<br /><span style={{ fontSize: '0.78rem', fontWeight: 400, color: 'var(--gold)', letterSpacing: '0.08em' }}>KINGDOM</span>
          </span>
        </div>
        <h1 style={{ color: 'var(--maroon)', margin: '0 0 0.5rem', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}>
          Treasured Tales for Your Family
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontWeight: 600, margin: 0 }}>
          Stories that teach faith, courage, and love
        </p>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.25rem' }}>
        {/* Search + Sort row */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
            <span style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>🔍</span>
            <input
              type="text"
              placeholder="Search books..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="tk-input"
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            style={{ padding: '0.75rem 1rem', border: '2px solid var(--cream-border)', borderRadius: '0.75rem', fontFamily: 'Nunito, sans-serif', fontWeight: 700, color: 'var(--text-primary)', background: 'white', cursor: 'pointer', outline: 'none' }}
          >
            {SORT_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </div>

        {/* Category filters */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                padding: '0.5rem 1.1rem',
                borderRadius: '9999px',
                border: 'none',
                fontWeight: 800,
                fontSize: '0.875rem',
                cursor: 'pointer',
                background: activeCategory === cat.id ? cat.color : 'white',
                color: activeCategory === cat.id ? 'white' : 'var(--text-secondary)',
                boxShadow: activeCategory === cat.id ? `0 2px 8px ${cat.color}55` : '0 1px 4px rgba(0,0,0,0.08)',
                transition: 'all 0.2s',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Results count */}
        <p style={{ color: 'var(--text-muted)', fontWeight: 600, marginBottom: '1.25rem', fontSize: '0.9rem' }}>
          Showing {filtered.length} {filtered.length === 1 ? 'item' : 'items'}
        </p>

        {/* Product grid */}
        {productsLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {[...Array(6)].map((_, i) => <ProductSkeleton key={i} />)}
          </div>
        ) : filtered.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {filtered.map(product => (
              <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
            <p style={{ fontWeight: 700 }}>No books found. Try a different search or category.</p>
          </div>
        )}

      </div>
    </div>
  );
}
