import { useState, useEffect, useCallback, useRef, type ReactNode, type CSSProperties, type FormEvent, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';

const API = 'http://localhost:4242';

interface AdminProduct {
  id: number;
  title: string;
  author?: string;
  price: number;
  originalPrice?: number | null;
  category: string;
  ages?: string;
  stock: number;
  badge?: string | null;
  active?: boolean;
  sold?: number;
  rating?: number;
  reviews?: number;
}

interface AdminOrder {
  id: string;
  userId?: string;
  customerName?: string;
  customerEmail?: string;
  status: string;
  total?: number;
  createdAt?: string;
  items?: Array<{ title: string; price: number; quantity?: number }>;
  note?: string;
  cancellationRequested?: boolean;
}

interface AdminSubscriber {
  id: string;
  email: string;
  name?: string;
  source?: string;
  createdAt?: string;
  active?: boolean;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  joinedDate?: string;
  createdAt?: string;
  isGuest?: boolean;
}

interface AdminEpisode {
  id: string;
  videoId: string;
  title: string;
  description?: string;
  ages?: string;
  category?: string;
  featured?: boolean;
  order?: number;
  active?: boolean;
}

interface ActivityLogEntry {
  id?: number;
  action: string;
  details: Record<string, unknown>;
  at: string;
}

type ToastFn = (msg: string, type?: string) => void;

interface AdminToast {
  id: number;
  message: string;
  type: string;
}

interface AdminStats {
  revenue: number;
  orders: Record<string, number>;
  cancelRequests?: number;
  products: { active: number; total: number };
  subscribers: { active: number; total: number };
  users: { total: number };
  episodes?: { featured: number; total: number };
  lowStock?: Array<{ id: number; title: string; stock: number }>;
}

const token = () => localStorage.getItem('tk_admin_token');

const apiFetch = async (path: string, opts: RequestInit = {}) => {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}`, ...(opts.headers || {}) },
  });
  if (res.status === 401) { localStorage.removeItem('tk_admin_token'); window.location.href = '/admin/login'; }
  return res.json();
};

// ── usePager ──────────────────────────────────────────────────────────────────
function usePager<T>(items: T[], perPage = 25, resetKey?: unknown) {
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [resetKey]);
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const slice = items.slice((page - 1) * perPage, page * perPage);
  return { page, setPage, totalPages, slice };
}

const btnBase = { padding: '0.3rem 0.75rem', borderRadius: '0.4rem', border: '1.5px solid var(--cream-border)', background: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', color: 'var(--maroon)' };

function Pager({ page, totalPages, setPage }: { page: number; totalPages: number; setPage: (fn: (p: number) => number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', padding: '1rem', alignItems: 'center' }}>
      <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ ...btnBase, opacity: page === 1 ? 0.4 : 1 }}>‹ Prev</button>
      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-muted)', padding: '0 0.5rem' }}>Page {page} of {totalPages}</span>
      <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ ...btnBase, opacity: page === totalPages ? 0.4 : 1 }}>Next ›</button>
    </div>
  );
}

// ── ConfirmBtn ─────────────────────────────────────────────────────────────────
function ConfirmBtn({ label, onConfirm, btnStyle, confirmLabel = 'Confirm?', cancelLabel = '✕' }: { label: string; onConfirm: () => void; btnStyle?: CSSProperties; confirmLabel?: string; cancelLabel?: string }) {
  const [pending, setPending] = useState(false);
  if (pending) return (
    <span style={{ display: 'inline-flex', gap: '0.25rem', alignItems: 'center' }}>
      <button
        onClick={() => { setPending(false); onConfirm(); }}
        style={{ padding: '0.25rem 0.5rem', borderRadius: '0.3rem', border: 'none', background: '#DCFCE7', color: '#166534', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer' }}
      >{confirmLabel}</button>
      <button
        onClick={() => setPending(false)}
        style={{ padding: '0.25rem 0.4rem', borderRadius: '0.3rem', border: 'none', background: '#FEE2E2', color: '#DC2626', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer' }}
      >{cancelLabel}</button>
    </span>
  );
  return <button onClick={() => setPending(true)} style={btnStyle}>{label}</button>;
}

// ── StatCard ──────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color }: { icon: string; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 2px 12px rgba(107,32,32,0.07)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <div style={{ width: 52, height: 52, borderRadius: '0.875rem', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
        <p style={{ margin: '0.15rem 0 0', fontSize: '1.75rem', fontWeight: 900, color, fontFamily: 'Nunito, sans-serif', lineHeight: 1 }}>{value}</p>
        {sub && <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>{sub}</p>}
      </div>
    </div>
  );
}

// ── Table helpers ─────────────────────────────────────────────────────────────
const TH = ({ children }: { children: ReactNode }) => (
  <th style={{ padding: '0.6rem 0.875rem', textAlign: 'left', fontWeight: 800, fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', background: 'var(--cream)', borderBottom: '1px solid var(--cream-border)', whiteSpace: 'nowrap' }}>
    {children}
  </th>
);
const TD = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => (
  <td style={{ padding: '0.75rem 0.875rem', borderBottom: '1px solid var(--cream)', fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 600, ...style }}>
    {children}
  </td>
);

const STATUS_COLORS: Record<string, string> = { placed: '#3B82F6', processing: '#F97316', shipped: '#7C3AED', delivered: '#22C55E', cancelled: '#EF4444' };

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] || '#9B7070';
  return <span style={{ background: `${color}18`, color, borderRadius: '9999px', padding: '0.2rem 0.6rem', fontSize: '0.72rem', fontWeight: 800 }}>{status}</span>;
}

// ── printOrder ─────────────────────────────────────────────────────────────────
function printOrder(o: AdminOrder) {
  const w = window.open('', '_blank', 'width=620,height=720');
  w.document.write(`<!DOCTYPE html><html><head><title>Receipt ${o.id}</title><style>
    body{font-family:sans-serif;padding:32px;max-width:480px;margin:auto;color:#222}
    h2{color:#6B2020;margin-bottom:4px}
    .meta{color:#666;font-size:13px;margin-bottom:16px;line-height:1.6}
    table{width:100%;border-collapse:collapse;margin:12px 0}
    td,th{padding:8px 4px;border-bottom:1px solid #eee;font-size:13px}
    th{font-weight:700;text-align:left;color:#888;text-transform:uppercase;font-size:11px}
    .total{font-weight:900;font-size:1.1rem;color:#6B2020;text-align:right;margin-top:12px}
    .note{font-style:italic;color:#666;font-size:12px;margin-top:8px}
    button{margin-top:24px;padding:10px 24px;background:#6B2020;color:white;border:none;border-radius:6px;cursor:pointer;font-size:14px;font-weight:700}
    @media print{button{display:none}}
  </style></head><body>
    <h2>Tiggy's Kingdom</h2>
    <div class="meta">
      <strong>Order:</strong> ${o.id}<br/>
      <strong>Customer:</strong> ${o.customerName || '—'}<br/>
      <strong>Email:</strong> ${o.customerEmail || '—'}<br/>
      <strong>Date:</strong> ${o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '—'}<br/>
      <strong>Status:</strong> ${o.status}
    </div>
    <table>
      <thead><tr><th>Item</th><th>Qty</th><th style="text-align:right">Price</th></tr></thead>
      <tbody>${(o.items || []).map(i => `<tr><td>${i.title}</td><td>${i.quantity || 1}</td><td style="text-align:right">$${(i.price * (i.quantity || 1)).toFixed(2)}</td></tr>`).join('')}</tbody>
    </table>
    <div class="total">Total: $${(o.total || 0).toFixed(2)}</div>
    ${o.note ? `<div class="note">Note: ${o.note}</div>` : ''}
    <button onclick="window.print()">Print Receipt</button>
  </body></html>`);
  w.document.close();
}

// ── ProductsTab ───────────────────────────────────────────────────────────────
function ProductsTab({ toast }: { toast: ToastFn }) {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [form, setForm] = useState({ title: '', author: '', price: '', originalPrice: '', category: 'story', ages: '4-8', stock: 20, badge: '', active: true });
  const [editStockId, setEditStockId] = useState<number | null>(null);
  const [editStockVal, setEditStockVal] = useState('');

  const load = useCallback(() => apiFetch('/api/admin/products').then(setProducts), []);
  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setEditing(null); setForm({ title: '', author: '', price: '', originalPrice: '', category: 'story', ages: '4-8', stock: 20, badge: '', active: true }); setShowForm(true); };
  const openEdit = (p: AdminProduct) => { setEditing(p); setForm({ title: p.title, author: p.author || '', price: String(p.price), originalPrice: p.originalPrice ? String(p.originalPrice) : '', category: p.category, ages: p.ages || '4-8', stock: p.stock, badge: p.badge || '', active: p.active ?? true }); setShowForm(true); };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    const body = { ...form, price: parseFloat(form.price as string), originalPrice: form.originalPrice ? parseFloat(form.originalPrice as string) : null, badge: form.badge || null };
    if (editing) {
      await apiFetch(`/api/admin/products/${editing.id}`, { method: 'PUT', body: JSON.stringify(body) });
      toast('Product updated!', 'success');
    } else {
      await apiFetch('/api/admin/products', { method: 'POST', body: JSON.stringify(body) });
      toast('Product created!', 'success');
    }
    setShowForm(false);
    load();
  };

  const handleDelete = async (id: number) => {
    await apiFetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    toast('Product archived.', 'info');
    load();
  };

  const saveStock = async (id: number) => {
    const val = parseInt(editStockVal, 10);
    if (isNaN(val) || val < 0) { setEditStockId(null); return; }
    await apiFetch(`/api/admin/products/${id}`, { method: 'PUT', body: JSON.stringify({ stock: val }) });
    toast('Stock updated!', 'success');
    setEditStockId(null);
    load();
  };

  const inputStyle: CSSProperties = { width: '100%', padding: '0.6rem 0.875rem', border: '1.5px solid var(--cream-border)', borderRadius: '0.5rem', fontFamily: 'Nunito, sans-serif', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h2 style={{ margin: 0, color: 'var(--maroon)', fontSize: '1.25rem' }}>Products</h2>
        <button onClick={openAdd} className="btn-gold" style={{ padding: '0.55rem 1.25rem', fontSize: '0.9rem' }}>+ Add Product</button>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '1.25rem', padding: '2rem', width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 1.5rem', color: 'var(--maroon)' }}>{editing ? 'Edit Product' : 'New Product'}</h3>
            <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
              {[
                ['title', 'Title', 'text', '2fr'],
                ['author', 'Author', 'text', null],
                ['price', 'Price ($)', 'number', null],
                ['originalPrice', 'Original Price ($)', 'number', null],
                ['ages', 'Age Range', 'text', null],
                ['stock', 'Stock', 'number', null],
                ['badge', 'Badge (optional)', 'text', null],
              ].map(([key, label, type, span]) => (
                <div key={key} style={span ? { gridColumn: span } : {}}>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{label}</label>
                  <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} style={inputStyle} step={type === 'number' ? '0.01' : undefined} />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inputStyle}>
                  {['story', 'coloring', 'prayer', 'saint', 'gift'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingTop: '1.25rem' }}>
                <input type="checkbox" id="active" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} style={{ width: 18, height: 18 }} />
                <label htmlFor="active" style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Active / Visible</label>
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowForm(false)} className="btn-outline-maroon" style={{ padding: '0.55rem 1.25rem', fontSize: '0.9rem' }}>Cancel</button>
                <button type="submit" className="btn-maroon" style={{ padding: '0.55rem 1.25rem', fontSize: '0.9rem' }}>Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto', background: 'white', borderRadius: '1rem', boxShadow: '0 2px 12px rgba(107,32,32,0.07)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            <TH>Title</TH><TH>Category</TH><TH>Price</TH><TH>Stock</TH><TH>Sold</TH><TH>Rating</TH><TH>Status</TH><TH>Actions</TH>
          </tr></thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} style={{ background: !p.active ? '#FFF5F5' : 'white' }}>
                <TD>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{p.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.author}</div>
                </TD>
                <TD><span style={{ background: 'var(--cream)', padding: '0.15rem 0.5rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: 700 }}>{p.category}</span></TD>
                <TD>
                  <span style={{ fontWeight: 800, color: 'var(--maroon)' }}>${p.price}</span>
                  {p.originalPrice && <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '0.78rem', marginLeft: '0.35rem' }}>${p.originalPrice}</span>}
                </TD>
                <TD>
                  {editStockId === p.id ? (
                    <span style={{ display: 'inline-flex', gap: '0.25rem', alignItems: 'center' }}>
                      <input
                        type="number" value={editStockVal} autoFocus
                        onChange={e => setEditStockVal(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') saveStock(p.id); if (e.key === 'Escape') setEditStockId(null); }}
                        style={{ width: 60, padding: '0.2rem 0.4rem', border: '1.5px solid var(--maroon)', borderRadius: '0.3rem', fontFamily: 'Nunito', fontWeight: 700, fontSize: '0.85rem', outline: 'none' }}
                      />
                      <button onClick={() => saveStock(p.id)} style={{ padding: '0.2rem 0.4rem', border: 'none', background: '#DCFCE7', color: '#166534', borderRadius: '0.3rem', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}>✓</button>
                    </span>
                  ) : (
                    <span
                      onClick={() => { setEditStockId(p.id); setEditStockVal(String(p.stock)); }}
                      title="Click to edit stock"
                      style={{ cursor: 'pointer', color: p.stock < 5 ? '#EF4444' : p.stock < 10 ? '#F97316' : 'inherit', fontWeight: p.stock < 10 ? 800 : 600, borderBottom: '1px dashed var(--cream-border)' }}
                    >{p.stock}</span>
                  )}
                </TD>
                <TD>{p.sold}</TD>
                <TD><span style={{ color: '#F5C842' }}>{'★'.repeat(Math.round(p.rating || 5))}</span> <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.rating}</span></TD>
                <TD><StatusBadge status={p.active ? 'active' : 'archived'} /></TD>
                <TD>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button onClick={() => openEdit(p)} style={{ padding: '0.3rem 0.75rem', borderRadius: '0.4rem', border: '1.5px solid var(--cream-border)', background: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', color: 'var(--maroon)' }}>Edit</button>
                    <ConfirmBtn
                      label="Archive"
                      onConfirm={() => handleDelete(p.id)}
                      confirmLabel="Archive?"
                      btnStyle={{ padding: '0.3rem 0.75rem', borderRadius: '0.4rem', border: 'none', background: '#FEE2E2', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', color: '#DC2626' }}
                    />
                  </div>
                </TD>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontWeight: 600 }}>No products yet.</p>}
      </div>
    </div>
  );
}

// ── OrdersTab ─────────────────────────────────────────────────────────────────
function OrdersTab({ toast }: { toast: ToastFn }) {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [secAgo, setSecAgo] = useState(0);
  const [editNoteId, setEditNoteId] = useState<string | null>(null);
  const [editNoteVal, setEditNoteVal] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState('processing');

  const reload = useCallback(() =>
    apiFetch('/api/admin/orders').then(d => {
      setOrders(d);
      setLastUpdated(Date.now());
      setSecAgo(0);
    }), []);

  useEffect(() => { reload(); }, [reload]);

  // Auto-refresh every 30s
  useEffect(() => {
    const id = setInterval(reload, 30000);
    return () => clearInterval(id);
  }, [reload]);

  // Seconds-ago ticker
  useEffect(() => {
    if (!lastUpdated) return;
    const id = setInterval(() => setSecAgo(Math.floor((Date.now() - lastUpdated) / 1000)), 1000);
    return () => clearInterval(id);
  }, [lastUpdated]);

  const updateStatus = async (id: string, status: string) => {
    await apiFetch(`/api/admin/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
    toast(`Order updated to "${status}"`, 'success');
    reload();
  };

  const approveCancel = async (id: string) => {
    await apiFetch(`/api/admin/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status: 'cancelled' }) });
    toast('Cancellation approved.', 'success');
    reload();
  };

  const denyCancel = async (id: string) => {
    await fetch(`${API}/api/orders/${id}/cancel-deny`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
    });
    toast('Cancellation denied — order continues.', 'info');
    setOrders(prev => prev.map(o => o.id === id ? { ...o, cancellationRequested: false } : o));
  };

  const saveNote = async (id: string) => {
    await apiFetch(`/api/admin/orders/${id}/note`, { method: 'PUT', body: JSON.stringify({ note: editNoteVal }) });
    toast('Note saved.', 'success');
    setOrders(prev => prev.map(o => o.id === id ? { ...o, note: editNoteVal } : o));
    setEditNoteId(null);
  };

  const exportCSV = () => {
    const rows = [
      ['ID', 'Customer', 'Email', 'Items', 'Total', 'Status', 'Date', 'Note'],
      ...filtered.map(o => [
        o.id,
        o.customerName || '',
        o.customerEmail || '',
        (o.items || []).map(i => `${i.title} x${i.quantity || 1}`).join('; '),
        (o.total || 0).toFixed(2),
        o.status,
        o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '',
        o.note || '',
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const applyBulk = async () => {
    if (!selected.size) return;
    await Promise.all([...selected].map(id =>
      apiFetch(`/api/admin/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status: bulkStatus }) })
    ));
    toast(`${selected.size} order${selected.size !== 1 ? 's' : ''} updated to "${bulkStatus}"`, 'success');
    setSelected(new Set());
    reload();
  };

  const toggleSelect = (id) => setSelected(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const STATUSES = ['placed', 'processing', 'shipped', 'delivered', 'cancelled'];
  const pendingCancels = orders.filter(o => o.cancellationRequested && o.status !== 'cancelled').length;

  const filtered = statusFilter === 'all' ? orders
    : statusFilter === 'cancel-requested' ? orders.filter(o => o.cancellationRequested && o.status !== 'cancelled')
    : orders.filter(o => o.status === statusFilter);

  const { page, setPage, totalPages, slice: pageSlice } = usePager(filtered, 20, statusFilter);

  const allPageSelected = pageSlice.length > 0 && pageSlice.every(o => selected.has(o.id));
  const toggleAll = () => {
    if (allPageSelected) setSelected(prev => { const next = new Set(prev); pageSlice.forEach(o => next.delete(o.id)); return next; });
    else setSelected(prev => { const next = new Set(prev); pageSlice.forEach(o => next.add(o.id)); return next; });
  };

  const FILTER_PILLS = [
    { key: 'all', label: `All (${orders.length})` },
    ...STATUSES.map(s => ({ key: s, label: `${s[0].toUpperCase() + s.slice(1)} (${orders.filter(o => o.status === s).length})` })),
    ...(pendingCancels > 0 ? [{ key: 'cancel-requested', label: `⚠ Cancel Req. (${pendingCancels})` }] : []),
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h2 style={{ margin: 0, color: 'var(--maroon)', fontSize: '1.25rem' }}>Orders</h2>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {lastUpdated && (
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Updated {secAgo}s ago
            </span>
          )}
          <button onClick={exportCSV} style={{ padding: '0.3rem 0.875rem', borderRadius: '0.4rem', border: '1.5px solid var(--cream-border)', background: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', color: '#22C55E' }}>
            ⬇ Export CSV
          </button>
          <button onClick={reload} style={{ padding: '0.3rem 0.875rem', borderRadius: '0.4rem', border: '1.5px solid var(--cream-border)', background: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', color: 'var(--maroon)' }}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
        {FILTER_PILLS.map(pill => (
          <button
            key={pill.key}
            onClick={() => setStatusFilter(pill.key)}
            style={{
              padding: '0.3rem 0.875rem', borderRadius: '9999px', border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: '0.8rem',
              background: statusFilter === pill.key ? 'var(--maroon)' : 'var(--cream-dark)',
              color: statusFilter === pill.key ? 'white' : 'var(--text-secondary)',
              transition: 'all 0.15s',
            }}
          >{pill.label}</button>
        ))}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div style={{ background: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: '0.75rem', padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1D4ED8' }}>{selected.size} order{selected.size !== 1 ? 's' : ''} selected</span>
          <span style={{ color: '#93C5FD' }}>→</span>
          <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)} style={{ padding: '0.3rem 0.5rem', border: '1.5px solid #BFDBFE', borderRadius: '0.4rem', fontFamily: 'Nunito', fontSize: '0.85rem', fontWeight: 700, color: '#1D4ED8', background: 'white', cursor: 'pointer' }}>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={applyBulk} style={{ padding: '0.3rem 0.875rem', borderRadius: '0.4rem', border: 'none', background: '#1D4ED8', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>
            Apply to {selected.size}
          </button>
          <button onClick={() => setSelected(new Set())} style={{ padding: '0.3rem 0.5rem', borderRadius: '0.4rem', border: 'none', background: 'transparent', color: '#6B7280', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>Clear</button>
        </div>
      )}

      <div style={{ overflowX: 'auto', background: 'white', borderRadius: '1rem', boxShadow: '0 2px 12px rgba(107,32,32,0.07)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            <TH><input type="checkbox" checked={allPageSelected} onChange={toggleAll} style={{ width: 15, height: 15, cursor: 'pointer' }} /></TH>
            <TH>Order ID</TH><TH>Customer</TH><TH>Items</TH><TH>Total</TH><TH>Status</TH><TH>Date</TH><TH>Note</TH><TH>Update</TH>
          </tr></thead>
          <tbody>
            {pageSlice.map(o => (
              <tr key={o.id} style={{ background: o.cancellationRequested && o.status !== 'cancelled' ? '#FFFBEB' : selected.has(o.id) ? '#EFF6FF' : 'white' }}>
                <TD><input type="checkbox" checked={selected.has(o.id)} onChange={() => toggleSelect(o.id)} style={{ width: 15, height: 15, cursor: 'pointer' }} /></TD>
                <TD>
                  <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 700, color: 'var(--maroon)' }}>{o.id}</span>
                    <button onClick={() => printOrder(o)} title="Print receipt" style={{ padding: '0.15rem 0.35rem', border: 'none', background: 'var(--cream)', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.75rem' }}>🖨</button>
                  </div>
                  {o.cancellationRequested && o.status !== 'cancelled' && (
                    <div style={{ marginTop: '0.3rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <span style={{ background: '#FEF3C7', color: '#92400E', borderRadius: '0.25rem', padding: '0.1rem 0.4rem', fontSize: '0.68rem', fontWeight: 800 }}>⚠ Cancel Requested</span>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button onClick={() => approveCancel(o.id)} style={{ padding: '0.2rem 0.5rem', borderRadius: '0.3rem', border: 'none', background: '#DCFCE7', color: '#166534', fontWeight: 800, fontSize: '0.68rem', cursor: 'pointer' }}>✓ Approve</button>
                        <button onClick={() => denyCancel(o.id)} style={{ padding: '0.2rem 0.5rem', borderRadius: '0.3rem', border: 'none', background: '#FEE2E2', color: '#DC2626', fontWeight: 800, fontSize: '0.68rem', cursor: 'pointer' }}>✗ Deny</button>
                      </div>
                    </div>
                  )}
                </TD>
                <TD>
                  <div style={{ fontWeight: 700 }}>{o.customerName || '—'}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{o.customerEmail || ''}</div>
                </TD>
                <TD style={{ maxWidth: 160 }}><span style={{ fontSize: '0.8rem' }}>{(o.items || []).map(i => i.title).join(', ').slice(0, 50)}{(o.items || []).length > 1 ? '…' : ''}</span></TD>
                <TD><span style={{ fontWeight: 800, color: 'var(--maroon)' }}>${(o.total || 0).toFixed(2)}</span></TD>
                <TD><StatusBadge status={o.status} /></TD>
                <TD style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '—'}</TD>
                <TD style={{ maxWidth: 160 }}>
                  {editNoteId === o.id ? (
                    <span style={{ display: 'inline-flex', gap: '0.25rem', alignItems: 'center' }}>
                      <input
                        type="text" value={editNoteVal} autoFocus placeholder="Add note…"
                        onChange={e => setEditNoteVal(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') saveNote(o.id); if (e.key === 'Escape') setEditNoteId(null); }}
                        style={{ width: 120, padding: '0.2rem 0.4rem', border: '1.5px solid var(--maroon)', borderRadius: '0.3rem', fontFamily: 'Nunito', fontSize: '0.8rem', outline: 'none' }}
                      />
                      <button onClick={() => saveNote(o.id)} style={{ padding: '0.2rem 0.4rem', border: 'none', background: '#DCFCE7', color: '#166534', borderRadius: '0.3rem', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}>✓</button>
                    </span>
                  ) : (
                    <span
                      onClick={() => { setEditNoteId(o.id); setEditNoteVal(o.note || ''); }}
                      title="Click to add/edit note"
                      style={{ cursor: 'pointer', fontSize: '0.78rem', color: o.note ? 'var(--text-secondary)' : 'var(--text-muted)', borderBottom: '1px dashed var(--cream-border)', fontStyle: o.note ? 'normal' : 'italic' }}
                    >{o.note || 'Add note…'}</span>
                  )}
                </TD>
                <TD>
                  <select
                    value={o.status}
                    onChange={e => updateStatus(o.id, e.target.value)}
                    style={{ padding: '0.3rem 0.5rem', border: '1.5px solid var(--cream-border)', borderRadius: '0.4rem', fontFamily: 'Nunito, sans-serif', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </TD>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontWeight: 600 }}>{orders.length === 0 ? 'No orders yet.' : 'No orders match this filter.'}</p>}
        <Pager page={page} totalPages={totalPages} setPage={setPage} />
      </div>
    </div>
  );
}

// ── SubscribersTab ────────────────────────────────────────────────────────────
function SubscribersTab({ toast }: { toast: ToastFn }) {
  const [allSubs, setAllSubs] = useState<AdminSubscriber[]>([]);
  const [showRemoved, setShowRemoved] = useState(false);
  const [showBlast, setShowBlast] = useState(false);
  const [blastSubject, setBlastSubject] = useState('');
  const [blastBody, setBlastBody] = useState('');
  const [sending, setSending] = useState(false);

  const load = () => apiFetch('/api/admin/subscribers').then(d => setAllSubs(Array.isArray(d) ? d : []));
  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    await apiFetch(`/api/admin/subscribers/${id}`, { method: 'DELETE' });
    toast('Subscriber removed.', 'info');
    setAllSubs(prev => prev.map(s => s.id === id ? { ...s, active: false } : s));
  };

  const sendBlast = async (e: FormEvent) => {
    e.preventDefault();
    setSending(true);
    const html = `<div style="font-family:sans-serif;max-width:560px;margin:auto;padding:32px;color:#222">${blastBody.replace(/\n/g, '<br/>')}<p style="color:#888;font-size:12px;margin-top:24px">© 2025 Tiggy's Kingdom</p></div>`;
    const res = await apiFetch('/api/admin/email-blast', { method: 'POST', body: JSON.stringify({ subject: blastSubject, html }) });
    setSending(false);
    if (res.error) { toast(res.error, 'error'); return; }
    toast(`Sent to ${res.sent} subscriber${res.sent !== 1 ? 's' : ''}!`, 'success');
    setShowBlast(false);
    setBlastSubject('');
    setBlastBody('');
  };

  const visible = showRemoved ? allSubs : allSubs.filter(s => s.active);
  const removedCount = allSubs.filter(s => !s.active).length;
  const { page, setPage, totalPages, slice } = usePager(visible, 25, showRemoved);

  const inputStyle: CSSProperties = { width: '100%', padding: '0.6rem 0.875rem', border: '1.5px solid var(--cream-border)', borderRadius: '0.5rem', fontFamily: 'Nunito, sans-serif', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h2 style={{ margin: 0, color: 'var(--maroon)', fontSize: '1.25rem' }}>Subscribers</h2>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setShowBlast(true)} className="btn-gold" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>✉ Email Blast</button>
          {removedCount > 0 && (
            <button onClick={() => setShowRemoved(v => !v)} style={{ background: 'none', border: '1.5px solid var(--cream-border)', borderRadius: '0.4rem', padding: '0.3rem 0.875rem', fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
              {showRemoved ? 'Hide removed' : `Show removed (${removedCount})`}
            </button>
          )}
          <span style={{ background: 'var(--gold-pale)', color: 'var(--gold-dark)', padding: '0.3rem 0.875rem', borderRadius: '9999px', fontWeight: 800, fontSize: '0.85rem' }}>
            {allSubs.filter(s => s.active).length} active
          </span>
        </div>
      </div>

      {/* Email blast modal */}
      {showBlast && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '1.25rem', padding: '2rem', width: '100%', maxWidth: 560 }}>
            <h3 style={{ margin: '0 0 1.25rem', color: 'var(--maroon)' }}>Send Email Blast</h3>
            <p style={{ margin: '0 0 1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Will be sent to all <strong>{allSubs.filter(s => s.active).length}</strong> active subscribers.
            </p>
            <form onSubmit={sendBlast} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Subject</label>
                <input type="text" value={blastSubject} onChange={e => setBlastSubject(e.target.value)} style={inputStyle} required placeholder="e.g. New episodes this week!" />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Message (plain text)</label>
                <textarea value={blastBody} onChange={e => setBlastBody(e.target.value)} style={{ ...inputStyle, height: 160, resize: 'vertical' }} required placeholder="Write your message here…" />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowBlast(false)} className="btn-outline-maroon" style={{ padding: '0.55rem 1.25rem', fontSize: '0.9rem' }}>Cancel</button>
                <button type="submit" className="btn-maroon" style={{ padding: '0.55rem 1.25rem', fontSize: '0.9rem' }} disabled={sending}>{sending ? 'Sending…' : 'Send to All'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto', background: 'white', borderRadius: '1rem', boxShadow: '0 2px 12px rgba(107,32,32,0.07)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><TH>Email</TH><TH>Name</TH><TH>Source</TH><TH>Joined</TH><TH>Action</TH></tr></thead>
          <tbody>
            {slice.map(s => (
              <tr key={s.id} style={{ opacity: s.active ? 1 : 0.5 }}>
                <TD style={{ fontWeight: 700 }}>{s.email}</TD>
                <TD>{s.name || '—'}</TD>
                <TD><span style={{ background: 'var(--cream)', padding: '0.15rem 0.5rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: 700 }}>{s.source}</span></TD>
                <TD style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{new Date(s.createdAt).toLocaleDateString()}</TD>
                <TD>
                  {s.active ? (
                    <ConfirmBtn
                      label="Remove"
                      onConfirm={() => remove(s.id)}
                      confirmLabel="Remove?"
                      btnStyle={{ padding: '0.3rem 0.75rem', borderRadius: '0.4rem', border: 'none', background: '#FEE2E2', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', color: '#DC2626' }}
                    />
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>Removed</span>
                  )}
                </TD>
              </tr>
            ))}
          </tbody>
        </table>
        {visible.length === 0 && (
          <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {allSubs.length === 0 ? 'No subscribers yet.' : 'All subscribers have been removed.'}
          </p>
        )}
        <Pager page={page} totalPages={totalPages} setPage={setPage} />
      </div>
    </div>
  );
}

// ── UsersTab ──────────────────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([
      apiFetch('/api/admin/users'),
      apiFetch('/api/admin/orders'),
    ]).then(([u, o]) => {
      setUsers(Array.isArray(u) ? u : []);
      setOrders(Array.isArray(o) ? o : []);
    }).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const ordersByUser = orders.reduce((acc, o) => {
    if (!o.userId) return acc;
    if (!acc[o.userId]) acc[o.userId] = { count: 0, latest: null };
    acc[o.userId].count += 1;
    if (!acc[o.userId].latest || new Date(o.createdAt) > new Date(acc[o.userId].latest.createdAt)) acc[o.userId].latest = o;
    return acc;
  }, {});

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h2 style={{ margin: 0, color: 'var(--maroon)', fontSize: '1.25rem' }}>Registered Users</h2>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span style={{ background: 'var(--cream-dark)', color: 'var(--text-secondary)', padding: '0.3rem 0.875rem', borderRadius: '9999px', fontWeight: 800, fontSize: '0.85rem' }}>{users.length} total</span>
          <button onClick={load} style={{ ...btnBase }}>↻ Refresh</button>
        </div>
      </div>
      <div style={{ overflowX: 'auto', background: 'white', borderRadius: '1rem', boxShadow: '0 2px 12px rgba(107,32,32,0.07)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><TH>Name</TH><TH>Email</TH><TH>Joined</TH><TH>Orders</TH><TH>Latest Order</TH></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontWeight: 600 }}>Loading…</td></tr>}
            {!loading && users.map(u => {
              const info = ordersByUser[u.id];
              return (
                <tr key={u.id}>
                  <TD>
                    <div style={{ fontWeight: 700 }}>{u.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{u.id}</div>
                  </TD>
                  <TD>{u.email}</TD>
                  <TD style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{u.joinedDate ? new Date(u.joinedDate).toLocaleDateString() : '—'}</TD>
                  <TD>{info ? <span style={{ background: '#DCFCE7', color: '#166534', borderRadius: '9999px', padding: '0.15rem 0.6rem', fontWeight: 800, fontSize: '0.78rem' }}>{info.count} order{info.count !== 1 ? 's' : ''}</span> : <span style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.78rem' }}>None</span>}</TD>
                  <TD style={{ fontSize: '0.78rem' }}>{info?.latest ? (<div><StatusBadge status={info.latest.status} /><div style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }}>{new Date(info.latest.createdAt).toLocaleDateString()}</div></div>) : <span style={{ color: 'var(--text-muted)' }}>—</span>}</TD>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!loading && users.length === 0 && <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontWeight: 600 }}>No registered users yet.</p>}
      </div>
    </div>
  );
}

// ── EpisodesTab ───────────────────────────────────────────────────────────────
function EpisodesTab({ toast }: { toast: ToastFn }) {
  const [eps, setEps] = useState<AdminEpisode[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AdminEpisode | null>(null);
  const [form, setForm] = useState({ videoId: '', title: '', description: '', ages: '4-8', category: 'general', featured: false, order: 1 });

  const load = useCallback(() => apiFetch('/api/admin/episodes').then(d => setEps(Array.isArray(d) ? d : [])), []);
  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setEditing(null); setForm({ videoId: '', title: '', description: '', ages: '4-8', category: 'general', featured: false, order: (eps.length + 1) }); setShowForm(true); };
  const openEdit = (e: AdminEpisode) => { setEditing(e); setForm({ videoId: e.videoId, title: e.title, description: e.description || '', ages: e.ages || '4-8', category: e.category || 'general', featured: e.featured ?? false, order: e.order ?? 1 }); setShowForm(true); };

  const handleSave = async (ev: FormEvent) => {
    ev.preventDefault();
    const body = { ...form, order: Number(form.order), featured: Boolean(form.featured) };
    if (editing) {
      await apiFetch(`/api/admin/episodes/${editing.id}`, { method: 'PUT', body: JSON.stringify(body) });
      toast('Episode updated!', 'success');
    } else {
      await apiFetch('/api/admin/episodes', { method: 'POST', body: JSON.stringify(body) });
      toast('Episode added!', 'success');
    }
    setShowForm(false);
    load();
  };

  const handleDelete = async (id: string) => {
    await apiFetch(`/api/admin/episodes/${id}`, { method: 'DELETE' });
    toast('Episode removed.', 'info');
    load();
  };

  const inputStyle: CSSProperties = { width: '100%', padding: '0.6rem 0.875rem', border: '1.5px solid var(--cream-border)', borderRadius: '0.5rem', fontFamily: 'Nunito, sans-serif', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h2 style={{ margin: 0, color: 'var(--maroon)', fontSize: '1.25rem' }}>Curated Episodes</h2>
        <button onClick={openAdd} className="btn-gold" style={{ padding: '0.55rem 1.25rem', fontSize: '0.9rem' }}>+ Add Episode</button>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '1.25rem', padding: '2rem', width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 1.5rem', color: 'var(--maroon)' }}>{editing ? 'Edit Episode' : 'New Episode'}</h3>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {[['videoId', 'YouTube Video ID', 'text'], ['title', 'Episode Title', 'text'], ['description', 'Description', 'text'], ['ages', 'Age Range (e.g. 4-8)', 'text'], ['order', 'Display Order', 'number']].map(([key, label, type]) => (
                <div key={key}>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{label}</label>
                  <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} style={inputStyle} required={key === 'title'} />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inputStyle}>
                  {['general', 'prayer', 'saints', 'scripture', 'fasting', 'liturgy'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" id="featured" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} style={{ width: 18, height: 18 }} />
                <label htmlFor="featured" style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Feature on homepage</label>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowForm(false)} className="btn-outline-maroon" style={{ padding: '0.55rem 1.25rem', fontSize: '0.9rem' }}>Cancel</button>
                <button type="submit" className="btn-maroon" style={{ padding: '0.55rem 1.25rem', fontSize: '0.9rem' }}>Save Episode</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto', background: 'white', borderRadius: '1rem', boxShadow: '0 2px 12px rgba(107,32,32,0.07)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><TH>#</TH><TH>Title</TH><TH>Video ID</TH><TH>Ages</TH><TH>Category</TH><TH>Featured</TH><TH>Actions</TH></tr></thead>
          <tbody>
            {eps.map(e => (
              <tr key={e.id} style={{ background: !e.active ? '#FFF5F5' : 'white' }}>
                <TD style={{ fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.8rem' }}>{e.order}</TD>
                <TD><div style={{ fontWeight: 700 }}>{e.title}</div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{e.description?.slice(0, 50)}</div></TD>
                <TD><span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#3B82F6' }}>{e.videoId || '—'}</span></TD>
                <TD><span style={{ background: '#DBEAFE', color: '#1D4ED8', borderRadius: '9999px', padding: '0.15rem 0.5rem', fontSize: '0.72rem', fontWeight: 700 }}>{e.ages}</span></TD>
                <TD><span style={{ background: 'var(--cream)', padding: '0.15rem 0.5rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: 700 }}>{e.category}</span></TD>
                <TD><span style={{ color: e.featured ? '#22C55E' : 'var(--text-muted)', fontWeight: 800 }}>{e.featured ? '★ Yes' : 'No'}</span></TD>
                <TD>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button onClick={() => openEdit(e)} style={{ padding: '0.3rem 0.75rem', borderRadius: '0.4rem', border: '1.5px solid var(--cream-border)', background: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', color: 'var(--maroon)' }}>Edit</button>
                    <ConfirmBtn
                      label="Remove"
                      onConfirm={() => handleDelete(e.id)}
                      confirmLabel="Remove?"
                      btnStyle={{ padding: '0.3rem 0.75rem', borderRadius: '0.4rem', border: 'none', background: '#FEE2E2', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', color: '#DC2626' }}
                    />
                  </div>
                </TD>
              </tr>
            ))}
          </tbody>
        </table>
        {eps.length === 0 && <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontWeight: 600 }}>No curated episodes yet.</p>}
      </div>
    </div>
  );
}

// ── ActivityTab ───────────────────────────────────────────────────────────────
const ACTION_LABELS: Record<string, string> = {
  order_status:      '📦 Order Status',
  order_note:        '📝 Order Note',
  product_create:    '➕ Product Created',
  product_update:    '✏️ Product Updated',
  product_delete:    '🗄 Product Archived',
  email_blast:       '✉️ Email Blast',
  subscriber_remove: '🗑 Subscriber Removed',
};

function ActivityTab() {
  const [log, setLog] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    apiFetch('/api/admin/activity-log').then(d => { setLog(Array.isArray(d) ? d : []); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const fmtDetails = (action: string, details: Record<string, unknown>) => {
    if (action === 'order_status') return `${details.orderId}: ${details.from} → ${details.to}`;
    if (action === 'order_note') return `${details.orderId}: "${details.note}"`;
    if (action === 'email_blast') return `"${details.subject}" — sent ${details.sent}/${details.total}`;
    if (action === 'subscriber_remove') return String(details.email || '');
    return `${details.title || details.id || JSON.stringify(details)}`;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h2 style={{ margin: 0, color: 'var(--maroon)', fontSize: '1.25rem' }}>Activity Log</h2>
        <button onClick={load} style={{ ...btnBase }}>↻ Refresh</button>
      </div>
      <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 2px 12px rgba(107,32,32,0.07)', overflow: 'hidden' }}>
        {loading ? (
          <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontWeight: 600 }}>Loading…</p>
        ) : log.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontWeight: 600 }}>No activity yet. Actions taken in the admin panel will appear here.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><TH>Action</TH><TH>Details</TH><TH>Time</TH></tr></thead>
            <tbody>
              {log.map(entry => (
                <tr key={entry.id}>
                  <TD style={{ whiteSpace: 'nowrap' }}>
                    <span style={{ background: 'var(--cream)', padding: '0.2rem 0.6rem', borderRadius: '0.375rem', fontSize: '0.78rem', fontWeight: 700 }}>
                      {ACTION_LABELS[entry.action] || entry.action}
                    </span>
                  </TD>
                  <TD style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: 320 }}>{fmtDetails(entry.action, entry.details)}</TD>
                  <TD style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{new Date(entry.at).toLocaleString()}</TD>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Main Admin ────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',    label: 'Overview',    icon: '📊', key: 'o' },
  { id: 'products',    label: 'Products',    icon: '📦', key: 'p' },
  { id: 'orders',      label: 'Orders',      icon: '🛒', key: 'r' },
  { id: 'subscribers', label: 'Subscribers', icon: '✉️', key: 's' },
  { id: 'users',       label: 'Users',       icon: '👥', key: 'u' },
  { id: 'episodes',    label: 'Episodes',    icon: '▶',  key: 'e' },
  { id: 'activity',    label: 'Activity',    icon: '📋', key: 'l' },
];

export default function Admin() {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [allOrders, setAllOrders] = useState<AdminOrder[]>([]);
  const [toasts, setToasts] = useState<AdminToast[]>([]);
  const navigate = useNavigate();

  const addToast = (message: string, type = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  };

  // Load stats + orders for sparkline
  useEffect(() => {
    if (!token()) { navigate('/admin/login'); return; }
    Promise.all([
      apiFetch('/api/admin/stats'),
      apiFetch('/api/admin/orders'),
    ]).then(([s, o]) => {
      setStats(s);
      setAllOrders(Array.isArray(o) ? o : []);
    }).catch(() => navigate('/admin/login'));
  }, [navigate]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((document.activeElement as HTMLElement)?.tagName)) return;
      const map: Record<string, string> = { o: 'overview', p: 'products', r: 'orders', s: 'subscribers', u: 'users', e: 'episodes', l: 'activity' };
      if (map[e.key]) setTab(map[e.key]);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('tk_admin_token');
    localStorage.removeItem('tk_admin_user');
    navigate('/admin/login');
  };

  // 7-day revenue sparkline
  const sparkline = (() => {
    const buckets = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return { label: d.toLocaleDateString(undefined, { weekday: 'short' }), revenue: 0 };
    });
    allOrders.forEach(o => {
      if (!o.createdAt) return;
      const daysAgo = Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 86400000);
      if (daysAgo >= 0 && daysAgo < 7) buckets[6 - daysAgo].revenue += (o.total || 0);
    });
    return buckets;
  })();
  const sparkMax = Math.max(1, ...sparkline.map(b => b.revenue));

  // Badge counts
  const ordersBadge = stats ? (stats.orders.placed || 0) + (stats.cancelRequests || 0) : 0;

  const TOAST_COLORS = { success: '#22C55E', error: '#EF4444', info: '#3B82F6', warning: '#F97316' };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', flexDirection: 'column' }}>
      {/* Toast notifications */}
      <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {toasts.map(t => (
          <div key={t.id} className="toast-enter" style={{ background: TOAST_COLORS[t.type] || '#3B82F6', color: 'white', padding: '0.75rem 1.25rem', borderRadius: '0.75rem', fontWeight: 700, fontSize: '0.9rem', boxShadow: '0 4px 16px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'} {t.message}
          </div>
        ))}
      </div>

      {/* Top bar */}
      <header style={{ background: 'var(--maroon)', padding: '0 1.5rem', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img src="/tiggy.png" alt="Tiggy" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(201,146,42,0.6)', flexShrink: 0 }} />
          <span style={{ color: 'white', fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.1rem' }}>Tiggy's Kingdom</span>
          <span style={{ color: 'rgba(255,255,255,0.5)', margin: '0 0.25rem' }}>/</span>
          <span style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 600, fontSize: '0.9rem' }}>Admin</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontFamily: 'monospace', display: 'none' /* hint */ }}>
            o/p/r/s/u/e/l
          </span>
          <a href="/" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, fontSize: '0.85rem' }}>View Site →</a>
          <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.4rem 0.875rem', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>Log Out</button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <aside style={{ width: 220, background: 'white', borderRight: '1px solid var(--cream-border)', padding: '1.5rem 0', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
          {TABS.map(t => {
            const badge = t.id === 'orders' ? ordersBadge : 0;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.75rem 1.5rem', border: 'none',
                  background: tab === t.id ? 'var(--cream)' : 'white',
                  color: tab === t.id ? 'var(--maroon)' : 'var(--text-secondary)',
                  fontWeight: tab === t.id ? 800 : 600, fontSize: '0.9rem', cursor: 'pointer',
                  borderLeft: tab === t.id ? '3px solid var(--maroon)' : '3px solid transparent',
                  textAlign: 'left', transition: 'all 0.15s', position: 'relative',
                }}
              >
                <span>{t.icon}</span>
                <span style={{ flex: 1 }}>{t.label}</span>
                {badge > 0 && (
                  <span style={{ background: '#EF4444', color: 'white', borderRadius: '9999px', padding: '0.1rem 0.4rem', fontSize: '0.7rem', fontWeight: 900, minWidth: 18, textAlign: 'center' }}>{badge}</span>
                )}
              </button>
            );
          })}

          {/* Quick stats in sidebar */}
          {stats && (
            <div style={{ marginTop: 'auto', padding: '1.25rem', borderTop: '1px solid var(--cream-border)' }}>
              <p style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quick Stats</p>
              {[
                ['Revenue', `$${stats.revenue.toFixed(0)}`],
                ['Orders', stats.orders.total],
                ['Subscribers', stats.subscribers.active],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{k}</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--maroon)' }}>{v}</span>
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          {tab === 'overview' && stats && (
            <div>
              <h2 style={{ margin: '0 0 1.5rem', color: 'var(--maroon)' }}>Dashboard Overview</h2>

              {/* Low-stock alert strip */}
              {stats.lowStock && stats.lowStock.length > 0 && (
                <div style={{ background: '#FEF3C7', border: '1.5px solid #FDE68A', borderRadius: '0.75rem', padding: '0.875rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>⚠️</span>
                  <div>
                    <p style={{ margin: '0 0 0.35rem', fontWeight: 800, color: '#92400E', fontSize: '0.9rem' }}>Low Stock Alert</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {stats.lowStock.map(p => (
                        <span key={p.id} style={{ background: '#FDE68A', color: '#92400E', borderRadius: '9999px', padding: '0.15rem 0.6rem', fontSize: '0.78rem', fontWeight: 700 }}>
                          {p.title} — {p.stock} left
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <StatCard icon="💰" label="Total Revenue" value={`$${stats.revenue.toFixed(2)}`} sub={`${stats.orders.total} orders`} color="#C9922A" />
                <StatCard icon="📦" label="Products" value={stats.products.active} sub={`${stats.products.total} total`} color="#6B2020" />
                <StatCard icon="🛒" label="Orders" value={stats.orders.total} sub={`${stats.orders.delivered || 0} delivered`} color="#7C3AED" />
                <StatCard icon="✉️" label="Subscribers" value={stats.subscribers.active} sub="active newsletter" color="#3B82F6" />
                <StatCard icon="👥" label="Users" value={stats.users.total} sub="registered" color="#22C55E" />
                <StatCard icon="▶" label="Episodes" value={stats.episodes?.featured || 0} sub={`${stats.episodes?.total || 0} total`} color="#3B82F6" />
              </div>

              {/* 7-day revenue sparkline */}
              <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 2px 12px rgba(107,32,32,0.07)', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1.25rem', fontSize: '1rem', color: 'var(--text-secondary)' }}>7-Day Revenue</h3>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', height: 80 }}>
                  {sparkline.map((b, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>{b.revenue > 0 ? `$${b.revenue.toFixed(0)}` : ''}</span>
                      <div style={{ width: '100%', background: 'var(--cream)', borderRadius: '0.3rem 0.3rem 0 0', height: 48, display: 'flex', alignItems: 'flex-end' }}>
                        <div style={{ width: '100%', borderRadius: '0.3rem 0.3rem 0 0', background: `linear-gradient(180deg, #C9922A, #6B2020)`, height: `${Math.max(4, (b.revenue / sparkMax) * 100)}%`, transition: 'height 0.5s ease', minHeight: b.revenue > 0 ? 4 : 0 }} />
                      </div>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>{b.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order status breakdown */}
              <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 2px 12px rgba(107,32,32,0.07)', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1.25rem', fontSize: '1rem', color: 'var(--text-secondary)' }}>Order Status Breakdown</h3>
                {(() => {
                  const max = Math.max(1, ...Object.entries(STATUS_COLORS).map(([s]) => stats.orders[s] || 0));
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {Object.entries(STATUS_COLORS).map(([status, color]) => {
                        const count = stats.orders[status] || 0;
                        return (
                          <div key={status} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 32px', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color, textTransform: 'capitalize', textAlign: 'right' }}>{status}</span>
                            <div style={{ height: 18, borderRadius: '9999px', background: 'var(--cream)', overflow: 'hidden' }}>
                              <div style={{ width: `${Math.round((count / max) * 100)}%`, height: '100%', borderRadius: '9999px', background: `linear-gradient(90deg, ${color}99, ${color})`, minWidth: count > 0 ? 18 : 0, transition: 'width 0.5s ease' }} />
                            </div>
                            <span style={{ fontSize: '0.82rem', fontWeight: 900, color }}>{count}</span>
                          </div>
                        );
                      })}
                      <p style={{ margin: '0.75rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>
                        {stats.orders.total} total · ${stats.revenue.toFixed(2)} revenue
                      </p>
                    </div>
                  );
                })()}
              </div>

              <div style={{ background: 'var(--cream-dark)', borderRadius: '1rem', padding: '1.5rem' }}>
                <p style={{ fontWeight: 700, color: 'var(--maroon)', margin: '0 0 0.5rem' }}>Admin Credentials (dev only)</p>
                <p style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Username: <strong>admin</strong> &nbsp;|&nbsp; Password: <strong>tiggy2025</strong></p>
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Move credentials to .env before deploying.</p>
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Keyboard shortcuts: <span style={{ fontFamily: 'monospace', background: 'var(--cream)', padding: '0 4px', borderRadius: 3 }}>O</span> Overview · <span style={{ fontFamily: 'monospace', background: 'var(--cream)', padding: '0 4px', borderRadius: 3 }}>P</span> Products · <span style={{ fontFamily: 'monospace', background: 'var(--cream)', padding: '0 4px', borderRadius: 3 }}>R</span> Orders · <span style={{ fontFamily: 'monospace', background: 'var(--cream)', padding: '0 4px', borderRadius: 3 }}>S</span> Subscribers · <span style={{ fontFamily: 'monospace', background: 'var(--cream)', padding: '0 4px', borderRadius: 3 }}>U</span> Users · <span style={{ fontFamily: 'monospace', background: 'var(--cream)', padding: '0 4px', borderRadius: 3 }}>E</span> Episodes · <span style={{ fontFamily: 'monospace', background: 'var(--cream)', padding: '0 4px', borderRadius: 3 }}>L</span> Activity</p>
              </div>
            </div>
          )}
          {tab === 'products'    && <ProductsTab    toast={addToast} />}
          {tab === 'orders'      && <OrdersTab      toast={addToast} />}
          {tab === 'subscribers' && <SubscribersTab toast={addToast} />}
          {tab === 'users'       && <UsersTab />}
          {tab === 'episodes'    && <EpisodesTab    toast={addToast} />}
          {tab === 'activity'    && <ActivityTab />}
        </main>
      </div>
    </div>
  );
}
