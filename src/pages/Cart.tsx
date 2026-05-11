import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth, type OrderActivity } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

import { API } from '../lib/api';

interface RecommendedProduct {
  id: number;
  title: string;
  author?: string;
  price: number;
  active?: boolean;
}

export default function Cart() {
  const { items, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal } = useCart();
  const { user, saveActivity } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [recommended, setRecommended] = useState<RecommendedProduct[]>([]);

  useEffect(() => {
    if (items.length === 0) {
      fetch(`${API}/api/products`)
        .then(r => r.json())
        .then(data => { if (Array.isArray(data)) setRecommended(data.filter(p => p.active !== false).slice(0, 3)); })
        .catch(() => {});
    }
  }, [items.length]);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          userId: user?.id || null,
          customerName: user?.name || null,
          customerEmail: user?.email || null,
        }),
      });
      const data = await res.json();
      if (data.url) {
        saveActivity(user?.id, {
          type: 'order',
          items: items.map(i => ({ id: i.id, title: i.title, price: i.price })),
          total: cartTotal,
        } as OrderActivity);
        clearCart();
        window.location.href = data.url;
      } else {
        addToast('Could not start checkout. Please try again.', 'error');
      }
    } catch {
      addToast('Server offline. Please make sure the backend is running.', 'warning');
    } finally {
      setLoading(false);
    }
  };

  const COVER_COLORS = ['#7B2020','#1D4ED8','#EA580C','#6D28D9','#065F46','#B45309'];
  const COVER_DARKS  = ['#4A1515','#1E3A8A','#C2410C','#5B21B6','#064E3B','#92400E'];

  if (items.length === 0) {
    return (
      <div style={{ background: 'var(--cream)', minHeight: '70vh', padding: '3rem 1.25rem' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🛒</div>
          <h2 style={{ color: 'var(--maroon)', marginBottom: '0.5rem' }}>Your cart is empty</h2>
          <p style={{ color: 'var(--text-muted)', fontWeight: 600, marginBottom: '1.5rem' }}>
            Discover books and gifts crafted for your family.
          </p>
          <Link to="/shop" className="btn-gold" style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}>Browse the Shop</Link>

          {recommended.length > 0 && (
            <div style={{ marginTop: '3rem', textAlign: 'left' }}>
              <h3 style={{ color: 'var(--maroon)', textAlign: 'center', marginBottom: '1.5rem', fontSize: '1.2rem' }}>
                ✦ You might like
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                {recommended.map(p => (
                  <div key={p.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ background: `linear-gradient(160deg, ${COVER_COLORS[p.id % COVER_COLORS.length]}, ${COVER_DARKS[p.id % COVER_DARKS.length]})`, padding: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '2.5rem' }}>📖</div>
                    <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <p style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)', margin: 0 }}>{p.title}</p>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, margin: 0 }}>{p.author}</p>
                      <p style={{ fontWeight: 900, color: 'var(--maroon)', fontSize: '1.1rem', margin: '0.25rem 0 0' }}>${p.price?.toFixed(2)}</p>
                      <button
                        onClick={() => { addToCart(p); addToast(`"${p.title}" added to cart!`, 'success'); }}
                        className="btn-gold"
                        style={{ width: '100%', justifyContent: 'center', padding: '0.6rem', fontSize: '0.875rem', marginTop: 'auto' }}
                      >🛒 Add to Cart</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const shipping = cartTotal >= 35 ? 0 : 4.99;
  const tax = Math.round(cartTotal * 0.08 * 100) / 100;
  const orderTotal = cartTotal + shipping + tax;

  return (
    <div style={{ background: 'var(--cream)', minHeight: '70vh' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1.25rem' }}>
        <h1 style={{ color: 'var(--maroon)', marginBottom: '0.25rem', fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}>
          Your Cart
        </h1>
        <p style={{ color: 'var(--text-muted)', fontWeight: 600, marginBottom: '2rem', fontSize: '0.9rem' }}>
          {items.reduce((s, i) => s + i.quantity, 0)} item{items.reduce((s, i) => s + i.quantity, 0) !== 1 ? 's' : ''}
        </p>

        <div className="cart-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: '1.5rem', alignItems: 'start' }}>

          {/* Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {items.map(item => (
              <div key={item.id} className="card" style={{ padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {/* Book cover */}
                <div style={{
                  width: 72, height: 96, flexShrink: 0, borderRadius: '0.4rem',
                  background: `linear-gradient(160deg, ${['#7B2020','#1D4ED8','#EA580C','#6D28D9','#065F46','#B45309'][item.id % 6]}, ${['#4A1515','#1E3A8A','#C2410C','#5B21B6','#064E3B','#92400E'][item.id % 6]})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem',
                  boxShadow: '2px 3px 8px rgba(0,0,0,0.25)',
                }}>
                  📖
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: '0.95rem', margin: '0 0 0.25rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.title}
                  </h3>
                  <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {item.author}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    {/* Quantity control */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0', border: '1.5px solid var(--cream-border)', borderRadius: '0.5rem', overflow: 'hidden' }}>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        style={{ width: 32, height: 32, border: 'none', background: 'var(--cream)', cursor: 'pointer', fontWeight: 800, fontSize: '1rem', color: 'var(--maroon)' }}
                      >−</button>
                      <span style={{ width: 32, textAlign: 'center', fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        style={{ width: 32, height: 32, border: 'none', background: 'var(--cream)', cursor: 'pointer', fontWeight: 800, fontSize: '1rem', color: 'var(--maroon)' }}
                      >+</button>
                    </div>
                    <button
                      onClick={() => { removeFromCart(item.id); addToast('Item removed.', 'info'); }}
                      style={{ background: 'none', border: 'none', color: '#EF4444', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', padding: 0 }}
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {/* Price */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--maroon)', margin: 0 }}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                  {item.quantity > 1 && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, margin: '0.1rem 0 0' }}>
                      ${item.price.toFixed(2)} ea.
                    </p>
                  )}
                </div>
              </div>
            ))}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem' }}>
              <Link to="/shop" style={{ color: 'var(--gold)', fontWeight: 700, fontSize: '0.9rem' }}>← Continue Shopping</Link>
              <button onClick={() => { clearCart(); addToast('Cart cleared.', 'info'); }} style={{ color: '#EF4444', background: 'none', border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                Clear Cart
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="card cart-summary" style={{ padding: '1.5rem', position: 'sticky', top: 84 }}>
            <h2 style={{ margin: '0 0 1.25rem', fontSize: '1.05rem', color: 'var(--maroon)' }}>Order Summary</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                <span>Shipping</span>
                <span style={{ color: shipping === 0 ? '#22C55E' : 'inherit' }}>
                  {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                <span>Tax (est.)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
            </div>

            {shipping > 0 && (
              <div style={{ background: '#FEF3C7', borderRadius: '0.5rem', padding: '0.6rem 0.875rem', marginBottom: '1rem', fontSize: '0.8rem', fontWeight: 700, color: '#92400E' }}>
                Add ${(35 - cartTotal).toFixed(2)} more for FREE shipping!
              </div>
            )}

            <div style={{ borderTop: '1px solid var(--cream-border)', paddingTop: '0.875rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1rem' }}>Total</span>
              <span style={{ fontWeight: 900, fontSize: '1.35rem', color: 'var(--maroon)' }}>${orderTotal.toFixed(2)}</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="btn-gold"
              style={{ width: '100%', justifyContent: 'center', padding: '0.875rem', fontSize: '1rem', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Redirecting...' : '🔒 Checkout Securely'}
            </button>

            {!user && (
              <p style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                <Link to="/login" style={{ color: 'var(--gold)' }}>Sign in</Link> to track your order
              </p>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              {['Visa', 'MC', 'Amex', 'PayPal'].map(c => (
                <span key={c} style={{ background: 'var(--cream)', borderRadius: '0.3rem', padding: '0.2rem 0.5rem', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
