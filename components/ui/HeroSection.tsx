'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Movie } from './MovieCard';

interface HeroSectionProps {
  movies: Movie[];
}

const INTERVAL_MS = 10000; // 10 seconds
const PRELOAD_AT_MS = 8000; // preload next image at 8s

function getBackdropUrl(movie: Movie) {
  if (movie.backdrop_path) return `https://image.tmdb.org/t/p/original${movie.backdrop_path}`;
  if (movie.poster_path)  return `https://image.tmdb.org/t/p/original${movie.poster_path}`;
  return '';
}

export function HeroSection({ movies }: HeroSectionProps) {
  // Guard: wait for real data
  if (!movies || movies.length === 0) return null;

  return <HeroSlideshow movies={movies} />;
}

// Separated to avoid hook order issues with early returns
function HeroSlideshow({ movies }: { movies: Movie[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [preloadIndex, setPreloadIndex] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const preloadRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const advance = useCallback((dir: 1 | -1 = 1) => {
    setDirection(dir);
    setActiveIndex(i => (i + dir + movies.length) % movies.length);
  }, [movies.length]);

  const goTo = useCallback((index: number) => {
    const next = ((index % movies.length) + movies.length) % movies.length;
    setDirection(next >= activeIndex ? 1 : -1);
    setActiveIndex(next);
    // Reset the interval on manual navigation
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => advance(1), INTERVAL_MS);
  }, [activeIndex, movies.length, advance]);

  // Setup auto-advance + preload timer
  useEffect(() => {
    if (movies.length <= 1) return;

    const startTimers = () => {
      // Preload next image at 8s
      preloadRef.current = setTimeout(() => {
        setPreloadIndex(i => ((i ?? activeIndex) + 1) % movies.length);
      }, PRELOAD_AT_MS);

      // Advance at 10s
      timerRef.current = setInterval(() => {
        advance(1);
        // Reset preload for next cycle
        if (preloadRef.current) clearTimeout(preloadRef.current);
        preloadRef.current = setTimeout(() => {
          setPreloadIndex(prev => ((prev ?? 0) + 1) % movies.length);
        }, PRELOAD_AT_MS);
      }, INTERVAL_MS);
    };

    startTimers();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (preloadRef.current) clearTimeout(preloadRef.current);
    };
  }, [movies.length]);  // eslint-disable-line

  const movie = movies[activeIndex];
  if (!movie) return null;

  const backdropUrl = getBackdropUrl(movie);
  const year = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : (movie as any).first_air_date
      ? new Date((movie as any).first_air_date).getFullYear()
      : '';
  const title = movie.title || (movie as any).name || '';
  const type = (movie as any).media_type === 'tv' ? 'Series' : 'Film';

  const bgVariants = {
    enter: { opacity: 0 },
    center: { opacity: 1, transition: { duration: 1.2, ease: 'easeInOut' as const } },
    exit:   { opacity: 0, transition: { duration: 0.7, ease: 'easeInOut' as const } },
  };

  const contentVariants = {
    enter:  (dir: number) => ({ opacity: 0, x: dir * 36 }),
    center: { opacity: 1, x: 0,  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as any } },
    exit:   (dir: number) => ({ opacity: 0, x: dir * -24, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as any } }),
  };

  return (
    <>
    <style>{`
      .hero-container {
        min-height: 100vh;
      }
      .hero-gradient-overlay {
        background: linear-gradient(to right, 
          rgba(8, 8, 8, 1) 0%,
          rgba(8, 8, 8, 0.95) 15%,
          rgba(8, 8, 8, 0.85) 30%,
          rgba(8, 8, 8, 0.6) 50%,
          rgba(8, 8, 8, 0.3) 70%,
          rgba(8, 8, 8, 0) 100%
        );
      }
      .hero-gradient-bottom {
        background: linear-gradient(to top, 
          rgba(8, 8, 8, 1) 0%, 
          rgba(8, 8, 8, 0.987) 8.1%, 
          rgba(8, 8, 8, 0.951) 15.5%, 
          rgba(8, 8, 8, 0.896) 22.5%, 
          rgba(8, 8, 8, 0.825) 29%, 
          rgba(8, 8, 8, 0.741) 35.3%, 
          rgba(8, 8, 8, 0.648) 41.2%, 
          rgba(8, 8, 8, 0.55) 47.1%, 
          rgba(8, 8, 8, 0.45) 52.9%, 
          rgba(8, 8, 8, 0.352) 58.8%, 
          rgba(8, 8, 8, 0.259) 64.7%, 
          rgba(8, 8, 8, 0.175) 71%, 
          rgba(8, 8, 8, 0.104) 77.5%, 
          rgba(8, 8, 8, 0.049) 84.5%, 
          rgba(8, 8, 8, 0.013) 91.9%, 
          rgba(8, 8, 8, 0) 100%
        );
        height: 280px;
        bottom: -1px;
      }
      .hero-content {
        padding: 0 80px;
        margin-top: 10vh;
        max-width: 650px;
      }
      .hero-title {
        font-size: 4.75rem !important;
      }
      .hero-overview {
        max-width: 400px;
        -webkit-line-clamp: 3;
      }
      .hero-buttons {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 12px;
      }
      
      @media (max-width: 768px) {
        .hero-container {
          min-height: 100vh !important;
          min-height: 100dvh !important;
          align-items: flex-end !important;
          padding-bottom: 70px !important;
        }
        .hero-gradient-overlay {
          background: linear-gradient(to bottom, rgba(8,8,8,0.1) 0%, rgba(8,8,8,0.5) 50%, rgba(8,8,8,0.8) 80%, #080808 98%) !important;
        }
        .hero-gradient-bottom {
          background: linear-gradient(to top, #080808 0%, rgba(8,8,8,0.85) 60%, transparent 100%) !important;
          height: 40vh !important;
        }
        .hero-content {
          padding: 0 20px !important;
          margin-top: 80px !important;
          max-width: 100% !important;
        }
        .hero-title {
          font-size: clamp(2rem, 8vw, 4.75rem) !important;
        }
        .hero-overview {
          max-width: 100% !important;
          -webkit-line-clamp: 2 !important;
          margin-bottom: 20px !important;
        }
      }
      
      @media (max-width: 480px) {
        .hero-buttons {
          flex-direction: column !important;
          width: 100%;
          gap: 8px !important;
        }
        .hero-buttons > * {
          width: 100%;
          justify-content: center;
        }
      }
    `}</style>
    <div className="hero-container" style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>

      {/* ── Hidden preload next image (to ensure smooth transition) ── */}
      {preloadIndex !== null && movies[preloadIndex] && (
        <div style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: -1 }}>
          <Image src={getBackdropUrl(movies[preloadIndex])} alt="" aria-hidden fill sizes="1px" quality={30} fetchPriority="low" />
        </div>
      )}

      {/* ── Background crossfade ── */}
      <AnimatePresence mode="sync">
        <motion.div
          key={`bg-${activeIndex}`}
          variants={bgVariants}
          initial="enter"
          animate="center"
          exit="exit"
          style={{ position: 'absolute', inset: 0, zIndex: 0 }}
        >
          {/* Use optimized next/image for better LCP */}
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            <Image
              src={backdropUrl}
              alt={title}
              fill
              priority
              quality={90}
              sizes="100vw"
              style={{
                objectFit: 'cover',
                objectPosition: 'center 30%',  // shifted down so faces show
                display: 'block',
              }}
            />
          </div>

          {/* Gradients */}
          <div className="hero-gradient-overlay" style={{ position: 'absolute', inset: 0 }} />
          <div className="hero-gradient-bottom" style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }} />
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '130px', background: 'linear-gradient(to bottom, rgba(8,8,8,0.28) 0%, transparent 100%)' }} />
          {/* Crimson glow hint */}
          <div style={{ position: 'absolute', left: 0, top: '15%', width: '480px', height: '480px', background: 'radial-gradient(circle, rgba(123,16,22,0.055) 0%, transparent 70%)', pointerEvents: 'none' }} />
        </motion.div>
      </AnimatePresence>

      {/* ── Content ── */}
      <div className="hero-content" style={{ position: 'relative', zIndex: 10, width: '100%' }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={`content-${activeIndex}`}
            custom={direction}
            variants={contentVariants}
            initial="enter"
            animate="center"
            exit="exit"
            style={{ width: '100%' }}
          >
            {/* Type badge */}
            <div style={{ marginBottom: '14px' }}>
              <span style={{
                display: 'inline-block', fontFamily: 'Inter, system-ui, sans-serif',
                fontWeight: 500, fontSize: '11px', letterSpacing: '0.14em',
                textTransform: 'uppercase', color: '#ECE8DD',
                background: 'rgba(123,16,22,0.20)', border: '1px solid rgba(123,16,22,0.35)',
                padding: '3px 10px', borderRadius: '4px',
              }}>{type}</span>
            </div>

            {/* Title */}
            <h1 className="hero-title" style={{
              fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 700,
              lineHeight: 1.02, letterSpacing: '-0.025em',
              textTransform: 'uppercase', color: '#F2F2F0',
              margin: '0 0 16px 0', textShadow: '0 25px 80px rgba(0,0,0,0.5)',
            }}>
              {title}
            </h1>

            {/* Metadata */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <span style={{ color: '#B1222E', fontWeight: 700, fontSize: '13px' }}>
                ★ {movie.vote_average ? movie.vote_average.toFixed(1) : '0.0'}
              </span>
              <span style={{ color: '#4E4E4E', fontSize: '13px' }}>·</span>
              <span style={{ color: '#B9B9B9', fontSize: '13px' }}>{year}</span>
              <span style={{ color: '#4E4E4E', fontSize: '13px' }}>·</span>
              <span style={{ color: '#7E7E7E', fontSize: '13px' }}>{type}</span>
            </div>

            {/* Divider */}
            <div style={{ width: '36px', height: '1px', background: 'linear-gradient(90deg, rgba(123,16,22,0.9), rgba(123,16,22,0.15))', marginBottom: '16px' }} />

            {/* Overview */}
            <p className="hero-overview" style={{
              fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 400,
              color: '#B9B9B9', fontSize: '14px', lineHeight: 1.7,
              marginBottom: '32px',
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {movie.overview}
            </p>

            {/* Buttons */}
            <div className="hero-buttons">
              <Link href={movie.media_type === 'tv' ? `/tv/${movie.id}?play=true` : `/movie/${movie.id}?play=true`} style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: 'linear-gradient(90deg, #ECE8DD, #F9F6EE)',
                color: '#080808', fontFamily: 'Inter, system-ui, sans-serif',
                fontWeight: 700, fontSize: '14px', letterSpacing: '0.02em',
                padding: '12px 28px', borderRadius: '999px', textDecoration: 'none',
                whiteSpace: 'nowrap', boxShadow: '0 6px 18px rgba(123,16,22,0.12)',
                border: '1px solid rgba(255,255,255,0.06)',
                transition: 'opacity 0.25s, transform 0.25s cubic-bezier(.22,1,.36,1)',
              }}
                onMouseEnter={e => { e.currentTarget.style.opacity='0.88'; e.currentTarget.style.transform='translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity='1'; e.currentTarget.style.transform='translateY(0)'; }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="#080808"><path d="M8 5v14l11-7z"/></svg>
                Play Now
              </Link>

              <Link href={movie.media_type === 'tv' ? `/tv/${movie.id}` : `/movie/${movie.id}`} style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: 'rgba(23,23,23,0.65)', color: '#B9B9B9',
                fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 500, fontSize: '14px',
                padding: '12px 28px', borderRadius: '999px', textDecoration: 'none',
                whiteSpace: 'nowrap', border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(8px)',
                transition: 'color 0.25s, border-color 0.25s, transform 0.25s cubic-bezier(.22,1,.36,1)',
              }}
                onMouseEnter={e => { e.currentTarget.style.color='#F2F2F0'; e.currentTarget.style.borderColor='rgba(255,255,255,0.15)'; e.currentTarget.style.transform='translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.color='#B9B9B9'; e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'; e.currentTarget.style.transform='translateY(0)'; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                Details
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
    </>
  );
}
