import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
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
  description?: string;
}

const FALLBACK_PRODUCTS: Product[] = [
  { id: 1, title: 'Saint Yared: The Gift of Song', author: 'By Maria Tesnaye', price: 14.99, originalPrice: 19.99, category: 'saint', badge: 'BESTSELLER', badgeColor: '#7C3AED', ages: '5-8', rating: 4.8, reviews: 186, description: 'Follow the miraculous story of Saint Yared, the Ethiopian composer who received the gift of sacred music from God. A beautifully illustrated tale of faith, perseverance, and divine inspiration for young readers.' },
  { id: 2, title: "Tiggy's First Fast", author: 'By Sarah Alemu', price: 12.99, category: 'story', badge: 'NEW', badgeColor: '#22C55E', ages: '4-7', rating: 5.0, reviews: 43, description: "Join Tiggy the lamb as she prepares for her very first Orthodox fast. A gentle, encouraging story that helps young children understand why we fast and how it brings us closer to God." },
  { id: 3, title: 'The Good Shepherd Coloring Book', author: "Tiggy's Kingdom", price: 9.99, category: 'coloring', badge: 'FREE ACTIVITY', badgeColor: '#3B82F6', ages: '4-10', rating: 4.7, reviews: 89, description: 'Over 30 beautiful coloring pages featuring parables, saints, and scenes from Orthodox Christian life. Includes activity sheets and memory verses to make learning the faith fun and creative.' },
  { id: 4, title: 'Saint Nicholas: Keeper of Hope', author: 'By Fr. Daniel Yosef', price: 14.99, originalPrice: 17.99, category: 'saint', ages: '5-9', rating: 4.9, reviews: 112, description: "Discover the true story of Saint Nicholas — bishop, miracle-worker, and keeper of hope for the poor and suffering. A rich, detailed retelling that captures the saint's compassion and courage." },
  { id: 5, title: 'The Holy Liturgy for Little Ones', author: "Tiggy's Kingdom", price: 11.99, category: 'prayer', badge: 'POPULAR', badgeColor: '#F5C842', ages: '3-8', rating: 4.8, reviews: 67, description: 'A child-friendly guide to the Divine Liturgy, explaining each part in simple language with vibrant illustrations. Perfect for helping young worshippers participate more fully in the service.' },
  { id: 6, title: 'Advent Coloring Journey', author: 'By Hana Tesfaye', price: 8.99, originalPrice: 12.99, category: 'coloring', ages: '5-12', rating: 4.6, reviews: 34, description: 'A 40-day coloring and reflection journey through the Advent fast leading up to the Nativity of Christ. Each page pairs a coloring scene with a short scripture passage and prayer.' },
  { id: 7, title: "Saint Mary's Story", author: 'By Sister Miriam', price: 14.99, category: 'saint', badge: 'NEW', badgeColor: '#22C55E', ages: '4-8', rating: 4.9, reviews: 28, description: "The beautiful story of the Theotokos — her early life in the Temple, the Annunciation, and her role as the Mother of God. Told with reverence and wonder for the youngest Orthodox hearts." },
  { id: 8, title: 'Faith Family Gift Bundle', author: '4 books + activity set', price: 49.99, originalPrice: 69.99, category: 'gift', badge: 'SAVE 28%', badgeColor: '#EF4444', ages: '4-12', rating: 5.0, reviews: 21, description: 'The perfect gift for any Orthodox family. Includes four of our most beloved books plus an exclusive activity and prayer card set. Beautifully packaged — ready to give.' },
];

const CATEGORY_ICONS: Record<string, string> = { saint: '✝', story: '✦', prayer: '🙏', coloring: '🎨', gift: '🎁' };
const CATEGORY_LABELS: Record<string, string> = { saint: 'Saint Lives', story: 'Story Books', prayer: 'Prayer Books', coloring: 'Coloring Books', gift: 'Gift Sets' };

