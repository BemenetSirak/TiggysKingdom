import { useState, type FormEvent } from 'react';
import { API } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { usePageMeta } from '../hooks/usePageMeta';

const GUIDES_KEY = 'tk_parent_guides';
const GUIDE_FILES_KEY = 'tk_guide_files';

export interface ParentGuide {
  id: string;
  icon: string;
  title: string;
  desc: string;
  cta: string;
  type: 'parent' | 'teacher' | 'feast';
  active: boolean;
}

type GuideFilesMap = Record<string, { url: string; name: string; filename: string }>;

const DEFAULT_GUIDES: ParentGuide[] = [
  { id: '1', icon: '📋', title: 'Parent Guides',       desc: 'One-page guides for each episode with the lesson, discussion questions, and a simple follow-up activity.',   cta: 'Download guides →',   type: 'parent',  active: true },
  { id: '2', icon: '🍎', title: 'Teacher Resources',   desc: 'Lesson plans, printable worksheets, and classroom-ready slides for Sunday school and church schools.',       cta: 'Browse lessons →',    type: 'teacher', active: true },
  { id: '3', icon: '📅', title: 'Feast Day Calendar',  desc: 'A year-round calendar of the great feasts and saints, with reminders you can follow as a family or class.', cta: 'Open calendar →',     type: 'feast',   active: true },
];

function getGuides(): ParentGuide[] {
  try {
    const s = localStorage.getItem(GUIDES_KEY);
    return s ? JSON.parse(s) : DEFAULT_GUIDES;
  } catch { return DEFAULT_GUIDES; }
}

function getGuideFiles(): GuideFilesMap {
  try { return JSON.parse(localStorage.getItem(GUIDE_FILES_KEY) || '{}'); } catch { return {}; }
}

const FAQS = [
  {
    q: 'Is this safe for my child?',
    a: 'Yes. Everything is ad-safe, free of frightening imagery, and reviewed for gentleness. There are no autoplay rabbit holes, no comments, and no links that lead children away from our content. What you press play on is exactly what they see.',
  },
  {
    q: 'Is this spiritually trustworthy?',
    a: "Tiggy's Kingdom is made by practicing Orthodox Christians and reviewed with care for faithfulness to the tradition — the lives of the saints, the meaning of the feasts, and the teachings of the Church. We never simplify in a way that distorts.",
  },
  {
    q: 'Is this actually educational?',
    a: "Each story is built around a clear lesson — a virtue, a saint, or a feast — with age-appropriate language and gentle repetition that helps it stick. Parent guides and discussion questions help you continue the conversation after the screen goes dark.",
  },
];

const PROMISES = [
  { icon: '🚫', title: 'Always Ad-Free',     desc: 'No advertising, no tracking aimed at children, ever. No products pushed mid-story.' },
  { icon: '🕊',  title: 'Gentle by Design',  desc: 'No scary or violent imagery. Even hard stories are told with hope and tenderness.' },
  { icon: '🔒', title: 'A Walled Garden',   desc: 'No comments, no autoplay to outside videos, no surprises. You stay in control.' },
];

const BENEFITS = [
  { icon: '🌿', title: 'Virtues & character',    desc: 'Kindness, forgiveness, patience, courage, and gratitude, modeled in every story.' },
  { icon: '📖', title: 'Faith literacy',          desc: 'The saints, the feasts, and the rhythm of the Church year, learned naturally.' },
  { icon: '💬', title: 'Language & vocabulary',   desc: 'Rich, beautiful storytelling that builds listening skills and new words.' },
  { icon: '🧠', title: 'Memory & reflection',     desc: 'Gentle repetition and discussion questions that deepen understanding.' },
];

const TESTIMONIALS = [
  { quote: "My kids ask for 'one more Tiggy story' every single night. It's the best part of our bedtime routine.",     name: 'Maria K.',        role: 'Mother of three' },
  { quote: "Finally, beautiful Orthodox content I can trust. The stories are faithful, gentle, and beautifully made.",  name: 'Fr. Andrew',      role: 'Parish priest' },
  { quote: "I use the teacher resources in my Sunday school class every week. The children are completely captivated.", name: 'Presbyterissa Joanna', role: 'Church school teacher' },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="card"
      style={{ padding: '1.25rem 1.5rem', background: 'white', cursor: 'pointer' }}
      onClick={() => setOpen(o => !o)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: '1rem', margin: 0, color: '#1B2A4A', lineHeight: 1.4, flex: 1 }}>{q}</h3>
        <span style={{ color: 'var(--text-muted)', fontSize: '1.1rem', flexShrink: 0, marginTop: 2 }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75, fontWeight: 600, margin: '0.875rem 0 0', fontSize: '0.9rem' }}>{a}</p>}
    </div>
  );
}

