/// <reference types="vite/client" />
import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usePageMeta } from '../hooks/usePageMeta';
import EmptyState from '../components/EmptyState';
import GuestBanner from '../components/GuestBanner';

const API_KEY           = import.meta.env.VITE_YOUTUBE_API_KEY || '';
const CHANNEL_ID        = 'UCY6m20ZtWVjAtbGqcqTYQng';
const UPLOADS_PLAYLIST  = CHANNEL_ID.replace(/^UC/, 'UU'); // free playlistItems vs expensive search
const SEARCH_PAGE_SIZE  = 50;
const DISPLAY_PAGE_SIZE = 15;
const YT_CACHE_KEY      = 'tk_yt_lessons_v6';
const YT_CACHE_TTL      = 6 * 60 * 60 * 1000;  // 6 hours
const PL_CACHE_KEY      = 'tk_yt_playlists_v1';
const PL_CACHE_TTL      = 12 * 60 * 60 * 1000; // 12 hours

// ── Video cache ───────────────────────────────────────────────────────────────
interface YTCache { ts: number; data: Video[]; }
function getCachedVideos(): YTCache | null {
  try {
    const s = localStorage.getItem(YT_CACHE_KEY);
    if (!s) return null;
    const c = JSON.parse(s) as YTCache;
    if (Date.now() - c.ts > YT_CACHE_TTL) { localStorage.removeItem(YT_CACHE_KEY); return null; }
    return c;
  } catch { return null; }
}
function setCachedVideos(videos: Video[]) {
  try { localStorage.setItem(YT_CACHE_KEY, JSON.stringify({ ts: Date.now(), data: videos })); } catch {}
}

// ── Playlist cache ────────────────────────────────────────────────────────────
export interface PlaylistMeta { id: string; title: string; }
interface YTPlaylistCache { ts: number; playlists: PlaylistMeta[]; videoMap: Record<string, string[]>; }
function getCachedPlaylists(): YTPlaylistCache | null {
  try {
    const s = localStorage.getItem(PL_CACHE_KEY);
    if (!s) return null;
    const c = JSON.parse(s) as YTPlaylistCache;
    if (Date.now() - c.ts > PL_CACHE_TTL) { localStorage.removeItem(PL_CACHE_KEY); return null; }
    return c;
  } catch { return null; }
}
function setCachedPlaylists(data: YTPlaylistCache) {
  try { localStorage.setItem(PL_CACHE_KEY, JSON.stringify(data)); } catch {}
}

async function fetchPlaylistData(): Promise<YTPlaylistCache | null> {
  const cached = getCachedPlaylists();
  if (cached) return cached;
  try {
    const pRes  = await fetch(`https://www.googleapis.com/youtube/v3/playlists?channelId=${CHANNEL_ID}&part=snippet&maxResults=50&key=${API_KEY}`);
    const pData = await pRes.json();
    if (pData.error) return null;

    const playlists: PlaylistMeta[] = (pData.items || []).map((p: { id: string; snippet: { title: string } }) => ({
      id: p.id, title: p.snippet.title,
    }));

    const videoMap: Record<string, string[]> = {};
    for (const pl of playlists) {
      let pageToken: string | undefined;
      do {
        let url = `https://www.googleapis.com/youtube/v3/playlistItems?playlistId=${pl.id}&part=contentDetails&maxResults=50&key=${API_KEY}`;
        if (pageToken) url += `&pageToken=${pageToken}`;
        const iRes  = await fetch(url);
        const iData = await iRes.json();
        if (iData.error) break;
        pageToken = iData.nextPageToken;
        for (const item of (iData.items || [])) {
          const vid = item.contentDetails?.videoId as string | undefined;
          if (vid) {
            if (!videoMap[vid]) videoMap[vid] = [];
            if (!videoMap[vid].includes(pl.title)) videoMap[vid].push(pl.title);
          }
        }
      } while (pageToken);
    }

    const result: YTPlaylistCache = { ts: Date.now(), playlists, videoMap };
    setCachedPlaylists(result);
    return result;
  } catch { return null; }
}

