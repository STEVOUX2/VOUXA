'use client';

import { useState, useEffect } from 'react';
import { HeroSection } from '@/components/ui/HeroSection';
import { CategoryRow } from '@/components/ui/CategoryRow';

interface MoviesData {
  hero: any[];
  trending: any[];
  popular: any[];
  topRated: any[];
  action: any[];
  comedy: any[];
  scifi: any[];
  adventure: any[];
  horror: any[];
  romance: any[];
}

export function MoviesClient() {
  const [data, setData] = useState<MoviesData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
    if (!KEY) { setError('Missing TMDB API key'); return; }

    const get = (endpoint: string) =>
      fetch(`https://api.tmdb.org/3/${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${KEY}&language=en-US`)
        .then(r => r.ok ? r.json() : Promise.reject(r.status))
        .then(j => (j.results || j).map((m: any) => ({ ...m, media_type: 'movie' })))
        .catch(() => []);

    Promise.all([
      get('trending/movie/day'),
      get('movie/popular'),
      get('movie/top_rated'),
      get('discover/movie?with_genres=28'),
      get('discover/movie?with_genres=35'),
      get('discover/movie?with_genres=878'),
      get('discover/movie?with_genres=12'),
      get('discover/movie?with_genres=27'),
      get('discover/movie?with_genres=10749'),
    ]).then(([trending, popular, topRated, action, comedy, scifi, adventure, horror, romance]) => {
      setData({
        hero: trending.slice(0, 20),
        trending: trending.slice(0, 20),
        popular: popular.slice(0, 20),
        topRated: topRated.slice(0, 20),
        action: action.slice(0, 20),
        comedy: comedy.slice(0, 20),
        scifi: scifi.slice(0, 20),
        adventure: adventure.slice(0, 20),
        horror: horror.slice(0, 20),
        romance: romance.slice(0, 20),
      });
    }).catch(() => setError('Failed to load movies'));
  }, []);

  if (error) {
    return <div style={{ background: '#080808', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff6b6b' }}>{error}</div>;
  }

  if (!data) {
    return (
      <div style={{ background: '#080808', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid rgba(123,16,22,0.2)', borderTop: '2px solid #7B1016', animation: 'spin 0.9s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <span style={{ color: '#4E4E4E', fontSize: '13px', letterSpacing: '0.06em' }}>LOADING</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#080808', minHeight: '100vh', overflowX: 'hidden', position: 'relative' }}>
      <HeroSection movies={data.hero} />

      <style>{`
        .movie-content-wrap {
          padding-bottom: 100px;
          position: relative;
          z-index: 1;
        }
        .home-section {
          margin-top: 56px;
        }
        .desktop-watermark, .desktop-section-header {
          display: none;
        }
        @media (min-width: 1024px) {
          .desktop-watermark {
            display: block;
            position: fixed;
            top: 75%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 18vw;
            font-weight: 900;
            color: transparent;
            -webkit-text-stroke: 2px rgba(123,16,22,0.04);
            pointer-events: none;
            z-index: 0;
            white-space: nowrap;
            letter-spacing: -0.02em;
          }
          .desktop-section-header {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0 4%;
            margin-bottom: 24px;
            margin-top: -32px;
            position: relative;
            z-index: 10;
          }
          .desktop-title {
            font-size: 56px;
            font-weight: 900;
            color: #fff;
            letter-spacing: -0.03em;
            text-transform: uppercase;
            margin: 0;
          }
          .desktop-title span {
            color: #7B1016;
          }
        }
        @media (max-width: 768px) {
          .movie-content-wrap {
            padding-bottom: 60px !important;
          }
          .home-section {
            margin-top: 32px !important;
          }
        }
      `}</style>

      <div className="desktop-watermark">MOVIES</div>

      <div className="movie-content-wrap">
        <div style={{ position: 'relative', height: 0, overflow: 'visible' }}>
          <div style={{ position: 'absolute', top: '-250px', left: '50%', transform: 'translateX(-50%)', width: '1000px', height: '500px', background: 'radial-gradient(50% 50% at 50% 50%, rgba(123,16,22,0.15) 0%, transparent 100%)', pointerEvents: 'none' }} />
        </div>

        <div className="desktop-section-header">
          <h1 className="desktop-title">Explore <span>Movies</span></h1>
        </div>

        <div className="home-section">
          <CategoryRow title="Trending Now" movies={data.trending} variant="portrait" />
        </div>

        <div className="home-section">
          <CategoryRow title="Popular Movies" movies={data.popular} variant="portrait" />
        </div>

        <div className="home-section">
          <CategoryRow title="Top Rated" movies={data.topRated} variant="portrait" />
        </div>

        <div className="home-section">
          <CategoryRow title="Action" movies={data.action} variant="portrait" />
        </div>

        <div className="home-section">
          <CategoryRow title="Comedy" movies={data.comedy} variant="portrait" />
        </div>

        <div className="home-section">
          <CategoryRow title="Sci-Fi" movies={data.scifi} variant="portrait" />
        </div>

        <div className="home-section">
          <CategoryRow title="Adventure" movies={data.adventure} variant="portrait" />
        </div>

        <div className="home-section">
          <CategoryRow title="Horror" movies={data.horror} variant="portrait" />
        </div>

        <div className="home-section">
          <CategoryRow title="Romance" movies={data.romance} variant="portrait" />
        </div>

      </div>
    </div>
  );
}
