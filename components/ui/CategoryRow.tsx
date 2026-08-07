'use client';

import { useRef, useState, useEffect } from 'react';
import { MovieCard, Movie } from './MovieCard';

interface CategoryRowProps {
  title: string;
  movies: Movie[];
  variant?: 'portrait' | 'landscape';
  showTop10?: boolean;
  showToggles?: boolean;
}

export function CategoryRow({ title, movies, variant = 'portrait', showTop10 = false, showToggles = false }: CategoryRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'movies' | 'series'>('all');
  const [hovered, setHovered] = useState(false);

  const filteredMovies = movies.filter(m => {
    if (activeTab === 'all') return true;
    if (activeTab === 'movies') return m.media_type !== 'tv';
    return m.media_type === 'tv';
  });

  const handleScroll = () => {
    if (!rowRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
    setShowLeft(scrollLeft > 0);
    setShowRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, [filteredMovies]);

  const scroll = (dir: 'left' | 'right') => {
    if (!rowRef.current) return;
    rowRef.current.scrollBy({ left: dir === 'left' ? -rowRef.current.clientWidth * 0.75 : rowRef.current.clientWidth * 0.75, behavior: 'smooth' });
  };

  if (!movies || movies.length === 0) return null;

  return (
    <>
    <style>{`
      .cat-row-container {
        padding-left: 48px !important;
        padding-right: 48px !important;
      }
      .cat-title {
        font-size: 17px !important;
      }
      .cat-scroll-container {
        scrollbar-width: none;
        -webkit-overflow-scrolling: touch;
        scroll-snap-type: x mandatory;
        scroll-padding-inline-start: 48px;
      }
      .cat-scroll-container > * {
        scroll-snap-align: start;
      }
      .cat-scroll-container::-webkit-scrollbar {
        display: none;
      }
      @media (max-width: 1024px) {
        .cat-row-container {
          padding-left: 24px !important;
          padding-right: 24px !important;
        }
        .cat-scroll-container {
          scroll-padding-inline-start: 24px;
        }
      }
      @media (max-width: 768px) {
        .cat-row-container {
          padding-left: 16px !important;
          padding-right: 16px !important;
        }
        .cat-scroll-container {
          scroll-padding-inline-start: 16px;
        }
        .cat-title {
          font-size: 15px !important;
        }
      }
      @media (max-width: 767px) {
        .cat-arrow {
          display: none !important;
        }
      }
    `}</style>
    <div
      style={{ position: 'relative', width: '100%', paddingTop: '4px', paddingBottom: '4px' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Header */}
      <div className="cat-row-container" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '18px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Crimson accent line */}
          <div style={{
            width: '2px', height: '18px',
            background: 'linear-gradient(180deg, #7B1016, #5D0F14)',
            borderRadius: '999px', flexShrink: 0,
          }} />
          <h2 className="cat-title" style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontWeight: 700,
            color: '#F2F2F0',
            margin: 0,
            letterSpacing: '-0.01em',
          }}>
            {title}
          </h2>
        </div>

        {showToggles && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            {(['all', 'movies', 'series'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontWeight: 500, fontSize: '12px',
                  letterSpacing: '0.04em',
                  textTransform: 'capitalize',
                  color: activeTab === tab ? '#ECE8DD' : '#7E7E7E',
                  borderBottom: activeTab === tab ? '1px solid rgba(236,232,221,0.5)' : '1px solid transparent',
                  paddingBottom: '3px',
                  transition: 'color 0.25s, border-color 0.25s',
                }}
              >
                {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Scrollable strip */}
      <div style={{ position: 'relative' }}>
        {/* Left fade + arrow */}
        {showLeft && (
          <button className="cat-arrow" onClick={() => scroll('left')} style={{
            position: 'absolute', left: 0, top: 0, bottom: '40px', width: '60px', zIndex: 20,
            background: 'linear-gradient(to right, rgba(8,8,8,0.98) 0%, rgba(8,8,8,0.4) 70%, transparent 100%)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'flex-start', paddingLeft: '10px',
            color: '#B9B9B9',
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.3s cubic-bezier(.22,1,.36,1)',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}

        {/* Cards */}
        <div
          ref={rowRef}
          onScroll={handleScroll}
          className="cat-row-container cat-scroll-container"
          style={{
            display: 'flex',
            gap: '14px',
            overflowX: 'auto',
            paddingBottom: '14px',
            paddingTop: '4px',
          } as React.CSSProperties}
        >
          {filteredMovies.map((movie, i) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              index={i}
              variant={variant}
              top10Number={showTop10 ? i + 1 : undefined}
            />
          ))}
        </div>

        {/* Right fade + arrow */}
        {showRight && (
          <button className="cat-arrow" onClick={() => scroll('right')} style={{
            position: 'absolute', right: 0, top: 0, bottom: '40px', width: '60px', zIndex: 20,
            background: 'linear-gradient(to left, rgba(8,8,8,0.98) 0%, rgba(8,8,8,0.4) 70%, transparent 100%)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '10px',
            color: '#B9B9B9',
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.3s cubic-bezier(.22,1,.36,1)',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}
      </div>
    </div>
    </>
  );
}