// ── Playlist icon inference ───────────────────────────────────────────────────
function playlistIcon(title: string): string {
  const t = title.toLowerCase();
  if (/saint|holy|martyr|apostle|theotokos/.test(t)) return '✝';
  if (/feast|nativity|pascha|christmas|theophany|transfiguration|dormition|pentecost|ascension/.test(t)) return '🕯';
  if (/parable/.test(t)) return '📖';
  if (/song|hymn|sing|chant/.test(t)) return '♪';
  if (/prayer|pray/.test(t)) return '🙏';
  if (/bible|scripture|testament/.test(t)) return '📜';
  return '✦';
}

type Filter = string; // 'all' | 'shorts' | 'watchLater' | playlist title

// ── Watch Later helpers ───────────────────────────────────────────────────────
const WL_KEY = (uid: string) => `tk_watch_later_${uid}`;
function getWatchLater(uid: string): { id: string; title: string }[] {
  try { return JSON.parse(localStorage.getItem(WL_KEY(uid)) || '[]'); } catch { return []; }
}
function saveWatchLater(uid: string, list: { id: string; title: string }[]) {
  try { localStorage.setItem(WL_KEY(uid), JSON.stringify(list)); } catch {}
}

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
      <p style={{ color: '#FEF3C7', fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '0.82rem', margin: 0, textAlign: 'center' }}>Tiggy's Kingdom</p>
      <span style={{ background: 'var(--gold)', color: 'white', borderRadius: '0.3rem', padding: '0.1rem 0.5rem', fontSize: '0.6rem', fontWeight: 900 }}>★ OFFICIAL CHANNEL</span>
    </div>
  );
}

