import { useState, useEffect, useRef, useCallback, type FormEvent } from 'react';

function TiggyHero() {
  const ref = useRef<HTMLImageElement>(null);
  const handleClick = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.remove('bouncing');
    void el.offsetWidth; // reflow to restart
    el.classList.add('bouncing');
    el.addEventListener('animationend', () => el.classList.remove('bouncing'), { once: true });
  }, []);
  return (
    <img
      ref={ref}
      src="/tiggy-hero.png"
      alt="Tiggy the Lamb"
      className="tiggy-hero"
      onClick={handleClick}
      title="Click me!"
      style={{ width: '100%', maxHeight: 500, objectFit: 'contain', filter: 'drop-shadow(0 24px 48px rgba(107,32,32,0.2))' }}
    />
  );
}
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import type { VideoProgress } from '../context/AuthContext';
import EmptyState from '../components/EmptyState';
import { API } from '../lib/api';
import { usePageMeta } from '../hooks/usePageMeta';

const YT_API_KEY       = import.meta.env.VITE_YOUTUBE_API_KEY || '';
const CHANNEL_ID       = 'UCY6m20ZtWVjAtbGqcqTYQng';
const UPLOADS_PLAYLIST = CHANNEL_ID.replace(/^UC/, 'UU');
const HOME_CACHE_KEY   = 'tk_yt_home_v2';
const HOME_CACHE_TTL   = 6 * 60 * 60 * 1000;

interface YTVideo { id: string; title: string; isShort: boolean; }

function parseDuration(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] || '0') * 3600) + (parseInt(m[2] || '0') * 60) + parseInt(m[3] || '0');
}

const TESTIMONIALS = [
  { quote: "My kids ask for 'one more Tiggy story' every single night. It's the best part of our bedtime routine.", name: 'Maria K.', role: 'Mother of three' },
  { quote: "Finally, beautiful Orthodox content I can trust. The animation is gorgeous and the stories are faithful and gentle.", name: 'Fr. Andrew', role: 'Parish priest' },
  { quote: "I bought the treasury for my goddaughter's name day. The illustrations are stunning — a true heirloom gift.", name: 'Claire P.', role: 'Godmother' },
];

const EP_COLORS = ['#3B82F6', '#22A05A', '#DC2626', '#8B5CF6', '#F97316', '#C9922A'];

function fmtTime(s: number) {
  return `${Math.floor(s / 60)}:${String(Math.floor(s) % 60).padStart(2, '0')}`;
}