export default function Subscribe() {
  usePageMeta('For Parents', 'Safe, faithful Orthodox content your children will love. Parent guides, teacher resources, and feast-day calendars — all free.');
  const guides = getGuides().filter(g => g.active);
  const guideFiles = getGuideFiles();
  const [email, setEmail] = useState('');
  const { addToast } = useToast();

  const handleSubscribe = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      await fetch(`${API}/api/subscribe`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, source: 'parents' }) });
    } catch { /* silent */ }
    addToast("Welcome! Check your inbox for free gifts.", 'success');
    setEmail('');
  };

  return (
    <div style={{ background: 'var(--cream)' }}>

      {/* ── Hero ── */}
      <section style={{ background: 'var(--cream)', padding: '4rem 1.25rem 3rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div className="tiggy-float" style={{ width: 130, height: 145, margin: '0 auto 1.25rem' }}>
            <img src="/tiggy-cheer.png" alt="Tiggy" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 8px 20px rgba(107,32,32,0.18))' }} onError={e => { (e.currentTarget as HTMLImageElement).src = '/tiggy.png'; }} />
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'white', border: '1.5px solid var(--cream-border)', borderRadius: '9999px', padding: '0.3rem 0.875rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            👨‍👩‍👧 The Parent Corner
          </span>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(2rem, 5vw, 3.5rem)', margin: '0 0 1rem', color: '#1B2A4A', lineHeight: 1.1, fontWeight: 700 }}>
            Made for parents you can <span style={{ color: '#3A7A30' }}>trust</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 600, lineHeight: 1.7, margin: 0, fontSize: '1.05rem' }}>
            You're the one who decides what your children watch and read. Here's everything you need to know about who we are and why families trust Tiggy's Kingdom.
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ background: '#F5F0E8', padding: '5rem 1.25rem' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: '0.75rem', letterSpacing: '0.18em', color: 'var(--gold-dark)', textTransform: 'uppercase', margin: '0 0 0.5rem' }}>YOUR HONEST QUESTIONS</p>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', margin: '0 0 2.5rem', color: '#1B2A4A' }}>The three things parents ask us most</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {FAQS.map(faq => <FaqItem key={faq.q} q={faq.q} a={faq.a} />)}
          </div>
        </div>
      </section>

      {/* ── Promises (dark navy) ── */}
      <section style={{ background: '#1B2A4A', padding: '5rem 1.25rem' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: '0.75rem', letterSpacing: '0.18em', color: '#5BB8A0', textTransform: 'uppercase', margin: '0 0 0.5rem' }}>SAFETY & VALUES</p>
          <h2 style={{ textAlign: 'center', color: 'white', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', margin: '0 0 3rem' }}>Our promises to your family</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
            {PROMISES.map(p => (
              <div key={p.title} style={{ background: 'rgba(255,255,255,0.07)', borderRadius: '1.25rem', padding: '2rem 1.75rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2.25rem', marginBottom: '1rem' }}>{p.icon}</div>
                <h3 style={{ color: 'white', fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: '1rem', margin: '0 0 0.625rem' }}>{p.title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 500, lineHeight: 1.65, margin: 0, fontSize: '0.875rem' }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What children take away ── */}
      <section style={{ background: 'var(--cream)', padding: '5rem 1.25rem' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: '0.75rem', letterSpacing: '0.18em', color: 'var(--gold-dark)', textTransform: 'uppercase', margin: '0 0 0.5rem' }}>EDUCATIONAL BENEFITS</p>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', margin: '0 0 3rem', color: '#1B2A4A' }}>What children take away</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {BENEFITS.map(b => (
              <div key={b.title} className="card" style={{ padding: '1.5rem', background: 'white', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ width: 40, height: 40, borderRadius: '0.75rem', background: 'var(--cream-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>{b.icon}</div>
                <div>
                  <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: '0.95rem', margin: '0 0 0.4rem', color: '#1B2A4A' }}>{b.title}</h3>
                  <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontWeight: 600, margin: 0, fontSize: '0.875rem' }}>{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Screen-time philosophy ── */}
      <section style={{ background: '#F5F0E8', padding: '5rem 1.25rem' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: '0.75rem', letterSpacing: '0.18em', color: 'var(--gold-dark)', textTransform: 'uppercase', margin: '0 0 0.5rem' }}>OUR SCREEN-TIME PHILOSOPHY</p>
          <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', margin: '0 0 1.5rem', color: '#1B2A4A' }}>Less screen, more meaning</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontWeight: 600, fontSize: '1rem', margin: 0 }}>
            We don't want your children watching for hours. We want a short, beautiful story that sparks a conversation, a prayer, or a craft — and then the screen goes off. Our episodes are made to be a starting point for real family time, not a babysitter. That's why every story comes with a parent guide and an activity to carry the moment off the screen and into your home.
          </p>
        </div>
      </section>

      {/* ── Parent & teacher resources ── */}
      <section style={{ background: 'var(--cream)', padding: '5rem 1.25rem' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: '0.75rem', letterSpacing: '0.18em', color: 'var(--gold-dark)', textTransform: 'uppercase', margin: '0 0 0.5rem' }}>FOR GROWN-UPS</p>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', margin: '0 0 0.75rem', color: '#1B2A4A' }}>Parent guides &amp; teacher resources</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600, margin: '0 auto 3rem', maxWidth: 480, lineHeight: 1.6 }}>
            Free tools to help you bring each story to life at home or in the classroom.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {guides.map(g => {
              const file = guideFiles[g.id];
              return (
                <div key={g.id} className="card" style={{ padding: '2rem', background: 'white', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ width: 52, height: 52, borderRadius: '0.875rem', background: 'var(--cream-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '1.25rem' }}>{g.icon}</div>
                  <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', margin: '0 0 0.625rem', color: '#1B2A4A' }}>{g.title}</h3>
                  <p style={{ color: 'var(--text-muted)', lineHeight: 1.65, fontWeight: 600, margin: '0 0 1.25rem', fontSize: '0.875rem', flex: 1 }}>{g.desc}</p>
                  {file ? (
                    <a
                      href={file.url}
                      download={file.name}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'var(--maroon)', color: 'white', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontWeight: 800, fontSize: '0.875rem', textDecoration: 'none', fontFamily: 'Nunito, sans-serif', width: 'fit-content' }}
                    >
                      ↓ {g.cta}
                    </a>
                  ) : (
                    <button
                      style={{ background: 'none', border: 'none', padding: 0, color: 'var(--text-muted)', fontWeight: 800, fontSize: '0.875rem', cursor: 'default', fontFamily: 'Nunito, sans-serif', textAlign: 'left' }}
                      onClick={() => addToast(`"${g.title}" — coming soon!`, 'info')}
                    >
                      {g.cta}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section style={{ background: '#F5F0E8', padding: '5rem 1.25rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: '0.75rem', letterSpacing: '0.18em', color: 'var(--gold-dark)', textTransform: 'uppercase', margin: '0 0 0.5rem' }}>FROM OUR FAMILIES</p>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', margin: '0 0 3rem', color: '#1B2A4A' }}>
            Trusted by parents, priests &amp; teachers
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="card" style={{ padding: '2rem', background: 'white' }}>
                <div style={{ color: '#F5C842', fontSize: '0.9rem', marginBottom: '1rem' }}>★★★★★</div>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75, fontWeight: 600, margin: '0 0 1.5rem', fontSize: '0.95rem', fontStyle: 'italic' }}>"{t.quote}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--maroon)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '0.9rem', flexShrink: 0 }}>
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p style={{ fontWeight: 800, color: '#1B2A4A', margin: 0, fontSize: '0.875rem' }}>{t.name}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: 0, fontWeight: 600 }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Newsletter CTA ── */}
      <section style={{ background: 'var(--cream)', padding: '5rem 1.25rem' }}>
        <div style={{ maxWidth: 620, margin: '0 auto' }}>
          <div className="card" style={{ padding: '2.5rem', background: 'white' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '2rem', alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ maxWidth: 130, margin: '0 auto' }}>
                  <img src="/tiggy-cheer.png" alt="Tiggy" style={{ width: '100%', objectFit: 'contain' }} onError={e => { (e.currentTarget as HTMLImageElement).src = '/tiggy.png'; }} />
                </div>
              </div>
              <div>
                <h2 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.6rem)', margin: '0 0 0.625rem', color: '#1B2A4A', lineHeight: 1.2 }}>
                  Join Tiggy's Kingdom Mail ✉
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontWeight: 600, lineHeight: 1.65, margin: '0 0 1.25rem', fontSize: '0.875rem' }}>
                  Faith-filled fun every week. New subscribers get a <strong>free mini saint-story ebook</strong> and a <strong>printable coloring pack</strong> — plus weekly feast reminders and new episode starts.
                </p>
                <form onSubmit={handleSubscribe} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Your email address" className="tk-input" required />
                  <button type="submit" className="btn-maroon" style={{ background: '#3A7A30', justifyContent: 'center' }}>Get my free gifts</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
