/// <reference types="vite/client" />
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePageMeta } from '../hooks/usePageMeta';
import EmptyState from '../components/EmptyState';
import GuestBanner from '../components/GuestBanner';

const API_KEY           = import.meta.env.VITE_YOUTUBE_API_KEY || '';
const CHANNEL_ID        = 'UCY6m20ZtWVjAtbGqcqTYQng';
const UPLOADS_PLAYLIST  = CHANNEL_ID.replace(/^UC/, 'UU'); // free playlistItems vs expensive search
const SEARCH_PAGE_SIZE  = 50;
const DISPLAY_PAGE_SIZE = 15;
const YT_CACHE_KEY      = 'tk_yt_lessons_v2';
const YT_CACHE_TTL      = 6 * 60 * 60 * 1000; // 6 hours

function getCachedVideos(): Video[] | null {
  try {
    const s = localStorage.getItem(YT_CACHE_KEY);
    if (!s) return null;
    const { ts, data } = JSON.parse(s);
    if (Date.now() - ts > YT_CACHE_TTL) { localStorage.removeItem(YT_CACHE_KEY); return null; }
    return data as Video[];
  } catch { return null; }
}
function setCachedVideos(videos: Video[]) {
  try { localStorage.setItem(YT_CACHE_KEY, JSON.stringify({ ts: Date.now(), data: videos })); } catch {}
}

type Filter = 'all' | 'episodes' | 'shorts';

interface Video {
  id: string;
  title: string;
  description?: string;
  isShort: boolean;
}

function parseDuration(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] || '0') * 3600) + (parseInt(m[2] || '0') * 60) + parseInt(m[3] || '0');
}

function formatTime(secs: number) {
  if (!secs || secs <= 0) return '';
  return `${Math.floor(secs / 60)}:${String(Math.floor(secs) % 60).padStart(2, '0')}`;
}

// ── YouTube IFrame API singleton ──────────────────────────────────────────────
interface YTPlayer {
  getCurrentTime(): number;
  getDuration(): number;
  destroy(): void;
}
declare global {
  interface Window {
    YT: { Player: new (...args: unknown[]) => YTPlayer; PlayerState: Record<string, number> };
    onYouTubeIframeAPIReady: () => void;
  }
}
let ytApiPromise: Promise<Window['YT']> | null = null;
function getYTApi() {
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise(resolve => {
    if (window.YT?.Player) { resolve(window.YT); return; }
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => resolve(window.YT);
  });
  return ytApiPromise;
}

// ── VideoEmbed ────────────────────────────────────────────────────────────────
// mode 'landscape' → 16:9 padding-top box
// mode 'portrait'  → 9:16 padding-top box
// mode 'fill'      → stretches to fill parent (used inside the fullscreen modal)
function VideoEmbed({ videoId, startSeconds, onProgress, mode = 'landscape' }: {
  videoId: string;
  startSeconds: number;
  onProgress: (t: number, d: number) => void;
  mode?: 'landscape' | 'portrait' | 'fill';
}) {
  const playerRef   = useRef<YTPlayer | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const suffix = mode === 'fill' ? 'f' : mode === 'portrait' ? 's' : 'e';
  const divId  = `yt-${videoId}-${suffix}`;

  useEffect(() => {
    let alive = true;
    getYTApi().then(YT => {
      if (!alive) return;
      playerRef.current = new YT.Player(divId, {
        videoId,
        playerVars: { start: Math.floor(startSeconds || 0), rel: 0, modestbranding: 1, playsinline: 1, fs: 1 },
        events: {
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.PLAYING) {
              clearInterval(intervalRef.current);
              intervalRef.current = setInterval(() => {
                const t = Math.floor(playerRef.current?.getCurrentTime() || 0);
                const d = Math.floor(playerRef.current?.getDuration()    || 0);
                if (t > 0) onProgress(t, d);
              }, 5000);
            } else {
              clearInterval(intervalRef.current);
              const t = Math.floor(playerRef.current?.getCurrentTime() || 0);
              const d = Math.floor(playerRef.current?.getDuration()    || 0);
              if (t > 0) onProgress(t, d);
            }
          },
        },
      });
    });
    return () => {
      alive = false;
      clearInterval(intervalRef.current);
      try { playerRef.current?.destroy(); } catch { /* ignore */ }
      playerRef.current = null;
    };
  }, [videoId]); // eslint-disable-line

  // 'fill' mode: no padding-top trick — parent controls size
  if (mode === 'fill') {
    return (
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <div id={divId} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', paddingTop: mode === 'portrait' ? '177.78%' : '56.25%' }}>
      <div id={divId} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
    </div>
  );
}

