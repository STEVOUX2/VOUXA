'use client';

import { useState, useEffect } from 'react';
import { MovieCard } from '@/components/ui/MovieCard';

interface CategoryClientProps {
  title: string;
  endpoint: string;
}

export function CategoryClient({ title, endpoint }: CategoryClientProps) {
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAll() {
      try {
        const KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
        if (!KEY) throw new Error('Missing TMDB key');

        // Fetch 2 pages of results to fill the grid nicely
        const [page1, page2] = await Promise.all([
          fetch(`https://api.tmdb.org/3/${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${KEY}&language=en-US&page=1`),
          fetch(`https://api.tmdb.org/3/${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${KEY}&language=en-US&page=2`),
        ]);

        const data1 = await page1.json();
        const data2 = await page2.json();

        const all = [...(data1.results || []), ...(data2.results || [])];
        
        // Ensure media_type is set for MovieCard formatting
        const mapped = all.map((m: any) => ({
          ...m,
          media_type: m.media_type || (endpoint.includes('movie') ? 'movie' : 'tv')
        }));

        setMovies(mapped);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [endpoint]);

  return (
    <>
    <style>{`
      .category-container {
        padding: 120px 48px 80px !important;
      }
      .category-title-header {
        margin-bottom: 80px !important;
        height: 140px !important;
      }
      .category-title-text {
        font-size: 56px !important;
        text-shadow: 0 0 60px rgba(123,16,22,0.6), 0 10px 30px rgba(0,0,0,0.8) !important;
      }
      .category-subtitle-text {
        font-size: 15px !important;
      }
      .category-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 28px 14px;
        align-items: start;
      }
      @media (max-width: 768px) {
        .category-container {
          padding: 80px 16px 60px !important;
        }
        .category-title-header {
          margin-bottom: 36px !important;
          height: auto !important;
          min-height: 80px !important;
        }
        .category-title-text {
          font-size: 32px !important;
        }
        .category-subtitle-text {
          font-size: 13px !important;
          margin-top: 4px !important;
        }
        .category-grid {
          grid-template-columns: repeat(3, 1fr) !important;
          gap: 16px 8px !important;
        }
      }
    `}</style>
    <div className="category-container" style={{ background: '#080808', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* ── Title Header with Floating Glows ── */}
      <div className="category-title-header" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'visible' }}>
        
        {/* Floating Glowing Orbs Behind */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ position: 'absolute', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(123,16,22,0.2) 0%, transparent 60%)', animation: 'float1 8s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(93,15,20,0.15) 0%, transparent 60%)', animation: 'float2 12s ease-in-out infinite' }} />
        </div>
        <style>{`
          @keyframes float1 { 0%, 100% { transform: translate(-20%, -10%) scale(1); } 50% { transform: translate(10%, 15%) scale(1.1); } }
          @keyframes float2 { 0%, 100% { transform: translate(15%, 5%) scale(1); } 50% { transform: translate(-15%, -15%) scale(1.05); } }
        `}</style>

        {/* Text Container with Bar */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ width: '4px', height: '64px', background: 'linear-gradient(180deg, #7B1016, #5D0F14)', borderRadius: '999px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <h1 className="category-title-text" style={{ 
              fontWeight: 800, color: '#F2F2F0', 
              margin: '0 0 8px 0', letterSpacing: '-0.02em', textTransform: 'uppercase',
              lineHeight: 1,
              textAlign: 'center'
            }}>
              {title}
            </h1>
            <p className="category-subtitle-text" style={{ margin: 0, color: '#999', letterSpacing: '0.02em', fontWeight: 400, textAlign: 'center' }}>
              {title.toLowerCase() === 'movies' && 'Discover cinematic masterpieces and blockbuster hits.'}
              {title.toLowerCase() === 'tv shows' && 'Binge-worthy series and acclaimed television.'}
              {title.toLowerCase() === 'anime' && 'Explore visually stunning animated worlds and epics.'}
              {title.toLowerCase() === 'watchlist' && 'Your curated collection of titles to watch next.'}
              {title.toLowerCase() === 'history' && 'A look back at your previously watched journey.'}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid rgba(123,16,22,0.2)', borderTop: '2px solid #7B1016', animation: 'spin 0.9s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <span style={{ color: '#4E4E4E', fontSize: '13px', letterSpacing: '0.06em' }}>LOADING</span>
          </div>
        </div>
      ) : error ? (
        <div style={{ color: '#7E7E7E', textAlign: 'center', padding: '80px 0' }}>Failed to load content.</div>
      ) : (
        <div className="category-grid">
          {movies.map((movie, idx) => (
            <MovieCard key={`${movie.id}-${idx}`} movie={movie} index={idx % 12} variant="portrait" gridMode={true} />
          ))}
        </div>
      )}
    </div>
    </>
  );
}
