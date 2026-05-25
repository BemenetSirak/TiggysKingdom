import { useState, type FormEvent } from 'react';
import { API } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { usePageMeta } from '../hooks/usePageMeta';
import { useAuth } from '../context/AuthContext';
import GuestBanner from '../components/GuestBanner';

// ── Admin-editable data keys ──────────────────────────────────────────────────
const ACTIVITIES_KEY = 'tk_activities';
const QUIZZES_KEY    = 'tk_quizzes';

export interface ActivityCard {
  id: string;
  icon: string;
  title: string;
  desc: string;
  tags: string[];      // e.g. ['PDF', 'Ages 4+', 'Free']
  cta: string;
  ctaColor: string;
  active: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  active: boolean;
}

const DEFAULT_ACTIVITIES: ActivityCard[] = [
  { id: '1', icon: '✏️', title: 'Coloring Pages',    desc: 'Printable scenes of Tiggy, the saints, and the great feasts to color in.',                           tags: ['PDF', 'Ages 4+', 'Free'],  cta: 'Download pack →',  ctaColor: '#C0392B', active: true },
  { id: '2', icon: '🧠', title: 'Saint Quizzes',      desc: 'Fun, gentle quizzes to test what you remember about your favorite saints.',                           tags: ['Interactive', 'Ages 6+'],  cta: 'Try a quiz →',     ctaColor: '#7C3AED', active: true },
  { id: '3', icon: '🃏', title: 'Memory Cards',        desc: 'Match the icons and learn the feasts with a classic memory game.',                                    tags: ['Printable', 'Ages 5+'],    cta: 'Print cards →',    ctaColor: '#2E8B57', active: true },
  { id: '4', icon: '🎮', title: 'Simple Games',        desc: 'Easy, screen-safe games — help Tiggy find the lost sheep and more.',                                  tags: ['Online', 'Ages 5+'],       cta: 'Play now →',       ctaColor: '#2C5FA0', active: true },
  { id: '5', icon: '✂️', title: 'Printable Crafts',   desc: 'Paper icons, feast-day garlands, and prayer-corner decorations to make.',                             tags: ['PDF', 'With grown-up'],    cta: 'Get crafts →',     ctaColor: '#D4691D', active: true },
  { id: '6', icon: '🎨', title: 'Draw with Tiggy',     desc: 'Follow along, step by step, and learn to draw Tiggy and her friends.',                                tags: ['Video', 'All ages'],       cta: 'Start drawing →',  ctaColor: '#C0392B', active: true },
];

const DEFAULT_QUIZZES: QuizQuestion[] = [
  { id: '1', question: 'Which saint is famous for secretly giving gifts to those in need? 🎁',                  options: ['St. Nicholas of Myra', 'St. George', 'St. Mary of Egypt'],     correctIndex: 0, active: true },
  { id: '2', question: 'Which apostle was the first to be called by Jesus?',                                   options: ['St. Peter', 'St. Andrew', 'St. John'],                          correctIndex: 1, active: true },
  { id: '3', question: 'How many days did Jonah spend inside the big fish? 🐟',                               options: ['One day', 'Three days', 'Seven days'],                          correctIndex: 1, active: true },
];

function getActivities(): ActivityCard[] {
  try {
    const s = localStorage.getItem(ACTIVITIES_KEY);
    return s ? JSON.parse(s) : DEFAULT_ACTIVITIES;
  } catch { return DEFAULT_ACTIVITIES; }
}

function getQuizzes(): QuizQuestion[] {
  try {
    const s = localStorage.getItem(QUIZZES_KEY);
    return s ? JSON.parse(s) : DEFAULT_QUIZZES;
  } catch { return DEFAULT_QUIZZES; }
}

