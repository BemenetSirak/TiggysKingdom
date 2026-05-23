import { useState, useEffect, useRef, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import type { VideoProgress } from '../context/AuthContext';
import EmptyState from '../components/EmptyState';

import { API } from '../lib/api';

const YT_API_KEY  = import.meta.env.VITE_YOUTUBE_API_KEY || '';
const CHANNEL_ID  = 'UCY6m20ZtWVjAtbGqcqTYQng';

type VideoFilter = 'all' | 'episodes' | 'shorts';

interface YTVideo { id: string; title: string; isShort: boolean; }

function parseDuration(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] || '0') * 3600) + (parseInt(m[2] || '0') * 60) + parseInt(m[3] || '0');
}

const ADVENTURE_CARDS = [
  { title: 'Animated Adventures', desc: 'Watch Tiggy explore ancient churches, learn about saints, and discover the beauty of Orthodox faith.', cta: 'Watch Now →', to: '/episodes', bg: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)', icon: '▶', iconBg: '#F97316' },
  { title: 'Sacred Stories', desc: 'Beautiful storybooks about Jesus, the saints, and the wonders of faith — crafted for ages 4-12.', cta: 'Browse Books →', to: '/shop', bg: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)', icon: '📖', iconBg: '#C9922A' },
  { title: 'Creative Corner', desc: 'Coloring pages, crafts, and activities that bring the faith to life through play and creativity.', cta: 'Start Creating →', to: '/activities', bg: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)', icon: '✏️', iconBg: '#A855F7' },
];


const TESTIMONIALS = [
  { quote: "Tiggy has transformed our family prayer time! My children actually ask to watch episodes and then we discuss the saints together. It's brought our Orthodox faith to life in a way I never imagined possible.", name: 'Maria S.', role: 'Mother of 3, Chicago' },
  { quote: "As a Sunday school teacher, Tiggy's Kingdom is a gift. The content is theologically sound, beautifully illustrated, and the children absolutely love Tiggy. I recommend it to every Orthodox family.", name: 'Father Nicholas', role: 'Sunday School Teacher, New York' },
  { quote: "My 5-year-old asked to read the Saint Yared book every night for a month. Seeing her fall in love with our Ethiopian Orthodox heritage through Tiggy is a blessing beyond words.", name: 'Sara T.', role: 'Mother of 2, Atlanta' },
];