function BigBookCover({ product }: { product: Product }) {
  const c = product.id % COVER_COLORS.length;
  const icon = CATEGORY_ICONS[product.category] || '✦';
  const authorShort = (product.author || '').replace(/^By\s+/i, '');
  return (
    <div style={{
      width: 180, height: 252,
      background: `linear-gradient(160deg, ${COVER_COLORS[c]}, ${COVER_DARKS[c]})`,
      borderRadius: '4px 10px 10px 4px',
      boxShadow: '8px 12px 32px rgba(0,0,0,0.4), inset -3px 0 6px rgba(0,0,0,0.2)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'space-between', padding: '1rem 0.875rem 0.875rem',
      overflow: 'hidden', position: 'relative',
    }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 10, background: 'rgba(0,0,0,0.25)', borderRadius: '4px 0 0 4px' }} />
      <div style={{ position: 'absolute', top: 0, left: 10, right: 0, height: 6, background: 'rgba(201,146,42,0.6)' }} />
      <span style={{ fontSize: '1.75rem', opacity: 0.9, zIndex: 1 }}>{icon}</span>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0.4rem 0', zIndex: 1 }}>
        <p style={{
          color: 'white', fontFamily: 'Playfair Display, serif', fontWeight: 700,
          fontSize: '0.82rem', lineHeight: 1.4, margin: 0, textAlign: 'center',
          display: '-webkit-box', WebkitLineClamp: 6, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          textShadow: '0 1px 4px rgba(0,0,0,0.4)',
        }}>
          {product.title}
        </p>
      </div>
      <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.65rem', margin: 0, textAlign: 'center', fontWeight: 600, zIndex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
        {authorShort}
      </p>
      <div style={{ position: 'absolute', bottom: 0, left: 10, right: 0, height: 4, background: 'rgba(201,146,42,0.4)' }} />
    </div>
  );
}

function StarRating({ rating, reviews }: { rating: number; reviews?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
      <span style={{ color: '#F5C842', fontSize: '1.1rem' }}>
        {'★'.repeat(Math.floor(rating))}{rating % 1 >= 0.5 ? '½' : ''}
      </span>
      <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>{rating.toFixed(1)}</span>
      {reviews != null && (
        <span style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>({reviews} reviews)</span>
      )}
    </div>
  );
}