// ── Quiz component ────────────────────────────────────────────────────────────
function QuizSection() {
  const questions = getQuizzes().filter(q => q.active);
  const [qIndex, setQIndex]   = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore]     = useState(0);
  const [done, setDone]       = useState(false);

  if (questions.length === 0) return null;

  const q = questions[qIndex];

  const handleAnswer = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    if (i === q.correctIndex) setScore(s => s + 1);
  };

  const handleNext = () => {
    if (qIndex + 1 >= questions.length) { setDone(true); return; }
    setQIndex(qi => qi + 1);
    setSelected(null);
  };

  const handleRestart = () => { setQIndex(0); setSelected(null); setScore(0); setDone(false); };

  return (
    <section style={{ background: 'var(--cream)', padding: '5rem 1.25rem' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <p style={{ textAlign: 'center', fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: '0.75rem', letterSpacing: '0.18em', color: 'var(--gold-dark)', textTransform: 'uppercase', margin: '0 0 0.5rem' }}>TRY IT NOW</p>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', margin: '0 0 2.5rem', color: '#1B2A4A' }}>A little saint quiz</h2>

        {done ? (
          <div className="card" style={{ padding: '2.5rem', textAlign: 'center', background: 'white' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🏆</div>
            <h3 style={{ color: '#1B2A4A', margin: '0 0 0.5rem', fontSize: '1.5rem' }}>Well done!</h3>
            <p style={{ color: 'var(--text-secondary)', fontWeight: 600, margin: '0 0 1.5rem' }}>
              You got <strong>{score}</strong> out of <strong>{questions.length}</strong> correct!
            </p>
            <button onClick={handleRestart} className="btn-maroon">Try again →</button>
          </div>
        ) : (
          <div className="card" style={{ padding: '2rem', background: 'white' }}>
            <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', margin: '0 0 1rem' }}>
              Question {qIndex + 1} of {questions.length}
            </p>
            <h3 style={{ color: '#1B2A4A', fontSize: '1.1rem', lineHeight: 1.5, margin: '0 0 1.5rem', fontFamily: 'Nunito, sans-serif', fontWeight: 800 }}>
              {q.question}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1.5rem' }}>
              {q.options.map((opt, i) => {
                let bg = 'white', border = '1.5px solid var(--cream-border)', color = 'var(--text-primary)';
                if (selected !== null) {
                  if (i === q.correctIndex) { bg = '#E8F8EC'; border = '2px solid #2E8B57'; color = '#1a5c30'; }
                  else if (i === selected && i !== q.correctIndex) { bg = '#FEE2E2'; border = '2px solid #C0392B'; color = '#7a1a1a'; }
                }
                return (
                  <button key={i} onClick={() => handleAnswer(i)} style={{
                    background: bg, border, color, borderRadius: '0.75rem',
                    padding: '0.875rem 1.25rem', fontWeight: 700, fontSize: '0.95rem',
                    cursor: selected !== null ? 'default' : 'pointer',
                    textAlign: 'left', transition: 'all 0.15s', fontFamily: 'Nunito, sans-serif',
                  }}>
                    {opt}
                    {selected !== null && i === q.correctIndex && <span style={{ float: 'right' }}>✓</span>}
                    {selected !== null && i === selected && i !== q.correctIndex && <span style={{ float: 'right' }}>✗</span>}
                  </button>
                );
              })}
            </div>
            {selected !== null && (
              <button onClick={handleNext} className="btn-maroon" style={{ width: '100%', justifyContent: 'center' }}>
                {qIndex + 1 >= questions.length ? 'See results →' : 'Next question →'}
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Activities() {
  usePageMeta('Activities for Kids', 'Coloring pages, quizzes, crafts and printable activities for children — all rooted in Orthodox Christian faith.');
  const activities = getActivities().filter(a => a.active);
  const [email, setEmail] = useState('');
  const { addToast } = useToast();
  const { user } = useAuth();

  const handleSubscribe = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      await fetch(`${API}/api/subscribe`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, source: 'activities' }) });
    } catch { /* silent */ }
    addToast('Free printables are on their way!', 'success');
    setEmail('');
  };

  return (
    <div style={{ background: 'var(--cream)' }}>

      {/* ── Hero ── */}
      <section style={{ background: 'var(--cream)', padding: '4rem 1.25rem 3rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div className="tiggy-float" style={{ width: 130, height: 145, margin: '0 auto 1.25rem' }}>
            <img src="/tiggy-wave.png" alt="Tiggy waving" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 8px 20px rgba(107,32,32,0.18))' }} onError={e => { (e.currentTarget as HTMLImageElement).src = '/tiggy.png'; }} />
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'white', border: '1.5px solid var(--cream-border)', borderRadius: '9999px', padding: '0.3rem 0.875rem', fontSize: '0.8rem', fontWeight: 700, color: '#C0392B', marginBottom: '1.25rem' }}>
            🎨 Activities for Kids
          </span>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(2rem, 5vw, 3.5rem)', margin: '0 0 1rem', color: '#1B2A4A', lineHeight: 1.1, fontWeight: 700 }}>
            Let's <span style={{ color: '#C0392B' }}>play</span> and <span style={{ color: '#2E8B57' }}>learn</span> with Tiggy!
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 600, lineHeight: 1.7, margin: 0, fontSize: '1.05rem' }}>
            Free printables, games, and quizzes that make faith joyful. Perfect for rainy days, Sunday school, and quiet afternoons.
          </p>
        </div>
      </section>

      {/* ── Activity cards grid ── */}
      <section style={{ background: '#F5F0E8', padding: '5rem 1.25rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {(!user || user.isGuest) && (
            <GuestBanner message="Create a free account to download activity packs, track completed crafts, and save your favorites." />
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {activities.map(a => (
              <div key={a.id} className="card" style={{ padding: '1.75rem', background: 'white' }}>
                <div style={{ width: 48, height: 48, borderRadius: '0.875rem', background: `${a.ctaColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '1rem' }}>
                  {a.icon}
                </div>
                <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: '1.05rem', margin: '0 0 0.625rem', color: '#1B2A4A' }}>{a.title}</h3>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.65, fontWeight: 600, margin: '0 0 1rem', fontSize: '0.9rem' }}>{a.desc}</p>
                <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                  {a.tags.map(tag => (
                    <span key={tag} style={{ background: 'var(--cream-dark)', color: 'var(--text-muted)', borderRadius: '9999px', padding: '0.15rem 0.6rem', fontSize: '0.72rem', fontWeight: 700 }}>{tag}</span>
                  ))}
                </div>
                <button
                  style={{ background: 'none', border: 'none', padding: 0, color: a.ctaColor, fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}
                  onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.textDecoration = 'underline'}
                  onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.textDecoration = 'none'}
                  onClick={() => addToast(`"${a.title}" — coming soon!`, 'info')}
                >
                  {a.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Quiz section ── */}
      <QuizSection />

      {/* ── Draw with Tiggy (dark navy) ── */}
      <section style={{ background: '#1B2A4A', padding: '5rem 1.25rem' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '3rem', alignItems: 'center' }}>
          <div>
            <p style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: '0.75rem', letterSpacing: '0.18em', color: '#5BB8A0', textTransform: 'uppercase', margin: '0 0 0.75rem' }}>DRAW WITH TIGGY</p>
            <h2 style={{ color: 'white', fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)', margin: '0 0 1.25rem', lineHeight: 1.2 }}>
              Grab a pencil — let's draw together!
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.68)', lineHeight: 1.8, fontWeight: 500, margin: '0 0 2rem', fontSize: '0.975rem' }}>
              In each short video, Tiggy guides you step by step to draw lambs, doves, churches, and your favorite saints. No experience needed — just a smile and some crayons.
            </p>
            <a
              href="https://www.youtube.com/channel/UCY6m20ZtWVjAtbGqcqTYQng"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--gold)', color: 'white', borderRadius: '9999px', padding: '0.75rem 1.75rem', fontWeight: 800, fontSize: '0.95rem', textDecoration: 'none' }}
            >
              ▶ Watch the drawing series
            </a>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ maxWidth: 260, margin: '0 auto' }}>
              <img src="/tiggy-draw.png" alt="Tiggy drawing" style={{ width: '100%', maxHeight: 300, objectFit: 'contain', filter: 'drop-shadow(0 12px 28px rgba(0,0,0,0.4))' }} onError={e => { (e.currentTarget as HTMLImageElement).src = '/tiggy.png'; }} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Get free printables newsletter ── */}
      <section style={{ background: '#F5F0E8', padding: '5rem 1.25rem' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div className="card" style={{ padding: '2.5rem', background: 'white', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ maxWidth: 140, margin: '0 auto' }}>
                <img src="/tiggy-cheer.png" alt="Tiggy" style={{ width: '100%', objectFit: 'contain' }} onError={e => { (e.currentTarget as HTMLImageElement).src = '/tiggy.png'; }} />
              </div>
            </div>
            <div>
              <h2 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', margin: '0 0 0.75rem', color: '#1B2A4A' }}>Get free printables every week ✏️</h2>
              <p style={{ color: 'var(--text-secondary)', fontWeight: 600, lineHeight: 1.65, margin: '0 0 1.25rem', fontSize: '0.9rem' }}>
                Join Tiggy's Kingdom Mail and we'll send a fresh coloring page or activity to your inbox each week.
              </p>
              <form onSubmit={handleSubscribe} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Your email address" className="tk-input" required />
                <button type="submit" className="btn-maroon" style={{ background: '#3A7A30', justifyContent: 'center' }}>Send me printables</button>
              </form>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
