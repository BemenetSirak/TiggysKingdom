/// <reference types="vite/client" />
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePageMeta } from '../hooks/usePageMeta';

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

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || '';
const CHANNEL_ID = 'UCY6m20ZtWVjAtbGqcqTYQng';
const INITIAL_RESULTS = 6;
const LOAD_MORE_COUNT = 6;
const AGE_FILTERS = ['All Ages', 'Ages 3-5', 'Ages 6-9', 'Ages 9-12'];

interface Video {
  id: string;
  title: string;
  description?: string;
}

// ── YouTube IFrame API singleton ──────────────────────────────────────────────
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

function formatTime(secs: number) {
  if (!secs || secs <= 0) return '';
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
}

// ── Embedded YT player ────────────────────────────────────────────────────────
function VideoEmbed({ videoId, startSeconds, onProgress }: { videoId: string; startSeconds: number; onProgress: (t: number, d: number) => void }) {
  const playerRef = useRef<YTPlayer | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const divId = `yt-${videoId}`;

  useEffect(() => {
    let isMounted = true;
    getYTApi().then(YT => {
      if (!isMounted) return;
      playerRef.current = new YT.Player(divId, {
        videoId,
        playerVars: { start: Math.floor(startSeconds || 0), rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.PLAYING) {
              clearInterval(intervalRef.current);
              intervalRef.current = setInterval(() => {
                const t = Math.floor(playerRef.current?.getCurrentTime() || 0);
                const dur = Math.floor(playerRef.current?.getDuration() || 0);
                if (t > 0) onProgress(t, dur);
              }, 5000);
            } else {
              clearInterval(intervalRef.current);
              const t = Math.floor(playerRef.current?.getCurrentTime() || 0);
              const dur = Math.floor(playerRef.current?.getDuration() || 0);
              if (t > 0) onProgress(t, dur);
            }
          },
        },
      });
    });
    return () => {
      isMounted = false;
      clearInterval(intervalRef.current);
      try { playerRef.current?.destroy(); } catch { /* ignore */ }
      playerRef.current = null;
    };
  }, [videoId]); // eslint-disable-line

  return (
    <div style={{ position: 'relative', paddingTop: '56.25%' }}>
      <div id={divId} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
    </div>
  );
}