// ── Episode card — used for All + Episodes tabs ───────────────────────────────
function EpisodeCard({ video, index, badge, savedProgress, isResuming, isFavorited, isWatchLater, onProgress, onToggleFavorite, onToggleWatchLater }: {
  video: Video;
  index: number;
  badge?: string;
  savedProgress?: { timestamp: number; duration: number } | null;
  isResuming: boolean;
  isFavorited: boolean;
  isWatchLater: boolean;
  onProgress: (video: Video, index: number, t: number, d: number) => void;
  onToggleFavorite: (video: Video) => void;
  onToggleWatchLater: (video: Video) => void;
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
        <h3 style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 800, fontSize: '0.95rem', margin: 0, color: 'var(--text-primary)', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {video.title}
        </h3>
        {video.description && (
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, margin: 0, lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {video.description}
          </p>
        )}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginTop: 'auto', paddingTop: '0.25rem' }}>
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
              title={isFavorited ? 'Remove from favourites' : 'Add to favourites'}
              style={{ background: isFavorited ? '#FEF3C7' : 'var(--cream-dark)', color: isFavorited ? '#C9922A' : 'var(--text-muted)', border: isFavorited ? '1.5px solid #C9922A' : '1.5px solid transparent', borderRadius: '0.75rem', padding: '0.5rem 0.65rem', cursor: 'pointer', fontSize: '1rem', flexShrink: 0, transition: 'all 0.15s' }}
            >
              {isFavorited ? '♥' : '♡'}
            </button>
            <button
              onClick={() => onToggleWatchLater(video)}
              title={isWatchLater ? 'Remove from Watch Later' : 'Watch Later'}
              style={{ background: isWatchLater ? '#EDE9FE' : 'var(--cream-dark)', color: isWatchLater ? '#7C3AED' : 'var(--text-muted)', border: isWatchLater ? '1.5px solid #7C3AED' : '1.5px solid transparent', borderRadius: '0.75rem', padding: '0.5rem 0.65rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, flexShrink: 0, transition: 'all 0.15s' }}
            >
              {isWatchLater ? '✓' : '🕐'}
            </button>
            <button
              onClick={() => {
                const url = `https://www.youtube.com/watch?v=${video.id}`;
                if (navigator.share) { navigator.share({ title: video.title, url }); }
                else { navigator.clipboard.writeText(url).then(() => {}); }
              }}
              title="Share"
              style={{ background: 'var(--cream-dark)', color: 'var(--text-muted)', border: '1.5px solid transparent', borderRadius: '0.75rem', padding: '0.5rem 0.65rem', cursor: 'pointer', fontSize: '1rem', flexShrink: 0 }}
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
//   'idle'       → thumbnail + title strip below, click to go inline
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

  return (
    <>
      {/* ── Fullscreen overlay ── */}
      {state === 'fullscreen' && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setState('idle')}
        >
          <div
            style={{ width: 'min(calc(100vh * 9 / 16), 100vw)', height: 'min(calc(100vw * 16 / 9), 100vh)', position: 'relative', background: '#000' }}
            onClick={e => e.stopPropagation()}
          >
            <VideoEmbed videoId={video.id} startSeconds={0} onProgress={() => {}} mode="fill" />
          </div>
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
        className="card"
        style={{
          borderRadius: '1rem',
          overflow: 'hidden',
          background: 'white',
          cursor: state === 'inline' ? 'default' : 'pointer',
          transition: 'transform 0.15s, box-shadow 0.15s',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
        }}
        onClick={state === 'idle' ? () => setState('inline') : undefined}
        onMouseEnter={e => { if (state === 'idle') { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(0,0,0,0.18)'; } }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}
      >
        {state === 'inline' ? (
          <>
            <VideoEmbed videoId={video.id} startSeconds={0} onProgress={() => {}} mode="portrait" />
            <div style={{ padding: '0.65rem 0.875rem', background: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <p style={{ flex: 1, color: 'var(--text-primary)', fontFamily: 'Fredoka, sans-serif', fontWeight: 800, fontSize: '0.82rem', margin: 0, lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {video.title}
              </p>
              <button
                onClick={e => { e.stopPropagation(); setState('fullscreen'); }}
                title="Fullscreen"
                style={{ flexShrink: 0, background: 'var(--cream-dark)', border: 'none', color: 'var(--text-secondary)', borderRadius: '0.4rem', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, lineHeight: 1 }}
              >
                ⛶
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Thumbnail */}
            <div style={{ position: 'relative', paddingTop: '177.78%', overflow: 'hidden', borderRadius: '0.875rem 0.875rem 0 0' }}>
              <img
                src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
                alt={video.title}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
                onError={e => { (e.currentTarget as HTMLImageElement).src = `https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`; }}
              />
              {/* light vignette for play button legibility only */}
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.3) 100%)' }} />
              {/* play button */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 18px rgba(0,0,0,0.4)' }}>
                  <span style={{ color: 'var(--maroon)', fontSize: '1.15rem', marginLeft: '5px' }}>▶</span>
                </div>
              </div>
              {/* SHORT badge */}
              <span style={{ position: 'absolute', top: 8, left: 8, background: '#EF4444', color: 'white', borderRadius: '0.35rem', padding: '0.18rem 0.55rem', fontSize: '0.62rem', fontWeight: 900, letterSpacing: '0.06em', boxShadow: '0 1px 5px rgba(0,0,0,0.4)' }}>
                SHORT
              </span>
              {/* tap hint */}
              <span style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', color: 'rgba(255,255,255,0.85)', borderRadius: '9999px', padding: '0.2rem 0.55rem', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.04em' }}>
                TAP TO PLAY
              </span>
            </div>

            {/* Title strip */}
            <div style={{ padding: '0.625rem 0.875rem 0.75rem', background: 'white' }}>
              <p style={{
                color: 'var(--text-primary)',
                fontFamily: 'Fredoka, sans-serif',
                fontWeight: 800,
                fontSize: '0.82rem',
                margin: 0,
                lineHeight: 1.4,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {video.title}
              </p>
            </div>
          </>
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
  usePageMeta('Episodes', 'Watch animated Orthodox faith adventures with Tiggy the Lamb — new episodes every week for ages 4+.');

  const [allVideos, setAllVideos]       = useState<Video[]>([]);
  const [playlists, setPlaylists]             = useState<PlaylistMeta[]>([]);
  const [playlistMap, setPlaylistMap]         = useState<Record<string, string[]>>({});
  const [shortsPlaylistTitle, setShortsPlaylistTitle] = useState<string | null>(null);
  const [filter, setFilter]             = useState<Filter>('all');
  const [displayCount, setDisplayCount] = useState(DISPLAY_PAGE_SIZE);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);

  const { user, saveVideoProgress, getVideoProgress, addFavorite, removeFavorite, getFavorites } = useAuth();
  const { addToast } = useToast();
  const location    = useLocation();
  const resumeVideoId = location.state?.resumeVideoId;

  // Reset display count when switching filters
  useEffect(() => { setDisplayCount(DISPLAY_PAGE_SIZE); }, [filter]);

  // When resuming, ensure the target video is on-screen
  useEffect(() => {
    if (!resumeVideoId || loading || allVideos.length === 0) return;
    const target = allVideos.find(v => v.id === resumeVideoId);
    if (!target || videoIsShort(target)) return; // shorts don't support resume
    const pool = allVideos.filter(v => !videoIsShort(v));
    const posInPool = pool.findIndex(v => v.id === resumeVideoId);
    if (posInPool === -1) return;
    const neededCount = posInPool + 1;
    if (filter === 'shorts') setFilter('all');
    setDisplayCount(c => Math.max(c, neededCount));
  }, [resumeVideoId, allVideos, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAllVideos = async () => {
    const cached = getCachedVideos();
    if (cached) {
      setAllVideos(cached.data);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const collected: Video[] = [];
    let pageToken: string | undefined;
    const MAX_PAGES = 10;
    let page = 0;
    try {
      do {
        page++;
        let url = `https://www.googleapis.com/youtube/v3/playlistItems?key=${API_KEY}&playlistId=${UPLOADS_PLAYLIST}&part=contentDetails&maxResults=${SEARCH_PAGE_SIZE}`;
        if (pageToken) url += `&pageToken=${pageToken}`;
        const sRes  = await fetch(url);
        const sData = await sRes.json();
        if (sData.error) {
          const msg = sData.error.message || '';
          if (collected.length > 0) break;
          setError(/quota/i.test(msg)
            ? 'YouTube video limit reached for today — videos will be back tomorrow. Sorry for the inconvenience!'
            : msg);
          return;
        }
        pageToken = sData.nextPageToken;
        const items = (sData.items || []) as { contentDetails: { videoId: string } }[];
        if (!items.length) break;

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
          // Duration-only fallback; playlist membership overrides this once loaded
          const isShort = dur > 0 && dur <= 60;
          return { id: v.id, title, description: desc, isShort };
        });

        collected.push(...mapped);
        setAllVideos([...collected]);
      } while (pageToken && page < MAX_PAGES);

      setCachedVideos(collected);
    } catch (err: unknown) {
      if (collected.length === 0) setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllVideos();
    fetchPlaylistData().then(data => {
      if (!data) return;
      const shortsP = data.playlists.find(p => /^#?shorts$/i.test(p.title.trim()));
      setShortsPlaylistTitle(shortsP?.title ?? null);
      // Keep Shorts playlist out of the category tabs (handled separately)
      setPlaylists(data.playlists.filter(p => !/^#?shorts$/i.test(p.title.trim())));
      setPlaylistMap(data.videoMap);
    });
  }, []); // eslint-disable-line

  // Use the channel's Shorts playlist as ground truth; fall back to duration when unavailable
  const videoIsShort = (v: Video): boolean =>
    shortsPlaylistTitle
      ? (playlistMap[v.id] || []).includes(shortsPlaylistTitle)
      : v.isShort;

  // Derived lists
  const shorts = allVideos.filter(videoIsShort);

  // Count videos (from allVideos) per playlist for tab badges
  const catCounts: Record<string, number> = { all: allVideos.length, shorts: shorts.length };
  for (const v of allVideos) {
    for (const title of (playlistMap[v.id] || [])) {
      catCounts[title] = (catCounts[title] || 0) + 1;
    }
  }

  const filteredVideos = filter === 'all'         ? allVideos
                       : filter === 'shorts'      ? allVideos.filter(videoIsShort)
                       : filter === 'watchLater'  ? allVideos.filter(v => watchLaterIds.has(v.id))
                       : allVideos.filter(v => (playlistMap[v.id] || []).includes(filter));

  const visibleVideos = filter === 'shorts' ? filteredVideos : filteredVideos.slice(0, displayCount);
  const hasMore       = filter !== 'shorts' && displayCount < filteredVideos.length;

  const handleLoadMore = () => setDisplayCount(c => c + DISPLAY_PAGE_SIZE);

  const handleProgress = (video: Video, index: number, timestamp: number, duration: number) => {
    if (!user?.id) return;
    saveVideoProgress(user.id, { videoId: video.id, title: video.title, episodeNum: index + 1, timestamp, duration });
  };

  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(
    () => new Set((user && !user.isGuest) ? getFavorites(user.id).map(f => f.id) : [])
  );
  const [watchLaterIds, setWatchLaterIds] = useState<Set<string>>(
    () => new Set((user && !user.isGuest) ? getWatchLater(user.id).map(v => v.id) : [])
  );

  const handleToggleFavorite = (video: Video) => {
    if (!user || user.isGuest) { addToast('Sign in to save favourites.', 'info'); return; }
    setFavoriteIds(prev => {
      const next = new Set(prev);
      if (next.has(video.id)) { removeFavorite(user.id, video.id); next.delete(video.id); addToast('Removed from favourites', 'info'); }
      else { addFavorite(user.id, { id: video.id, title: video.title }); next.add(video.id); addToast('Added to favourites ♥', 'success'); }
      return next;
    });
  };

  const handleToggleWatchLater = (video: Video) => {
    if (!user || user.isGuest) { addToast('Sign in to use Watch Later.', 'info'); return; }
    setWatchLaterIds(prev => {
      const next = new Set(prev);
      const list = getWatchLater(user.id);
      if (next.has(video.id)) {
        saveWatchLater(user.id, list.filter(v => v.id !== video.id));
        next.delete(video.id);
        addToast('Removed from Watch Later', 'info');
      } else {
        saveWatchLater(user.id, [{ id: video.id, title: video.title }, ...list]);
        next.add(video.id);
        addToast('Saved to Watch Later 🕐', 'success');
      }
      return next;
    });
  };

  const videosWithBadge = visibleVideos.map(v => ({
    ...v,
    badge: videoIsShort(v) ? 'SHORT' : undefined as string | undefined,
  }));

  return (
    <div>
      {/* ── Hero ── */}
      <section style={{ background: 'var(--cream)', overflow: 'hidden' }}>
        {/* video — full width, cropped to TV region */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'flex-end' }}>
          <video
            src="/tiggy-watch.mp4"
            autoPlay loop muted playsInline
            style={{
              width: 'clamp(260px, 38vw, 480px)',
              objectFit: 'contain',
              mixBlendMode: 'multiply',
              display: 'block',
            }}
          />
        </div>
        {/* text below */}
        <div style={{ textAlign: 'center', padding: '0.5rem 1.25rem 2.5rem', maxWidth: 660, margin: '0 auto' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'white', border: '1.5px solid var(--cream-border)', borderRadius: '9999px', padding: '0.3rem 0.875rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            📺 The Watch Library
          </span>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 'clamp(1.75rem, 4vw, 3rem)', margin: '0 0 0.75rem', color: '#1B2A4A', lineHeight: 1.1, fontWeight: 700 }}>
            Stories to <span style={{ color: '#C9A227' }}>play</span> &amp; watch together
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 600, margin: 0, lineHeight: 1.7, fontSize: '1rem' }}>
            Every film is hand-crafted, faithful to the tradition, and gentle enough for the youngest souls. A new story every Sunday.
          </p>
        </div>
      </section>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2.5rem 1.25rem' }}>

        {/* ── Guest upgrade prompt ── */}
        {(!user || user.isGuest) && (
          <GuestBanner message="Sign in to save your watch progress, favorite episodes, and pick up right where you left off." />
        )}

        {/* ── Category filter tabs (driven by real YouTube playlists) ── */}
        {(() => {
          // Build tab list: All + channel playlists (those with ≥1 matching video) + Shorts
          const tabs: { key: string; label: string; icon: string }[] = [
            { key: 'all', label: 'All Stories', icon: '✦' },
            ...(watchLaterIds.size > 0 ? [{ key: 'watchLater', label: 'Watch Later', icon: '🕐' }] : []),
            ...playlists
              .filter(p => (catCounts[p.title] || 0) > 0)
              .map(p => ({ key: p.title, label: p.title, icon: playlistIcon(p.title) })),
            ...(catCounts['shorts'] > 0 ? [{ key: 'shorts', label: 'Shorts', icon: '⚡' }] : []),
          ];
          return (
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.375rem', marginBottom: '2rem', scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}>
              {tabs.map(({ key, label, icon }) => {
                const active = filter === key;
                const count  = catCounts[key] ?? 0;
                return (
                  <button
                    key={key}
                    onClick={() => { setFilter(key); setDisplayCount(DISPLAY_PAGE_SIZE); }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      padding: '0.45rem 1rem',
                      borderRadius: '9999px',
                      border: active ? '2px solid #1B2A4A' : '2px solid transparent',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      background: active ? '#1B2A4A' : 'white',
                      color: active ? 'white' : 'var(--text-secondary)',
                      boxShadow: active ? '0 2px 8px rgba(27,42,74,0.25)' : '0 1px 4px rgba(0,0,0,0.08)',
                      transition: 'all 0.18s',
                    }}
                  >
                    <span style={{ fontSize: '0.9em', opacity: active ? 1 : 0.75 }}>{icon}</span>
                    {label}
                    {!loading && count > 0 && (
                      <span style={{ background: active ? 'rgba(255,255,255,0.2)' : 'var(--cream-dark)', color: active ? 'white' : 'var(--text-muted)', borderRadius: '9999px', padding: '0.05rem 0.45rem', fontSize: '0.72rem', fontWeight: 800 }}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })()}

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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {[...Array(8)].map((_, i) => <ShortSkeleton key={i} />)}
          </div>
        )}

        {/* ── Empty ── */}
        {!loading && !error && filteredVideos.length === 0 && (
          <EmptyState
            title={filter === 'shorts' ? 'No shorts yet' : filter === 'all' ? 'No videos yet' : filter === 'watchLater' ? 'No Watch Later videos' : `No "${filter}" videos yet`}
            message={filter === 'watchLater' ? 'Tap the 🕐 button on any episode to save it here.' : "Check back soon — new stories from Tiggy's Kingdom are on the way!"}
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
                  isWatchLater={watchLaterIds.has(video.id)}
                  onProgress={handleProgress}
                  onToggleFavorite={handleToggleFavorite}
                  onToggleWatchLater={handleToggleWatchLater}
                />
              ))}
            </div>
            {hasMore && (
              <div style={{ textAlign: 'center' }}>
                <button onClick={handleLoadMore} className="btn-maroon">
                  Load More
                </button>
              </div>
            )}
          </>
        )}

        {/* ── Shorts grid (9:16 portrait) ── */}
        {!loading && filter === 'shorts' && shorts.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
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