export default function Home() {
  usePageMeta(undefined, 'Orthodox Christian stories, songs, and activities for children ages 4 and above. Meet Tiggy the lamb and explore the faith together.');
  const [email, setEmail]             = useState('');
  const [ytVideos, setYtVideos]       = useState<YTVideo[]>([]);
  const [ytLoading, setYtLoading]     = useState(true);
  const [continueWatching, setContinueWatching] = useState<VideoProgress | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const { addToast }       = useToast();
  const { user, getWatchHistory } = useAuth();

  useEffect(() => {
    if (!YT_API_KEY) { setYtLoading(false); return; }
    // Serve from cache when fresh
    try {
      const s = localStorage.getItem(HOME_CACHE_KEY);
      if (s) {
        const { ts, data } = JSON.parse(s);
        if (Date.now() - ts < HOME_CACHE_TTL) { setYtVideos(data); setYtLoading(false); return; }
      }
    } catch {}
    // playlistItems = 1 quota unit; search = 100 units
    fetch(`https://www.googleapis.com/youtube/v3/playlistItems?key=${YT_API_KEY}&playlistId=${UPLOADS_PLAYLIST}&part=contentDetails&maxResults=15`)
      .then(r => r.json())
      .then(async data => {
        if (data.error || !data.items?.length) return;
        const ids = data.items.map((i: { contentDetails: { videoId: string } }) => i.contentDetails.videoId).join(',');
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
        try { localStorage.setItem(HOME_CACHE_KEY, JSON.stringify({ ts: Date.now(), data: mapped })); } catch {}
        setYtVideos(mapped);
      })
      .catch(() => {})
      .finally(() => setYtLoading(false));
  }, []);

  useEffect(() => {
    if (!user?.id || user.id === 'guest') { setContinueWatching(null); return; }
    const history    = getWatchHistory(user.id);
    const inProgress = history.find(h => h.timestamp > 30 && h.duration > 0 && (h.timestamp / h.duration) < 0.9) ?? null;
    setContinueWatching(prev => prev?.videoId === inProgress?.videoId ? prev : inProgress);
  }, [user, getWatchHistory]);

  const handleSubscribe = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      const res  = await fetch(`${API}/api/subscribe`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, source: 'homepage' }) });
      const data = await res.json();
      addToast(data.message || "You've joined Tiggy's Kingdom Mail! Check your inbox.", 'success');
    } catch {
      addToast("You've joined Tiggy's Kingdom Mail! Check your inbox.", 'success');
    }
    setEmail('');
  };

  const displayVideos = ytVideos.filter(v => !v.isShort).slice(0, 3);

  return (
    <div>
      {/* ===== CONTINUE WATCHING BANNER ===== */}
      {continueWatching && (
        <div style={{ background: 'var(--maroon)', color: 'white', padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>▶</span>
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: '0.9rem' }}>Continue watching</p>
              <p style={{ margin: 0, fontSize: '0.78rem', opacity: 0.8 }}>{continueWatching.title} — {fmtTime(continueWatching.timestamp)} / {fmtTime(continueWatching.duration)}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Link to="/episodes" state={{ resumeVideoId: continueWatching.videoId }} className="btn-gold" style={{ padding: '0.4rem 1.1rem', fontSize: '0.85rem' }}>Resume →</Link>
            <button onClick={() => setContinueWatching(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '1.1rem', padding: '0.25rem 0.5rem', lineHeight: 1 }}>✕</button>
          </div>
        </div>
      )}

      {/* ===== HERO ===== */}
      <section style={{ background: 'var(--cream)', padding: '5rem 1.25rem 4rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', alignItems: 'center' }}>
          <div>
            <span style={{ display: 'inline-block', background: 'var(--gold-pale)', color: 'var(--gold-dark)', fontWeight: 800, fontSize: '0.8rem', padding: '0.35rem 1rem', borderRadius: '9999px', marginBottom: '1.5rem', letterSpacing: '0.03em' }}>
              Orthodox stories for ages 4+
            </span>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(2.75rem, 6vw, 4.5rem)', lineHeight: 1.05, margin: '0 0 1rem', color: 'var(--text-primary)', fontWeight: 700 }}>
              Meet <span style={{ color: '#D4691D' }}>Tiggy</span>, the<br />little lamb who<br />loves <span style={{ color: '#3A7A30' }}>God</span>!
            </h1>
            <p style={{ fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontSize: '1.1rem', color: 'var(--text-secondary)', margin: '0 0 1.25rem' }}>
              Play, Learn &amp; Grow with God ✦
            </p>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75, fontWeight: 600, margin: '0 0 2.25rem', maxWidth: 480, fontSize: '1.05rem' }}>
              Join Tiggy on joyful, beautifully animated adventures through the saints, the feasts, and the wonders of the faith — gentle stories the whole family can treasure together.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to="/episodes" className="btn-maroon">▶ Watch the Stories</Link>
              <Link to="/shop" className="btn-outline-maroon">Browse the Bookshop</Link>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ maxWidth: 460, width: '100%' }}>
              <TiggyHero />
            </div>
          </div>
        </div>
      </section>

      {/* ===== THREE JOYFUL WAYS ===== */}
      <section style={{ background: '#F5F0E8', padding: '5rem 1.25rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: '0.75rem', letterSpacing: '0.18em', color: 'var(--gold-dark)', textTransform: 'uppercase', margin: '0 0 0.5rem' }}>OUR LITTLE PROMISE</p>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', margin: '0 0 0.75rem', color: 'var(--text-primary)' }}>Three joyful ways to grow</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600, margin: '0 auto 3rem', maxWidth: 520, lineHeight: 1.6 }}>
            Everything in Tiggy's Kingdom is built around three simple, beautiful ideas.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {([
              { color: '#C0392B', label: 'Play',  subtitle: 'Joyful adventures',  desc: "Songs, animated episodes, and games that make faith feel like the best kind of fun.",                              cta: 'Start playing →',  to: '/activities', img: '/tiggy-wave.png'  },
              { color: '#2E8B57', label: 'Learn', subtitle: 'Saints & feasts',    desc: "Gentle, faithful storytelling that teaches the lives of the saints and the meaning of the Church year.",           cta: 'Start learning →', to: '/episodes',   img: '/tiggy-point.png' },
              { color: '#2C5FA0', label: 'Grow',  subtitle: 'With God',           desc: "Simple prayers, kindness, and quiet moments that help little hearts grow close to Christ.",                         cta: 'Start growing →',  to: '/calendar',   img: '/tiggy-pray.png'  },
            ] as const).map(card => (
              <div key={card.label} className="card" style={{ overflow: 'hidden', textAlign: 'center', borderTop: `4px solid ${card.color}` }}>
                <div style={{ padding: '2rem 1.5rem 0.75rem', background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <img
                    src={card.img}
                    alt={`Tiggy — ${card.label}`}
                    style={{ width: 160, height: 180, objectFit: 'contain', filter: 'drop-shadow(0 8px 18px rgba(0,0,0,0.12))' }}
                    onError={e => { (e.currentTarget as HTMLImageElement).src = '/tiggy.png'; }}
                  />
                  <h3 style={{ fontFamily: 'Playfair Display, serif', color: card.color, fontSize: '2rem', margin: '0.5rem 0 0', fontWeight: 700 }}>{card.label}</h3>
                  <p style={{ color: '#1B2A4A', fontWeight: 800, margin: '0.2rem 0 0', fontSize: '0.9rem' }}>{card.subtitle}</p>
                </div>
                <div style={{ padding: '1.1rem 1.75rem 1.75rem', background: 'white' }}>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.65, fontWeight: 600, margin: '0 0 1.25rem', fontSize: '0.925rem' }}>{card.desc}</p>
                  <Link
                    to={card.to}
                    style={{ display: 'inline-block', color: card.color, fontWeight: 800, fontSize: '0.875rem', border: `2px solid ${card.color}`, padding: '0.45rem 1.1rem', borderRadius: '9999px', transition: 'all 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = card.color; (e.currentTarget as HTMLAnchorElement).style.color = 'white'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; (e.currentTarget as HTMLAnchorElement).style.color = card.color; }}
                  >{card.cta}</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== YOUTUBE EPISODES ===== */}
      <section style={{ background: 'var(--cream)', padding: '5rem 1.25rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: '0.75rem', letterSpacing: '0.18em', color: '#2E8B57', textTransform: 'uppercase', margin: '0 0 0.5rem' }}>ON OUR YOUTUBE CHANNEL</p>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.5rem)', margin: 0, color: 'var(--text-primary)', maxWidth: 520, lineHeight: 1.2 }}>Stories the whole family can watch together</h2>
            <Link to="/episodes" className="btn-maroon" style={{ flexShrink: 0, padding: '0.6rem 1.25rem', fontSize: '0.875rem', marginTop: '0.25rem' }}>▶ All episodes</Link>
          </div>

          {ytLoading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="card" style={{ pointerEvents: 'none' }}>
                  <div className="skeleton" style={{ paddingTop: '56.25%' }} />
                  <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div className="skeleton" style={{ height: 16, width: '80%', borderRadius: '0.4rem' }} />
                    <div className="skeleton" style={{ height: 12, width: '50%', borderRadius: '0.4rem' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!ytLoading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {displayVideos.length > 0 ? displayVideos.map((v, idx) => {
                const color = EP_COLORS[idx % EP_COLORS.length];
                const isPlaying = playingId === v.id;
                const aspectRatio = v.isShort ? '177.78%' : '56.25%';
                return (
                  <div key={v.id} className="card">
                    <div style={{ position: 'relative', background: `${color}22`, paddingTop: aspectRatio, cursor: isPlaying ? 'default' : 'pointer' }}
                         onClick={() => { if (!isPlaying) setPlayingId(v.id); }}>
                      {isPlaying ? (
                        <iframe
                          src={`https://www.youtube.com/embed/${v.id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          title={v.title}
                        />
                      ) : (
                        <>
                          <img
                            src={`https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`}
                            alt={v.title}
                            loading="lazy"
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={e => { e.currentTarget.style.display = 'none'; }}
                          />
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.15)', transition: 'background 0.2s' }}>
                            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', color, boxShadow: '0 4px 16px rgba(0,0,0,0.25)' }}>▶</div>
                          </div>
                          {v.isShort && <span style={{ position: 'absolute', top: 10, left: 10, background: '#EF4444', color: 'white', borderRadius: '0.5rem', padding: '0.2rem 0.55rem', fontSize: '0.7rem', fontWeight: 900 }}>SHORT</span>}
                        </>
                      )}
                    </div>
                    <div style={{ padding: '1.25rem' }}>
                      <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: '1rem', margin: '0 0 0.625rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>{v.title}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.875rem' }}>
                        <span style={{ color: '#F5C842', fontSize: '0.85rem' }}>★★★★★</span>
                        <span style={{ background: 'var(--cream-dark)', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>Ages 4+</span>
                      </div>
                      {isPlaying ? (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => setPlayingId(null)}
                            style={{ flex: 1, background: 'var(--cream-dark)', color: 'var(--text-secondary)', border: 'none', borderRadius: '0.75rem', padding: '0.5rem', fontWeight: 800, fontSize: '0.875rem', cursor: 'pointer' }}
                          >✕ Close</button>
                          <Link to="/episodes" state={{ resumeVideoId: v.id }} style={{ flex: 1, display: 'block', textAlign: 'center', background: 'var(--maroon)', color: 'white', borderRadius: '0.75rem', padding: '0.5rem', fontWeight: 800, fontSize: '0.875rem', textDecoration: 'none' }}>Full player →</Link>
                        </div>
                      ) : (
                        <button
                          onClick={() => setPlayingId(v.id)}
                          style={{ width: '100%', background: 'var(--cream-dark)', color: 'var(--maroon)', border: 'none', borderRadius: '0.75rem', padding: '0.5rem', fontWeight: 800, fontSize: '0.875rem', cursor: 'pointer' }}
                        >▶ Watch Now</button>
                      )}
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
        </div>
      </section>

      {/* ===== SO MUCH TO DO ===== */}
      <section style={{ background: '#F5F0E8', padding: '5rem 1.25rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', margin: '0 0 3rem', color: 'var(--text-primary)' }}>So much to do together</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {[
              { icon: '🎨', iconBg: '#FFE8E8', to: '/activities', title: 'Activities for Kids',  desc: 'Coloring pages, word puzzles, memory cards, printable crafts, and "Draw with Tiggy."', cta: 'Start playing →' },
              { icon: '🙏', iconBg: '#E8F0FF', to: '/calendar',   title: 'Prayer Corner',        desc: 'Simple prayers for little ones, plus a feast-day calendar to follow the Church year.',  cta: 'Visit the corner →' },
              { icon: '📚', iconBg: '#E8F8EC', to: '/shop',       title: 'The Bookshop',         desc: 'Hardcover storybooks, treasuries, and activity books — perfect for gifts and keepsakes.', cta: 'Browse books →' },
            ].map(item => (
              <div key={item.title} className="card" style={{ background: 'white', padding: '2rem' }}>
                <div style={{ width: 56, height: 56, borderRadius: '1rem', background: item.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', marginBottom: '1.25rem' }}>{item.icon}</div>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.25rem', margin: '0 0 0.75rem', color: 'var(--text-primary)' }}>{item.title}</h3>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.65, fontWeight: 600, margin: '0 0 1.25rem', fontSize: '0.9rem' }}>{item.desc}</p>
                <Link
                  to={item.to}
                  style={{ color: 'var(--text-secondary)', fontWeight: 800, fontSize: '0.9rem', transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = 'var(--maroon)'}
                  onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-secondary)'}
                >{item.cta}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== MISSION (dark navy) ===== */}
      <section style={{ background: '#1B2A4A', padding: '5rem 1.25rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '4rem', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="tiggy-float" style={{ maxWidth: 320, margin: '0 auto' }}>
              <img src="/tiggy-pray.png" alt="Tiggy praying" style={{ width: '100%', maxHeight: 380, objectFit: 'contain', filter: 'drop-shadow(0 24px 40px rgba(0,0,0,0.45))' }} onError={e => { (e.currentTarget as HTMLImageElement).src = '/tiggy.png'; }} />
            </div>
          </div>
          <div>
            <p style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: '0.75rem', letterSpacing: '0.18em', color: '#5BB8A0', textTransform: 'uppercase', margin: '0 0 0.75rem' }}>OUR MISSION</p>
            <h2 style={{ color: 'white', fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', margin: '0 0 1.25rem', lineHeight: 1.2 }}>
              Faith planted gently, in stories children remember
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.72)', lineHeight: 1.8, fontWeight: 500, margin: '0 0 2rem', fontSize: '1rem' }}>
              Tiggy's Kingdom was created by Orthodox parents who wanted screen time and bedtime to draw their children closer to Christ — without fear, without noise, just wonder.
            </p>
            {[
              { icon: '⛪', label: 'Rooted in Tradition', desc: 'Faithful to Orthodox teaching, the saints, and the feasts.' },
              { icon: '✨', label: 'Beautifully Made',     desc: 'Hand-crafted animation and illustration children adore.' },
              { icon: '🛡',  label: 'Safe & Ad-Free',      desc: 'Gentle, screen-safe content parents can fully trust.' },
            ].map(b => (
              <div key={b.label} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>{b.icon}</div>
                <div>
                  <p style={{ color: 'white', fontWeight: 800, margin: '0 0 0.2rem', fontSize: '0.95rem' }}>{b.label}</p>
                  <p style={{ color: 'rgba(255,255,255,0.55)', margin: 0, fontSize: '0.875rem', fontWeight: 500 }}>{b.desc}</p>
                </div>
              </div>
            ))}
            <Link to="/about" className="btn-gold" style={{ marginTop: '0.75rem' }}>Read our story →</Link>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section style={{ background: 'var(--cream)', padding: '5rem 1.25rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: '0.75rem', letterSpacing: '0.18em', color: 'var(--gold-dark)', textTransform: 'uppercase', margin: '0 0 0.5rem' }}>FROM OUR FAMILIES</p>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', margin: '0 0 3rem', color: 'var(--text-primary)' }}>
            Loved by parents, priests &amp; godparents
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="card" style={{ padding: '2rem' }}>
                <div style={{ color: '#F5C842', fontSize: '0.9rem', marginBottom: '1rem', letterSpacing: '0.05em' }}>★★★★★</div>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75, fontWeight: 600, margin: '0 0 1.5rem', fontSize: '0.95rem', fontStyle: 'italic' }}>"{t.quote}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--maroon)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '1rem', flexShrink: 0 }}>
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p style={{ fontWeight: 800, color: 'var(--text-primary)', margin: 0, fontSize: '0.875rem' }}>{t.name}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0, fontWeight: 600 }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== NEWSLETTER ===== */}
      <section style={{ background: '#F5F0E8', padding: '5rem 1.25rem' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ width: 120, height: 130, margin: '0 auto 1rem', overflow: 'hidden' }}>
            <img src="/tiggy-cheer.png" alt="Tiggy" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 6px 14px rgba(201,146,42,0.25))' }} onError={e => { (e.currentTarget as HTMLImageElement).src = '/tiggy.png'; }} />
          </div>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', margin: '0 0 0.875rem', color: 'var(--text-primary)' }}>Join Tiggy's Kingdom Mail ✉</h2>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 600, lineHeight: 1.7, margin: '0 0 2rem', maxWidth: 480, marginLeft: 'auto', marginRight: 'auto', fontSize: '1rem' }}>
            Faith-filled fun every week — new episode stories, free printables, and feast-day reminders delivered to your inbox.
          </p>
          <form onSubmit={handleSubscribe} style={{ display: 'flex', gap: '0.625rem', maxWidth: 460, margin: '0 auto', flexWrap: 'wrap', justifyContent: 'center' }}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Your email address"
              className="tk-input"
              style={{ flex: 1, minWidth: 220 }}
              required
            />
            <button type="submit" className="btn-maroon">Subscribe</button>
          </form>
        </div>
      </section>
    </div>
  );
}
