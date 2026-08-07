'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, memo } from 'react';
import { checkWatchlist, addToWatchlist, removeFromWatchlist } from '@/app/actions/user';
import { AuthModal } from '@/components/ui/AuthModal';

export interface Movie {
  id: string;
  tmdb_id: number;
  title: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  media_type?: 'movie' | 'tv';
  genres?: string[];
}

interface MovieCardProps {
  movie: Movie;
  index?: number;
  variant?: 'portrait' | 'landscape';
  top10Number?: number;
  gridMode?: boolean;
}

export const MovieCard = memo(function MovieCard({ movie, index = 0, variant = 'portrait', top10Number, gridMode }: MovieCardProps) {
  const isLandscape = variant === 'landscape';
  
  const [isHovered, setIsHovered] = useState(false);
  const [watchlistStatus, setWatchlistStatus] = useState<'loading' | 'in' | 'out' | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(window.matchMedia('(hover: none)').matches);
  }, []);

  useEffect(() => {
    if (isHovered && watchlistStatus === null) {
      setWatchlistStatus('loading');
      checkWatchlist(movie.id || movie.tmdb_id, movie.media_type || 'movie').then(res => {
        setWatchlistStatus(res.inWatchlist ? 'in' : 'out');
      });
    }
  }, [isHovered, watchlistStatus, movie]);

  const handleWatchlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (watchlistStatus === 'loading') return;
    
    const mediaType = movie.media_type || 'movie';
    const id = movie.id || movie.tmdb_id;
    
    setWatchlistStatus('loading');
    
    if (watchlistStatus === 'in') {
      const res = await removeFromWatchlist(id, mediaType);
      if (res.success) setWatchlistStatus('out');
      else if (res.error === 'You must be logged in.') setAuthOpen(true);
    } else {
      const res = await addToWatchlist(id, mediaType);
      if (res.success) setWatchlistStatus('in');
      else if (res.error === 'You must be logged in to add to your watchlist.') setAuthOpen(true);
    }
    
    if (!authOpen) {
      // If error didn't trigger auth, reset to previous state
      checkWatchlist(id, mediaType).then(res => {
        setWatchlistStatus(res.inWatchlist ? 'in' : 'out');
      });
    }
  };

  const imageUrl = isLandscape
    ? (movie.backdrop_path ? `https://image.tmdb.org/t/p/w500${movie.backdrop_path}` : '/placeholder-backdrop.jpg')
    : (movie.poster_path ? `https://image.tmdb.org/t/p/w342${movie.poster_path}` : '/placeholder-poster.jpg');

  const title = movie.title || movie.name || 'Untitled';
  const rawDate = movie.release_date || movie.first_air_date;
  const year = rawDate ? new Date(rawDate).getFullYear() : '';
  const type = movie.media_type === 'tv' ? 'Series' : 'Film';

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const cardWidth = gridMode 
    ? '100%' 
    : (top10Number 
        ? (isMobile ? '145px' : 'calc(10vw - 23px)') 
        : (isLandscape ? '300px' : '175px'));
  const cardHeight = gridMode 
    ? 'auto' 
    : (top10Number 
        ? (isMobile ? '217px' : 'auto') 
        : (isLandscape ? '169px' : '262px'));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.6), ease: [0.22, 1, 0.36, 1] }}
      style={{ flexShrink: 0, cursor: 'pointer', width: cardWidth, position: 'relative' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={movie.media_type === 'tv' ? `/tv/${movie.id}` : `/movie/${movie.id}`} style={{ textDecoration: 'none', display: 'block' }}>
        {/* Card image area */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: (gridMode || top10Number) ? 0 : cardHeight,
            paddingTop: (gridMode || top10Number) ? '150%' : 0,
            borderRadius: '14px',
            overflow: 'hidden',
            backgroundColor: '#171717',
            border: '1px solid rgba(255,255,255,0.05)',
            transition: 'transform 0.3s cubic-bezier(.22,1,.36,1), box-shadow 0.3s cubic-bezier(.22,1,.36,1), border-color 0.3s',
            transform: (isHovered && !isTouch) ? 'translateY(-6px)' : 'translateY(0)',
            boxShadow: (isHovered && !isTouch) ? '0 20px 50px rgba(0,0,0,0.5)' : '0 12px 40px rgba(0,0,0,0.35)',
            borderColor: (isHovered && !isTouch) ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.05)',
          }}
        >
          <Image src={imageUrl} alt={title} fill sizes={isLandscape ? '300px' : '155px'} style={{ objectFit: 'cover' }} />

          {/* Matte gradient overlay — always visible at bottom */}
          <div style={{
            position: 'absolute', inset: 0,
            background: isLandscape
              ? 'linear-gradient(to top, rgba(8,8,8,0.65) 0%, transparent 55%)'
              : 'linear-gradient(to top, rgba(8,8,8,0.45) 0%, transparent 50%)',
          }} />

          {/* TOP 10 badge — crimson */}
          {top10Number !== undefined && (
            <div style={{
              position: 'absolute', top: 0, left: 0,
              background: 'linear-gradient(135deg, #5D0F14, #7B1016)',
              color: '#ECE8DD',
              fontFamily: 'Inter, system-ui, sans-serif',
              fontWeight: 800,
              fontSize: '9px',
              letterSpacing: '0.08em',
              padding: '4px 8px',
              borderBottomRightRadius: '8px',
              zIndex: 10,
            }}>
              TOP {String(top10Number).padStart(2, '0')}
            </div>
          )}

          {/* Radial light — luxury studio effect */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(circle at top, rgba(255,255,255,0.04), transparent 60%)',
            pointerEvents: 'none',
          }} />
        </div>

        <style>{`
          @media (max-width: 600px) {
            .mc-title {
              font-size: 11px !important;
              margin-bottom: 2px !important;
            }
            .mc-meta {
              gap: 3px !important;
            }
            .mc-meta span {
              font-size: 9px !important;
            }
            .mc-meta-dot {
              font-size: 8px !important;
            }
          }
        `}</style>
        {/* Text below card */}
        <div style={{ marginTop: '8px', paddingLeft: '2px' }}>
          <h3 className="mc-title" style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontWeight: 600,
            fontSize: '13px',
            color: '#F2F2F0',
            margin: '0 0 5px 0',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            letterSpacing: '-0.005em',
          }}>
            {title}
          </h3>
          <div className="mc-meta" style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
            <span style={{ color: '#B1222E', fontWeight: 700, fontSize: '11px' }}>
              ★ {movie.vote_average ? movie.vote_average.toFixed(1) : '0.0'}
            </span>
            <span className="mc-meta-dot" style={{ color: '#4E4E4E', fontSize: '11px' }}>·</span>
            <span style={{ color: '#7E7E7E', fontSize: '11px' }}>{year}</span>
            <span className="mc-meta-dot" style={{ color: '#4E4E4E', fontSize: '11px' }}>·</span>
            <span style={{ color: '#7E7E7E', fontSize: '11px' }}>{type}</span>
            {(movie as any).runtime_watched !== undefined && (
              <>
                <span className="mc-meta-dot" style={{ color: '#4E4E4E', fontSize: '11px' }}>·</span>
                <span style={{ color: '#ff6b6b', fontWeight: 600, fontSize: '11px' }}>
                  {(() => {
                    const secs = Math.floor((movie as any).runtime_watched);
                    const h = Math.floor(secs / 3600);
                    const m = Math.floor((secs % 3600) / 60);
                    const s = secs % 60;
                    if (h > 0) return `${h}h ${m}m ${s}s watched`;
                    return `${m}m ${s}s watched`;
                  })()}
                </span>
              </>
            )}
          </div>
        </div>
      </Link>
      
      {/* Watchlist Button Overlay - OUTSIDE of Link for valid HTML */}
      <AnimatePresence>
        {(isHovered && !isTouch) && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            onClick={handleWatchlistClick}
            aria-label={watchlistStatus === 'in' ? 'Remove from Watchlist' : 'Add to Watchlist'}
            style={{
              position: 'absolute', top: '8px', right: '8px', zIndex: 20,
              width: '32px', height: '32px', borderRadius: '50%',
              background: watchlistStatus === 'in' ? 'rgba(123,16,22,0.85)' : 'rgba(255,255,255,0.12)',
              border: watchlistStatus === 'in' ? '1px solid rgba(123,16,22,0.5)' : '1px solid rgba(255,255,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: watchlistStatus === 'loading' ? 'wait' : 'pointer',
              color: '#F2F2F0', backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              transition: 'all 0.2s',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)'
            }}
            onMouseEnter={e => {
              if (watchlistStatus !== 'in' && watchlistStatus !== 'loading') {
                e.currentTarget.style.background = 'rgba(255,255,255,0.22)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
              }
            }}
            onMouseLeave={e => {
              if (watchlistStatus !== 'in' && watchlistStatus !== 'loading') {
                e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
              }
            }}
            title={watchlistStatus === 'in' ? 'Remove from Watchlist' : 'Add to Watchlist'}
          >
            {watchlistStatus === 'loading' ? (
              <div style={{ width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            ) : watchlistStatus === 'in' ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
              </svg>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Auth Modal for when clicked while logged out */}
      {authOpen && <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />}
    </motion.div>
  );
});
