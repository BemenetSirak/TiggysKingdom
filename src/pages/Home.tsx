import { useState, useEffect, useRef, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import type { VideoProgress } from '../context/AuthContext';

const API = 'http://localhost:4242';

const ADVENTURE_CARDS = [
  { title: 'Animated Adventures', desc: 'Watch Tiggy explore ancient churches, learn about saints, and discover the beauty of Orthodox faith.', cta: 'Watch Now →', to: '/episodes', bg: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)', icon: '▶', iconBg: '#F97316' },
  { title: 'Sacred Stories', desc: 'Beautiful storybooks about Jesus, the saints, and the wonders of faith — crafted for ages 4-12.', cta: 'Browse Books →', to: '/shop', bg: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)', icon: '📖', iconBg: '#C9922A' },
  { title: 'Creative Corner', desc: 'Coloring pages, crafts, and activities that bring the faith to life through play and creativity.', cta: 'Start Creating →', to: '/activities', bg: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)', icon: '✏️', iconBg: '#A855F7' },
];

interface Episode {
  id: string | number;
  videoId: string | null;
  title: string;
  order?: number;
  ages?: string;
  badge?: string | null;
  color?: string;
  featured?: boolean;
}

// Static fallback episodes if server returns empty
const FALLBACK_EPISODES: Episode[] = [
  { id: '1', videoId: null, title: 'The Good Shepherd', order: 12, ages: '6-9', badge: 'NEW', color: '#3B82F6' },
  { id: '2', videoId: null, title: "Saint Yared's Gift", order: 11, ages: '5-9', badge: 'POPULAR', color: '#F97316' },
  { id: '3', videoId: null, title: 'The Holy Cross', order: 10, ages: '4-8', badge: null, color: '#7C3AED' },
  { id: '4', videoId: null, title: "Tiggy's First Fast", order: 9, ages: '5-9', badge: null, color: '#22C55E' },
];

const TESTIMONIALS = [
  { quote: "Tiggy has transformed our family prayer time! My children actually ask to watch episodes and then we discuss the saints together. It's brought our Orthodox faith to life in a way I never imagined possible.", name: 'Maria S.', role: 'Mother of 3, Chicago' },
  { quote: "As a Sunday school teacher, Tiggy's Kingdom is a gift. The content is theologically sound, beautifully illustrated, and the children absolutely love Tiggy. I recommend it to every Orthodox family.", name: 'Father Nicholas', role: 'Sunday School Teacher, New York' },
  { quote: "My 5-year-old asked to read the Saint Yared book every night for a month. Seeing her fall in love with our Ethiopian Orthodox heritage through Tiggy is a blessing beyond words.", name: 'Sara T.', role: 'Mother of 2, Atlanta' },
];

const AGE_GROUPS = [
  { label: 'All Ages', min: 0, max: 99 },
  { label: '3–5', min: 3, max: 5 },
  { label: '6–8', min: 6, max: 8 },
  { label: '9–12', min: 9, max: 12 },
];

const EP_COLORS = ['#3B82F6', '#F97316', '#7C3AED', '#22C55E', '#EF4444', '#C9922A'];

function parseAges(str: string | undefined) {
  if (!str) return { min: 0, max: 99 };
  const parts = String(str).split(/[-–]/).map(Number);
  return { min: parts[0] || 0, max: parts[1] || parts[0] || 99 };
}

function fmtTime(s: number) {
  return `${Math.floor(s / 60)}:${String(Math.floor(s) % 60).padStart(2, '0')}`;
}

function StarRating({ count = 5 }: { count?: number }) {
  return <span className="stars">{'★'.repeat(count)}</span>;
}

export default function Home() {
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [testimonialPaused, setTestimonialPaused] = useState(false);
  const [email, setEmail] = useState('');
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [ageFilter, setAgeFilter] = useState(0);
  const [continueWatching, setContinueWatching] = useState<VideoProgress | null>(null);
  const { addToast } = useToast();
  const { user, getWatchHistory } = useAuth();

  // Fetch curated episodes from server
  useEffect(() => {
    fetch(`${API}/api/episodes`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data) && data.length > 0) setEpisodes(data); else setEpisodes(FALLBACK_EPISODES); })
      .catch(() => setEpisodes(FALLBACK_EPISODES));
  }, []);

  // Auto-rotate testimonials every 5s (pause on hover)
  useEffect(() => {
    if (testimonialPaused) return;
    const id = setInterval(() => setTestimonialIndex(i => (i + 1) % TESTIMONIALS.length), 5000);
    return () => clearInterval(id);
  }, [testimonialPaused]);

  // Continue watching — find most recent in-progress video
  useEffect(() => {
    if (!user?.id || user.id === 'guest') return;
    const history = getWatchHistory(user.id);
    const inProgress = history.find(h => h.timestamp > 30 && h.duration > 0 && (h.timestamp / h.duration) < 0.9);
    if (inProgress) setContinueWatching(inProgress);
  }, [user, getWatchHistory]);

  const handleSubscribe = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      const res = await fetch(`${API}/api/subscribe`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, source: 'homepage' }) });
      const data = await res.json();
      addToast(data.message || "You've joined Tiggy's Flock! Check your inbox.", 'success');
    } catch {
      addToast("You've joined Tiggy's Flock! Check your inbox.", 'success');
    }
    setEmail('');
  };

  // Filter episodes by age group
  const group = AGE_GROUPS[ageFilter];
  const filteredEps = episodes.filter(ep => {
    const { min, max } = parseAges(ep.ages);
    return min <= group.max && max >= group.min;
  }).slice(0, 4);

  const t = TESTIMONIALS[testimonialIndex];

  return (
    <div>
      {/* ===== CONTINUE WATCHING BANNER ===== */}
      {continueWatching && (
        <div style={{ background: 'var(--maroon)', color: 'white', padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>▶</span>
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: '0.9rem' }}>Continue watching</p>
              <p style={{ margin: 0, fontSize: '0.78rem', opacity: 0.8 }}>
                {continueWatching.title} — {fmtTime(continueWatching.timestamp)} / {fmtTime(continueWatching.duration)}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Link
              to="/episodes"
              state={{ resumeVideoId: continueWatching.videoId }}
              className="btn-gold"
              style={{ padding: '0.4rem 1.1rem', fontSize: '0.85rem' }}
            >Resume →</Link>
            <button onClick={() => setContinueWatching(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '1.1rem', padding: '0.25rem 0.5rem', lineHeight: 1 }}>✕</button>
          </div>
        </div>
      )}

      {/* ===== HERO ===== */}
      <section style={{ background: 'linear-gradient(180deg, #B8E8FF 0%, #FFF5CC 50%, #D4F5D4 100%)', padding: '4rem 1.25rem 3rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {['❤️', '✦', '✝', '⭐', '❤️', '✦', '✝', '💛'].map((d, i) => (
          <span key={i} style={{ position: 'absolute', fontSize: ['1rem','0.75rem','1.25rem','0.9rem','1.1rem','0.8rem','1rem','0.7rem'][i], top: ['15%','25%','40%','10%','60%','70%','20%','55%'][i], left: ['5%','12%','8%','88%','93%','85%','78%','3%'][i], opacity: 0.6 }}>{d}</span>
        ))}
        <p style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, color: 'var(--maroon)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Welcome to</p>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(2.5rem, 7vw, 4.5rem)', color: '#1E6CB8', margin: '0 0 0.5rem', lineHeight: 1.1, fontWeight: 700 }}>Tiggy's Kingdom</h1>
        <p style={{ fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontSize: 'clamp(1rem, 3vw, 1.35rem)', color: 'var(--purple)', margin: '0 0 2rem' }}>Where Faith, Wonder, and Learning Dance Together</p>
        <div style={{ maxWidth: 500, margin: '0 auto 2.5rem', background: 'rgba(255,255,255,0.35)', borderRadius: '2rem', padding: '2rem 1rem', backdropFilter: 'blur(4px)' }}>
          <div className="tiggy-float" style={{ width: 140, height: 140, borderRadius: '50%', overflow: 'hidden', margin: '0 auto', border: '4px solid var(--maroon)', boxShadow: '0 8px 32px rgba(107,32,32,0.25)' }}>
            <img src="/tiggy.png" alt="Tiggy the Lamb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <p style={{ color: 'var(--maroon)', fontWeight: 700, margin: '0.75rem 0 0' }}>Tiggy the Lamb &amp; Friends</p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
          <Link to="/episodes" className="btn-purple" style={{ fontSize: '1rem' }}>▶ Watch Episodes</Link>
          <Link to="/shop" className="btn-gold" style={{ fontSize: '1rem' }}>📖 Explore Books</Link>
          <Link to="/activities" className="btn-purple" style={{ fontSize: '1rem', background: 'var(--purple-light)' }}>✏️ Free Activities</Link>
        </div>
      </section>

      {/* ===== START YOUR ADVENTURE ===== */}
      <section style={{ background: 'var(--gold-pale)', padding: '4rem 1.25rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', color: 'var(--gold)', fontSize: '1.25rem', marginBottom: '0.25rem' }}>✦ &nbsp; ✦</p>
          <h2 style={{ textAlign: 'center', color: 'var(--purple)', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', margin: '0 0 0.5rem' }}>Start Your Adventure</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 600, margin: '0 0 2.5rem' }}>Choose how you want to explore Tiggy's Kingdom today</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {ADVENTURE_CARDS.map(card => (
              <div key={card.title} className="card" style={{ background: card.bg, color: 'white', overflow: 'visible' }}>
                <div style={{ padding: '2rem 1.75rem 1.5rem', display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>{card.icon}</div>
                  <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: '1.35rem', margin: 0, color: 'white' }}>{card.title}</h3>
                  <p style={{ margin: 0, opacity: 0.9, lineHeight: 1.5, fontWeight: 600 }}>{card.desc}</p>
                  <Link to={card.to} style={{ color: 'white', fontWeight: 800, fontSize: '1rem', marginTop: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>{card.cta}</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== LATEST EPISODES ===== */}
      <section style={{ background: 'var(--cream)', padding: '4rem 1.25rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', color: 'var(--maroon)', fontStyle: 'italic', margin: '0 0 0.5rem', fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)' }}>
            ✦ Latest Adventures from the Kingdom ✦
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600, margin: '0 0 1.25rem' }}>New episodes added every week</p>

          {/* Age filter pills */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
            {AGE_GROUPS.map((g, i) => (
              <button
                key={g.label}
                onClick={() => setAgeFilter(i)}
                style={{
                  padding: '0.35rem 1rem', borderRadius: '9999px', border: 'none', cursor: 'pointer',
                  fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.15s',
                  background: ageFilter === i ? 'var(--maroon)' : 'var(--cream-dark)',
                  color: ageFilter === i ? 'white' : 'var(--text-secondary)',
                  boxShadow: ageFilter === i ? '0 2px 8px rgba(107,32,32,0.25)' : 'none',
                }}
              >{i === 0 ? g.label : `Ages ${g.label}`}</button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
            {filteredEps.length > 0 ? filteredEps.map((ep, idx) => {
              const color = EP_COLORS[idx % EP_COLORS.length];
              const hasThumb = ep.videoId;
              return (
                <div key={ep.id} className="card" style={{ cursor: 'pointer' }}>
                  <div style={{ position: 'relative', background: `linear-gradient(135deg, ${color}33, ${color}88)`, paddingTop: '56.25%' }}>
                    {hasThumb ? (
                      <img
                        src={`https://i.ytimg.com/vi/${ep.videoId}/mqdefault.jpg`}
                        alt={ep.title}
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : null}
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', color }}>▶</div>
                    </div>
                    {ep.badge && (
                      <span style={{ position: 'absolute', top: 10, left: 10, background: color, color: 'white', borderRadius: '0.5rem', padding: '0.2rem 0.6rem', fontSize: '0.7rem', fontWeight: 900 }}>{ep.badge || (ep.featured ? 'FEATURED' : null)}</span>
                    )}
                    <span style={{ position: 'absolute', top: 10, right: 10, background: 'var(--maroon)', color: 'white', borderRadius: '0.5rem', padding: '0.2rem 0.5rem', fontSize: '0.7rem', fontWeight: 700 }}>Ep. {ep.order || idx + 1}</span>
                  </div>
                  <div style={{ padding: '1rem' }}>
                    <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: '1rem', margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>{ep.title}</h3>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ background: '#DBEAFE', color: '#1D4ED8', borderRadius: '0.375rem', padding: '0.15rem 0.5rem', fontSize: '0.75rem', fontWeight: 700 }}>Ages {ep.ages}</span>
                      <StarRating count={5} />
                    </div>
                    <Link
                      to="/episodes"
                      state={ep.videoId ? { resumeVideoId: ep.videoId } : undefined}
                      style={{ display: 'block', textAlign: 'center', background: 'var(--gold-pale)', color: 'var(--maroon)', borderRadius: '0.75rem', padding: '0.5rem', fontWeight: 800, fontSize: '0.875rem' }}
                    >Watch Now</Link>
                  </div>
                </div>
              );
            }) : (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                No episodes for this age range yet.
              </div>
            )}
          </div>
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Link to="/episodes" className="btn-maroon">View All Episodes →</Link>
          </div>
        </div>
      </section>

      {/* ===== MEET TIGGY ===== */}
      <section style={{ background: 'var(--cream-dark)', padding: '4rem 1.25rem' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '3rem', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 220, height: 220, borderRadius: '50%', overflow: 'hidden', margin: '0 auto', border: '4px solid var(--gold)', boxShadow: '0 8px 32px rgba(201,146,42,0.35)' }}>
              <img src="/tiggy.png" alt="Tiggy the Lamb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>
          <div>
            <p style={{ fontFamily: 'Playfair Display, serif', fontStyle: 'italic', color: 'var(--gold)', fontSize: '1.1rem', margin: '0 0 0.25rem' }}>Meet Your Faithful Friend</p>
            <h2 style={{ color: 'var(--maroon)', fontSize: 'clamp(2rem, 4vw, 2.75rem)', margin: '0 0 1rem' }}>Tiggy the Lamb</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontWeight: 600, margin: '0 0 1.25rem' }}>Hello, dear friend! I'm Tiggy, and I'm so glad you're here. Just like the Good Shepherd loves His lambs, I'm here to guide you through wonderful stories about Jesus, the saints, and our beautiful Orthodox faith.</p>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontWeight: 600, margin: '0 0 1.5rem' }}>Together, we'll explore ancient churches, learn sacred prayers, discover brave heroes of faith, and grow closer to God — all while having joyful adventures!</p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              {[['🕊', 'Gentle & Kind'], ['📖', 'Loves Learning'], ['🙏', 'Prayerful Heart']].map(([icon, label]) => (
                <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--gold-pale)', padding: '0.4rem 0.875rem', borderRadius: '9999px', color: 'var(--gold-dark)', fontWeight: 700, fontSize: '0.875rem' }}>{icon} {label}</span>
              ))}
            </div>
            <Link to="/about" className="btn-gold">Meet More Friends →</Link>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section
        style={{ background: '#F3F0FF', padding: '4rem 1.25rem' }}
        onMouseEnter={() => setTestimonialPaused(true)}
        onMouseLeave={() => setTestimonialPaused(false)}
      >
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--maroon)', margin: '0 0 0.25rem', fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)' }}>❤️ Loved by Families Worldwide</h2>
          <p style={{ color: 'var(--text-muted)', fontWeight: 600, margin: '0 0 2.5rem' }}>Join thousands of families growing in faith</p>
          <div className="card" style={{ padding: '2.5rem', maxWidth: 680, margin: '0 auto' }}>
            <p style={{ fontSize: '2.5rem', color: 'var(--gold)', margin: '0 0 1rem', lineHeight: 1 }}>"</p>
            <p style={{ fontSize: '1.05rem', lineHeight: 1.75, color: 'var(--text-primary)', fontWeight: 600, margin: '0 0 1.5rem', fontStyle: 'italic' }}>{t.quote}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--maroon)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.25rem' }}>👤</div>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontWeight: 800, color: 'var(--maroon)', margin: 0 }}>{t.name}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0, fontWeight: 600 }}>{t.role}</p>
                <StarRating count={5} />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '1.5rem', alignItems: 'center' }}>
            <button onClick={() => { setTestimonialIndex(i => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length); setTestimonialPaused(true); }} style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--purple)', color: 'white', border: 'none', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>‹</button>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {TESTIMONIALS.map((_, i) => (
                <button key={i} onClick={() => { setTestimonialIndex(i); setTestimonialPaused(true); }} style={{ width: i === testimonialIndex ? 24 : 10, height: 10, borderRadius: 9999, background: i === testimonialIndex ? 'var(--gold)' : 'var(--cream-border)', border: 'none', transition: 'all 0.2s', padding: 0, cursor: 'pointer' }} />
              ))}
            </div>
            <button onClick={() => { setTestimonialIndex(i => (i + 1) % TESTIMONIALS.length); setTestimonialPaused(true); }} style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--purple)', color: 'white', border: 'none', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>›</button>
          </div>
          {testimonialPaused && (
            <p style={{ marginTop: '0.75rem', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Auto-play paused</p>
          )}
        </div>
      </section>

      {/* ===== JOIN TIGGY'S FLOCK (Newsletter) ===== */}
      <section style={{ background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)', padding: '4rem 1.25rem' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 100, height: 100, borderRadius: '50%', overflow: 'hidden', margin: '0 auto 0.5rem', border: '3px solid var(--gold)' }}>
              <img src="/tiggy.png" alt="Tiggy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ fontSize: '2rem' }}>✉️</div>
          </div>
          <div>
            <h2 style={{ color: 'var(--purple)', margin: '0 0 0.5rem', fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}>Join Tiggy's Flock</h2>
            <p style={{ color: 'var(--text-secondary)', fontWeight: 600, lineHeight: 1.6, margin: '0 0 1.25rem' }}>Receive weekly blessings, saint stories &amp; free activities delivered straight to your inbox.</p>
            <form onSubmit={handleSubscribe} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" className="tk-input" style={{ flex: 1, minWidth: 180 }} required />
              <button type="submit" className="btn-purple">Subscribe</button>
            </form>
            <p style={{ margin: '0.75rem 0 0', fontSize: '0.8rem', color: 'var(--gold-dark)', fontWeight: 700 }}>🎁 Get a free coloring book instantly when you subscribe!</p>
            <p style={{ margin: '0.4rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>We respect your privacy. Unsubscribe anytime. No spam, ever.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
