import { useState, useEffect, useCallback, useRef, type ReactNode, type CSSProperties, type FormEvent, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { API } from '../lib/api';
import { STATUS_COLORS } from '../lib/constants';
import { type ActivityCard, type QuizQuestion } from './Activities';
import { type ParentGuide } from './Subscribe';
import { type Prayer } from './Calendar';
import { type FreeStory } from './Stories';

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
  coverImageUrl?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
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
  trackingNumber?: string;
  trackingCarrier?: string;
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
        <p style={{ margin: '0.15rem 0 0', fontSize: '1.75rem', fontWeight: 900, color, fontFamily: 'Fredoka, sans-serif', lineHeight: 1 }}>{value}</p>
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


function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] || '#9B7070';
  return <span style={{ background: `${color}18`, color, borderRadius: '9999px', padding: '0.2rem 0.6rem', fontSize: '0.72rem', fontWeight: 800 }}>{status}</span>;
}

// ── printOrder ─────────────────────────────────────────────────────────────────
function printOrder(o: AdminOrder) {
  const w = window.open('', '_blank', 'width=620,height=720');
  if (!w) { alert('Please allow pop-ups to print receipts.'); return; }
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
  const [form, setForm] = useState({ title: '', author: '', price: '', originalPrice: '', category: 'story', ages: '4+', stock: 20, badge: '', active: true, coverImageUrl: '', fileUrl: '', fileName: '' });
  const [editStockId, setEditStockId] = useState<number | null>(null);
  const [editStockVal, setEditStockVal] = useState('');
  const [uploadingKind, setUploadingKind] = useState<'cover' | 'file' | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const load = useCallback(() => apiFetch('/api/admin/products').then(setProducts), []);
  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setEditing(null); setForm({ title: '', author: '', price: '', originalPrice: '', category: 'story', ages: '4+', stock: 20, badge: '', active: true, coverImageUrl: '', fileUrl: '', fileName: '' }); setUploadError(null); setShowForm(true); };
  const openEdit = (p: AdminProduct) => { setEditing(p); setForm({ title: p.title, author: p.author || '', price: String(p.price), originalPrice: p.originalPrice ? String(p.originalPrice) : '', category: p.category, ages: p.ages || '4-8', stock: p.stock, badge: p.badge || '', active: p.active ?? true, coverImageUrl: p.coverImageUrl || '', fileUrl: p.fileUrl || '', fileName: p.fileName || '' }); setUploadError(null); setShowForm(true); };

  const handleUpload = async (kind: 'cover' | 'file', file: File) => {
    const ALLOWED_EXTS = kind === 'cover' ? ['.png', '.jpg', '.jpeg'] : ['.pdf', '.epub', '.png', '.jpg', '.jpeg'];
    const ext = '.' + file.name.split('.').pop()!.toLowerCase();
    if (!ALLOWED_EXTS.includes(ext)) {
      setUploadError(`${kind === 'cover' ? 'Cover image' : 'Story file'} must be one of: ${ALLOWED_EXTS.join(', ')}. Got: ${ext}`);
      return;
    }
    if (file.size > 20 * 1024 * 1024) { setUploadError('File must be under 20 MB.'); return; }
    setUploadingKind(kind);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API}/api/admin/stories/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) { setUploadError(data.error || 'Upload failed'); return; }
      if (kind === 'cover') setForm(f => ({ ...f, coverImageUrl: data.url }));
      else setForm(f => ({ ...f, fileUrl: data.url, fileName: data.name }));
    } catch { setUploadError('Network error — could not reach the server'); }
    finally { setUploadingKind(null); }
  };

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

  const inputStyle: CSSProperties = { width: '100%', padding: '0.6rem 0.875rem', border: '1.5px solid var(--cream-border)', borderRadius: '0.5rem', fontFamily: 'Fredoka, sans-serif', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' };

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

              {uploadError && (
                <div style={{ gridColumn: '1 / -1', background: '#FEE2E2', color: '#DC2626', padding: '0.5rem 0.875rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 700 }}>
                  ✕ {uploadError}
                </div>
              )}

              <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--cream-border)', paddingTop: '0.875rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Cover Image</label>
                  <input type="file" ref={coverInputRef} accept=".png,.jpg,.jpeg" style={{ display: 'none' }}
                    onChange={e => { if (e.target.files?.[0]) handleUpload('cover', e.target.files[0]); e.target.value = ''; }} />
                  {form.coverImageUrl && (
                    <img src={form.coverImageUrl} alt="Cover preview" style={{ width: 64, height: 90, objectFit: 'cover', borderRadius: '0.4rem', marginBottom: '0.4rem', display: 'block' }} />
                  )}
                  <button type="button" onClick={() => coverInputRef.current?.click()} disabled={uploadingKind === 'cover'}
                    style={{ ...btnBase, background: form.coverImageUrl ? '#EFF6FF' : 'var(--maroon)', color: form.coverImageUrl ? '#2C5FA0' : 'white', border: form.coverImageUrl ? '1.5px solid #BFDBFE' : 'none', opacity: uploadingKind === 'cover' ? 0.6 : 1 }}>
                    {uploadingKind === 'cover' ? '⏳ Uploading…' : form.coverImageUrl ? '↑ Replace cover' : '↑ Upload cover'}
                  </button>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Story File (PDF/ePub)</label>
                  <input type="file" ref={fileInputRef} accept=".pdf,.epub,.png,.jpg,.jpeg" style={{ display: 'none' }}
                    onChange={e => { if (e.target.files?.[0]) handleUpload('file', e.target.files[0]); e.target.value = ''; }} />
                  {form.fileUrl ? (
                    <p style={{ margin: '0 0 0.4rem', fontSize: '0.78rem', color: '#22A05A', fontWeight: 700 }}>
                      📎 {form.fileName} <a href={form.fileUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#2C5FA0', textDecoration: 'none' }}>preview ↗</a>
                    </p>
                  ) : (
                    <p style={{ margin: '0 0 0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>No file attached</p>
                  )}
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingKind === 'file'}
                    style={{ ...btnBase, background: form.fileUrl ? '#EFF6FF' : 'var(--maroon)', color: form.fileUrl ? '#2C5FA0' : 'white', border: form.fileUrl ? '1.5px solid #BFDBFE' : 'none', opacity: uploadingKind === 'file' ? 0.6 : 1 }}>
                    {uploadingKind === 'file' ? '⏳ Uploading…' : form.fileUrl ? '↑ Replace file' : '↑ Upload file'}
                  </button>
                </div>
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
                        style={{ width: 60, padding: '0.2rem 0.4rem', border: '1.5px solid var(--maroon)', borderRadius: '0.3rem', fontFamily: 'Fredoka', fontWeight: 700, fontSize: '0.85rem', outline: 'none' }}
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
  const [editTrackId, setEditTrackId] = useState<string | null>(null);
  const [editTrackVal, setEditTrackVal] = useState('');
  const [editCarrierVal, setEditCarrierVal] = useState('');
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

  const saveTracking = async (id: string) => {
    await apiFetch(`/api/admin/orders/${id}/tracking`, { method: 'PUT', body: JSON.stringify({ tracking_number: editTrackVal.trim(), carrier: editCarrierVal.trim() }) });
    toast('Tracking saved.', 'success');
    setOrders(prev => prev.map(o => o.id === id ? { ...o, trackingNumber: editTrackVal.trim() || undefined, trackingCarrier: editCarrierVal.trim() || undefined } : o));
    setEditTrackId(null);
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
          <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)} style={{ padding: '0.3rem 0.5rem', border: '1.5px solid #BFDBFE', borderRadius: '0.4rem', fontFamily: 'Fredoka', fontSize: '0.85rem', fontWeight: 700, color: '#1D4ED8', background: 'white', cursor: 'pointer' }}>
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
            <TH>Order ID</TH><TH>Customer</TH><TH>Items</TH><TH>Total</TH><TH>Status</TH><TH>Date</TH><TH>Tracking</TH><TH>Note</TH><TH>Update</TH>
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
                <TD style={{ maxWidth: 150 }}>
                  {editTrackId === o.id ? (
                    <span style={{ display: 'inline-flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <input
                        type="text" value={editTrackVal} autoFocus placeholder="Tracking #"
                        onChange={e => setEditTrackVal(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') saveTracking(o.id); if (e.key === 'Escape') setEditTrackId(null); }}
                        style={{ width: 120, padding: '0.2rem 0.4rem', border: '1.5px solid var(--maroon)', borderRadius: '0.3rem', fontFamily: 'Fredoka', fontSize: '0.8rem', outline: 'none' }}
                      />
                      <input
                        type="text" value={editCarrierVal} placeholder="Carrier (UPS, USPS…)"
                        onChange={e => setEditCarrierVal(e.target.value)}
                        style={{ width: 120, padding: '0.2rem 0.4rem', border: '1.5px solid var(--cream-border)', borderRadius: '0.3rem', fontFamily: 'Fredoka', fontSize: '0.78rem', outline: 'none' }}
                      />
                      <span style={{ display: 'inline-flex', gap: '0.25rem' }}>
                        <button onClick={() => saveTracking(o.id)} style={{ padding: '0.2rem 0.4rem', border: 'none', background: '#DCFCE7', color: '#166534', borderRadius: '0.3rem', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}>✓</button>
                        <button onClick={() => setEditTrackId(null)} style={{ padding: '0.2rem 0.4rem', border: 'none', background: 'var(--cream)', color: 'var(--text-muted)', borderRadius: '0.3rem', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}>✕</button>
                      </span>
                    </span>
                  ) : (
                    <span
                      onClick={() => { setEditTrackId(o.id); setEditTrackVal(o.trackingNumber || ''); setEditCarrierVal(o.trackingCarrier || ''); }}
                      title="Click to set tracking number"
                      style={{ cursor: 'pointer', fontSize: '0.78rem', color: o.trackingNumber ? '#166534' : 'var(--text-muted)', borderBottom: '1px dashed var(--cream-border)', fontStyle: o.trackingNumber ? 'normal' : 'italic', fontWeight: o.trackingNumber ? 700 : 400 }}
                    >{o.trackingNumber ? `${o.trackingCarrier ? o.trackingCarrier + ' · ' : ''}${o.trackingNumber}` : 'Add tracking…'}</span>
                  )}
                </TD>
                <TD style={{ maxWidth: 160 }}>
                  {editNoteId === o.id ? (
                    <span style={{ display: 'inline-flex', gap: '0.25rem', alignItems: 'center' }}>
                      <input
                        type="text" value={editNoteVal} autoFocus placeholder="Add note…"
                        onChange={e => setEditNoteVal(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') saveNote(o.id); if (e.key === 'Escape') setEditNoteId(null); }}
                        style={{ width: 120, padding: '0.2rem 0.4rem', border: '1.5px solid var(--maroon)', borderRadius: '0.3rem', fontFamily: 'Fredoka', fontSize: '0.8rem', outline: 'none' }}
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
                    style={{ padding: '0.3rem 0.5rem', border: '1.5px solid var(--cream-border)', borderRadius: '0.4rem', fontFamily: 'Fredoka, sans-serif', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
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
    const html = `<div style="font-family:sans-serif;max-width:560px;margin:auto;padding:32px;color:#222">${blastBody.replace(/\n/g, '<br/>')}<p style="color:#888;font-size:12px;margin-top:24px">© ${new Date().getFullYear()} Tiggy's Kingdom</p></div>`;
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

  const inputStyle: CSSProperties = { width: '100%', padding: '0.6rem 0.875rem', border: '1.5px solid var(--cream-border)', borderRadius: '0.5rem', fontFamily: 'Fredoka, sans-serif', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h2 style={{ margin: 0, color: 'var(--maroon)', fontSize: '1.25rem' }}>Subscribers</h2>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setShowBlast(true)} className="btn-gold" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>✉ Email Blast</button>
          <button onClick={() => {
            const rows = [['Email', 'Name', 'Source', 'Joined', 'Active'], ...allSubs.map(s => [s.email, s.name || '', s.source || '', s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '', s.active ? 'Yes' : 'No'])];
            const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
            const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
            a.download = `subscribers-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
          }} style={{ padding: '0.3rem 0.875rem', borderRadius: '0.4rem', border: '1.5px solid var(--cream-border)', background: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', color: '#22C55E' }}>
            ⬇ Export CSV
          </button>
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
          <button onClick={() => {
            const rows = [['Name', 'Email', 'User ID', 'Joined', 'Orders'], ...users.map(u => {
              const info = ordersByUser[u.id];
              return [u.name, u.email, u.id, u.joinedDate ? new Date(u.joinedDate).toLocaleDateString() : '', info ? info.count : 0];
            })];
            const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
            const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
            a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
          }} style={{ padding: '0.3rem 0.875rem', borderRadius: '0.4rem', border: '1.5px solid var(--cream-border)', background: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', color: '#22C55E' }}>
            ⬇ Export CSV
          </button>
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
  const [form, setForm] = useState({ videoId: '', title: '', description: '', ages: '4+', category: 'general', featured: false, order: 1 });

  const load = useCallback(() => apiFetch('/api/admin/episodes').then(d => setEps(Array.isArray(d) ? d : [])), []);
  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setEditing(null); setForm({ videoId: '', title: '', description: '', ages: '4+', category: 'general', featured: false, order: (eps.length + 1) }); setShowForm(true); };
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

  const inputStyle: CSSProperties = { width: '100%', padding: '0.6rem 0.875rem', border: '1.5px solid var(--cream-border)', borderRadius: '0.5rem', fontFamily: 'Fredoka, sans-serif', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' };

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
              {[['videoId', 'YouTube Video ID', 'text'], ['title', 'Episode Title', 'text'], ['description', 'Description', 'text'], ['ages', 'Age Range (e.g. 4+)', 'text'], ['order', 'Display Order', 'number']].map(([key, label, type]) => (
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
  order_tracking:    '🚚 Order Tracking',
  product_create:    '➕ Product Created',
  product_update:    '✏️ Product Updated',
  product_delete:    '🗄 Product Archived',
  email_blast:       '✉️ Email Blast',
  subscriber_remove: '🗑 Subscriber Removed',
};

function ActivityTab() {
  const [log, setLog] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const load = () => {
    setLoading(true);
    apiFetch('/api/admin/activity-log').then(d => { setLog(Array.isArray(d) ? d : []); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const fmtDetails = (action: string, details: Record<string, unknown>) => {
    if (action === 'order_status') return `${details.orderId}: ${details.from} → ${details.to}`;
    if (action === 'order_note') return `${details.orderId}: "${details.note}"`;
    if (action === 'order_tracking') return `${details.orderId}: ${details.tracking_number}${details.carrier ? ' (' + details.carrier + ')' : ''}`;
    if (action === 'email_blast') return `"${details.subject}" — sent ${details.sent}/${details.total}`;
    if (action === 'subscriber_remove') return String(details.email || '');
    return `${details.title || details.id || JSON.stringify(details)}`;
  };

  const uniqueActions = ['all', ...Array.from(new Set(log.map(e => e.action)))];

  const filtered = log.filter(e => {
    if (actionFilter !== 'all' && e.action !== actionFilter) return false;
    if (dateFrom && new Date(e.at) < new Date(dateFrom)) return false;
    if (dateTo && new Date(e.at) > new Date(dateTo + 'T23:59:59')) return false;
    return true;
  });

  const exportCSV = () => {
    const rows = [
      ['Action', 'Details', 'Time'],
      ...filtered.map(e => [
        ACTION_LABELS[e.action] || e.action,
        fmtDetails(e.action, e.details),
        new Date(e.at).toLocaleString(),
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h2 style={{ margin: 0, color: 'var(--maroon)', fontSize: '1.25rem' }}>Activity Log</h2>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={exportCSV} disabled={filtered.length === 0} style={{ padding: '0.3rem 0.875rem', borderRadius: '0.4rem', border: '1.5px solid var(--cream-border)', background: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', color: '#22C55E' }}>
            ⬇ Export CSV
          </button>
          <button onClick={load} style={{ ...btnBase }}>↻ Refresh</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'center' }}>
        <select
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
          style={{ padding: '0.3rem 0.625rem', border: '1.5px solid var(--cream-border)', borderRadius: '0.4rem', fontFamily: 'Fredoka', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', color: 'var(--text-primary)', background: 'white' }}
        >
          {uniqueActions.map(a => (
            <option key={a} value={a}>{a === 'all' ? 'All actions' : ACTION_LABELS[a] || a}</option>
          ))}
        </select>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} placeholder="From"
          style={{ padding: '0.3rem 0.625rem', border: '1.5px solid var(--cream-border)', borderRadius: '0.4rem', fontFamily: 'Fredoka', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }} />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} placeholder="To"
          style={{ padding: '0.3rem 0.625rem', border: '1.5px solid var(--cream-border)', borderRadius: '0.4rem', fontFamily: 'Fredoka', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }} />
        {(actionFilter !== 'all' || dateFrom || dateTo) && (
          <button onClick={() => { setActionFilter('all'); setDateFrom(''); setDateTo(''); }}
            style={{ padding: '0.3rem 0.625rem', border: 'none', background: 'var(--cream)', borderRadius: '0.4rem', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
            ✕ Clear
          </button>
        )}
        {!loading && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>{filtered.length} entries</span>}
      </div>

      <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 2px 12px rgba(107,32,32,0.07)', overflow: 'hidden' }}>
        {loading ? (
          <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontWeight: 600 }}>Loading…</p>
        ) : filtered.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontWeight: 600 }}>{log.length === 0 ? 'No activity yet. Actions taken in the admin panel will appear here.' : 'No entries match these filters.'}</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><TH>Action</TH><TH>Details</TH><TH>Time</TH></tr></thead>
            <tbody>
              {filtered.map(entry => (
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

// ── Content management helpers ───────────────────────────────────────────────
type ContentItem = { id: string; active?: boolean } & (ActivityCard | QuizQuestion | ParentGuide | Prayer | FreeStory);

function useLocalStore<T extends { id: string; active?: boolean }>(key: string, defaults: T[]): [T[], (items: T[]) => void] {
  const get = (): T[] => {
    try {
      const s = localStorage.getItem(key);
      const parsed: T[] = s ? JSON.parse(s) : defaults;
      return parsed.map(item => ({ ...item, active: item.active ?? true }));
    } catch { return defaults; }
  };
  const [items, setItems] = useState<T[]>(get);
  const save = (next: T[]) => { localStorage.setItem(key, JSON.stringify(next)); setItems(next); };
  return [items, save];
}

// Import default arrays from the public pages for seeding
const ACTIVITY_DEFAULTS: ActivityCard[] = [
  { id: '1', icon: '✏️', title: 'Coloring Pages',   desc: 'Printable scenes of Tiggy, the saints, and the great feasts to color in.',       tags: ['PDF','Ages 4+','Free'], cta: 'Download pack →', ctaColor: '#C0392B', active: true },
  { id: '2', icon: '🧠', title: 'Saint Quizzes',     desc: 'Fun, gentle quizzes to test what you remember about your favorite saints.',       tags: ['Interactive','Ages 4+'], cta: 'Try a quiz →', ctaColor: '#7C3AED', active: true },
  { id: '3', icon: '🃏', title: 'Memory Cards',      desc: 'Match the icons and learn the feasts with a classic memory game.',                tags: ['Printable','Ages 4+'], cta: 'Print cards →', ctaColor: '#2E8B57', active: true },
  { id: '4', icon: '🎮', title: 'Simple Games',      desc: 'Easy, screen-safe games — help Tiggy find the lost sheep and more.',              tags: ['Online','Ages 4+'], cta: 'Play now →', ctaColor: '#2C5FA0', active: true },
  { id: '5', icon: '✂️', title: 'Printable Crafts',  desc: 'Paper icons, feast-day garlands, and prayer-corner decorations to make.',        tags: ['PDF','With grown-up'], cta: 'Get crafts →', ctaColor: '#D4691D', active: true },
  { id: '6', icon: '🎨', title: 'Draw with Tiggy',   desc: 'Follow along, step by step, and learn to draw Tiggy and her friends.',           tags: ['Video','All ages'], cta: 'Start drawing →', ctaColor: '#C0392B', active: true },
];
const QUIZ_DEFAULTS: QuizQuestion[] = [
  { id: '1', question: 'Which saint is famous for secretly giving gifts to those in need? 🎁', options: ['St. Nicholas of Myra','St. George','St. Mary of Egypt'], correctIndex: 0, active: true },
  { id: '2', question: 'Which apostle was the first to be called by Jesus?', options: ['St. Peter','St. Andrew','St. John'], correctIndex: 1, active: true },
  { id: '3', question: 'How many days did Jonah spend inside the big fish? 🐟', options: ['One day','Three days','Seven days'], correctIndex: 1, active: true },
];
const PRAYER_DEFAULTS: Prayer[] = [
  { id: '1', icon: '🌅', title: 'Morning Prayer',       borderColor: '#F97316', text: "Thank You, God, for this new day. Keep me kind in work and play. Help me love and help me share, and feel You with me everywhere.", note: 'A gentle way to begin the morning with gratitude.', active: true },
  { id: '2', icon: '🌙', title: 'Evening Prayer',        borderColor: '#7C3AED', text: "Thank You, God, for all today — the friends, the food, the time to play. Watch me as I close my eyes, until the morning sun will rise.", note: 'Perfect for the end of the bedtime routine.', active: true },
  { id: '3', icon: '🍽',  title: 'Before Meals',          borderColor: '#22A05A', text: "Bless this food we're going to eat, and bless the hands that made our treat. Thank You, God, for all we share. Amen.", note: 'A short blessing the whole family can say together.', active: true },
  { id: '4', icon: '👼', title: 'To My Guardian Angel',  borderColor: '#3B82F6', text: "Angel sent to be my friend, stay beside me to the end. Guide my steps and keep me near to all that's good and all that's dear.", note: 'Help little ones feel safe and watched over.', active: true },
];
const GUIDE_DEFAULTS: ParentGuide[] = [
  { id: '1', icon: '📋', title: 'Parent Guides',      desc: 'One-page guides for each episode with the lesson, discussion questions, and a simple follow-up activity.',   cta: 'Download guides →', type: 'parent',  active: true },
  { id: '2', icon: '🍎', title: 'Teacher Resources',  desc: 'Lesson plans, printable worksheets, and classroom-ready slides for Sunday school and church schools.',       cta: 'Browse lessons →',  type: 'teacher', active: true },
  { id: '3', icon: '📅', title: 'Feast Day Calendar', desc: 'A year-round calendar of the great feasts and saints, with reminders you can follow as a family or class.',  cta: 'Open calendar →',   type: 'feast',   active: true },
];
const FREE_STORY_DEFAULTS: FreeStory[] = [];

// ── Generic content manager component ─────────────────────────────────────────
function ContentManager<T extends { id: string; active?: boolean }>({ storageKey, defaults, fields, renderPreview, addLabel }: {
  storageKey: string;
  defaults: T[];
  fields: Array<{ key: keyof T; label: string; type?: 'text' | 'textarea' | 'color' | 'select' | 'toggle'; options?: string[] }>;
  renderPreview: (item: T) => string;
  addLabel: string;
}) {
  const [items, setItems] = useLocalStore<T>(storageKey, defaults);
  const [editing, setEditing] = useState<T | null>(null);
  const [form, setForm] = useState<Partial<T>>({});

  const startNew = () => {
    const blank: Partial<T> = { id: Date.now().toString(), active: true } as Partial<T>;
    fields.forEach(f => { if (!(f.key in blank)) blank[f.key] = (f.type === 'toggle' ? true : '') as T[keyof T]; });
    setForm(blank);
    setEditing(blank as T);
  };

  const startEdit = (item: T) => { setEditing(item); setForm({ ...item }); };
  const cancelEdit = () => { setEditing(null); setForm({}); };

  const saveEdit = () => {
    const next = editing?.id && items.find(i => i.id === editing.id)
      ? items.map(i => i.id === editing!.id ? { ...i, ...form } as T : i)
      : [...items, { ...form } as T];
    setItems(next);
    cancelEdit();
  };

  const toggleActive = (id: string) => setItems(items.map(i => i.id === id ? { ...i, active: !i.active } as T : i));
  const deleteItem   = (id: string) => setItems(items.filter(i => i.id !== id));

  const rowStyle: CSSProperties = { padding: '0.875rem 1rem', borderBottom: '1px solid var(--cream)', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>{items.length} items</h3>
        <button onClick={startNew} style={{ ...btnBase, background: 'var(--maroon)', color: 'white', border: 'none', padding: '0.4rem 1rem' }}>+ {addLabel}</button>
      </div>

      {editing && (
        <div style={{ background: 'var(--gold-pale)', border: '1.5px solid var(--gold)', borderRadius: '0.875rem', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h4 style={{ margin: '0 0 1rem', color: 'var(--maroon)' }}>{items.find(i => i.id === editing.id) ? 'Edit' : 'New'} item</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.875rem' }}>
            {fields.map(f => (
              <div key={String(f.key)}>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase' }}>{f.label}</label>
                {f.type === 'toggle' ? (
                  <input type="checkbox" checked={!!form[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.checked }))} style={{ width: 18, height: 18 }} />
                ) : f.type === 'textarea' ? (
                  <textarea value={String(form[f.key] ?? '')} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} rows={3} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1.5px solid var(--cream-border)', borderRadius: '0.5rem', fontFamily: 'Fredoka, sans-serif', fontSize: '0.875rem', resize: 'vertical' }} />
                ) : f.type === 'select' ? (
                  <select value={String(form[f.key] ?? '')} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1.5px solid var(--cream-border)', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
                    {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input type={f.type || 'text'} value={String(form[f.key] ?? '')} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1.5px solid var(--cream-border)', borderRadius: '0.5rem', fontSize: '0.875rem' }} />
                )}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button onClick={saveEdit} style={{ ...btnBase, background: 'var(--maroon)', color: 'white', border: 'none' }}>Save</button>
            <button onClick={cancelEdit} style={{ ...btnBase }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ background: 'white', borderRadius: '0.875rem', overflow: 'hidden', border: '1px solid var(--cream-border)' }}>
        {items.length === 0 && <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>No items yet.</p>}
        {items.map(item => (
          <div key={item.id} style={{ ...rowStyle, opacity: item.active ? 1 : 0.5 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{renderPreview(item)}</p>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{item.active ? 'Active' : 'Hidden'}</p>
            </div>
            <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
              <button onClick={() => toggleActive(item.id)} style={{ ...btnBase, background: item.active ? '#FEF3C7' : '#DCFCE7', color: item.active ? '#C9922A' : '#166534' }}>{item.active ? 'Hide' : 'Show'}</button>
              <button onClick={() => startEdit(item)} style={{ ...btnBase }}>Edit</button>
              <ConfirmBtn label="Delete" onConfirm={() => deleteItem(item.id)} btnStyle={{ ...btnBase, background: '#FEE2E2', color: '#DC2626', border: 'none' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const ACTIVITY_FILES_KEY = 'tk_activity_files';

type ActivityFilesMap = Record<string, { url: string; name: string; filename: string }>;

function getActivityFiles(): ActivityFilesMap {
  try { return JSON.parse(localStorage.getItem(ACTIVITY_FILES_KEY) || '{}'); } catch { return {}; }
}

function ActivitiesTab() {
  const [activityFiles, setActivityFiles] = useState<ActivityFilesMap>(getActivityFiles);
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const currentActivities = (): ActivityCard[] => {
    try { const s = localStorage.getItem('tk_activities'); return s ? JSON.parse(s) : ACTIVITY_DEFAULTS; }
    catch { return ACTIVITY_DEFAULTS; }
  };

  const saveFiles = (next: ActivityFilesMap) => {
    localStorage.setItem(ACTIVITY_FILES_KEY, JSON.stringify(next));
    setActivityFiles({ ...next });
  };

  const handleUpload = async (activityId: string, file: File) => {
    const ALLOWED_EXTS = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg'];
    const ext = '.' + file.name.split('.').pop()!.toLowerCase();
    if (!ALLOWED_EXTS.includes(ext)) {
      setUploadError(`Only PDF, Word docs, and images are allowed (.pdf, .doc, .docx, .png, .jpg). Got: ${ext}`);
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setUploadError('File must be under 20 MB.');
      return;
    }
    setUploading(activityId);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API}/api/admin/activities/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) { setUploadError(data.error || 'Upload failed'); return; }
      saveFiles({ ...activityFiles, [activityId]: { url: data.url, name: data.name, filename: data.filename } });
    } catch { setUploadError('Network error — could not reach the server'); }
    finally { setUploading(null); }
  };

  const handleRemove = async (activityId: string) => {
    const fileInfo = activityFiles[activityId];
    if (!fileInfo) return;
    try {
      await fetch(`${API}/api/admin/activities/file`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: fileInfo.filename }),
      });
    } catch { /* best effort */ }
    const next = { ...activityFiles };
    delete next[activityId];
    saveFiles(next);
  };

  const rowStyle: CSSProperties = { padding: '0.875rem 1rem', borderBottom: '1px solid var(--cream)', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' };

  return (
    <div>
      <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem', color: 'var(--text-primary)' }}>Activities for Kids</h2>
      <ContentManager<ActivityCard>
        storageKey="tk_activities"
        defaults={ACTIVITY_DEFAULTS}
        addLabel="Add Activity"
        renderPreview={a => `${a.icon} ${a.title}`}
        fields={[
          { key: 'icon',     label: 'Icon (emoji)' },
          { key: 'title',    label: 'Title' },
          { key: 'desc',     label: 'Description', type: 'textarea' },
          { key: 'cta',      label: 'CTA text' },
          { key: 'ctaColor', label: 'CTA color', type: 'color' },
          { key: 'active',   label: 'Active', type: 'toggle' },
        ]}
      />

      {/* ── Uploadable files ──────────────────────────────────────────── */}
      <div style={{ marginTop: '2.5rem' }}>
        <h3 style={{ margin: '0 0 0.35rem', fontSize: '1rem', color: 'var(--text-primary)' }}>Activity Files</h3>
        <p style={{ margin: '0 0 1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          Upload the actual coloring page, craft sheet, or printable for each activity. Users will see a download button on the Activities page.
        </p>

        {uploadError && (
          <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '0.6rem 1rem', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem' }}>
            ✕ {uploadError}
          </div>
        )}

        <div style={{ background: 'white', borderRadius: '0.875rem', overflow: 'hidden', border: '1px solid var(--cream-border)' }}>
          {currentActivities().map(activity => {
            const file = activityFiles[activity.id];
            return (
              <div key={activity.id} style={rowStyle}>
                <input
                  type="file"
                  ref={el => { fileRefs.current[activity.id] = el; }}
                  style={{ display: 'none' }}
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  onChange={e => { if (e.target.files?.[0]) handleUpload(activity.id, e.target.files[0]); e.target.value = ''; }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                    {activity.icon} {activity.title}
                    {!activity.active && <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>(hidden)</span>}
                  </p>
                  {file ? (
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#22A05A', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      📎 {file.name}
                      <a href={file.url} target="_blank" rel="noopener noreferrer" style={{ color: '#2C5FA0', textDecoration: 'none', fontWeight: 700 }}>preview ↗</a>
                    </p>
                  ) : (
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>No file attached</p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
                  <button
                    onClick={() => fileRefs.current[activity.id]?.click()}
                    disabled={uploading === activity.id}
                    style={{ ...btnBase, background: file ? '#EFF6FF' : 'var(--maroon)', color: file ? '#2C5FA0' : 'white', border: file ? '1.5px solid #BFDBFE' : 'none', opacity: uploading === activity.id ? 0.6 : 1 }}
                  >
                    {uploading === activity.id ? '⏳ Uploading…' : file ? '↑ Replace' : '↑ Upload file'}
                  </button>
                  {file && (
                    <ConfirmBtn
                      label="Remove"
                      onConfirm={() => handleRemove(activity.id)}
                      btnStyle={{ ...btnBase, background: '#FEE2E2', color: '#DC2626', border: 'none' }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const FREE_STORY_FILES_KEY = 'tk_free_story_files';

type FreeStoryFilesMap = Record<string, { url: string; name: string; filename: string }>;

function getFreeStoryFiles(): FreeStoryFilesMap {
  try { return JSON.parse(localStorage.getItem(FREE_STORY_FILES_KEY) || '{}'); } catch { return {}; }
}

function FreeStoriesTab() {
  const [storyFiles, setStoryFiles] = useState<FreeStoryFilesMap>(getFreeStoryFiles);
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const currentStories = (): FreeStory[] => {
    try { const s = localStorage.getItem('tk_free_stories'); return s ? JSON.parse(s) : FREE_STORY_DEFAULTS; }
    catch { return FREE_STORY_DEFAULTS; }
  };

  const saveFiles = (next: FreeStoryFilesMap) => {
    localStorage.setItem(FREE_STORY_FILES_KEY, JSON.stringify(next));
    setStoryFiles({ ...next });
  };

  const handleUpload = async (storyId: string, file: File) => {
    const ALLOWED_EXTS = ['.pdf', '.png', '.jpg', '.jpeg'];
    const ext = '.' + file.name.split('.').pop()!.toLowerCase();
    if (!ALLOWED_EXTS.includes(ext)) {
      setUploadError(`Only PDF and images are allowed (.pdf, .png, .jpg). Got: ${ext}`);
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setUploadError('File must be under 20 MB.');
      return;
    }
    setUploading(storyId);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API}/api/admin/free-stories/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) { setUploadError(data.error || 'Upload failed'); return; }
      saveFiles({ ...storyFiles, [storyId]: { url: data.url, name: data.name, filename: data.filename } });
    } catch { setUploadError('Network error — could not reach the server'); }
    finally { setUploading(null); }
  };

  const handleRemove = async (storyId: string) => {
    const fileInfo = storyFiles[storyId];
    if (!fileInfo) return;
    try {
      await fetch(`${API}/api/admin/free-stories/file`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: fileInfo.filename }),
      });
    } catch { /* best effort */ }
    const next = { ...storyFiles };
    delete next[storyId];
    saveFiles(next);
  };

  const rowStyle: CSSProperties = { padding: '0.875rem 1rem', borderBottom: '1px solid var(--cream)', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' };

  return (
    <div>
      <h2 style={{ margin: '0 0 0.35rem', fontSize: '1.25rem', color: 'var(--text-primary)' }}>Free Stories</h2>
      <p style={{ margin: '0 0 1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
        The public Stories page currently shows a "Coming Soon" notice. Prep your free read-along stories here so they're ready to publish once the page goes live.
      </p>
      <ContentManager<FreeStory>
        storageKey="tk_free_stories"
        defaults={FREE_STORY_DEFAULTS}
        addLabel="Add Story"
        renderPreview={s => `${s.icon} ${s.title}`}
        fields={[
          { key: 'icon',   label: 'Icon (emoji)' },
          { key: 'title',  label: 'Title' },
          { key: 'desc',   label: 'Description', type: 'textarea' },
          { key: 'ages',   label: 'Age Range' },
          { key: 'active', label: 'Active', type: 'toggle' },
        ]}
      />

      {/* ── Uploadable files ──────────────────────────────────────────── */}
      <div style={{ marginTop: '2.5rem' }}>
        <h3 style={{ margin: '0 0 0.35rem', fontSize: '1rem', color: 'var(--text-primary)' }}>Story Files</h3>
        <p style={{ margin: '0 0 1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          Upload the read-along PDF or illustrated pages for each free story.
        </p>

        {uploadError && (
          <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '0.6rem 1rem', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem' }}>
            ✕ {uploadError}
          </div>
        )}

        <div style={{ background: 'white', borderRadius: '0.875rem', overflow: 'hidden', border: '1px solid var(--cream-border)' }}>
          {currentStories().length === 0 && <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>Add a story above first, then attach its file here.</p>}
          {currentStories().map(story => {
            const file = storyFiles[story.id];
            return (
              <div key={story.id} style={rowStyle}>
                <input
                  type="file"
                  ref={el => { fileRefs.current[story.id] = el; }}
                  style={{ display: 'none' }}
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={e => { if (e.target.files?.[0]) handleUpload(story.id, e.target.files[0]); e.target.value = ''; }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                    {story.icon} {story.title}
                    {!story.active && <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>(hidden)</span>}
                  </p>
                  {file ? (
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#22A05A', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      📎 {file.name}
                      <a href={file.url} target="_blank" rel="noopener noreferrer" style={{ color: '#2C5FA0', textDecoration: 'none', fontWeight: 700 }}>preview ↗</a>
                    </p>
                  ) : (
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>No file attached</p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
                  <button
                    onClick={() => fileRefs.current[story.id]?.click()}
                    disabled={uploading === story.id}
                    style={{ ...btnBase, background: file ? '#EFF6FF' : 'var(--maroon)', color: file ? '#2C5FA0' : 'white', border: file ? '1.5px solid #BFDBFE' : 'none', opacity: uploading === story.id ? 0.6 : 1 }}
                  >
                    {uploading === story.id ? '⏳ Uploading…' : file ? '↑ Replace' : '↑ Upload file'}
                  </button>
                  {file && (
                    <ConfirmBtn
                      label="Remove"
                      onConfirm={() => handleRemove(story.id)}
                      btnStyle={{ ...btnBase, background: '#FEE2E2', color: '#DC2626', border: 'none' }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function QuizzesTab() {
  const [quizzes, setQuizzes] = useLocalStore<QuizQuestion>('tk_quizzes', QUIZ_DEFAULTS);
  const [editing, setEditing] = useState<QuizQuestion | null>(null);
  const [form, setForm] = useState<{ question: string; options: string[]; correctIndex: number; active: boolean }>({
    question: '', options: ['', '', ''], correctIndex: 0, active: true,
  });

  const rowStyle: CSSProperties = { padding: '0.875rem 1rem', borderBottom: '1px solid var(--cream)', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' };
  const inputSt: CSSProperties = { width: '100%', padding: '0.5rem 0.75rem', border: '1.5px solid var(--cream-border)', borderRadius: '0.5rem', fontFamily: 'Fredoka, sans-serif', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' };

  const startNew = () => {
    setEditing({ id: Date.now().toString(), question: '', options: ['', '', ''], correctIndex: 0, active: true });
    setForm({ question: '', options: ['', '', ''], correctIndex: 0, active: true });
  };

  const startEdit = (q: QuizQuestion) => {
    setEditing(q);
    setForm({ question: q.question, options: [...q.options, '', '', ''].slice(0, Math.max(q.options.length, 3)), correctIndex: q.correctIndex, active: q.active });
  };

  const save = () => {
    if (!form.question.trim()) return;
    const options = form.options.map(o => o.trim()).filter(Boolean);
    if (options.length < 2) return;
    const correctIndex = Math.min(form.correctIndex, options.length - 1);
    const updated: QuizQuestion = { id: editing!.id, question: form.question.trim(), options, correctIndex, active: form.active };
    const exists = quizzes.find(q => q.id === editing!.id);
    setQuizzes(exists ? quizzes.map(q => q.id === editing!.id ? updated : q) : [...quizzes, updated]);
    setEditing(null);
  };

  const addOption = () => setForm(f => ({ ...f, options: [...f.options, ''] }));
  const removeOption = (i: number) => setForm(f => {
    const options = f.options.filter((_, idx) => idx !== i);
    return { ...f, options, correctIndex: Math.min(f.correctIndex, options.length - 1) };
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h2 style={{ margin: 0, color: 'var(--maroon)', fontSize: '1.25rem' }}>Quiz Questions</h2>
        <button onClick={startNew} style={{ ...btnBase, background: 'var(--maroon)', color: 'white', border: 'none', padding: '0.4rem 1rem' }}>+ Add Question</button>
      </div>

      {editing && (
        <div style={{ background: 'var(--gold-pale)', border: '1.5px solid var(--gold)', borderRadius: '0.875rem', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h4 style={{ margin: '0 0 1.25rem', color: 'var(--maroon)' }}>{quizzes.find(q => q.id === editing.id) ? 'Edit' : 'New'} Question</h4>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase' }}>Question</label>
            <textarea
              value={form.question}
              onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
              rows={2}
              style={{ ...inputSt, resize: 'vertical' }}
              placeholder="e.g. Which saint is famous for giving gifts? 🎁"
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              Answer Options — select the correct one
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {form.options.map((opt, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="radio"
                    name="correct"
                    checked={form.correctIndex === i}
                    onChange={() => setForm(f => ({ ...f, correctIndex: i }))}
                    title="Mark as correct answer"
                    style={{ width: 18, height: 18, accentColor: '#2E8B57', flexShrink: 0 }}
                  />
                  <input
                    type="text"
                    value={opt}
                    onChange={e => setForm(f => { const o = [...f.options]; o[i] = e.target.value; return { ...f, options: o }; })}
                    placeholder={`Option ${i + 1}`}
                    style={{ ...inputSt }}
                  />
                  {form.options.length > 2 && (
                    <button onClick={() => removeOption(i)} style={{ background: '#FEE2E2', border: 'none', borderRadius: '0.3rem', padding: '0.3rem 0.5rem', color: '#DC2626', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', flexShrink: 0 }}>✕</button>
                  )}
                </div>
              ))}
            </div>
            {form.options.length < 5 && (
              <button onClick={addOption} style={{ marginTop: '0.5rem', ...btnBase }}>+ Add option</button>
            )}
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: '#2E8B57', fontWeight: 700 }}>
              ● = correct answer
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} style={{ width: 18, height: 18 }} />
            <label style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Active (show to users)</label>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={save} style={{ ...btnBase, background: 'var(--maroon)', color: 'white', border: 'none' }}>Save Question</button>
            <button onClick={() => setEditing(null)} style={{ ...btnBase }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ background: 'white', borderRadius: '0.875rem', overflow: 'hidden', border: '1px solid var(--cream-border)' }}>
        {quizzes.length === 0 && <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>No questions yet.</p>}
        {quizzes.map(q => (
          <div key={q.id} style={{ ...rowStyle, opacity: q.active ? 1 : 0.5 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.question}</p>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.72rem', color: '#2E8B57', fontWeight: 600 }}>
                ✓ {q.options[q.correctIndex]} ({q.options.length} options)
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
              <button onClick={() => setQuizzes(quizzes.map(i => i.id === q.id ? { ...i, active: !i.active } : i))}
                style={{ ...btnBase, background: q.active ? '#FEF3C7' : '#DCFCE7', color: q.active ? '#C9922A' : '#166534' }}>
                {q.active ? 'Hide' : 'Show'}
              </button>
              <button onClick={() => startEdit(q)} style={{ ...btnBase }}>Edit</button>
              <ConfirmBtn label="Delete" onConfirm={() => setQuizzes(quizzes.filter(i => i.id !== q.id))}
                btnStyle={{ ...btnBase, background: '#FEE2E2', color: '#DC2626', border: 'none' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const PRAYER_FILES_KEY = 'tk_prayer_files';

type PrayerFilesMap = Record<string, { url: string; name: string; filename: string }>;

function getPrayerFiles(): PrayerFilesMap {
  try { return JSON.parse(localStorage.getItem(PRAYER_FILES_KEY) || '{}'); } catch { return {}; }
}

const CALENDAR_FILE_KEY = 'tk_calendar_file';

type CalendarFile = { url: string; name: string; filename: string } | null;

function getCalendarFile(): CalendarFile {
  try { return JSON.parse(localStorage.getItem(CALENDAR_FILE_KEY) || 'null'); } catch { return null; }
}

function PrayersTab() {
  const [prayerFiles, setPrayerFiles] = useState<PrayerFilesMap>(getPrayerFiles);
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [calendarFile, setCalendarFile] = useState<CalendarFile>(getCalendarFile);
  const [uploadingCalendar, setUploadingCalendar] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const calendarInputRef = useRef<HTMLInputElement | null>(null);

  const handleCalendarUpload = async (file: File) => {
    const ALLOWED_EXTS = ['.pdf', '.png', '.jpg', '.jpeg'];
    const ext = '.' + file.name.split('.').pop()!.toLowerCase();
    if (!ALLOWED_EXTS.includes(ext)) {
      setCalendarError(`Only PDF and images are allowed (.pdf, .png, .jpg). Got: ${ext}`);
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setCalendarError('File must be under 20 MB.');
      return;
    }
    setUploadingCalendar(true);
    setCalendarError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API}/api/admin/calendar/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) { setCalendarError(data.error || 'Upload failed'); return; }
      const next = { url: data.url, name: data.name, filename: data.filename };
      localStorage.setItem(CALENDAR_FILE_KEY, JSON.stringify(next));
      setCalendarFile(next);
    } catch { setCalendarError('Network error — could not reach the server'); }
    finally { setUploadingCalendar(false); }
  };

  const handleCalendarRemove = async () => {
    if (!calendarFile) return;
    try {
      await fetch(`${API}/api/admin/calendar/file`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: calendarFile.filename }),
      });
    } catch { /* best effort */ }
    localStorage.removeItem(CALENDAR_FILE_KEY);
    setCalendarFile(null);
  };

  const currentPrayers = (): Prayer[] => {
    try { const s = localStorage.getItem('tk_prayers'); return s ? JSON.parse(s) : PRAYER_DEFAULTS; }
    catch { return PRAYER_DEFAULTS; }
  };

  const saveFiles = (next: PrayerFilesMap) => {
    localStorage.setItem(PRAYER_FILES_KEY, JSON.stringify(next));
    setPrayerFiles({ ...next });
  };

  const handleUpload = async (prayerId: string, file: File) => {
    const ALLOWED_EXTS = ['.pdf', '.png', '.jpg', '.jpeg'];
    const ext = '.' + file.name.split('.').pop()!.toLowerCase();
    if (!ALLOWED_EXTS.includes(ext)) {
      setUploadError(`Only PDF and images are allowed (.pdf, .png, .jpg). Got: ${ext}`);
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setUploadError('File must be under 20 MB.');
      return;
    }
    setUploading(prayerId);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API}/api/admin/prayers/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) { setUploadError(data.error || 'Upload failed'); return; }
      saveFiles({ ...prayerFiles, [prayerId]: { url: data.url, name: data.name, filename: data.filename } });
    } catch { setUploadError('Network error — could not reach the server'); }
    finally { setUploading(null); }
  };

  const handleRemove = async (prayerId: string) => {
    const fileInfo = prayerFiles[prayerId];
    if (!fileInfo) return;
    try {
      await fetch(`${API}/api/admin/prayers/file`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: fileInfo.filename }),
      });
    } catch { /* best effort */ }
    const next = { ...prayerFiles };
    delete next[prayerId];
    saveFiles(next);
  };

  const rowStyle: CSSProperties = { padding: '0.875rem 1rem', borderBottom: '1px solid var(--cream)', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' };

  return (
    <div>
      <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem', color: 'var(--text-primary)' }}>Prayer Cards</h2>
      <ContentManager<Prayer>
        storageKey="tk_prayers"
        defaults={PRAYER_DEFAULTS}
        addLabel="Add Prayer"
        renderPreview={p => `${p.icon} ${p.title}`}
        fields={[
          { key: 'icon',        label: 'Icon (emoji)' },
          { key: 'title',       label: 'Title' },
          { key: 'text',        label: 'Prayer text', type: 'textarea' },
          { key: 'note',        label: 'Note / context', type: 'textarea' },
          { key: 'borderColor', label: 'Border color', type: 'color' },
          { key: 'active',      label: 'Active', type: 'toggle' },
        ]}
      />

      {/* ── Uploadable files ──────────────────────────────────────────── */}
      <div style={{ marginTop: '2.5rem' }}>
        <h3 style={{ margin: '0 0 0.35rem', fontSize: '1rem', color: 'var(--text-primary)' }}>Prayer Card Files</h3>
        <p style={{ margin: '0 0 1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          Upload a designed, printable card (PDF or image) for each prayer. If attached, users get this file instead of the auto-generated print page.
        </p>

        {uploadError && (
          <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '0.6rem 1rem', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem' }}>
            ✕ {uploadError}
          </div>
        )}

        <div style={{ background: 'white', borderRadius: '0.875rem', overflow: 'hidden', border: '1px solid var(--cream-border)' }}>
          {currentPrayers().map(prayer => {
            const file = prayerFiles[prayer.id];
            return (
              <div key={prayer.id} style={rowStyle}>
                <input
                  type="file"
                  ref={el => { fileRefs.current[prayer.id] = el; }}
                  style={{ display: 'none' }}
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={e => { if (e.target.files?.[0]) handleUpload(prayer.id, e.target.files[0]); e.target.value = ''; }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                    {prayer.icon} {prayer.title}
                    {!prayer.active && <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>(hidden)</span>}
                  </p>
                  {file ? (
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#22A05A', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      📎 {file.name}
                      <a href={file.url} target="_blank" rel="noopener noreferrer" style={{ color: '#2C5FA0', textDecoration: 'none', fontWeight: 700 }}>preview ↗</a>
                    </p>
                  ) : (
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>No file attached — using auto-generated print page</p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
                  <button
                    onClick={() => fileRefs.current[prayer.id]?.click()}
                    disabled={uploading === prayer.id}
                    style={{ ...btnBase, background: file ? '#EFF6FF' : 'var(--maroon)', color: file ? '#2C5FA0' : 'white', border: file ? '1.5px solid #BFDBFE' : 'none', opacity: uploading === prayer.id ? 0.6 : 1 }}
                  >
                    {uploading === prayer.id ? '⏳ Uploading…' : file ? '↑ Replace' : '↑ Upload file'}
                  </button>
                  {file && (
                    <ConfirmBtn
                      label="Remove"
                      onConfirm={() => handleRemove(prayer.id)}
                      btnStyle={{ ...btnBase, background: '#FEE2E2', color: '#DC2626', border: 'none' }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Printable feast day calendar ──────────────────────────────── */}
      <div style={{ marginTop: '2.5rem' }}>
        <h3 style={{ margin: '0 0 0.35rem', fontSize: '1rem', color: 'var(--text-primary)' }}>Printable Feast Day Calendar</h3>
        <p style={{ margin: '0 0 1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          Upload a printable calendar (PDF or image). When attached, users see a "Download Calendar" button on the Prayer Corner page.
        </p>

        {calendarError && (
          <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '0.6rem 1rem', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem' }}>
            ✕ {calendarError}
          </div>
        )}

        <div style={{ background: 'white', borderRadius: '0.875rem', border: '1px solid var(--cream-border)', padding: '1rem' }}>
          <input
            type="file"
            ref={calendarInputRef}
            style={{ display: 'none' }}
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={e => { if (e.target.files?.[0]) handleCalendarUpload(e.target.files[0]); e.target.value = ''; }}
          />
          {calendarFile ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#22A05A', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                📎 {calendarFile.name}
                <a href={calendarFile.url} target="_blank" rel="noopener noreferrer" style={{ color: '#2C5FA0', textDecoration: 'none', fontWeight: 700 }}>preview ↗</a>
              </p>
              <button
                onClick={() => calendarInputRef.current?.click()}
                disabled={uploadingCalendar}
                style={{ ...btnBase, background: '#EFF6FF', color: '#2C5FA0', border: '1.5px solid #BFDBFE', opacity: uploadingCalendar ? 0.6 : 1 }}
              >
                {uploadingCalendar ? '⏳ Uploading…' : '↑ Replace'}
              </button>
              <ConfirmBtn label="Remove" onConfirm={handleCalendarRemove} btnStyle={{ ...btnBase, background: '#FEE2E2', color: '#DC2626', border: 'none' }} />
            </div>
          ) : (
            <button
              onClick={() => calendarInputRef.current?.click()}
              disabled={uploadingCalendar}
              style={{ ...btnBase, background: 'var(--maroon)', color: 'white', border: 'none', opacity: uploadingCalendar ? 0.6 : 1 }}
            >
              {uploadingCalendar ? '⏳ Uploading…' : '↑ Upload Calendar'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const GUIDE_FILES_KEY = 'tk_guide_files';

type GuideFilesMap = Record<string, { url: string; name: string; filename: string }>;

function getGuideFiles(): GuideFilesMap {
  try { return JSON.parse(localStorage.getItem(GUIDE_FILES_KEY) || '{}'); } catch { return {}; }
}

function GuidesTab() {
  const [guideFiles, setGuideFiles] = useState<GuideFilesMap>(getGuideFiles);
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const currentGuides = (): ParentGuide[] => {
    try { const s = localStorage.getItem('tk_parent_guides'); return s ? JSON.parse(s) : GUIDE_DEFAULTS; }
    catch { return GUIDE_DEFAULTS; }
  };

  const saveFiles = (next: GuideFilesMap) => {
    localStorage.setItem(GUIDE_FILES_KEY, JSON.stringify(next));
    setGuideFiles({ ...next });
  };

  const handleUpload = async (guideId: string, file: File) => {
    const ALLOWED_EXTS = ['.pdf', '.doc', '.docx'];
    const ext = '.' + file.name.split('.').pop()!.toLowerCase();
    if (!ALLOWED_EXTS.includes(ext)) {
      setUploadError(`Only PDF and Word documents are allowed (.pdf, .doc, .docx). Got: ${ext}`);
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setUploadError('File must be under 20 MB.');
      return;
    }
    setUploading(guideId);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API}/api/admin/guides/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) { setUploadError(data.error || 'Upload failed'); return; }
      saveFiles({ ...guideFiles, [guideId]: { url: data.url, name: data.name, filename: data.filename } });
    } catch { setUploadError('Network error — could not reach the server'); }
    finally { setUploading(null); }
  };

  const handleRemove = async (guideId: string) => {
    const fileInfo = guideFiles[guideId];
    if (!fileInfo) return;
    try {
      await fetch(`${API}/api/admin/guides/file`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: fileInfo.filename }),
      });
    } catch { /* best effort */ }
    const next = { ...guideFiles };
    delete next[guideId];
    saveFiles(next);
  };

  const rowStyle: CSSProperties = { padding: '0.875rem 1rem', borderBottom: '1px solid var(--cream)', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' };

  return (
    <div>
      <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem', color: 'var(--text-primary)' }}>Parent &amp; Teacher Guides</h2>
      <ContentManager<ParentGuide>
        storageKey="tk_parent_guides"
        defaults={GUIDE_DEFAULTS}
        addLabel="Add Guide"
        renderPreview={g => `${g.icon} ${g.title}`}
        fields={[
          { key: 'icon',   label: 'Icon (emoji)' },
          { key: 'title',  label: 'Title' },
          { key: 'desc',   label: 'Description', type: 'textarea' },
          { key: 'cta',    label: 'CTA text' },
          { key: 'type',   label: 'Type', type: 'select', options: ['parent', 'teacher', 'feast'] },
          { key: 'active', label: 'Active', type: 'toggle' },
        ]}
      />

      {/* ── Downloadable files ──────────────────────────────────────────── */}
      <div style={{ marginTop: '2.5rem' }}>
        <h3 style={{ margin: '0 0 0.35rem', fontSize: '1rem', color: 'var(--text-primary)' }}>Downloadable Files</h3>
        <p style={{ margin: '0 0 1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          Attach a PDF or document to each guide. Users will see a Download button on the Parents page.
        </p>

        {uploadError && (
          <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '0.6rem 1rem', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem' }}>
            ✕ {uploadError}
          </div>
        )}

        <div style={{ background: 'white', borderRadius: '0.875rem', overflow: 'hidden', border: '1px solid var(--cream-border)' }}>
          {currentGuides().map(guide => {
            const file = guideFiles[guide.id];
            return (
              <div key={guide.id} style={rowStyle}>
                <input
                  type="file"
                  ref={el => { fileRefs.current[guide.id] = el; }}
                  style={{ display: 'none' }}
                  accept=".pdf,.doc,.docx"
                  onChange={e => { if (e.target.files?.[0]) handleUpload(guide.id, e.target.files[0]); e.target.value = ''; }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                    {guide.icon} {guide.title}
                    {!guide.active && <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>(hidden)</span>}
                  </p>
                  {file ? (
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#22A05A', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      📎 {file.name}
                      <a href={file.url} target="_blank" rel="noopener noreferrer" style={{ color: '#2C5FA0', textDecoration: 'none', fontWeight: 700 }}>preview ↗</a>
                    </p>
                  ) : (
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>No file attached</p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
                  <button
                    onClick={() => fileRefs.current[guide.id]?.click()}
                    disabled={uploading === guide.id}
                    style={{ ...btnBase, background: file ? '#EFF6FF' : 'var(--maroon)', color: file ? '#2C5FA0' : 'white', border: file ? '1.5px solid #BFDBFE' : 'none', opacity: uploading === guide.id ? 0.6 : 1 }}
                  >
                    {uploading === guide.id ? '⏳ Uploading…' : file ? '↑ Replace' : '↑ Upload file'}
                  </button>
                  {file && (
                    <ConfirmBtn
                      label="Remove"
                      onConfirm={() => handleRemove(guide.id)}
                      btnStyle={{ ...btnBase, background: '#FEE2E2', color: '#DC2626', border: 'none' }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── StripeSubsTab ─────────────────────────────────────────────────────────────
interface StripeSub {
  id: string;
  status: string;
  email: string | null;
  name: string | null;
  planName: string;
  amount: number;
  currency: string;
  interval: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  trialEnd: string | null;
  createdAt: string;
}

const SUB_STATUS_COLORS: Record<string, string> = {
  active: '#22C55E',
  trialing: '#3B82F6',
  past_due: '#F97316',
  canceled: '#EF4444',
  unpaid: '#EF4444',
  incomplete: '#9CA3AF',
};

function StripeSubsTab() {
  const [subs, setSubs] = useState<StripeSub[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const load = () => {
    setLoading(true);
    apiFetch('/api/admin/stripe-subscriptions')
      .then(d => { setSubs(Array.isArray(d) ? d : []); setLastRefreshed(new Date()); setLoading(false); })
      .catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const statuses = ['all', ...Array.from(new Set(subs.map(s => s.status)))];
  const filtered = statusFilter === 'all' ? subs : subs.filter(s => s.status === statusFilter);
  const { page, setPage, totalPages, slice } = usePager(filtered, 25, statusFilter);

  const mrr = subs
    .filter(s => s.status === 'active' || s.status === 'trialing')
    .reduce((sum, s) => sum + (s.interval === 'year' ? s.amount / 12 : s.amount), 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h2 style={{ margin: 0, color: 'var(--maroon)', fontSize: '1.25rem' }}>Stripe Subscriptions</h2>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ background: '#DCFCE7', color: '#166534', padding: '0.3rem 0.875rem', borderRadius: '9999px', fontWeight: 800, fontSize: '0.85rem' }}>
            MRR ~${mrr.toFixed(2)}/mo
          </span>
          {lastRefreshed && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Updated {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button onClick={load} style={{ ...btnBase }}>↻ Refresh</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {statuses.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            style={{ padding: '0.3rem 0.875rem', borderRadius: '9999px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem',
              background: statusFilter === s ? 'var(--maroon)' : 'var(--cream-dark)', color: statusFilter === s ? 'white' : 'var(--text-secondary)', transition: 'all 0.15s' }}
          >{s === 'all' ? `All (${subs.length})` : `${s} (${subs.filter(x => x.status === s).length})`}</button>
        ))}
      </div>

      <div style={{ overflowX: 'auto', background: 'white', borderRadius: '1rem', boxShadow: '0 2px 12px rgba(107,32,32,0.07)' }}>
        {loading ? (
          <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontWeight: 600 }}>Loading from Stripe…</p>
        ) : filtered.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontWeight: 600 }}>No subscriptions found.</p>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><TH>Customer</TH><TH>Plan</TH><TH>Amount</TH><TH>Status</TH><TH>Renews</TH><TH>Since</TH></tr></thead>
              <tbody>
                {slice.map(s => (
                  <tr key={s.id}>
                    <TD>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{s.name || '—'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.email || ''}</div>
                    </TD>
                    <TD><span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{s.planName}</span></TD>
                    <TD><span style={{ fontWeight: 800, color: 'var(--maroon)' }}>${s.amount.toFixed(2)}/{s.interval}</span></TD>
                    <TD>
                      <span style={{ background: `${SUB_STATUS_COLORS[s.status] || '#9CA3AF'}18`, color: SUB_STATUS_COLORS[s.status] || '#9CA3AF', borderRadius: '9999px', padding: '0.2rem 0.6rem', fontSize: '0.72rem', fontWeight: 800 }}>
                        {s.cancelAtPeriodEnd ? `${s.status} (cancels)` : s.trialEnd ? 'trialing' : s.status}
                      </span>
                    </TD>
                    <TD style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {s.currentPeriodEnd ? new Date(s.currentPeriodEnd).toLocaleDateString() : '—'}
                    </TD>
                    <TD style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(s.createdAt).toLocaleDateString()}
                    </TD>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pager page={page} totalPages={totalPages} setPage={setPage} />
          </>
        )}
      </div>
    </div>
  );
}

// ── Main Admin ────────────────────────────────────────────────────────────────
// ── SettingsTab ───────────────────────────────────────────────────────────────
function SettingsTab({ toast }: { toast: ToastFn }) {
  const [curPw, setCurPw]       = useState('');
  const [newPw, setNewPw]       = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError]   = useState('');
  const [savingPw, setSavingPw] = useState(false);

  const [lowStockVal, setLowStockVal]     = useState('5');
  const [savingStock, setSavingStock]     = useState(false);

  const [announcementText, setAnnouncementText] = useState('');
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);

  useEffect(() => {
    apiFetch('/api/admin/settings').then(d => {
      if (d.lowStockThreshold) setLowStockVal(String(d.lowStockThreshold));
      if (d.announcementBar !== undefined) setAnnouncementText(d.announcementBar);
    }).catch(() => {});
  }, []);

  const handlePwChange = async (e: FormEvent) => {
    e.preventDefault();
    setPwError('');
    if (newPw.length < 8) { setPwError('New password must be at least 8 characters.'); return; }
    if (newPw !== confirmPw) { setPwError('Passwords do not match.'); return; }
    setSavingPw(true);
    try {
      const res = await apiFetch('/api/admin/settings/password', { method: 'PUT', body: JSON.stringify({ currentPassword: curPw, newPassword: newPw }) });
      if (res.error) { setPwError(res.error); } else { toast('Password changed successfully!', 'success'); setCurPw(''); setNewPw(''); setConfirmPw(''); }
    } catch { setPwError('Failed to change password.'); }
    setSavingPw(false);
  };

  const handleSaveStock = async (e: FormEvent) => {
    e.preventDefault();
    const val = parseInt(lowStockVal);
    if (isNaN(val) || val < 1) return;
    setSavingStock(true);
    try {
      await apiFetch('/api/admin/settings/low-stock', { method: 'PUT', body: JSON.stringify({ threshold: val }) });
      toast(`Low-stock threshold set to ${val}`, 'success');
    } catch { toast('Failed to save setting.', 'error'); }
    setSavingStock(false);
  };

  const handleSaveAnnouncement = async (e: FormEvent) => {
    e.preventDefault();
    setSavingAnnouncement(true);
    try {
      await apiFetch('/api/admin/settings/announcement', { method: 'PUT', body: JSON.stringify({ text: announcementText }) });
      toast('Announcement bar updated!', 'success');
    } catch { toast('Failed to save announcement.', 'error'); }
    setSavingAnnouncement(false);
  };

  const inputStyle: CSSProperties = { padding: '0.55rem 0.75rem', border: '1.5px solid var(--cream-border)', borderRadius: '0.5rem', fontFamily: 'Fredoka, sans-serif', fontSize: '0.9rem', outline: 'none', width: '100%', boxSizing: 'border-box' as const };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 520 }}>
      <h2 style={{ margin: 0, color: 'var(--maroon)', fontSize: '1.25rem' }}>Settings</h2>

      {/* Password change */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', color: 'var(--text-primary)' }}>Change Admin Password</h3>
        <form onSubmit={handlePwChange} style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {pwError && <p style={{ margin: 0, color: '#DC2626', fontWeight: 700, fontSize: '0.82rem' }}>{pwError}</p>}
          <input type="password" placeholder="Current password" value={curPw} onChange={e => setCurPw(e.target.value)} style={inputStyle} required />
          <input type="password" placeholder="New password (8+ characters)" value={newPw} onChange={e => setNewPw(e.target.value)} style={inputStyle} required />
          <input type="password" placeholder="Confirm new password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} style={inputStyle} required />
          <button type="submit" disabled={savingPw} className="btn-maroon" style={{ marginTop: '0.25rem', padding: '0.6rem', fontSize: '0.9rem', opacity: savingPw ? 0.7 : 1 }}>
            {savingPw ? 'Saving…' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Low-stock threshold */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', color: 'var(--text-primary)' }}>Low-Stock Alert Threshold</h3>
        <p style={{ margin: '0 0 0.875rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.875rem' }}>
          Products with stock at or below this number will show a warning badge in the shop.
        </p>
        <form onSubmit={handleSaveStock} style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
          <input
            type="number" min="1" max="99" value={lowStockVal}
            onChange={e => setLowStockVal(e.target.value)}
            style={{ ...inputStyle, width: 80 }}
          />
          <button type="submit" disabled={savingStock} className="btn-gold" style={{ padding: '0.55rem 1.25rem', fontSize: '0.9rem', opacity: savingStock ? 0.7 : 1 }}>
            {savingStock ? 'Saving…' : 'Save'}
          </button>
        </form>
      </div>

      {/* Announcement bar */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', color: 'var(--text-primary)' }}>Announcement Bar</h3>
        <p style={{ margin: '0 0 0.875rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.875rem' }}>
          The text shown in the dark bar at the top of every page. Leave empty to hide the bar.
        </p>
        <form onSubmit={handleSaveAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          <textarea
            value={announcementText}
            onChange={e => setAnnouncementText(e.target.value)}
            rows={2}
            placeholder="e.g. + NEW STORY EVERY SUNDAY · FREE SHIPPING OVER $40 +"
            style={{ ...inputStyle, resize: 'vertical' }}
          />
          <button type="submit" disabled={savingAnnouncement} className="btn-gold" style={{ padding: '0.55rem 1.25rem', fontSize: '0.9rem', opacity: savingAnnouncement ? 0.7 : 1, alignSelf: 'flex-start' }}>
            {savingAnnouncement ? 'Saving…' : 'Update Announcement'}
          </button>
        </form>
      </div>
    </div>
  );
}

const TABS = [
  { id: 'overview',    label: 'Overview',    icon: '📊', key: 'o' },
  { id: 'products',    label: 'Products',    icon: '📦', key: 'p' },
  { id: 'orders',      label: 'Orders',      icon: '🛒', key: 'r' },
  { id: 'subscribers', label: 'Subscribers', icon: '✉️', key: 's' },
  { id: 'stripe-subs', label: 'Subscriptions', icon: '💳', key: 'b' },
  { id: 'users',       label: 'Users',       icon: '👥', key: 'u' },
  { id: 'episodes',    label: 'Episodes',    icon: '▶',  key: 'e' },
  { id: 'activities',  label: 'Activities',  icon: '🎨', key: 'a' },
  { id: 'quizzes',     label: 'Quizzes',     icon: '🧠', key: 'q' },
  { id: 'prayers',     label: 'Prayers',     icon: '🙏', key: 'y' },
  { id: 'guides',      label: 'Guides',      icon: '📋', key: 'g' },
  { id: 'free-stories', label: 'Free Stories', icon: '📖', key: 'f' },
  { id: 'activity',    label: 'Audit Log',   icon: '📈', key: 'l' },
  { id: 'settings',    label: 'Settings',    icon: '⚙️',  key: 'x' },
];

export default function Admin() {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [allOrders, setAllOrders] = useState<AdminOrder[]>([]);
  const [toasts, setToasts] = useState<AdminToast[]>([]);
  const [sessionMinsLeft, setSessionMinsLeft] = useState<number | null>(null);
  const navigate = useNavigate();

  const addToast = (message: string, type = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  };

  // Load stats + orders for sparkline; track session expiry
  useEffect(() => {
    const t = token();
    if (!t) { navigate('/admin/login'); return; }

    // Decode JWT to compute session time remaining
    try {
      const payload = JSON.parse(atob(t.split('.')[1]));
      const minsLeft = Math.floor((payload.exp * 1000 - Date.now()) / 60000);
      setSessionMinsLeft(minsLeft);
      const tick = setInterval(() => {
        const remaining = Math.floor((payload.exp * 1000 - Date.now()) / 60000);
        setSessionMinsLeft(remaining);
        if (remaining <= 0) { navigate('/admin/login'); }
      }, 60000);
      return () => clearInterval(tick);
    } catch { /* ignore malformed token */ }
  }, [navigate]);

  useEffect(() => {
    if (!token()) return;
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
      <header style={{ background: 'var(--maroon)', padding: '0 1.5rem', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          <img src="/tiggy.png" alt="Tiggy" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--gold)', flexShrink: 0 }} />
          <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '1rem', color: 'white', lineHeight: 1.1 }}>
            Tiggy's<br /><span style={{ fontSize: '0.65rem', fontWeight: 400, color: 'var(--gold)', letterSpacing: '0.1em' }}>KINGDOM</span>
          </span>
          <span style={{ color: 'rgba(255,255,255,0.35)', margin: '0 0.1rem', fontSize: '1.1rem' }}>|</span>
          <span style={{ background: 'rgba(255,255,255,0.15)', color: 'white', borderRadius: '0.4rem', padding: '0.2rem 0.6rem', fontWeight: 800, fontSize: '0.72rem', letterSpacing: '0.06em' }}>ADMIN</span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {sessionMinsLeft !== null && sessionMinsLeft <= 30 && (
            <span style={{ background: '#FEF3C7', color: '#92400E', borderRadius: '0.4rem', padding: '0.2rem 0.6rem', fontSize: '0.72rem', fontWeight: 800 }}>
              ⚠ Session expires in {sessionMinsLeft}m
            </span>
          )}
          <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.78rem', fontWeight: 600, display: 'none' }}>
            {localStorage.getItem('tk_admin_user') || ''}
          </span>
          <a href="/" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 700, fontSize: '0.82rem', textDecoration: 'none' }}>View Site ↗</a>
          <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '0.5rem', padding: '0.35rem 0.875rem', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>Log Out</button>
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

          {/* Sidebar footer: stats + session info */}
          <div style={{ marginTop: 'auto', borderTop: '1px solid var(--cream-border)' }}>
            {stats && (
              <div style={{ padding: '1rem 1.25rem 0.75rem' }}>
                <p style={{ fontWeight: 700, fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quick Stats</p>
                {[
                  ['Revenue', `$${stats.revenue.toFixed(0)}`],
                  ['Orders', stats.orders.total],
                  ['Subscribers', stats.subscribers.active],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>{k}</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--maroon)' }}>{v}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ padding: '0.6rem 1.25rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--maroon)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.7rem', fontWeight: 800, flexShrink: 0 }}>A</div>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {localStorage.getItem('tk_admin_user') || 'Admin'}
                </p>
                {sessionMinsLeft !== null && (
                  <p style={{ margin: 0, fontSize: '0.68rem', color: sessionMinsLeft <= 30 ? '#DC2626' : 'var(--text-muted)', fontWeight: 600 }}>
                    {sessionMinsLeft > 60 ? `${Math.floor(sessionMinsLeft / 60)}h ${sessionMinsLeft % 60}m left` : `${sessionMinsLeft}m left`}
                  </p>
                )}
              </div>
            </div>
          </div>
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

              {/* Quick Actions */}
              <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 2px 12px rgba(107,32,32,0.07)', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', color: 'var(--text-secondary)' }}>Quick Actions</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem' }}>
                  {[
                    { label: '+ New Product',    tab: 'products',    icon: '📦', color: '#6B2020' },
                    { label: 'View New Orders',  tab: 'orders',      icon: '🛒', color: '#7C3AED' },
                    { label: 'Email Blast',       tab: 'subscribers', icon: '✉️', color: '#3B82F6' },
                    { label: 'View Users',        tab: 'users',       icon: '👥', color: '#22C55E' },
                    { label: 'Manage Episodes',   tab: 'episodes',    icon: '▶',  color: '#F97316' },
                    { label: 'Activity Log',      tab: 'activity',    icon: '📋', color: '#C9922A' },
                  ].map(a => (
                    <button
                      key={a.tab}
                      onClick={() => setTab(a.tab)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.875rem', border: `1.5px solid ${a.color}22`, borderRadius: '0.6rem', background: `${a.color}08`, cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', color: a.color, transition: 'all 0.15s', textAlign: 'left' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = `${a.color}18`; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = `${a.color}08`; }}
                    >
                      <span style={{ fontSize: '1rem' }}>{a.icon}</span>
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ background: 'var(--cream-dark)', borderRadius: '1rem', padding: '1.25rem 1.5rem' }}>
                <p style={{ fontWeight: 700, color: 'var(--maroon)', margin: '0 0 0.35rem', fontSize: '0.9rem' }}>Keyboard Shortcuts</p>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {['O Overview', 'P Products', 'R Orders', 'S Subscribers', 'U Users', 'E Episodes', 'L Activity'].map(s => (
                    <span key={s} style={{ marginRight: '0.75rem', whiteSpace: 'nowrap' }}>
                      <span style={{ fontFamily: 'monospace', background: 'var(--cream)', padding: '0 4px', borderRadius: 3 }}>{s[0]}</span>
                      {' '}{s.slice(2)}
                    </span>
                  ))}
                </p>
              </div>
            </div>
          )}
          {tab === 'products'    && <ProductsTab    toast={addToast} />}
          {tab === 'orders'      && <OrdersTab      toast={addToast} />}
          {tab === 'subscribers' && <SubscribersTab toast={addToast} />}
          {tab === 'stripe-subs' && <StripeSubsTab />}
          {tab === 'users'       && <UsersTab />}
          {tab === 'episodes'    && <EpisodesTab    toast={addToast} />}
          {tab === 'activities'  && <ActivitiesTab />}
          {tab === 'quizzes'     && <QuizzesTab />}
          {tab === 'prayers'     && <PrayersTab />}
          {tab === 'guides'      && <GuidesTab />}
          {tab === 'free-stories' && <FreeStoriesTab />}
          {tab === 'activity'    && <ActivityTab />}
          {tab === 'settings'    && <SettingsTab   toast={addToast} />}
        </main>
      </div>
    </div>
  );
}
