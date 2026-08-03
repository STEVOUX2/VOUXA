'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { MovieCard } from '@/components/ui/MovieCard';
import Image from 'next/image';
import { AuthModal } from '@/components/ui/AuthModal';
import { addToWatchlist, removeFromWatchlist, checkWatchlist, logHistory, createWatchParty } from '@/app/actions/user';
import { Sparkles, CheckCircle, AlertCircle } from 'lucide-react';

export function TvDetailClient({ idParam, currentUserId, initialServers = [], warningText }: { idParam: string, currentUserId?: string, initialServers?: any[], warningText?: string }) {
  const router = useRouter();
  const [tv, setTv] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [muted, setMuted] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Episodes specific state
  const [seasons, setSeasons] = useState<any[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [startSeconds, setStartSeconds] = useState(0);

  const [watchEpisode, setWatchEpisode] = useState<{s: number, e: number, name: string} | null>(null);
  const [selectedServerIndex, setSelectedServerIndex] = useState(0);
  const [serverDropdownOpen, setServerDropdownOpen] = useState(false);
  const [isVirtualFullscreen, setIsVirtualFullscreen] = useState(false);
  const [showExitBtn, setShowExitBtn] = useState(true);

  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams && searchParams.get('play') === 'true') {
      const s = parseInt(searchParams.get('s') || '1');
      const e = parseInt(searchParams.get('e') || '1');
      setWatchEpisode({ s, e, name: `Season ${s} Episode ${e}` });
    }
  }, [searchParams]);

  useEffect(() => {
    try {
      const CW_KEY = 'vouxa_continue_watching';
      const local = localStorage.getItem(CW_KEY);
      if (local && tv) {
        const list = JSON.parse(local);
        const tmdbIdInt = parseInt(tv.id);
        const found = list.find((i: any) => i.tmdbId === tmdbIdInt && i.mediaType === 'tv');
        if (found && found.runtime > 0) {
          setStartSeconds(found.runtime * 60);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [tv, idParam]);

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

  // Watchlist & Auth State
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    if (tv) {
      checkWatchlist(tv.id, 'tv').then((res) => {
        if (res.inWatchlist) setInWatchlist(true);
        setWatchlistLoading(false);
      });
    }
  }, [tv]);

  const handlePlay = (epNum: number, epName: string, runtime: number) => {
    setWatchEpisode({ s: selectedSeason, e: epNum, name: epName });
  };

  const [watchPartyLoading, setWatchPartyLoading] = useState(false);
  const handleWatchParty = async () => {
    if (!currentUserId) { setAuthOpen(true); return; }
    if (!tv) return;
    setWatchPartyLoading(true);
    // Find the first default server
    const serverUrl = initialServers.length > 0 
      ? (initialServers[0].url_template ? initialServers[0].url_template.replace('{id}', tv.id).replace('{s}', '1').replace('{e}', '1') : initialServers[0].embed_url)
      : `https://vidsrc.to/embed/tv/${tv.id}/1/1`;
    const res = await createWatchParty(tv.id, 'tv', tv.name, tv.poster_path || '', serverUrl);
    setWatchPartyLoading(false);
    if (res && 'roomCode' in res && res.roomCode) {
      window.open(`/watch-party/${res.roomCode}`, '_blank');
    } else if (res && 'error' in res) {
      showToast(res.error || 'An error occurred', 'error');
    }
  };

  const handleWatchlistToggle = async () => {
    if (watchlistLoading || !tv) return;
    setWatchlistLoading(true);
    
    if (inWatchlist) {
      const res = await removeFromWatchlist(tv.id, 'tv');
      if (res.success) setInWatchlist(false);
      else if (res.error === 'You must be logged in.') setAuthOpen(true);
    } else {
      const res = await addToWatchlist(tv.id, 'tv');
      if (res.success) setInWatchlist(true);
      else if (res.error === 'You must be logged in to add to your watchlist.') setAuthOpen(true);
    }
    setWatchlistLoading(false);
  };

  // Send postMessage to YouTube IFrame API
  const sendYtCmd = useCallback((cmd: string) => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func: cmd, args: [] }), '*'
    );
  }, []);

  const toggleMute = useCallback(() => {
    sendYtCmd(muted ? 'unMute' : 'mute');
    setMuted(m => !m);
  }, [muted, sendYtCmd]);

  const handleIframeLoad = useCallback(() => {
    setTimeout(() => {
      if (muted) sendYtCmd('mute');
      setShowTrailer(true);
    }, 1500);
  }, [muted, sendYtCmd]);

  // When episode player opens, pause background trailer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (watchEpisode && tv) {
      sendYtCmd('pauseVideo');
      document.body.style.overflow = 'hidden';

      const saveToLocal = (minutesWatched: number) => {
        try {
          const CW_KEY = 'vouxa_continue_watching';
          const local = localStorage.getItem(CW_KEY);
          const list = local ? JSON.parse(local) : [];
          const tmdbIdInt = parseInt(tv.id);
          
          const filtered = list.filter((i: any) => !(i.tmdbId === tmdbIdInt && i.mediaType === 'tv'));
          const prev = list.find((i: any) => i.tmdbId === tmdbIdInt && i.mediaType === 'tv');
          
          filtered.push({
            tmdbId: tmdbIdInt,
            mediaType: 'tv',
            title: tv.name,
            posterPath: tv.poster_path,
            runtime: (prev?.runtime || 0) + minutesWatched,
            duration: tv.episode_run_time?.[0] || 45,
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
        logHistory(tv.id, 'tv', 0, tv.name, tv.poster_path, tv.episode_run_time?.[0] || 45);
      });
      // Periodically update watch time (60 second intervals)
      interval = setInterval(() => {
        saveToLocal(1);
        import('@/app/actions/user').then(({ saveProgress }) => {
          saveProgress(tv.id, 'tv', 1);
        });
      }, 60000);
    } else {
      sendYtCmd('playVideo');
      document.body.style.overflow = 'auto';
    }
    return () => { 
      document.body.style.overflow = 'auto'; 
      if (interval) clearInterval(interval);
    };
  }, [watchEpisode, sendYtCmd, tv]);

  useEffect(() => {
    async function fetchTvDetails() {
      try {
        const KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
        if (!KEY) throw new Error('Missing TMDB key');

        const tmdbId = parseInt(idParam);
        
        // Fetch everything in one go using append_to_response
        const res = await fetch(`https://api.tmdb.org/3/tv/${tmdbId}?api_key=${KEY}&append_to_response=credits,images,videos,similar&language=en-US`);
        const data = await res.json();
        
        if (data.success === false) {
          throw new Error('Show not found');
        }

        setTv(data);
        
        // Find best trailer
        const allVideos = (data.videos?.results || []).filter((v: any) => v.site === 'YouTube');
        const pick = allVideos.find((v: any) => v.type === 'Trailer' && v.official) ||
                     allVideos.find((v: any) => v.type === 'Trailer') ||
                     allVideos[0];
        if (pick) setTrailerKey(pick.key);

        // Filter valid seasons (ignore specials season 0 if desired, but we'll include it or just default to 1)
        const validSeasons = (data.seasons || []).filter((s: any) => s.season_number > 0);
        setSeasons(validSeasons);
        
        if (validSeasons.length > 0) {
          setSelectedSeason(validSeasons[0].season_number);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchTvDetails();
  }, [idParam]);

  // Fetch episodes when selectedSeason changes
  useEffect(() => {
    if (!tv || !selectedSeason) return;
    
    async function fetchEpisodes() {
      setEpisodesLoading(true);
      try {
        const KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
        const res = await fetch(`https://api.tmdb.org/3/tv/${tv.id}/season/${selectedSeason}?api_key=${KEY}&language=en-US`);
        const data = await res.json();
        setEpisodes(data.episodes || []);
      } catch (e) {
        console.error('Error fetching episodes', e);
      } finally {
        setEpisodesLoading(false);
      }
    }
    fetchEpisodes();
  }, [tv, selectedSeason]);

  if (loading) {
    return <div style={{ background: '#080808', minHeight: '100vh' }} />;
  }
  if (error || !tv) {
    return <div style={{ background: '#080808', minHeight: '100vh', color: '#ECE8DD', padding: '100px' }}>Error: {error}</div>;
  }

  const backdropUrl = tv.backdrop_path ? `https://image.tmdb.org/t/p/original${tv.backdrop_path}` : null;
  const year = tv.first_air_date ? new Date(tv.first_air_date).getFullYear() : '';
  const genres = tv.genres?.map((g: any) => g.name) || [];
  
  // Find a logo (preferably english)
  const englishLogo = tv.images?.logos?.find((l: any) => l.iso_639_1 === 'en');
  const fallbackLogo = tv.images?.logos?.[0];
  const logo = englishLogo || fallbackLogo;
  const logoUrl = logo ? `https://image.tmdb.org/t/p/w500${logo.file_path}` : null;
  
  const cast = tv.credits?.cast?.slice(0, 10) || [];
  const similarShows = tv.similar?.results?.slice(0, 12) || [];

  const filteredEpisodes = episodes.filter(e => 
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.episode_number.toString().includes(searchQuery)
  );

  return (
    <>
    <style>{`
      @media (max-width: 1023px) {
        .detail-hero-content { bottom: 48px !important; left: 32px !important; right: 32px !important; }
        .detail-main-content { padding: 40px 32px 80px 32px !important; }
        .detail-cast { grid-template-columns: 1fr !important; }
        .player-header { padding: 16px 24px !important; }
      }
      @media (max-width: 767px) {
        .detail-hero-content { bottom: 24px !important; left: 16px !important; right: 16px !important; }
        .detail-hero-title { font-size: clamp(2rem, 8vw, 3rem) !important; margin-bottom: 12px !important; }
        .detail-main-content { padding: 32px 16px 64px 16px !important; }
        .detail-buttons { gap: 8px !important; }
        .detail-buttons button, .detail-buttons > div { min-height: 44px !important; }
        .detail-back-btn, .detail-mute-btn { top: 24px !important; }
        .detail-back-btn { left: 16px !important; }
        .detail-mute-btn { right: 16px !important; }
        .episode-item { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
        .episode-item > div:first-child { width: 100% !important; height: auto !important; aspect-ratio: 16/9; }
        .detail-recs { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)) !important; gap: 12px !important; }
        .player-header { padding: 16px !important; flex-direction: column !important; align-items: flex-start !important; gap: 16px !important; }
        .episode-controls { flex-wrap: wrap !important; }
        .episode-search { width: 100% !important; }
      }
    `}</style>
    <div style={{ background: '#080808', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* ── EPISODE PLAYER MODAL ── */}
      {watchEpisode && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#080808', display: 'flex', flexDirection: 'column' }}>
          {!isVirtualFullscreen && (
            <div className="player-header" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '24px 40px', background: 'linear-gradient(to bottom, rgba(8,8,8,0.9), transparent)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <button 
                  onClick={() => setWatchEpisode(null)}
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
                  <h2 style={{ margin: 0, color: '#F2F2F0', fontSize: '20px', fontWeight: 600 }}>{tv.name}</h2>
                  <div style={{ color: '#7E7E7E', fontSize: '13px', marginTop: '4px' }}>
                    Season {watchEpisode.s} Episode {watchEpisode.e} <span style={{ margin: '0 8px' }}>·</span> {watchEpisode.name}
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <div style={{ color: '#999', fontSize: '10px', maxWidth: '65vw', textAlign: 'center', lineHeight: '1.4' }}>
                  {warningText || "If video isn't playing or buffering, try switching to another server. Try waiting on a server if it's loading, some take a bit of time. Some servers may contain a few ads."}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' }}>
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

                  {/* Fullscreen Button */}
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
                onClick={() => setWatchEpisode(null)}
                style={{
                  width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)',
                  border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#F2F2F0', cursor: 'pointer', transition: 'background 0.2s', marginLeft: '16px'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          )}
          {/* Player */}
          <div style={{ flex: 1, backgroundColor: '#000', width: '100%', position: 'relative' }}>
            {/* Virtual Fullscreen Exit Button */}
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

            {/* Server loading pulse */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 0 }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid rgba(123,16,22,0.2)', borderTop: '2px solid #7B1016', animation: 'spin 1s linear infinite' }} />
            </div>
            <iframe
              key={`${selectedServerIndex}-${watchEpisode.s}-${watchEpisode.e}`}
              src={(() => {
                const server = initialServers[selectedServerIndex];
                if (!server) return '';
                let template = server.url_template.replace('cinesrc.com', 'cinesrc.st');
                if (server.media_type === 'general') {
                  template = template.replace('/movie/', '/tv/').replace('type=movie', 'type=tv').replace('movie?tmdb=', 'tv?tmdb=');
                  if (!template.includes('{s}') && !template.includes('{e}')) {
                    if (template.includes('?')) {
                      template += '&season={s}&episode={e}';
                    } else {
                      template += '/{s}/{e}';
                    }
                  }
                }
                const finalUrl = template
                  .replace('{id}', tv.id)
                  .replace('{s}', watchEpisode?.s?.toString() || '1')
                  .replace('{e}', watchEpisode?.e?.toString() || '1');
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

      {/* ── HERO SECTION ── */}
      <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', backgroundColor: '#080808' }}>
        
        {/* YouTube Trailer Background */}
        {trailerKey && (
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            overflow: 'hidden', zIndex: 0,
            opacity: showTrailer ? 1 : 0, transition: 'opacity 1s ease-in-out'
          }}>
            <iframe
              ref={iframeRef}
              onLoad={handleIframeLoad}
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailerKey}&playsinline=1&enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}`}
              style={{
                position: 'absolute', top: '50%', left: '50%',
                width: 'max(100vw, 177.8vh)', height: 'max(100vh, 56.25vw)',
                transform: 'translate(-50%, -50%) scale(1.35)', border: 'none', pointerEvents: 'none',
              }}
              allow="autoplay; encrypted-media"
            />
            {/* Transparent blocker */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 2, background: 'transparent' }} />
          </div>
        )}

        {/* Fallback backdrop */}
        {backdropUrl && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: trailerKey ? -1 : 0,
            backgroundImage: `url(${backdropUrl})`, backgroundSize: 'cover', backgroundPosition: 'center 25%',
          }} />
        )}

        {/* Overlays */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'linear-gradient(to right, rgba(8,8,8,0.95) 0%, rgba(8,8,8,0.4) 60%, rgba(8,8,8,0.1) 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '320px', zIndex: 1, background: 'linear-gradient(to top, #080808 0%, transparent 100%)' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '180px', zIndex: 1, background: 'linear-gradient(to bottom, rgba(8,8,8,0.75) 0%, transparent 100%)' }} />

        {/* Top UI */}
        <button
          className="detail-back-btn"
          onClick={() => router.back()}
          style={{
            position: 'absolute', top: '84px', left: '32px', zIndex: 200,
            width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(8,8,8,0.85)',
            border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#F2F2F0', transition: 'background 0.2s, border-color 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(30,30,30,0.95)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(8,8,8,0.85)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>

        {trailerKey && (
          <button
            className="detail-mute-btn"
            onClick={toggleMute}
            style={{
              position: 'absolute', top: '84px', right: '32px', zIndex: 200,
              width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(8,8,8,0.85)',
              border: `1px solid ${muted ? 'rgba(255,255,255,0.15)' : 'rgba(123,16,22,0.6)'}`,
              backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: muted ? '#7E7E7E' : '#ECE8DD',
              transition: 'all 0.2s',
            }}
          >
            {muted ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
            )}
          </button>
        )}

        {/* Hero Content (Logo and Actions) */}
        <div className="detail-hero-content" style={{ position: 'absolute', bottom: '64px', left: '64px', zIndex: 20 }}>
          
          {logoUrl ? (
            <div style={{ marginBottom: '24px', maxWidth: '400px' }}>
              <Image src={logoUrl} alt={tv.name} width={400} height={150} priority style={{ width: '100%', height: 'auto', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))' }} />
            </div>
          ) : (
            <h1 className="detail-hero-title" style={{ fontWeight: 800, fontSize: '4rem', color: '#F2F2F0', margin: '0 0 24px 0', textShadow: '0 4px 40px rgba(0,0,0,0.7)', maxWidth: '680px' }}>
              {tv.name}
            </h1>
          )}

          <div className="detail-buttons" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Play Button - defaults S1 E1 */}
            <button 
              onClick={() => {
                const ep1 = episodes.find(e => e.episode_number === 1);
                if (ep1) handlePlay(1, ep1.name, ep1.runtime || 45);
              }}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                background: '#F2F2F0', color: '#080808', fontWeight: 700, fontSize: '13px',
                height: '42px', padding: '0 28px', borderRadius: '999px', border: 'none', cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity='0.88'; e.currentTarget.style.transform='translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity='1'; e.currentTarget.style.transform='translateY(0)'; }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#080808"><path d="M8 5v14l11-7z"/></svg>
              <span>Play</span>
            </button>

            {/* Watch Party Button */}
            <button 
              onClick={handleWatchParty}
              disabled={watchPartyLoading}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                background: 'rgba(123, 16, 22, 0.15)', border: '1px solid rgba(123, 16, 22, 0.45)',
                color: '#ff6b6b', fontWeight: 600, fontSize: '13px',
                height: '42px', padding: '0 24px', borderRadius: '999px', cursor: watchPartyLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s', backdropFilter: 'blur(8px)',
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
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              )}
            </button>

            {/* Episode Tag */}
            <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', height: '42px', padding: '0 20px', borderRadius: '999px', fontSize: '13px', fontWeight: 600, color: '#ECE8DD', backdropFilter: 'blur(8px)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              {tv.number_of_episodes} Episodes
            </div>

            {/* Year Tag */}
            <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', height: '42px', padding: '0 20px', borderRadius: '999px', fontSize: '13px', fontWeight: 600, color: '#ECE8DD', backdropFilter: 'blur(8px)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              {year}
            </div>
          </div>
        </div>
      </div>

      <div className="detail-main-content" style={{ padding: '40px 64px 100px 64px' }}>
        
        {/* ── EPISODES SECTION ── */}
        <div style={{ marginBottom: '60px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ width: '4px', height: '24px', background: 'linear-gradient(180deg, #7B1016, #5D0F14)', borderRadius: '999px' }} />
            <h2 style={{ fontWeight: 800, fontSize: '20px', color: '#F2F2F0', margin: 0 }}>Episodes</h2>
          </div>

          <div className="episode-controls" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            {/* Custom Season Select Dropdown */}
            <div style={{ position: 'relative', minWidth: '160px' }}>
              <div 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  color: '#ECE8DD', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
                  cursor: 'pointer', outline: 'none', fontFamily: 'Inter, sans-serif', transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
              >
                <span>{seasons.find(s => s.season_number === selectedSeason)?.name || `Season ${selectedSeason}`}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>

              {dropdownOpen && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px', zIndex: 100,
                  background: '#121212', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px',
                  maxHeight: '260px', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                  display: 'flex', flexDirection: 'column', padding: '4px'
                }}>
                  {seasons.map((s) => (
                    <div 
                      key={s.id} 
                      onClick={() => { setSelectedSeason(s.season_number); setDropdownOpen(false); }}
                      style={{
                        padding: '10px 12px', fontSize: '13px', color: s.season_number === selectedSeason ? '#F2F2F0' : '#B9B9B9',
                        background: s.season_number === selectedSeason ? 'rgba(123,16,22,0.4)' : 'transparent',
                        borderRadius: '6px', cursor: 'pointer', transition: 'background 0.2s'
                      }}
                      onMouseEnter={e => { if (s.season_number !== selectedSeason) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                      onMouseLeave={e => { if (s.season_number !== selectedSeason) e.currentTarget.style.background = 'transparent' }}
                    >
                      {s.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Search Episodes */}
            <div className="episode-search" style={{ position: 'relative', width: '280px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7E7E7E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input 
                type="text" 
                placeholder="Search episode name or number..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  color: '#ECE8DD', padding: '10px 12px 10px 36px', borderRadius: '8px', fontSize: '13px',
                  outline: 'none', fontFamily: 'Inter, sans-serif'
                }}
              />
            </div>
          </div>

          {/* Episode List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {episodesLoading ? (
              <div style={{ color: '#7E7E7E', padding: '20px 0' }}>Loading episodes...</div>
            ) : filteredEpisodes.length === 0 ? (
              <div style={{ color: '#7E7E7E', padding: '20px 0' }}>No episodes found.</div>
            ) : (
              filteredEpisodes.map((ep) => (
                <div 
                  key={ep.id} 
                  className="episode-item"
                  onClick={() => handlePlay(ep.episode_number, ep.name, ep.runtime || tv?.episode_run_time?.[0] || 45)}
                  style={{
                  display: 'flex', alignItems: 'center', gap: '20px', padding: '16px',
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
                  borderRadius: '12px', transition: 'background 0.2s', cursor: 'pointer'
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                >
                  <div style={{ position: 'relative', width: '160px', height: '90px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: '#111' }}>
                    {ep.still_path ? (
                      <img src={`https://image.tmdb.org/t/p/w300${ep.still_path}`} alt={ep.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4E4E4E' }}>No Image</div>
                    )}
                    <div style={{ position: 'absolute', bottom: '6px', left: '6px', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, color: '#F2F2F0' }}>
                      {ep.episode_number}
                    </div>
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 600, color: '#F2F2F0' }}>{ep.name}</h3>
                    <div style={{ fontSize: '12px', color: '#7E7E7E', marginBottom: '8px' }}>{ep.runtime ? `${ep.runtime} min` : 'TBA'}</div>
                    <p style={{ margin: 0, fontSize: '12px', color: '#999', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {ep.overview || 'No description available.'}
                    </p>
                  </div>
                  
                  <div style={{ padding: '0 16px' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4E4E4E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── ACTORS SECTION ── */}
        {cast.length > 0 && (
          <div style={{ marginBottom: '60px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ width: '4px', height: '24px', background: 'linear-gradient(180deg, #7B1016, #5D0F14)', borderRadius: '999px' }} />
              <h2 style={{ fontWeight: 800, fontSize: '20px', color: '#F2F2F0', margin: 0 }}>Actors</h2>
            </div>
            
            <div className="detail-cast" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              {cast.map((actor: any) => (
                <div key={actor.id} style={{
                  display: 'flex', alignItems: 'center', gap: '16px', padding: '12px',
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
                  borderRadius: '12px', transition: 'background 0.2s'
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                >
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', background: '#111', flexShrink: 0 }}>
                    {actor.profile_path ? (
                      <img src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`} alt={actor.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4E4E4E' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      </div>
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#F2F2F0', marginBottom: '2px' }}>{actor.name}</div>
                    <div style={{ fontSize: '11px', color: '#7E7E7E' }}>{actor.character}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── YOU MAY LIKE ── */}
        {similarShows.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ width: '4px', height: '24px', background: 'linear-gradient(180deg, #7B1016, #5D0F14)', borderRadius: '999px' }} />
              <h2 style={{ fontWeight: 800, fontSize: '20px', color: '#F2F2F0', margin: 0 }}>You may like</h2>
            </div>
            
            <div className="detail-recs" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '24px' }}>
              {similarShows.map((show: any, idx: number) => (
                <MovieCard key={show.id} movie={{...show, media_type: 'tv'}} index={idx % 12} variant="portrait" />
              ))}
            </div>
          </div>
        )}

      </div>
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
