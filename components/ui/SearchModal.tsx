'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      setQuery('');
      setResults([]);
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  // Debounced search for live results
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/tmdb-search?query=${encodeURIComponent(query)}&page=1`);
        const data = await res.json();
        // Filter out people, keep only movies and tv
        const filtered = (data.results || [])
          .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
          .slice(0, 6); // Max 6 quick results
        setResults(filtered);
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      onClose();
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: 'rgba(8,8,8,0.95)', backdropFilter: 'blur(20px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            paddingTop: '15vh'
          }}
        >
          <style>{`
            .search-modal-container {
              --search-modal-pt: 15vh;
              --search-input-padding: 24px 24px 24px 76px;
              --search-input-font-size: 24px;
              --search-icon-size: 28px;
              --search-icon-left: 28px;
            }
            @media (max-width: 600px) {
              .search-modal-container {
                --search-modal-pt: 8vh;
                --search-input-padding: 14px 16px 14px 46px;
                --search-input-font-size: 16px;
                --search-icon-size: 18px;
                --search-icon-left: 16px;
              }
              .search-modal-close {
                top: 20px !important;
                right: 20px !important;
                width: 38px !important;
                height: 38px !important;
              }
            }
          `}</style>
          {/* Close Button */}
          <button
            onClick={onClose}
            className="search-modal-close"
            style={{
              position: 'absolute', top: '40px', right: '64px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              width: '48px', height: '48px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#ECE8DD', cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>

          <div className="search-modal-container" style={{ width: '100%', maxWidth: '800px', padding: '0 24px', paddingTop: 'var(--search-modal-pt)' }}>
            {/* Search Input */}
            <motion.div
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              style={{ position: 'relative', overflow: 'visible' }}
            >
              {/* Outer glow effect */}
              <div style={{
                position: 'absolute', inset: -2, borderRadius: '26px',
                background: 'linear-gradient(90deg, rgba(123,16,22,0.5), rgba(93,15,20,0.5))',
                opacity: 0.3, filter: 'blur(15px)', zIndex: 0,
                pointerEvents: 'none'
              }} />
              
              <svg 
                viewBox="0 0 24 24" fill="none" stroke="#7B1016" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" 
                style={{ 
                  position: 'absolute', 
                  left: 'var(--search-icon-left)', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  zIndex: 10,
                  width: 'var(--search-icon-size)',
                  height: 'var(--search-icon-size)'
                }}
              >
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search for movies, TV shows, anime..."
                style={{
                  width: '100%',
                  background: 'rgba(20,20,20,0.8)',
                  border: '1px solid rgba(123,16,22,0.3)',
                  borderRadius: '24px',
                  padding: 'var(--search-input-padding)',
                  fontSize: 'var(--search-input-font-size)',
                  fontWeight: 500,
                  color: '#ECE8DD',
                  outline: 'none',
                  boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.8), 0 10px 40px rgba(0,0,0,0.5)',
                  fontFamily: 'Inter, sans-serif',
                  backdropFilter: 'blur(10px)',
                  position: 'relative',
                  zIndex: 5,
                  transition: 'border-color 0.3s, box-shadow 0.3s'
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = 'rgba(123,16,22,0.8)';
                  e.currentTarget.style.boxShadow = 'inset 0 2px 10px rgba(0,0,0,0.8), 0 10px 40px rgba(123,16,22,0.2)';
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = 'rgba(123,16,22,0.3)';
                  e.currentTarget.style.boxShadow = 'inset 0 2px 10px rgba(0,0,0,0.8), 0 10px 40px rgba(0,0,0,0.5)';
                }}
              />
            </motion.div>

            {/* Live Results Dropdown */}
            {query.trim() && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}
              >
                {loading ? (
                  <div style={{ color: '#7E7E7E', fontSize: '16px', textAlign: 'center', padding: '40px' }}>Searching...</div>
                ) : results.length > 0 ? (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                      {results.map((item) => (
                        <Link
                          key={item.id}
                          href={item.media_type === 'tv' ? `/tv/${item.id}` : `/movie/${item.id}`}
                          onClick={onClose}
                          style={{
                            display: 'flex', gap: '16px', alignItems: 'center',
                            background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '16px',
                            textDecoration: 'none', transition: 'background 0.2s, transform 0.2s',
                            border: '1px solid rgba(255,255,255,0.05)'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                          {item.poster_path ? (
                            <Image src={`https://image.tmdb.org/t/p/w185${item.poster_path}`} alt={item.title || item.name} width={60} height={90} style={{ width: '60px', height: '90px', objectFit: 'cover', borderRadius: '8px' }} />
                          ) : (
                            <div style={{ width: '60px', height: '90px', background: '#121212', borderRadius: '8px' }} />
                          )}
                          <div style={{ flex: 1, overflow: 'hidden' }}>
                            <h3 style={{ margin: '0 0 6px 0', color: '#F2F2F0', fontSize: '16px', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                              {item.title || item.name}
                            </h3>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <span style={{ fontSize: '12px', color: '#7B1016', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {item.media_type === 'tv' ? 'Series' : 'Movie'}
                              </span>
                              <span style={{ color: '#7E7E7E', fontSize: '12px' }}>
                                {(item.release_date || item.first_air_date || '').substring(0, 4)}
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => {
                        onClose();
                        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
                      }}
                      style={{
                        marginTop: '16px', background: 'rgba(123,16,22,0.1)', border: '1px solid rgba(123,16,22,0.3)',
                        color: '#F2F2F0', padding: '16px', borderRadius: '12px', cursor: 'pointer',
                        fontSize: '15px', fontWeight: 600, transition: 'all 0.2s', textAlign: 'center'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(123,16,22,0.2)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(123,16,22,0.1)'; }}
                    >
                      View All Results for "{query}"
                    </button>
                  </>
                ) : (
                  <div style={{ color: '#7E7E7E', fontSize: '16px', textAlign: 'center', padding: '40px' }}>
                    No results found for "{query}".
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
