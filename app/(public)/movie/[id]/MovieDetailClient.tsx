'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { addToWatchlist, removeFromWatchlist, checkWatchlist, logHistory, toggleFavorite, checkFavorite, createWatchParty } from '@/app/actions/user';
import { AuthModal } from '@/components/ui/AuthModal';
import dynamic from 'next/dynamic';

const ReviewSection = dynamic(
  () => import('@/components/ui/ReviewSection').then(mod => mod.ReviewSection),
  { loading: () => <div style={{ padding: '40px', textAlign: 'center', color: '#7E7E7E' }}>Loading reviews...</div> }
);

import { Sparkles, CheckCircle, AlertCircle } from 'lucide-react';

export function MovieDetailClient({ initialMovie, initialSubtitles, initialServers = [], warningText, idParam, initialReviews = [], currentUserId }: { initialMovie: any, initialSubtitles: any[], initialServers?: any[], warningText?: string, idParam: string, initialReviews?: any[], currentUserId?: string }) {
  const router = useRouter();
  const [movie, setMovie] = useState(initialMovie);
  const [loading, setLoading] = useState(!initialMovie);
  const [error, setError] = useState<string | null>(null);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [similar, setSimilar] = useState<any[]>([]);
  const [muted, setMuted] = useState(true);
  const [watchMovie, setWatchMovie] = useState(false);
  const [selectedServerIndex, setSelectedServerIndex] = useState(0);
  const [isVirtualFullscreen, setIsVirtualFullscreen] = useState(false);
  const [showExitBtn, setShowExitBtn] = useState(true);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(true);
  const [watchPartyLoading, setWatchPartyLoading] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [serverDropdownOpen, setServerDropdownOpen] = useState(false);
  
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const searchParams = useSearchParams();
  const [startSeconds, setStartSeconds] = useState(0);

  useEffect(() => {
    if (searchParams && searchParams.get('play') === 'true') {
      setWatchMovie(true);
    }
  }, [searchParams]);

  useEffect(() => {
    try {
      const CW_KEY = 'vouxa_continue_watching';
      const local = localStorage.getItem(CW_KEY);
      if (local) {
        const list = JSON.parse(local);
        const tmdbIdInt = parseInt(movie?.tmdb_id || idParam);
        const found = list.find((i: any) => i.tmdbId === tmdbIdInt && i.mediaType === 'movie');
        if (found && found.runtime > 0) {
          setStartSeconds(found.runtime * 60);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [movie, idParam]);

  useEffect(() => {
    if (isVirtualFullscreen) {
      setShowExitBtn(true);
      const timer = setTimeout(() => setShowExitBtn(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [isVirtualFullscreen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsVirtualFullscreen(false);
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const enterFullscreen = () => {
    setIsVirtualFullscreen(true);
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().then(() => {
        const orientation: any = screen.orientation;
        if (orientation && orientation.lock) {
          orientation.lock('landscape').catch(() => {});
        }
      }).catch(() => {});
    }
  };

  const exitFullscreen = () => {
    setIsVirtualFullscreen(false);
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().then(() => {
        const orientation: any = screen.orientation;
        if (orientation && orientation.unlock) {
          orientation.unlock();
        }
      }).catch(() => {});
    }
  };

  const handlePlay = () => {
    setWatchMovie(true);
  };

  const handleWatchlistToggle = async () => {
    if (watchlistLoading) return;
    setWatchlistLoading(true);
    
    if (inWatchlist) {
      const res = await removeFromWatchlist(movie.id, 'movie');
      if (res.success) setInWatchlist(false);
      else if (res.error === 'You must be logged in.') setAuthOpen(true);
    } else {
      const res = await addToWatchlist(movie.id, 'movie');
      if (res.success) setInWatchlist(true);
      else if (res.error === 'You must be logged in to add to your watchlist.') setAuthOpen(true);
    }
    setWatchlistLoading(false);
  };

  const handleFavoriteToggle = async () => {
    if (!movie) return;
    const res = await toggleFavorite(movie.id, 'movie', movie.title, movie.poster_path || '');
    if ('error' in res && res.error === 'You must be logged in.') { setAuthOpen(true); return; }
    if ('action' in res) setIsFavorite(res.action === 'added');
  };

  const handleWatchParty = async () => {
    if (!movie || !currentUserId) { setAuthOpen(true); return; }
    setWatchPartyLoading(true);
    const serverUrl = initialServers?.[0]
      ? initialServers[0].url_template?.replace('{id}', movie.id) || initialServers[0].embed_url || ''
      : `https://vidsrc.to/embed/movie/${movie.id}`;
    const res = await createWatchParty(movie.id, 'movie', movie.title, movie.poster_path || '', serverUrl);
    setWatchPartyLoading(false);
    if ('roomCode' in res && res.roomCode) {
      window.open(`/watch-party/${res.roomCode}`, '_blank');
    } else if ('error' in res) {
      showToast(res.error || 'An error occurred', 'error');
    }
  };

  const sendYtCmd = useCallback((cmd: string) => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func: cmd, args: [] }), '*'
    );
  }, []);

  const toggleMute = useCallback(() => {
    sendYtCmd(muted ? 'unMute' : 'mute');
    setMuted(m => !m);
  }, [muted, sendYtCmd]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    const CW_KEY = 'vouxa_continue_watching';
    const tmdbIdInt = parseInt(movie?.tmdb_id || idParam);

    if (watchMovie && movie) {
      sendYtCmd('pauseVideo');
      document.body.style.overflow = 'hidden';

      let currentSeconds = 0;
      
      const saveToLocal = (secondsWatched: number) => {
        try {
          const raw = localStorage.getItem(CW_KEY);
          let list = raw ? JSON.parse(raw) : [];
          if (!Array.isArray(list)) list = [];
          
          const filtered = list.filter((i: any) => !(i.tmdbId === tmdbIdInt && i.mediaType === 'movie'));
          const prev = list.find((i: any) => i.tmdbId === tmdbIdInt && i.mediaType === 'movie');
          
          const newRuntime = (prev?.runtime || 0) + secondsWatched;
          currentSeconds = newRuntime;
          
          filtered.push({
            tmdbId: tmdbIdInt,
            mediaType: 'movie',
            title: movie.title,
            posterPath: movie.poster_path,
            runtime: newRuntime,
            duration: movie.runtime || 0,
            watchedAt: Date.now()
          });
          localStorage.setItem(CW_KEY, JSON.stringify(filtered));
        } catch (e) {
          console.error(e);
        }
      };

      // Initial tracking trigger
      saveToLocal(0);

      // Log to watch history when user starts watching
      import('@/app/actions/user').then(({ logHistory }) => {
        logHistory(movie.tmdb_id || movie.id, 'movie', 0, movie.title, movie.poster_path, movie.runtime || 0);
      });
      // Periodically update watch time (5 second intervals)
      interval = setInterval(() => {
        saveToLocal(5);
        import('@/app/actions/user').then(({ saveExactTime }) => {
          saveExactTime(movie.tmdb_id || movie.id, 'movie', currentSeconds);
        });
      }, 5000);
    } else {
      sendYtCmd('playVideo');
      document.body.style.overflow = 'auto';
    }
    return () => { 
      document.body.style.overflow = 'auto'; 
      if (interval) clearInterval(interval);
    };
  }, [watchMovie, sendYtCmd, movie]);

  // Check initial favorite status
  useEffect(() => {
    if (!movie?.id || !currentUserId) return;
    checkFavorite(movie.id, 'movie').then(res => { if ('isFavorite' in res) setIsFavorite(res.isFavorite); });
  }, [movie?.id, currentUserId]);

  const handleIframeLoad = useCallback(() => {
    setIframeLoaded(true);
    setTimeout(() => {
      if (muted) sendYtCmd('mute');
      setShowTrailer(true);
    }, 1500);
  }, [muted, sendYtCmd]);

  useEffect(() => {
    async function fetchAll() {
      try {
        const KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
        if (!KEY) throw new Error('Missing TMDB key');

        const tmdbId = parseInt(idParam);

        const [detailRes, videosRes, similarRes] = await Promise.all([
          fetch(`https://api.tmdb.org/3/movie/${tmdbId}?api_key=${KEY}&append_to_response=credits&language=en-US`),
          fetch(`https://api.tmdb.org/3/movie/${tmdbId}/videos?api_key=${KEY}&language=en-US`),
          fetch(`https://api.tmdb.org/3/movie/${tmdbId}/similar?api_key=${KEY}&language=en-US`),
        ]);

        const detail = await detailRes.json();
        const videos = await videosRes.json();
        const sim    = await similarRes.json();

        const allVideos = (videos.results || []).filter((v: any) => v.site === 'YouTube');

        const pick = (
          allVideos.find((v: any) => v.type === 'Trailer' && v.official) ||
          allVideos.find((v: any) => v.type === 'Trailer') ||
          allVideos.find((v: any) => v.type === 'Teaser' && v.official) ||
          allVideos[0]
        );

        if (pick) setTrailerKey(pick.key);
        setSimilar((sim.results || []).slice(0, 15));

        // Fetch AI recommendations from TMDB
        const recRes = await fetch(`https://api.tmdb.org/3/movie/${tmdbId}/recommendations?api_key=${KEY}&language=en-US`);
        const recData = await recRes.json();
        setRecommendations((recData.results || []).slice(0, 20).map((m: any) => ({ ...m, media_type: 'movie' })));

        if (!initialMovie) {
          setMovie({
            id: detail.id.toString(),
            tmdb_id: detail.id,
            title: detail.title,
            overview: detail.overview,
            tagline: detail.tagline,
            poster_path: detail.poster_path,
            backdrop_path: detail.backdrop_path,
            release_date: detail.release_date,
            runtime: detail.runtime,
            vote_average: detail.vote_average,
            genres: detail.genres?.map((g: any) => g.name) || [],
            cast: detail.credits?.cast?.slice(0, 15) || [],
          });
        } else {
          setMovie((prev: any) => ({
            ...prev,
            genres: detail.genres?.map((g: any) => g.name) || prev.genres || [],
            cast: detail.credits?.cast?.slice(0, 15) || prev.cast || [],
            runtime: detail.runtime || prev.runtime,
            tagline: detail.tagline || prev.tagline,
          }));
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [idParam, initialMovie]);

  if (loading) {
    return (
      <div style={{ background: '#080808', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid rgba(123,16,22,0.2)', borderTop: '2px solid #7B1016', animation: 'spin 0.9s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <span style={{ color: '#4E4E4E', fontFamily: 'Inter, sans-serif', fontSize: '13px', letterSpacing: '0.06em' }}>LOADING</span>
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div style={{ background: '#080808', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
        <p style={{ color: '#7E7E7E', fontFamily: 'Inter, sans-serif' }}>Movie not found.</p>
        <Link href="/" style={{ color: '#ECE8DD', fontFamily: 'Inter, sans-serif', fontSize: '14px', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 20px', borderRadius: '8px' }}>← Back Home</Link>
      </div>
    );
  }

  const cast    = movie.cast   ? (typeof movie.cast   === 'string' ? JSON.parse(movie.cast)   : movie.cast)   : [];
  const genres  = movie.genres ? (typeof movie.genres === 'string' ? JSON.parse(movie.genres) : movie.genres) : [];
  const year    = movie.release_date ? new Date(movie.release_date).getFullYear() : '';
  const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : '';
  const backdropUrl = movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : '';

  return (
    <>
    <style>{`
      @media (max-width: 1023px) {
        .detail-hero-content { padding: 0 32px 40px 32px !important; }
        .detail-section { padding: 48px 32px 0 !important; }
        .detail-reviews { padding: 0 32px 64px !important; }
        .detail-cast { grid-template-columns: repeat(2, 1fr) !important; }
        .player-header { padding: 16px 24px !important; }
      }
      @media (max-width: 767px) {
        .detail-hero-content { padding: 0 16px 32px 16px !important; }
        .detail-hero-title { font-size: clamp(2rem, 8vw, 3rem) !important; margin-bottom: 12px !important; }
        .detail-section { padding: 32px 16px 0 !important; }
        .detail-reviews { padding: 0 16px 48px !important; }
        .detail-cast { grid-template-columns: 1fr !important; }
        .detail-recs { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)) !important; gap: 12px !important; }
        .detail-buttons { gap: 8px !important; }
        .detail-buttons button { min-height: 44px !important; }
        .detail-back-btn, .detail-mute-btn { top: 24px !important; }
        .detail-back-btn { left: 16px !important; }
        .detail-mute-btn { right: 16px !important; }
        .player-header { padding: 12px 16px !important; flex-wrap: wrap !important; gap: 12px 0 !important; flex-direction: row !important; background: rgba(8,8,8,0.5) !important; backdrop-filter: blur(16px) !important; -webkit-backdrop-filter: blur(16px) !important; border-bottom: 1px solid rgba(255,255,255,0.05) !important; }
        .player-header-center { position: static !important; transform: none !important; width: 100% !important; margin-top: 4px !important; order: 3; }
        .player-header-left { flex: 1; min-width: 0; }
        .player-header > button { order: 2; margin-left: auto; }
      }
    `}</style>
    <div className="detail-layout" style={{ background: '#080808', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>

      <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>

        {trailerKey && (
          <div style={{ 
            position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden', background: '#000',
            opacity: showTrailer ? 1 : 0, transition: 'opacity 1s ease-in-out' 
          }}>
            <iframe
              ref={iframeRef}
              onLoad={handleIframeLoad}
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailerKey}&playsinline=1&enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}`}
              style={{
                position: 'absolute',
                top: '50%', left: '50%',
                width: 'max(100vw, 177.8vh)',
                height: 'max(100vh, 56.25vw)',
                transform: 'translate(-50%, -50%) scale(1.35)',
                border: 'none',
                pointerEvents: 'none',
              }}
              allow="autoplay; encrypted-media"
            />
            <div style={{
              position: 'absolute', inset: 0, zIndex: 2,
              background: 'transparent',
            }} />
          </div>
        )}

        {backdropUrl && (
          <div style={{
            position: 'absolute', inset: 0,
            zIndex: trailerKey ? -1 : 0,
            backgroundImage: `url(${backdropUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 25%',
          }} />
        )}

        <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'linear-gradient(to right, rgba(8,8,8,0.92) 0%, rgba(8,8,8,0.55) 50%, rgba(8,8,8,0.08) 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '320px', zIndex: 1, background: 'linear-gradient(to top, #080808 0%, transparent 100%)' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '180px', zIndex: 1, background: 'linear-gradient(to bottom, rgba(8,8,8,0.75) 0%, transparent 100%)' }} />

        <button
          className="detail-back-btn"
          onClick={() => router.back()}
          style={{
            position: 'absolute', top: '84px', left: '32px', zIndex: 200,
            width: '42px', height: '42px', borderRadius: '50%',
            background: 'rgba(8,8,8,0.85)',
            border: '1px solid rgba(255,255,255,0.15)',
            backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#F2F2F0',
            transition: 'background 0.2s, border-color 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(30,30,30,0.95)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(8,8,8,0.85)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        {trailerKey && (
          <button
            className="detail-mute-btn"
            onClick={toggleMute}
            style={{
              position: 'absolute', top: '84px', right: '32px', zIndex: 200,
              width: '42px', height: '42px', borderRadius: '50%',
              background: 'rgba(8,8,8,0.85)',
              border: `1px solid ${muted ? 'rgba(255,255,255,0.15)' : 'rgba(123,16,22,0.6)'}`,
              backdropFilter: 'blur(12px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              color: muted ? '#7E7E7E' : '#ECE8DD',
              transition: 'background 0.2s, border-color 0.2s, color 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(30,30,30,0.95)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(8,8,8,0.85)'; }}
            title={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
            )}
          </button>
        )}

        <div className="detail-hero-content" style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          zIndex: 20,
          padding: '0 64px 52px 64px',
        }}>
          <h1 className="detail-hero-title" style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontWeight: 800, fontSize: '4.5rem',
            lineHeight: 1.0, letterSpacing: '-0.03em',
            textTransform: 'uppercase', color: '#F2F2F0',
            margin: '0 0 18px 0',
            textShadow: '0 4px 40px rgba(0,0,0,0.7)',
            maxWidth: '680px',
          }}>
            {movie.title}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <span style={{ color: '#B1222E', fontWeight: 700, fontSize: '14px' }}>★ {movie.vote_average ? movie.vote_average.toFixed(1) : '0.0'}</span>
            {year && <><span style={{ color: '#4E4E4E' }}>·</span><span style={{ color: '#B9B9B9', fontSize: '14px' }}>{year}</span></>}
            {runtime && <><span style={{ color: '#4E4E4E' }}>·</span><span style={{ color: '#B9B9B9', fontSize: '14px' }}>{runtime}</span></>}
            {genres.slice(0, 3).map((g: string, i: number) => (
              <span key={g} style={{ color: '#B9B9B9', fontSize: '14px' }}>
                <span style={{ color: '#4E4E4E', marginRight: '10px' }}>·</span>{g}
              </span>
            ))}
          </div>

          <p style={{
            color: '#B9B9B9', fontSize: '14px', lineHeight: 1.65,
            maxWidth: '560px', marginBottom: '28px',
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {movie.overview}
          </p>

          <div className="detail-buttons" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Play Button */}
            <button 
              onClick={() => {
                if (!currentUserId) { setAuthOpen(true); return; }
                setWatchMovie(true);
              }} 
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                background: '#F2F2F0', color: '#080808', fontWeight: 700, fontSize: '13px',
                height: '42px', padding: '0 28px', borderRadius: '999px', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity='0.88'; e.currentTarget.style.transform='translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity='1'; e.currentTarget.style.transform='translateY(0)'; }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#080808"><path d="M8 5v14l11-7z"/></svg>
              <span>Play</span>
            </button>

            {/* Watchlist Toggle */}
            <button onClick={handleWatchlistToggle} style={{
              width: '42px', height: '42px', borderRadius: '50%', flexShrink: 0,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              background: inWatchlist ? '#7B1016' : 'rgba(255,255,255,0.06)', 
              border: inWatchlist ? '1px solid #7B1016' : '1px solid rgba(255,255,255,0.15)',
              cursor: watchlistLoading ? 'wait' : 'pointer', 
              color: '#F2F2F0', backdropFilter: 'blur(16px)',
              transition: 'all 0.2s',
              opacity: watchlistLoading ? 0.7 : 1,
            }}
              onMouseEnter={e => { 
                if(!inWatchlist && !watchlistLoading) {
                  e.currentTarget.style.background='rgba(255,255,255,0.15)'; 
                  e.currentTarget.style.borderColor='rgba(255,255,255,0.3)';
                }
              }}
              onMouseLeave={e => { 
                if(!inWatchlist && !watchlistLoading) {
                  e.currentTarget.style.background='rgba(255,255,255,0.06)'; 
                  e.currentTarget.style.borderColor='rgba(255,255,255,0.15)';
                }
              }}
              title={inWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
            >
              {inWatchlist ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              )}
            </button>

            {/* Favorite Heart Button */}
            <button onClick={handleFavoriteToggle} style={{
              width: '42px', height: '42px', borderRadius: '50%', flexShrink: 0,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              background: isFavorite ? 'rgba(255,107,107,0.15)' : 'rgba(255,255,255,0.06)',
              border: isFavorite ? '1px solid rgba(255,107,107,0.5)' : '1px solid rgba(255,255,255,0.15)',
              cursor: 'pointer', color: isFavorite ? '#ff6b6b' : '#7E7E7E',
              backdropFilter: 'blur(16px)', transition: 'all 0.25s',
            }}
              onMouseEnter={e => { if (!isFavorite) { e.currentTarget.style.background = 'rgba(255,107,107,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,107,107,0.3)'; e.currentTarget.style.color = '#ff6b6b'; } }}
              onMouseLeave={e => { if (!isFavorite) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#7E7E7E'; } }}
              title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>

            {/* Download Button */}
            <button style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              background: 'rgba(15,15,15,0.85)', border: '1px solid rgba(255,255,255,0.14)',
              color: '#B9B9B9', fontWeight: 500, fontSize: '13px',
              height: '42px', padding: '0 24px', borderRadius: '999px', cursor: 'pointer',
              backdropFilter: 'blur(8px)', whiteSpace: 'nowrap',
              transition: 'color 0.2s, border-color 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.color='#F2F2F0'; e.currentTarget.style.borderColor='rgba(255,255,255,0.25)'; }}
              onMouseLeave={e => { e.currentTarget.style.color='#B9B9B9'; e.currentTarget.style.borderColor='rgba(255,255,255,0.14)'; }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              <span>Download</span>
            </button>

            {/* Watch Party Button */}
            <button onClick={handleWatchParty} disabled={watchPartyLoading} style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              background: 'rgba(123, 16, 22, 0.15)', border: '1px solid rgba(123, 16, 22, 0.45)',
              color: '#ff6b6b', fontWeight: 600, fontSize: '13px',
              height: '42px', padding: '0 24px', borderRadius: '999px', cursor: watchPartyLoading ? 'not-allowed' : 'pointer',
              backdropFilter: 'blur(8px)', whiteSpace: 'nowrap',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => { if(!watchPartyLoading){ e.currentTarget.style.background='rgba(123, 16, 22, 0.35)'; e.currentTarget.style.transform='translateY(-1px)'; } }}
              onMouseLeave={e => { if(!watchPartyLoading){ e.currentTarget.style.background='rgba(123, 16, 22, 0.15)'; e.currentTarget.style.transform='translateY(0)'; } }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
                <line x1="7" y1="2" x2="7" y2="22"/>
                <line x1="17" y1="2" x2="17" y2="22"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <line x1="2" y1="7" x2="7" y2="7"/>
                <line x1="2" y1="17" x2="7" y2="17"/>
                <line x1="17" y1="17" x2="22" y2="17"/>
                <line x1="17" y1="7" x2="22" y2="7"/>
              </svg>
              <span>{watchPartyLoading ? 'Creating...' : 'Watch Party'}</span>
            </button>

            {/* Similars Button */}
            <button style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              background: 'rgba(15,15,15,0.85)', border: '1px solid rgba(255,255,255,0.14)',
              color: '#B9B9B9', fontWeight: 500, fontSize: '13px',
              height: '42px', padding: '0 24px', borderRadius: '999px', cursor: 'pointer',
              backdropFilter: 'blur(8px)', whiteSpace: 'nowrap',
              transition: 'color 0.2s, border-color 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.color='#F2F2F0'; e.currentTarget.style.borderColor='rgba(255,255,255,0.25)'; }}
              onMouseLeave={e => { e.currentTarget.style.color='#B9B9B9'; e.currentTarget.style.borderColor='rgba(255,255,255,0.14)'; }}
              onClick={() => document.getElementById('similar-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/>
                <path d="M13 6h3a2 2 0 0 1 2 2v7"/><line x1="6" y1="9" x2="6" y2="21"/>
              </svg>
              <span>Similars</span>
            </button>
          </div>
        </div>
      </div>

      {watchMovie && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, background: '#080808',
          display: 'flex', flexDirection: 'column'
        }}>
          {!isVirtualFullscreen && (
            <div className="player-header" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '24px 40px', background: 'linear-gradient(to bottom, rgba(8,8,8,0.9), transparent)',
              position: 'relative', zIndex: 10
            }}>
              <div className="player-header-left" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <button 
                  onClick={() => setWatchMovie(false)}
                  style={{
                    width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)',
                    border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#F2F2F0', cursor: 'pointer', transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <div>
                  <h2 style={{ margin: 0, color: '#F2F2F0', fontSize: '20px', fontWeight: 700 }}>{movie.title}</h2>
                </div>
              </div>
              
              <div className="player-header-center" style={{ 
                position: 'absolute', left: '50%', transform: 'translateX(-50%)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                width: '60%', pointerEvents: 'none'
              }}>
                <div style={{ color: '#999', fontSize: '10px', textAlign: 'center', lineHeight: '1.4', pointerEvents: 'auto' }}>
                  {warningText || "If video isn't playing or buffering, try switching to another server. Try waiting on a server if it's loading, some take a bit of time. Some servers may contain a few ads."}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center', pointerEvents: 'auto' }}>
                  <style>{`
                    .servers-desktop { display: flex !important; align-items: center; justify-content: center; margin: 0 auto; gap: 8px; background: rgba(255,255,255,0.03); padding: 6px 12px; borderRadius: 12px; border: 1px solid rgba(255,255,255,0.05); overflow-x: auto; max-width: 60vw; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
                    .servers-desktop::-webkit-scrollbar { display: none; }
                    .servers-mobile { display: none !important; }
                    @media (max-width: 768px) {
                      .servers-desktop { display: none !important; }
                      .servers-mobile { display: block !important; }
                    }
                  `}</style>
                  
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'center', position: 'relative' }}>
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={() => setServerDropdownOpen(!serverDropdownOpen)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: '#F2F2F0',
                          padding: '10px 20px',
                          borderRadius: '999px',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          backdropFilter: 'blur(10px)',
                          transition: 'all 0.2s',
                          boxShadow: serverDropdownOpen ? '0 0 0 2px rgba(123,16,22,0.4)' : 'none',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                      >
                        <span style={{ color: '#7E7E7E' }}>Server:</span>
                        <span>{initialServers[selectedServerIndex]?.name || "Select Server"}</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: serverDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </button>
                      
                      {serverDropdownOpen && (
                        <div style={{
                          position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '12px', zIndex: 1000,
                          background: 'rgba(15,15,15,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
                          boxShadow: '0 10px 40px rgba(0,0,0,0.8)', minWidth: '180px', display: 'flex', flexDirection: 'column',
                          padding: '6px', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                          animation: 'dropdownFade 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}>
                          <style>{`@keyframes dropdownFade { from { opacity: 0; transform: translate(-50%, -10px) scale(0.95); } to { opacity: 1; transform: translate(-50%, 0) scale(1); } }`}</style>
                          {initialServers.map((server: any, idx: number) => (
                            <button
                              key={server.name}
                              onClick={() => { setSelectedServerIndex(idx); setServerDropdownOpen(false); }}
                              style={{
                                background: selectedServerIndex === idx ? 'linear-gradient(135deg, rgba(123,16,22,0.15), rgba(93,15,20,0.15))' : 'transparent',
                                border: selectedServerIndex === idx ? '1px solid rgba(123,16,22,0.3)' : '1px solid transparent',
                                color: selectedServerIndex === idx ? '#ff6b6b' : '#B9B9B9',
                                padding: '10px 16px',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.2s',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                              }}
                              onMouseEnter={e => { if (selectedServerIndex !== idx) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#F2F2F0'; } }}
                              onMouseLeave={e => { if (selectedServerIndex !== idx) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#B9B9B9'; } }}
                            >
                              <span>{server.name}</span>
                              {selectedServerIndex === idx && <CheckCircle size={14} />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={enterFullscreen}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff', width: '38px', height: '38px', borderRadius: '8px', cursor: 'pointer',
                      transition: 'all 0.2s', flexShrink: 0
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    title="Virtual Fullscreen"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
                  </button>
                </div>
              </div>
              
              <button 
                onClick={() => setWatchMovie(false)}
                style={{
                  width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)',
                  border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#F2F2F0', cursor: 'pointer', transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          )}
          <div style={{ flex: 1, backgroundColor: '#000', width: '100%', position: 'relative' }}>
            {isVirtualFullscreen && (
              <div
                style={{
                  position: 'absolute', top: 0, right: 0, padding: '24px', zIndex: 100,
                  width: '200px', height: '150px', display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start'
                }}
                onMouseEnter={() => setShowExitBtn(true)}
                onMouseLeave={() => setShowExitBtn(false)}
              >
                <button
                  onClick={exitFullscreen}
                  style={{
                    background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600,
                    backdropFilter: 'blur(10px)',
                    opacity: showExitBtn ? 1 : 0,
                    pointerEvents: showExitBtn ? 'auto' : 'none',
                    transition: 'opacity 0.4s, background 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.8)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.5)'}
                >
                  Exit Fullscreen
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
                </button>
              </div>
            )}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 0 }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid rgba(123,16,22,0.2)', borderTop: '2px solid #7B1016', animation: 'spin 1s linear infinite' }} />
            </div>
            <iframe
              key={selectedServerIndex}
              src={(() => {
                const template = initialServers[selectedServerIndex]?.url_template || '';
                let finalUrl = template.replace('{id}', movie.tmdb_id || movie.id);
                finalUrl = finalUrl.replace('cinesrc.com', 'cinesrc.st');
                if (!finalUrl) return '';
                return startSeconds > 0 
                  ? `${finalUrl}${finalUrl.includes('?') ? '&' : '?'}t=${startSeconds}&start=${startSeconds}` 
                  : finalUrl;
              })()}
              width="100%" height="100%"
              frameBorder="0"
              allowFullScreen={true}
              allow="autoplay; fullscreen"
              style={{ border: 'none', position: 'relative', zIndex: 1 }}
            />
          </div>
        </div>
      )}

      {cast.length > 0 && (
        <section className="detail-section" style={{ padding: '56px 64px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ width: '3px', height: '20px', background: 'linear-gradient(180deg,#7B1016,#5D0F14)', borderRadius: '999px' }} />
            <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '18px', color: '#F2F2F0', margin: 0 }}>Actors</h2>
          </div>
          <div className="detail-cast" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {cast.map((member: any) => (
              <div key={member.id} style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                background: '#111111', border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '12px', padding: '12px 16px',
                transition: 'background 0.25s, border-color 0.25s', cursor: 'default',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background='#161616'; (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.09)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background='#111111'; (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.05)'; }}
              >
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0, overflow: 'hidden', background: '#1C1C1C', border: '1px solid rgba(255,255,255,0.07)' }}>
                  {member.profile_path ? (
                    <Image src={`https://image.tmdb.org/t/p/w185${member.profile_path}`} alt={member.name} width={185} height={185} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                      </svg>
                    </div>
                  )}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: '#F2F2F0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.name}</div>
                  <div style={{ fontWeight: 400, fontSize: '12px', color: '#7B1016', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.character}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}


      {/* ════════ AI RECOMMENDATIONS ════════ */}
      {recommendations.length > 0 && (
        <section className="detail-section" style={{ padding: '56px 64px 48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ width: '3px', height: '20px', background: 'linear-gradient(180deg,#7B1016,#5D0F14)', borderRadius: '999px' }} />
            <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '18px', color: '#F2F2F0', margin: 0 }}>You May Like</h2>
          </div>
          <div className="detail-recs" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
            {recommendations.map((m: any) => {
              const img = m.poster_path ? `https://image.tmdb.org/t/p/w342${m.poster_path}` : '';
              return (
                <a key={m.id} href={`/movie/${m.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                  <div style={{ borderRadius: '10px', overflow: 'hidden', background: '#171717', border: '1px solid rgba(255,255,255,0.05)', transition: 'transform 0.2s, box-shadow 0.2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.5)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
                  >
                    {img ? <Image src={img} alt={m.title} width={342} height={513} style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', display: 'block' }} /> : <div style={{ width: '100%', aspectRatio: '2/3', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4E4E4E' }}>🎬</div>}
                    <div style={{ padding: '10px 12px' }}>
                      <p style={{ color: '#F2F2F0', fontSize: '13px', fontWeight: 600, margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</p>
                      <p style={{ color: '#ff6b6b', fontSize: '11px', margin: 0 }}>★ {m.vote_average?.toFixed(1)}</p>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      )}

      {/* ════════ REVIEWS ════════ */}
      <section className="detail-reviews" style={{ padding: '0 64px 80px' }}>
        <ReviewSection
          itemId={Number(movie?.tmdb_id) || Number(movie?.id) || parseInt(idParam)}
          mediaType="movie"
          initialReviews={initialReviews}
          currentUserId={currentUserId}
        />
      </section>

      {/* Modals */}
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />

      {toast && (
        <div style={{
          position: 'fixed', bottom: '32px', right: '32px', zIndex: 1000,
          background: toast.type === 'error' ? 'rgba(123,16,22,0.92)' : 'rgba(15,15,15,0.92)',
          border: toast.type === 'error' ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.08)',
          color: '#F2F2F0', padding: '14px 24px', borderRadius: '12px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)',
          fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: '10px',
          animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {toast.type === 'error' ? <AlertCircle size={16} style={{ color: '#ff6b6b' }} /> : <CheckCircle size={16} style={{ color: '#22c55e' }} />}
          {toast.message}
        </div>
      )}
    </div>
    </>
  );
}