// ── Tiggy's Kingdom branded thumbnail ────────────────────────────────────────
function TiggyThumbnail() {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(160deg, #6B2020 0%, #3B0A0A 60%, #1A0505 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: '0.4rem', padding: '1rem',
    }}>
      {/* Channel logo */}
      <div style={{ width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(201,146,42,0.7)', boxShadow: '0 0 12px rgba(201,146,42,0.3)' }}>
        <img src="/tiggy.png" alt="Tiggy's Kingdom" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#FEF3C7', fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '0.82rem', margin: 0, lineHeight: 1.2 }}>
          Tiggy's Kingdom
        </p>
        <p style={{ color: 'rgba(201,146,42,0.9)', fontSize: '0.6rem', fontWeight: 700, margin: '0.2rem 0 0', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Orthodox Faith for Kids
        </p>
      </div>
      <span style={{ background: 'var(--gold)', color: 'white', borderRadius: '0.3rem', padding: '0.1rem 0.5rem', fontSize: '0.6rem', fontWeight: 900, letterSpacing: '0.04em' }}>
        ★ OFFICIAL CHANNEL
      </span>
    </div>
  );
}

// ── Episode card ──────────────────────────────────────────────────────────────
function EpisodeCard({ video, index, savedProgress, isResuming, onProgress }: {
  video: Video;
  index: number;
  savedProgress?: { timestamp: number; duration: number } | null;
  isResuming: boolean;
  onProgress: (video: Video, index: number, t: number, d: number) => void;
}) {
  const [playing, setPlaying] = useState(isResuming);
  const cardRef = useRef<HTMLDivElement>(null);
  const colors = ['#3B82F6', '#F97316', '#7C3AED', '#22C55E', '#EF4444', '#C9922A'];
  const color = colors[index % colors.length];

  // Detect the channel logo/intro video by title
  const isTiggyBranded = video.title.toLowerCase().includes("tiggy's kingdom") &&
    !video.title.toLowerCase().includes('episode') &&
    !video.title.toLowerCase().includes('ep.');

  useEffect(() => {
    if (isResuming && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isResuming]);

  const ts = savedProgress?.timestamp || 0;
  const dur = savedProgress?.duration || 0;
  const progressPct = ts > 0 && dur > 0 ? Math.min(98, (ts / dur) * 100) : 0;

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
        <VideoEmbed
          videoId={video.id}
          startSeconds={ts}
          onProgress={(t, d) => onProgress(video, index, t, d)}
        />
      ) : (
        <div
          onClick={() => setPlaying(true)}
          style={{ position: 'relative', paddingTop: '56.25%', background: `${color}22`, overflow: 'hidden', cursor: 'pointer', borderRadius: '1.5rem 1.5rem 0 0' }}
        >
          {/* Branded or regular thumbnail */}
          {isTiggyBranded ? (
            <TiggyThumbnail />
          ) : (
            <img
              src={`https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`}
              alt={video.title}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { e.currentTarget.style.display = 'none'; }}
            />
          )}

          {/* Play button */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(0,0,0,0.58)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontSize: '1.4rem', marginLeft: '5px' }}>▶</span>
            </div>
          </div>

          {/* Episode badge */}
          <span style={{ position: 'absolute', top: 8, left: 8, background: 'var(--maroon)', color: 'white', borderRadius: '0.4rem', padding: '0.15rem 0.5rem', fontSize: '0.7rem', fontWeight: 900, pointerEvents: 'none' }}>
            Ep. {index + 1}
          </span>

          {/* Progress bar */}
          {ts > 0 && (
            <>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: 'rgba(255,255,255,0.25)' }}>
                {progressPct > 0 && <div style={{ height: '100%', background: 'var(--gold)', width: `${progressPct}%` }} />}
              </div>
              <span style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.7)', color: 'white', borderRadius: '0.3rem', padding: '0.1rem 0.4rem', fontSize: '0.68rem', fontWeight: 700 }}>
                {formatTime(ts)} watched
              </span>
            </>
          )}
        </div>
      )}

      {/* Info */}
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
          <button
            onClick={() => setPlaying(true)}
            style={{
              display: 'block', width: '100%', textAlign: 'center',
              background: ts > 0 ? 'var(--gold)' : 'var(--maroon)',
              color: 'white', borderRadius: '0.75rem', padding: '0.5rem',
              fontWeight: 800, fontSize: '0.875rem', border: 'none', cursor: 'pointer', marginTop: '0.25rem',
            }}
          >
            {ts > 0 ? `▶ Resume at ${formatTime(ts)}` : '▶ Watch Episode'}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Skeleton card ─────────────────────────────────────────────────────────────
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

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Lessons() {
  usePageMeta('Episodes', 'Watch animated Orthodox faith adventures with Tiggy the Lamb — new episodes every week for ages 4-12.');

  const [videos, setVideos] = useState<Video[]>([]);
  const [maxResults, setMaxResults] = useState(INITIAL_RESULTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ageFilter, setAgeFilter] = useState('All Ages');

  const { user, saveVideoProgress, getVideoProgress } = useAuth();
  const location = useLocation();
  const resumeVideoId = location.state?.resumeVideoId;

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(
      `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=${maxResults}`
    )
      .then(r => r.json())
      .then(async data => {
        if (data.error) { setError(data.error.message); return; }
        const items = (data.items || []).filter(item => item.id.kind === 'youtube#video');
        if (items.length === 0) { setVideos([]); return; }

        // Batch-fetch full descriptions — search.list only returns ~100 chars
        const ids = items.map(i => i.id.videoId).join(',');
        let descMap = {};
        try {
          const vRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?key=${API_KEY}&id=${ids}&part=snippet`);
          const vData = await vRes.json();
          (vData.items || []).forEach(v => { descMap[v.id] = v.snippet.description || ''; });
        } catch { /* fall back to search snippet on network error */ }

        setVideos(items.map(item => ({
          id: item.id.videoId,
          title: item.snippet.title,
          description: (descMap[item.id.videoId] || item.snippet.description || '').split('\n')[0].slice(0, 180).trim(),
        })));
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [maxResults]);

  const handleProgress = (video, index, timestamp, duration) => {
    if (!user?.id) return;
    saveVideoProgress(user.id, { videoId: video.id, title: video.title, episodeNum: index + 1, timestamp, duration });
  };

  return (
    <div>
      <section style={{ background: 'linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)', padding: '3.5rem 1.25rem', textAlign: 'center' }}>
        <p style={{ fontFamily: 'Playfair Display, serif', fontStyle: 'italic', color: 'rgba(255,255,255,0.85)', margin: '0 0 0.25rem', fontSize: '1.05rem' }}>
          ▶ Watch &amp; Learn
        </p>
        <h1 style={{ color: 'white', margin: '0 0 0.5rem', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}>
          Animated Adventures
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600, margin: 0 }}>
          New episodes every week — faith comes alive for ages 4-12
        </p>
      </section>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          {AGE_FILTERS.map(f => (
            <button key={f} onClick={() => setAgeFilter(f)} style={{ padding: '0.45rem 1.1rem', borderRadius: '9999px', border: 'none', fontWeight: 800, fontSize: '0.875rem', cursor: 'pointer', background: ageFilter === f ? 'var(--maroon)' : 'white', color: ageFilter === f ? 'white' : 'var(--text-secondary)', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', transition: 'all 0.2s' }}>
              {f}
            </button>
          ))}
        </div>

        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            {[...Array(INITIAL_RESULTS)].map((_, i) => <EpisodeSkeleton key={i} />)}
          </div>
        )}

        {error && !loading && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem', color: '#DC2626', fontWeight: 600, fontSize: '0.9rem', textAlign: 'center' }}>
            <p style={{ margin: '0 0 0.5rem' }}>Could not load videos from YouTube. Check your API key or connection.</p>
            <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>{error}</p>
          </div>
        )}

        {!loading && videos.length > 0 && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
              {videos.map((video, i) => (
                <EpisodeCard
                  key={video.id}
                  video={video}
                  index={i}
                  isResuming={video.id === resumeVideoId}
                  savedProgress={user ? getVideoProgress(user.id, video.id) : null}
                  onProgress={handleProgress}
                />
              ))}
            </div>
            <div style={{ textAlign: 'center' }}>
              <button onClick={() => setMaxResults(prev => prev + LOAD_MORE_COUNT)} className="btn-maroon">
                Load More Episodes
              </button>
            </div>
          </>
        )}

        {!loading && !error && videos.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📺</div>
            <p style={{ fontWeight: 700 }}>No episodes found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
