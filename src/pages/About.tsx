import { useState, type FormEvent } from 'react';
import { API } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { usePageMeta } from '../hooks/usePageMeta';

const GOALS = [
  { icon: '🌱', title: 'Plant seeds, gently',       desc: 'To give children a warm, joyful first encounter with the faith that grows with them for life.' },
  { icon: '📖', title: 'Teach the tradition truthfully', desc: 'To pass on the saints, the feasts, and the prayers without distortion or fear.' },
  { icon: '👨‍👩‍👧', title: 'Strengthen families',         desc: 'To turn screen time into shared time — conversations, prayers, and crafts done together.' },
  { icon: '✨', title: 'Make beauty a habit',         desc: 'To surround children with the kind of beauty that points beyond itself, toward God.' },
];

export default function About() {
  usePageMeta('Our Mission', 'Why we made Tiggy — the story behind Tiggy\'s Kingdom and our mission to bring Orthodox Christian faith to children everywhere.');
  const [email, setEmail] = useState('');
  const { addToast } = useToast();

  const handleSubscribe = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      await fetch(`${API}/api/subscribe`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, source: 'about' }) });
    } catch { /* silent */ }
    addToast("You've joined Tiggy's Kingdom Mail!", 'success');
    setEmail('');
  };

  return (
    <div style={{ background: 'var(--cream)' }}>

      {/* ── Hero ── */}
      <section style={{ background: 'var(--cream)', padding: '4rem 1.25rem 3rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{ width: 160, height: 160, margin: '0 auto 1.25rem', borderRadius: '1.25rem', overflow: 'hidden', boxShadow: '0 8px 24px rgba(107,32,32,0.18)' }}>
            <img src="/tiggy%20mission.jpg" alt="Tiggy on a mission" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.currentTarget as HTMLImageElement).src = '/tiggy-wave.png'; }} />
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'white', border: '1.5px solid var(--cream-border)', borderRadius: '9999px', padding: '0.3rem 0.875rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            ✦ Our Mission
          </span>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 'clamp(2rem, 5vw, 3.5rem)', margin: '0 0 1rem', color: '#1B2A4A', lineHeight: 1.1, fontWeight: 700 }}>
            Why we made <span style={{ color: '#D4691D' }}>Tiggy</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 600, lineHeight: 1.7, margin: 0, fontSize: '1.05rem' }}>
            Every brand begins with a longing. Ours began at bedtime, with a simple wish for our own children.
          </p>
        </div>
      </section>

      {/* ── Story section ── */}
      <section style={{ background: 'var(--cream)', padding: '3rem 1.25rem' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <p style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: '1.2rem', color: '#1B2A4A', lineHeight: 1.8, margin: '0 0 2rem', borderLeft: '4px solid var(--gold)', paddingLeft: '1.5rem' }}>
            We were tired of choosing between screens that taught our children nothing and screens that quietly taught them things we didn't believe.
          </p>

          <h2 style={{ color: '#1B2A4A', fontSize: 'clamp(1.35rem, 3vw, 1.75rem)', margin: '0 0 0.875rem' }}>The longing behind Tiggy</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontWeight: 600, margin: '0 0 1.25rem', fontSize: '0.975rem' }}>
            As Orthodox parents, we searched everywhere for stories that were beautiful enough to capture our children's hearts and faithful enough to nourish their souls. We found gorgeous animation with empty values, and faithful content that children simply wouldn't watch. So we decided to make the thing we couldn't find.
          </p>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontWeight: 600, margin: '0 0 2.5rem', fontSize: '0.975rem' }}>
            Tiggy was born one evening as a little drawing — a lamb in an embroidered robe, with big kind eyes and a heart full of wonder. The lamb is one of the oldest and gentlest images of Christ's flock, and it felt exactly right for a child's first guide into the faith.
          </p>

          <div style={{ background: '#1B2A4A', borderRadius: '1.25rem', padding: '2rem 2.5rem', marginBottom: '2.5rem' }}>
            <p style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: '1.25rem', color: 'white', lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
              "We wanted screen time to draw our children closer to Christ — not pull them away."
            </p>
          </div>

          <h2 style={{ color: '#1B2A4A', fontSize: 'clamp(1.35rem, 3vw, 1.75rem)', margin: '0 0 0.875rem' }}>Our Orthodox inspiration</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontWeight: 600, margin: '0 0 1.25rem', fontSize: '0.975rem' }}>
            Everything in Tiggy's Kingdom is rooted in the living tradition of the Orthodox Church — the lives of the saints, the great feasts, the prayers our grandparents prayed. We don't water these down. We tell them gently, in a child's language, but we keep them whole, because children deserve the real thing, told with love.
          </p>

          <h2 style={{ color: '#1B2A4A', fontSize: 'clamp(1.35rem, 3vw, 1.75rem)', margin: '0 0 0.875rem' }}>Our mission for children</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontWeight: 600, margin: 0, fontSize: '0.975rem' }}>
            We believe a small lamb can do a big thing: she can make a child want to know God. Not from fear, not from duty, but from delight. If a five-year-old asks for "one more Tiggy story" and falls asleep thinking about the kindness of a saint, we have done our work.
          </p>
        </div>
      </section>

      {/* ── Educational goals ── */}
      <section style={{ background: '#F5F0E8', padding: '5rem 1.25rem' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontFamily: 'Fredoka, sans-serif', fontWeight: 900, fontSize: '0.75rem', letterSpacing: '0.18em', color: 'var(--gold-dark)', textTransform: 'uppercase', margin: '0 0 0.5rem' }}>WHAT WE'RE BUILDING TOWARD</p>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', margin: '0 0 3rem', color: '#1B2A4A' }}>Our educational goals</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {GOALS.map(g => (
              <div key={g.title} className="card" style={{ padding: '1.75rem', background: 'white' }}>
                <div style={{ fontSize: '1.75rem', marginBottom: '0.875rem' }}>{g.icon}</div>
                <h3 style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '1rem', margin: '0 0 0.5rem', color: '#1B2A4A' }}>{g.title}</h3>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.65, fontWeight: 600, margin: 0, fontSize: '0.9rem' }}>{g.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── From our home to yours ── */}
      <section style={{ background: 'var(--cream)', padding: '5rem 1.25rem' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '4rem', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="tiggy-float" style={{ maxWidth: 300, margin: '0 auto' }}>
              <img src="/tiggy-book.png" alt="Tiggy with a book" style={{ width: '100%', maxHeight: 340, objectFit: 'contain', filter: 'drop-shadow(0 16px 32px rgba(107,32,32,0.15))' }} onError={e => { (e.currentTarget as HTMLImageElement).src = '/tiggy.png'; }} />
            </div>
          </div>
          <div>
            <p style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 900, fontSize: '0.75rem', letterSpacing: '0.18em', color: 'var(--gold-dark)', textTransform: 'uppercase', margin: '0 0 0.75rem' }}>A NOTE FROM THE FAMILY</p>
            <h2 style={{ color: '#1B2A4A', fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)', margin: '0 0 1.25rem', lineHeight: 1.2 }}>From our home to yours</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontWeight: 600, margin: '0 0 1.25rem', fontSize: '0.975rem' }}>
              Tiggy's Kingdom is made by a small Orthodox family with the help of artists and storytellers who share our faith. We make every story as if our own children were watching — because they are. Thank you for welcoming Tiggy into your home.
            </p>
            <p style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', color: 'var(--gold-dark)', fontWeight: 600, margin: 0, fontSize: '1.05rem' }}>
              — The Tiggy's Kingdom family ✦
            </p>
          </div>
        </div>
      </section>

      {/* ── Walk with us newsletter ── */}
      <section style={{ background: '#F5F0E8', padding: '5rem 1.25rem' }}>
        <div style={{ maxWidth: 580, margin: '0 auto' }}>
          <div className="card" style={{ padding: '2.5rem', textAlign: 'center', background: 'white' }}>
            <div style={{ width: 110, height: 120, margin: '0 auto 1rem', overflow: 'hidden', borderRadius: '1rem' }}>
              <img src="/tiggy%20mail.jpg" alt="Tiggy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.currentTarget as HTMLImageElement).src = '/tiggy-cheer.png'; }} />
            </div>
            <h2 style={{ fontSize: 'clamp(1.35rem, 3vw, 1.75rem)', margin: '0 0 0.75rem', color: '#1B2A4A' }}>Walk with us 🐑</h2>
            <p style={{ color: 'var(--text-secondary)', fontWeight: 600, lineHeight: 1.65, margin: '0 0 1.75rem', fontSize: '0.95rem' }}>
              Join Tiggy's Kingdom Mail for new stories, free printables, and feast-day reminders — and be part of what we're building.
            </p>
            <form onSubmit={handleSubscribe} style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Your email address"
                className="tk-input"
                style={{ flex: 1, minWidth: 220 }}
                required
              />
              <button type="submit" className="btn-maroon" style={{ background: '#3A7A30', whiteSpace: 'nowrap' }}>Join the journey</button>
            </form>
          </div>
        </div>
      </section>

    </div>
  );
}