const EP_COLORS = ['#3B82F6', '#F97316', '#7C3AED', '#22C55E', '#EF4444', '#C9922A'];

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
  const [ytVideos, setYtVideos]     = useState<YTVideo[]>([]);
  const [ytLoading, setYtLoading]   = useState(true);
  const [videoFilter, setVideoFilter] = useState<VideoFilter>('all');
  const [continueWatching, setContinueWatching] = useState<VideoProgress | null>(null);
  const { addToast } = useToast();
  const { user, getWatchHistory } = useAuth();

  // Fetch latest videos from YouTube channel
  useEffect(() => {
    if (!YT_API_KEY) { setYtLoading(false); return; }
    fetch(`https://www.googleapis.com/youtube/v3/search?key=${YT_API_KEY}&channelId=${CHANNEL_ID}&part=id&type=video&order=date&maxResults=10`)
      .then(r => r.json())
      .then(async data => {
        if (data.error || !data.items?.length) return;
        const ids = data.items.map((i: { id: { videoId: string } }) => i.id.videoId).join(',');
        const vRes  = await fetch(`https://www.googleapis.com/youtube/v3/videos?key=${YT_API_KEY}&id=${ids}&part=snippet,contentDetails`);
        const vData = await vRes.json();
        const mapped: YTVideo[] = (vData.items || []).map((v: {
          id: string;
          snippet: { title: string; description: string };
          contentDetails: { duration: string };
        }) => {
          const dur     = parseDuration(v.contentDetails?.duration || '');
          const title   = v.snippet.title || '';
          const isShort = dur <= 60 || /\#shorts/i.test(title + ' ' + (v.snippet.description || ''));
          return { id: v.id, title, isShort };
        });
        setYtVideos(mapped);
      })
      .catch(() => {})
      .finally(() => setYtLoading(false));
  }, []);

  // Auto-rotate testimonials every 5s (pause on hover)
  useEffect(() => {
    if (testimonialPaused) return;
    const id = setInterval(() => setTestimonialIndex(i => (i + 1) % TESTIMONIALS.length), 5000);
    return () => clearInterval(id);
  }, [testimonialPaused]);

  // Continue watching — find most recent in-progress video
  useEffect(() => {
    if (!user?.id || user.id === 'guest') { setContinueWatching(null); return; }
    const history = getWatchHistory(user.id);
    const inProgress = history.find(h => h.timestamp > 30 && h.duration > 0 && (h.timestamp / h.duration) < 0.9) ?? null;
    setContinueWatching(prev => prev?.videoId === inProgress?.videoId ? prev : inProgress);
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

  const filteredVideos = videoFilter === 'all'
    ? ytVideos
    : videoFilter === 'episodes'
      ? ytVideos.filter(v => !v.isShort)
      : ytVideos.filter(v => v.isShort);
  const displayVideos = filteredVideos.slice(0, videoFilter === 'shorts' ? 6 : 4);

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

          {/* Filter tabs */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
            {(['all', 'episodes', 'shorts'] as VideoFilter[]).map(f => (
              <button
                key={f}
                onClick={() => setVideoFilter(f)}
                style={{
                  padding: '0.35rem 1rem', borderRadius: '9999px', cursor: 'pointer',
                  border: f === 'shorts' && videoFilter === f ? '2px solid #EF4444' : '2px solid transparent',
                  fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.15s',
                  background: videoFilter === f ? (f === 'shorts' ? '#EF4444' : 'var(--maroon)') : 'var(--cream-dark)',
                  color: videoFilter === f ? 'white' : 'var(--text-secondary)',
                  boxShadow: videoFilter === f ? '0 2px 8px rgba(107,32,32,0.25)' : 'none',
                }}
              >
                {f === 'all' ? 'All' : f === 'episodes' ? 'Episodes' : 'Shorts'}
              </button>
            ))}
          </div>

          {/* Loading skeleton */}
          {ytLoading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="card" style={{ pointerEvents: 'none' }}>
                  <div className="skeleton" style={{ paddingTop: '56.25%' }} />
                  <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div className="skeleton" style={{ height: 16, width: '80%', borderRadius: '0.4rem' }} />
                    <div className="skeleton" style={{ height: 32, borderRadius: '0.75rem' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Episode grid (16:9) */}
          {!ytLoading && videoFilter !== 'shorts' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
              {displayVideos.length > 0 ? displayVideos.map((v, idx) => {
                const color = EP_COLORS[idx % EP_COLORS.length];
                return (
                  <div key={v.id} className="card">
                    <div style={{ position: 'relative', background: `${color}22`, paddingTop: '56.25%' }}>
                      <img
                        src={`https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`}
                        alt={v.title}
                        loading="lazy"
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => { e.currentTarget.style.display = 'none'; }}
                      />
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', color }}>▶</div>
                      </div>
                      {v.isShort && (
                        <span style={{ position: 'absolute', top: 10, left: 10, background: '#EF4444', color: 'white', borderRadius: '0.5rem', padding: '0.2rem 0.55rem', fontSize: '0.7rem', fontWeight: 900 }}>SHORT</span>
                      )}
                    </div>
                    <div style={{ padding: '1rem' }}>
                      <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: '1rem', margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>{v.title}</h3>
                      <StarRating count={5} />
                      <Link to="/episodes" state={{ resumeVideoId: v.id }}
                        style={{ display: 'block', textAlign: 'center', background: 'var(--gold-pale)', color: 'var(--maroon)', borderRadius: '0.75rem', padding: '0.5rem', fontWeight: 800, fontSize: '0.875rem', marginTop: '0.5rem' }}
                      >Watch Now</Link>
                    </div>
                  </div>
                );
              }) : (
                <div style={{ gridColumn: '1/-1' }}>
                  <EmptyState message="No episodes yet — check back soon!" action={{ label: 'View All', to: '/episodes' }} />
                </div>
              )}
            </div>
          )}

          {/* Shorts grid (9:16 portrait) */}
          {!ytLoading && videoFilter === 'shorts' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.875rem' }}>
              {displayVideos.length > 0 ? displayVideos.map(v => (
                <Link key={v.id} to="/episodes" style={{ display: 'block', borderRadius: '0.875rem', overflow: 'hidden', background: '#111', textDecoration: 'none' }}>
                  <div style={{ position: 'relative', paddingTop: '177.78%', overflow: 'hidden' }}>
                    <img
                      src={`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`}
                      alt={v.title}
                      loading="lazy"
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
                      onError={e => { (e.currentTarget as HTMLImageElement).src = `https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`; }}
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.3) 45%, transparent 100%)' }} />
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: 'var(--maroon)', fontSize: '0.9rem', marginLeft: '3px' }}>▶</span>
                      </div>
                    </div>
                    <span style={{ position: 'absolute', top: 8, left: 8, background: '#EF4444', color: 'white', borderRadius: '0.3rem', padding: '0.15rem 0.45rem', fontSize: '0.6rem', fontWeight: 900 }}>SHORT</span>
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0.625rem' }}>
                      <p style={{ color: 'white', fontWeight: 800, fontSize: '0.75rem', margin: 0, lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}>{v.title}</p>
                    </div>
                  </div>
                </Link>
              )) : (
                <div style={{ gridColumn: '1/-1' }}>
                  <EmptyState message="No shorts yet — check back soon!" action={{ label: 'View All', to: '/episodes' }} />
                </div>
              )}
            </div>
          )}
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