// ── Branded Tiggy thumbnail fallback ─────────────────────────────────────────
function TiggyThumbnail() {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(160deg, #6B2020 0%, #3B0A0A 60%, #1A0505 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '1rem',
    }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(201,146,42,0.7)' }}>
        <img src="/tiggy.png" alt="Tiggy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <p style={{ color: '#FEF3C7', fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '0.82rem', margin: 0, textAlign: 'center' }}>Tiggy's Kingdom</p>
      <span style={{ background: 'var(--gold)', color: 'white', borderRadius: '0.3rem', padding: '0.1rem 0.5rem', fontSize: '0.6rem', fontWeight: 900 }}>★ OFFICIAL CHANNEL</span>
    </div>
  );
}

// ── Episode card — used for All + Episodes tabs ───────────────────────────────
function EpisodeCard({ video, index, badge, savedProgress, isResuming, isFavorited, onProgress, onToggleFavorite }: {
  video: Video;
  index: number;
  badge?: string;          // "Ep. N" | "SHORT" | undefined
  savedProgress?: { timestamp: number; duration: number } | null;
  isResuming: boolean;
  isFavorited: boolean;
  onProgress: (video: Video, index: number, t: number, d: number) => void;
  onToggleFavorite: (video: Video) => void;
}) {
  const [playing, setPlaying] = useState(isResuming);
  const cardRef = useRef<HTMLDivElement>(null);
  const colors  = ['#3B82F6', '#F97316', '#7C3AED', '#22C55E', '#EF4444', '#C9922A'];
  const color   = colors[index % colors.length];
  const isTiggyBranded = video.title.toLowerCase().includes("tiggy's kingdom") &&
    !video.title.toLowerCase().includes('episode') && !video.title.toLowerCase().includes('ep.');

  useEffect(() => {
    if (isResuming && cardRef.current) cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [isResuming]);

  const ts  = savedProgress?.timestamp || 0;
  const dur = savedProgress?.duration  || 0;
  const pct = ts > 0 && dur > 0 ? Math.min(98, (ts / dur) * 100) : 0;

  const badgeIsShort = badge === 'SHORT';

  return (
    <div
      ref={cardRef}
      className="card"
      style={{
        display: 'flex', flexDirection: 'column',
        outline: isResuming && !playing ? '3px solid var(--gold)' : 'none',
        boxShadow: isResuming && !playing ? '0 0 0 4px rgba(201,146,42,0.2)' : undefined,
      }}
    >
      {isResuming && !playing && (
        <div style={{ background: 'var(--gold)', color: 'white', textAlign: 'center', padding: '0.3rem', fontSize: '0.75rem', fontWeight: 800, borderRadius: '1.5rem 1.5rem 0 0' }}>
          ▶ Continue Watching
        </div>
      )}

      {playing ? (
        <VideoEmbed videoId={video.id} startSeconds={ts} onProgress={(t, d) => onProgress(video, index, t, d)} mode="landscape" />
      ) : (
        <div
          onClick={() => setPlaying(true)}
          style={{ position: 'relative', paddingTop: '56.25%', background: `${color}22`, overflow: 'hidden', cursor: 'pointer', borderRadius: '1.5rem 1.5rem 0 0' }}
        >
          {isTiggyBranded ? <TiggyThumbnail /> : (
            <img
              src={`https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`}
              alt={video.title}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { e.currentTarget.style.display = 'none'; }}
            />
          )}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontSize: '1.4rem', marginLeft: '5px' }}>▶</span>
            </div>
          </div>
          {badge && (
            <span style={{ position: 'absolute', top: 8, left: 8, background: badgeIsShort ? '#EF4444' : 'var(--maroon)', color: 'white', borderRadius: '0.4rem', padding: '0.15rem 0.5rem', fontSize: '0.7rem', fontWeight: 900, pointerEvents: 'none' }}>
              {badge}
            </span>
          )}
          {ts > 0 && (
            <>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: 'rgba(255,255,255,0.25)' }}>
                <div style={{ height: '100%', background: 'var(--gold)', width: `${pct}%` }} />
              </div>
              <span style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.7)', color: 'white', borderRadius: '0.3rem', padding: '0.1rem 0.4rem', fontSize: '0.68rem', fontWeight: 700 }}>
                {formatTime(ts)} watched
              </span>
            </>
          )}
        </div>
      )}

      <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: '0.95rem', margin: 0, color: 'var(--text-primary)', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {video.title}
        </h3>
        {video.description && (
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, margin: 0, lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {video.description}
          </p>
        )}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginTop: 'auto', paddingTop: '0.25rem' }}>
          <span style={{ background: '#DBEAFE', color: '#1D4ED8', borderRadius: '9999px', padding: '0.15rem 0.5rem', fontSize: '0.72rem', fontWeight: 700 }}>Ages 4-12</span>
          <span style={{ color: '#F5C842', fontSize: '0.8rem' }}>★★★★★</span>
          {ts > 0 && (
            <span style={{ background: '#FEF3C7', color: '#C9922A', borderRadius: '9999px', padding: '0.15rem 0.5rem', fontSize: '0.72rem', fontWeight: 700, marginLeft: 'auto' }}>
              {formatTime(ts)} watched
            </span>
          )}
        </div>
        {!playing && (
          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.25rem' }}>
            <button
              onClick={() => setPlaying(true)}
              style={{ flex: 1, textAlign: 'center', background: ts > 0 ? 'var(--gold)' : badgeIsShort ? '#EF4444' : 'var(--maroon)', color: 'white', borderRadius: '0.75rem', padding: '0.5rem', fontWeight: 800, fontSize: '0.875rem', border: 'none', cursor: 'pointer' }}
            >
              {ts > 0 ? `▶ Resume at ${formatTime(ts)}` : badgeIsShort ? '▶ Watch Short' : '▶ Watch Episode'}
            </button>
            <button
              onClick={() => onToggleFavorite(video)}
              title={isFavorited ? 'Remove from favorites' : 'Save to favorites'}
              style={{ background: isFavorited ? '#FEF3C7' : 'var(--cream-dark)', color: isFavorited ? '#C9922A' : 'var(--text-secondary)', border: isFavorited ? '1.5px solid #C9922A' : 'none', borderRadius: '0.75rem', padding: '0.5rem 0.65rem', cursor: 'pointer', fontSize: '1rem', flexShrink: 0, transition: 'all 0.15s' }}
            >
              {isFavorited ? '♥' : '♡'}
            </button>
            <button
              onClick={() => {
                const url = `https://www.youtube.com/watch?v=${video.id}`;
                if (navigator.share) { navigator.share({ title: video.title, url }); }
                else { navigator.clipboard.writeText(url).then(() => alert('Link copied!')); }
              }}
              title="Share"
              style={{ background: 'var(--cream-dark)', color: 'var(--text-secondary)', border: 'none', borderRadius: '0.75rem', padding: '0.5rem 0.65rem', cursor: 'pointer', fontSize: '1rem', flexShrink: 0 }}
            >
              ↗
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Short card — portrait grid card used in Shorts tab ───────────────────────
// Three states:
//   'idle'       → shows thumbnail, click to go inline
//   'inline'     → portrait player inside the card, ⛶ button → fullscreen
//   'fullscreen' → fixed viewport overlay with correctly-sized portrait player
function ShortCard({ video }: { video: Video }) {
  const [state, setState] = useState<'idle' | 'inline' | 'fullscreen'>('idle');

  // Close fullscreen on Escape key
  useEffect(() => {
    if (state !== 'fullscreen') return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setState('idle'); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [state]);

  // Thumbnail shared between idle and inline states
  const Thumbnail = (
    <div style={{ position: 'relative', paddingTop: '177.78%', overflow: 'hidden' }}>
      <img
        src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
        alt={video.title}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
        onError={e => { (e.currentTarget as HTMLImageElement).src = `https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`; }}
      />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.45) 38%, rgba(0,0,0,0.1) 65%, transparent 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(255,255,255,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 14px rgba(0,0,0,0.45)' }}>
          <span style={{ color: 'var(--maroon)', fontSize: '1.1rem', marginLeft: '4px' }}>▶</span>
        </div>
      </div>
      <span style={{ position: 'absolute', top: 8, left: 8, background: '#EF4444', color: 'white', borderRadius: '0.35rem', padding: '0.18rem 0.55rem', fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.04em', boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
        SHORT
      </span>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0.875rem 0.75rem 0.8rem' }}>
        <p style={{ color: 'white', fontWeight: 800, fontSize: '0.85rem', margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', textShadow: '0 1px 6px rgba(0,0,0,0.7)', letterSpacing: '0.01em' }}>
          {video.title}
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Fullscreen overlay — position:fixed so it covers the viewport ── */}
      {state === 'fullscreen' && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setState('idle')}
        >
          {/*
            Portrait video sizing that fits any screen without clipping:
            - width  = min(100vh × 9/16, 100vw)  → at most the screen width
            - height = min(100vw × 16/9, 100vh)  → at most the screen height
            On landscape desktops: slim pillar centered in black
            On portrait phones:    fills the screen
          */}
          <div
            style={{
              width:  'min(calc(100vh * 9 / 16), 100vw)',
              height: 'min(calc(100vw * 16 / 9), 100vh)',
              position: 'relative',
              background: '#000',
            }}
            onClick={e => e.stopPropagation()}
          >
            <VideoEmbed videoId={video.id} startSeconds={0} onProgress={() => {}} mode="fill" />
          </div>

          {/* Close button */}
          <button
            onClick={e => { e.stopPropagation(); setState('idle'); }}
            aria-label="Close fullscreen"
            style={{ position: 'absolute', top: 20, right: 20, width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.3)', color: 'white', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Card ── */}
      <div
        style={{ borderRadius: '1rem', overflow: 'hidden', background: '#111', cursor: state === 'inline' ? 'default' : 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
        onClick={state === 'idle' ? () => setState('inline') : undefined}
        onMouseEnter={e => { if (state === 'idle') { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.25)'; } }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
      >
        {state === 'inline' ? (
          <>
            <VideoEmbed videoId={video.id} startSeconds={0} onProgress={() => {}} mode="portrait" />
            <div style={{ padding: '0.6rem 0.75rem', background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <p style={{ flex: 1, color: 'white', fontWeight: 700, fontSize: '0.78rem', margin: 0, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {video.title}
              </p>
              <button
                onClick={e => { e.stopPropagation(); setState('fullscreen'); }}
                title="Fullscreen"
                style={{ flexShrink: 0, background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', borderRadius: '0.4rem', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, backdropFilter: 'blur(4px)', lineHeight: 1 }}
              >
                ⛶
              </button>
            </div>
          </>
        ) : (
          Thumbnail
        )}
      </div>
    </>
  );
}

// ── Episode skeleton ──────────────────────────────────────────────────────────
function EpisodeSkeleton() {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', pointerEvents: 'none' }}>
      <div className="skeleton" style={{ paddingTop: '56.25%', borderRadius: '1.5rem 1.5rem 0 0' }} />
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        <div className="skeleton" style={{ height: 16, width: '85%', borderRadius: '0.4rem' }} />
        <div className="skeleton" style={{ height: 13, width: '65%', borderRadius: '0.4rem' }} />
        <div className="skeleton" style={{ height: 13, width: '50%', borderRadius: '0.4rem' }} />
        <div className="skeleton" style={{ height: 36, marginTop: '0.25rem', borderRadius: '0.75rem' }} />
      </div>
    </div>
  );
}

function ShortSkeleton() {
  return (
    <div style={{ borderRadius: '1rem', overflow: 'hidden' }}>
      <div className="skeleton" style={{ paddingTop: '177.78%' }} />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Lessons() {
  usePageMeta('Episodes', 'Watch animated Orthodox faith adventures with Tiggy the Lamb — new episodes every week for ages 4-12.');

  const [allVideos, setAllVideos]       = useState<Video[]>([]);
  const [filter, setFilter]             = useState<Filter>('all');
  const [displayCount, setDisplayCount] = useState(DISPLAY_PAGE_SIZE);
  const [loading, setLoading]           = useState(true);
  const [loadingMore, setLoadingMore]   = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const nextPageRef                     = useRef<string | null>(null);

  const { user, saveVideoProgress, getVideoProgress, addFavorite, removeFavorite, getFavorites } = useAuth();
  const location    = useLocation();
  const resumeVideoId = location.state?.resumeVideoId;

  // Reset display count when switching filters
  useEffect(() => { setDisplayCount(DISPLAY_PAGE_SIZE); }, [filter]);

  // When resuming, ensure the target video is on-screen
  useEffect(() => {
    if (!resumeVideoId || loading || allVideos.length === 0) return;
    const target = allVideos.find(v => v.id === resumeVideoId);
    if (!target || target.isShort) return; // shorts don't support resume
    const pool = target.isShort ? allVideos.filter(v => v.isShort) : allVideos.filter(v => !v.isShort);
    const posInPool = pool.findIndex(v => v.id === resumeVideoId);
    if (posInPool === -1) return;
    const neededCount = posInPool + 1;
    if (filter === 'shorts') setFilter('episodes');
    setDisplayCount(c => Math.max(c, neededCount));
  }, [resumeVideoId, allVideos, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPage = async (pageToken?: string) => {
    // Serve first page from cache when available
    if (!pageToken) {
      const cached = getCachedVideos();
      if (cached) { setAllVideos(cached); setLoading(false); return; }
    }

    if (pageToken) setLoadingMore(true); else setLoading(true);
    setError(null);
    try {
      // playlistItems costs 1 quota unit vs search's 100
      let url = `https://www.googleapis.com/youtube/v3/playlistItems?key=${API_KEY}&playlistId=${UPLOADS_PLAYLIST}&part=contentDetails&maxResults=${SEARCH_PAGE_SIZE}`;
      if (pageToken) url += `&pageToken=${pageToken}`;
      const sRes  = await fetch(url);
      const sData = await sRes.json();
      if (sData.error) {
        const msg = sData.error.message || '';
        setError(/quota/i.test(msg)
          ? 'YouTube video limit reached for today — videos will be back tomorrow. Sorry for the inconvenience!'
          : msg);
        return;
      }

      nextPageRef.current = sData.nextPageToken || null;
      const items = (sData.items || []) as { contentDetails: { videoId: string } }[];
      if (items.length === 0) return;

      const ids   = items.map(i => i.contentDetails.videoId).join(',');
      const vRes  = await fetch(`https://www.googleapis.com/youtube/v3/videos?key=${API_KEY}&id=${ids}&part=snippet,contentDetails`);
      const vData = await vRes.json();

      const mapped: Video[] = (vData.items || []).map((v: {
        id: string;
        snippet: { title: string; description: string };
        contentDetails: { duration: string };
      }) => {
        const dur     = parseDuration(v.contentDetails?.duration || '');
        const title   = v.snippet.title || '';
        const rawDesc = v.snippet.description || '';
        const desc    = rawDesc.split('\n')[0].slice(0, 180).trim();
        const isShort = dur <= 60 || /\#shorts/i.test(title + ' ' + rawDesc);
        return { id: v.id, title, description: desc, isShort };
      });

      if (!pageToken) setCachedVideos(mapped);
      setAllVideos(prev => pageToken ? [...prev, ...mapped] : mapped);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => { fetchPage(); }, []); // eslint-disable-line

  // Derived lists
  const episodes = allVideos.filter(v => !v.isShort);
  const shorts   = allVideos.filter(v => v.isShort);

  const filteredVideos = filter === 'shorts' ? shorts : filter === 'episodes' ? episodes : allVideos;
  // Shorts tab: show all. Episode/All tabs: paginate.
  const visibleVideos  = filter === 'shorts' ? filteredVideos : filteredVideos.slice(0, displayCount);
  const hasMore        = filter !== 'shorts' && (displayCount < filteredVideos.length || !!nextPageRef.current);

  const handleLoadMore = async () => {
    const next = displayCount + DISPLAY_PAGE_SIZE;
    setDisplayCount(next);
    if (next >= filteredVideos.length && nextPageRef.current) {
      await fetchPage(nextPageRef.current);
    }
  };

  const handleProgress = (video: Video, index: number, timestamp: number, duration: number) => {
    if (!user?.id) return;
    saveVideoProgress(user.id, { videoId: video.id, title: video.title, episodeNum: index + 1, timestamp, duration });
  };

  const favoriteIds = new Set((user && !user.isGuest) ? getFavorites(user.id).map(f => f.id) : []);

  const handleToggleFavorite = (video: Video) => {
    if (!user || user.isGuest) { alert('Sign in to save favorites.'); return; }
    if (favoriteIds.has(video.id)) { removeFavorite(user.id, video.id); }
    else { addFavorite(user.id, { id: video.id, title: video.title }); }
  };

  // Compute episode number label only for Episodes tab
  let epNumCounter = 0;
  const videosWithBadge = visibleVideos.map(v => {
    if (filter === 'episodes' && !v.isShort) {
      epNumCounter++;
      return { ...v, badge: `Ep. ${epNumCounter}` };
    }
    if (v.isShort && filter === 'all') return { ...v, badge: 'SHORT' };
    return { ...v, badge: undefined as string | undefined };
  });

  // Tab label helpers
  const tabLabel = (f: Filter) => {
    if (f === 'all')      return `All${!loading ? ` (${allVideos.length}${nextPageRef.current ? '+' : ''})` : ''}`;
    if (f === 'episodes') return `Episodes${!loading ? ` (${episodes.length}${nextPageRef.current ? '+' : ''})` : ''}`;
    return `Shorts${!loading ? ` (${shorts.length})` : ''}`;
  };

  return (
    <div>
      {/* ── Hero ── */}
      <section style={{ background: 'var(--cream)', padding: '4rem 1.25rem 3rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div className="tiggy-float" style={{ width: 130, height: 145, margin: '0 auto 1.25rem' }}>
            <img src="/tiggy-point.png" alt="Tiggy pointing" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 8px 20px rgba(107,32,32,0.18))' }} onError={e => { (e.currentTarget as HTMLImageElement).src = '/tiggy.png'; }} />
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'white', border: '1.5px solid var(--cream-border)', borderRadius: '9999px', padding: '0.3rem 0.875rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            📺 The Watch Library
          </span>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(2rem, 5vw, 3.5rem)', margin: '0 0 1rem', color: '#1B2A4A', lineHeight: 1.1, fontWeight: 700 }}>
            Stories to <span style={{ color: '#D4691D' }}>play</span> &amp; watch together
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 600, margin: '0 auto', maxWidth: 520, lineHeight: 1.7, fontSize: '1.05rem' }}>
            Every film is hand-crafted, faithful to the tradition, and gentle enough for the youngest souls. A new story every Sunday.
          </p>
        </div>
      </section>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2.5rem 1.25rem' }}>

        {/* ── Guest upgrade prompt ── */}
        {(!user || user.isGuest) && (
          <GuestBanner message="Sign in to save your watch progress, favorite episodes, and pick up right where you left off." />
        )}

        {/* ── Filter tabs ── */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2.5rem', justifyContent: 'center' }}>
          {(['all', 'episodes', 'shorts'] as Filter[]).map((f, i) => {
            const labels = ['All Stories', 'Episodes', 'Shorts'];
            const active = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '9999px',
                  border: '2px solid transparent',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  background: active ? '#1B2A4A' : 'white',
                  color: active ? 'white' : 'var(--text-secondary)',
                  boxShadow: active ? '0 2px 8px rgba(27,42,74,0.25)' : '0 1px 4px rgba(0,0,0,0.08)',
                  transition: 'all 0.18s',
                }}
              >
                {labels[i]}{!loading ? ` (${f === 'all' ? allVideos.length : f === 'episodes' ? episodes.length : shorts.length}${nextPageRef.current && f !== 'shorts' ? '+' : ''})` : ''}
              </button>
            );
          })}
        </div>

        {/* ── Error ── */}
        {error && !loading && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '1rem', padding: '1.5rem', marginBottom: '2rem', color: '#DC2626', fontWeight: 600, fontSize: '0.9rem', textAlign: 'center' }}>
            <p style={{ margin: '0 0 0.5rem' }}>Could not load videos from YouTube. Check your API key or connection.</p>
            <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>{error}</p>
          </div>
        )}

        {/* ── Loading skeleton ── */}
        {loading && filter !== 'shorts' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            {[...Array(9)].map((_, i) => <EpisodeSkeleton key={i} />)}
          </div>
        )}
        {loading && filter === 'shorts' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.875rem', marginBottom: '2rem' }}>
            {[...Array(8)].map((_, i) => <ShortSkeleton key={i} />)}
          </div>
        )}

        {/* ── Empty ── */}
        {!loading && !error && filteredVideos.length === 0 && (
          <EmptyState
            title={filter === 'shorts' ? 'No shorts yet' : 'No episodes found'}
            message={filter === 'shorts'
              ? 'Short clips will appear here as they are published to the channel.'
              : 'Check back soon — new animated adventures from Tiggy\'s Kingdom are on the way!'}
          />
        )}

        {/* ── Episode / All grid (16:9) ── */}
        {!loading && filter !== 'shorts' && visibleVideos.length > 0 && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              {videosWithBadge.map((video, i) => (
                <EpisodeCard
                  key={video.id}
                  video={video}
                  index={i}
                  badge={video.badge}
                  isResuming={video.id === resumeVideoId}
                  savedProgress={user ? getVideoProgress(user.id, video.id) : null}
                  isFavorited={favoriteIds.has(video.id)}
                  onProgress={handleProgress}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
            {hasMore && (
              <div style={{ textAlign: 'center' }}>
                <button onClick={handleLoadMore} disabled={loadingMore} className="btn-maroon" style={{ opacity: loadingMore ? 0.7 : 1 }}>
                  {loadingMore ? 'Loading…' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}

        {/* ── Shorts grid (9:16 portrait) ── */}
        {!loading && filter === 'shorts' && shorts.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.875rem' }}>
            {shorts.map(video => <ShortCard key={video.id} video={video} />)}
          </div>
        )}

      </div>

      {/* ── Never miss a Sunday story CTA ── */}
      <section style={{ padding: '2rem 1.25rem 4rem' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', background: '#1B2A4A', borderRadius: '1.5rem', padding: '3rem 2.5rem', textAlign: 'center' }}>
          <h2 style={{ color: 'white', fontSize: 'clamp(1.5rem, 3vw, 2rem)', margin: '0 0 0.75rem' }}>
            Never miss a Sunday story 🔔
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontWeight: 600, margin: '0 0 1.75rem', lineHeight: 1.6 }}>
            Subscribe on YouTube to get every new Tiggy episode the moment it premieres.
          </p>
          <a
            href={`https://www.youtube.com/channel/${CHANNEL_ID}?sub_confirmation=1`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.625rem', background: '#EF4444', color: 'white', borderRadius: '9999px', padding: '0.75rem 2rem', fontWeight: 800, fontSize: '1rem', textDecoration: 'none', transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = '#DC2626'}
            onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = '#EF4444'}
          >
            ▶ Subscribe on YouTube
          </a>
        </div>
      </section>
    </div>
  );
}