export default function ShopProduct() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  usePageMeta(
    product ? product.title : 'Product',
    product ? `${product.title} — ${product.author || ''} · Ages ${product.ages}` : undefined,
  );

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/products`)
      .then(r => r.json())
      .then((data: Product[]) => {
        const list = Array.isArray(data) && data.length > 0 ? data : FALLBACK_PRODUCTS;
        const found = list.find(p => String(p.id) === id);
        if (!found) { navigate('/shop', { replace: true }); return; }
        setProduct(found);
        setRelated(list.filter(p => p.id !== found.id && p.category === found.category && p.active !== false).slice(0, 3));
      })
      .catch(() => {
        const found = FALLBACK_PRODUCTS.find(p => String(p.id) === id);
        if (!found) { navigate('/shop', { replace: true }); return; }
        setProduct(found);
        setRelated(FALLBACK_PRODUCTS.filter(p => p.id !== found.id && p.category === found.category).slice(0, 3));
      })
      .finally(() => setLoading(false));
  }, [id]); // eslint-disable-line

  const handleAddToCart = () => {
    if (!product) return;
    for (let i = 0; i < qty; i++) addToCart(product);
    setAdded(true);
    addToast(`"${product.title}" added to cart!`, 'success');
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) {
    return (
      <div style={{ background: 'var(--cream)', minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="skeleton" style={{ width: 240, height: 32, borderRadius: '0.5rem' }} />
      </div>
    );
  }

  if (!product) return null;

  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null;
  const outOfStock = Number(product.stock) === 0;
  const lowStock = !outOfStock && Number(product.stock) > 0 && Number(product.stock) <= 5;

  return (
    <div style={{ background: 'var(--cream)', minHeight: '70vh' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.25rem' }}>

        {/* Breadcrumb */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.75rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          <Link to="/shop" style={{ color: 'var(--gold)' }}>Shop</Link>
          <span>›</span>
          <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
            {CATEGORY_LABELS[product.category] || product.category}
          </span>
          <span>›</span>
          <span style={{ color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60vw' }}>{product.title}</span>
        </nav>

        {/* Main product section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '3rem', alignItems: 'start', marginBottom: '3rem' }}>

          {/* Cover */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              background: `linear-gradient(135deg, ${COVER_COLORS[product.id % COVER_COLORS.length]}18, ${COVER_COLORS[product.id % COVER_COLORS.length]}40)`,
              borderRadius: '1.25rem', padding: '2rem 2.5rem', position: 'relative',
            }}>
              <BigBookCover product={product} />
              {product.badge && !outOfStock && (
                <span style={{
                  position: 'absolute', top: 12, left: 12,
                  background: product.badgeColor || '#7C3AED',
                  color: product.badgeColor === '#F5C842' ? '#1C0A0A' : 'white',
                  borderRadius: '0.5rem', padding: '0.2rem 0.7rem', fontSize: '0.7rem', fontWeight: 900,
                }}>
                  {product.badge}
                </span>
              )}
            </div>
            {product.category !== 'gift' && (
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'center', margin: 0 }}>
                Hardcover · Ships in 3–5 days
              </p>
            )}
          </div>

          {/* Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {CATEGORY_LABELS[product.category] || product.category}
              </span>
              <h1 style={{ fontFamily: 'Playfair Display, serif', color: 'var(--maroon)', fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', margin: '0.35rem 0 0', lineHeight: 1.2 }}>
                {product.title}
              </h1>
              {product.author && (
                <p style={{ margin: '0.4rem 0 0', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '1rem' }}>{product.author}</p>
              )}
            </div>

            {product.rating != null && (
              <StarRating rating={product.rating} reviews={product.reviews ?? product.sold} />
            )}

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '2rem', fontWeight: 900, color: outOfStock ? 'var(--text-muted)' : 'var(--maroon)' }}>
                ${product.price.toFixed(2)}
              </span>
              {product.originalPrice && (
                <>
                  <span style={{ fontSize: '1.1rem', textDecoration: 'line-through', color: 'var(--text-muted)' }}>
                    ${product.originalPrice.toFixed(2)}
                  </span>
                  {discount && !outOfStock && (
                    <span style={{ background: '#FEE2E2', color: '#DC2626', borderRadius: '9999px', padding: '0.2rem 0.6rem', fontSize: '0.8rem', fontWeight: 800 }}>
                      Save {discount}%
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Tags */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {product.ages && (
                <span style={{ background: '#DBEAFE', color: '#1D4ED8', borderRadius: '9999px', padding: '0.2rem 0.75rem', fontSize: '0.8rem', fontWeight: 700 }}>
                  Ages {product.ages}
                </span>
              )}
              {lowStock && (
                <span style={{ background: '#FEF3C7', color: '#92400E', borderRadius: '9999px', padding: '0.2rem 0.75rem', fontSize: '0.8rem', fontWeight: 800 }}>
                  Only {product.stock} left!
                </span>
              )}
              {outOfStock && (
                <span style={{ background: '#FEE2E2', color: '#DC2626', borderRadius: '9999px', padding: '0.2rem 0.75rem', fontSize: '0.8rem', fontWeight: 800 }}>
                  Out of Stock
                </span>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p style={{ color: 'var(--text-secondary)', fontWeight: 600, lineHeight: 1.75, margin: 0, fontSize: '0.95rem' }}>
                {product.description}
              </p>
            )}

            {/* Quantity + Add to cart */}
            {!outOfStock && (
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', border: '2px solid var(--cream-border)', borderRadius: '0.75rem', overflow: 'hidden' }}>
                  <button
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    style={{ width: 40, height: 44, border: 'none', background: 'var(--cream)', cursor: 'pointer', fontWeight: 900, fontSize: '1.1rem', color: 'var(--maroon)' }}
                  >−</button>
                  <span style={{ width: 36, textAlign: 'center', fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>{qty}</span>
                  <button
                    onClick={() => setQty(q => q + 1)}
                    style={{ width: 40, height: 44, border: 'none', background: 'var(--cream)', cursor: 'pointer', fontWeight: 900, fontSize: '1.1rem', color: 'var(--maroon)' }}
                  >+</button>
                </div>
                <button
                  onClick={handleAddToCart}
                  className="btn-gold"
                  style={{ flex: 1, minWidth: 180, justifyContent: 'center', padding: '0.75rem 1.5rem', fontSize: '1rem', background: added ? '#22C55E' : undefined, transition: 'background 0.2s' }}
                >
                  {added ? '✓ Added to Cart!' : '🛒 Add to Cart'}
                </button>
              </div>
            )}

            {/* Trust badges */}
            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
              {[
                { icon: '🚚', text: 'Free shipping over $35' },
                { icon: '🔒', text: 'Secure checkout' },
                { icon: '↩', text: '30-day returns' },
              ].map(b => (
                <div key={b.text} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  <span>{b.icon}</span>{b.text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <div>
            <h2 style={{ color: 'var(--maroon)', fontSize: '1.25rem', margin: '0 0 1.25rem' }}>
              More {CATEGORY_LABELS[product.category] || 'Products'}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
              {related.map(p => (
                <Link
                  key={p.id}
                  to={`/shop/${p.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem', transition: 'transform 0.15s, box-shadow 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(107,32,32,0.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                  >
                    <div style={{
                      width: 52, height: 72, flexShrink: 0, borderRadius: '2px 5px 5px 2px',
                      background: `linear-gradient(160deg, ${COVER_COLORS[p.id % COVER_COLORS.length]}, ${COVER_DARKS[p.id % COVER_DARKS.length]})`,
                      boxShadow: '3px 4px 10px rgba(0,0,0,0.3)',
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-primary)', margin: '0 0 0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.title}
                      </p>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, fontWeight: 600 }}>{p.author}</p>
                      <p style={{ fontWeight: 900, color: 'var(--maroon)', margin: '0.25rem 0 0', fontSize: '0.95rem' }}>${p.price.toFixed(2)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
