'use client';

import { useState, useEffect } from 'react';
import { HeroSection } from '@/components/ui/HeroSection';
import { CategoryRow } from '@/components/ui/CategoryRow';

interface AnimeData {
  hero: any[];
  trending: any[];
  topRated: any[];
  action: any[];
  comedy: any[];
  fantasy: any[];
  drama: any[];
  movies: any[];
}

export function AnimeClient() {
  const [data, setData] = useState<AnimeData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
    if (!KEY) { setError('Missing TMDB API key'); return; }

    const get = (endpoint: string, mediaType: string = 'tv') =>
      fetch(`https://api.tmdb.org/3/${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${KEY}&language=en-US`)
        .then(r => r.ok ? r.json() : Promise.reject(r.status))
        .then(j => (j.results || j).map((m: any) => ({ ...m, media_type: mediaType })))
        .catch(() => []);

    const customHeroUrls = [
      'tv/37854',   // One Piece
      'tv/85937',   // Demon Slayer
      'tv/46260',   // Naruto
      'tv/30984',   // Bleach
      'tv/86986',   // Doraemon (2005)
      'tv/211089',  // Solo Leveling
      'tv/65336',   // Erased
      'movie/12477' // Grave of the Fireflies
    ];

    const getCustomHero = () => Promise.all(
      customHeroUrls.map(endpoint => 
        fetch(`https://api.tmdb.org/3/${endpoint}?api_key=${KEY}&language=en-US`)
          .then(r => r.ok ? r.json() : null)
          .then(j => j ? { ...j, media_type: endpoint.startsWith('tv') ? 'tv' : 'movie' } : null)
      )
    ).then(res => res.filter(Boolean));

    Promise.all([
      getCustomHero(),
      get('discover/tv?with_genres=16&with_original_language=ja&sort_by=popularity.desc'), // trending
      get('discover/tv?with_genres=16&with_original_language=ja&sort_by=vote_average.desc&vote_count.gte=100'),
      get('discover/tv?with_genres=16,10759&with_original_language=ja'), // Action/Adventure
      get('discover/tv?with_genres=16,35&with_original_language=ja'), // Comedy
      get('discover/tv?with_genres=16,10765&with_original_language=ja'), // Fantasy/Sci-Fi
      get('discover/tv?with_genres=16,18&with_original_language=ja'), // Drama
      get('discover/movie?with_genres=16&with_original_language=ja&sort_by=popularity.desc', 'movie'), // Anime Movies
    ]).then(([heroCustom, trending, topRated, action, comedy, fantasy, drama, movies]) => {
      setData({
        hero: heroCustom,
        trending: trending.slice(0, 20),
        topRated: topRated.slice(0, 20),
        action: action.slice(0, 20),
        comedy: comedy.slice(0, 20),
        fantasy: fantasy.slice(0, 20),
        drama: drama.slice(0, 20),
        movies: movies.slice(0, 20),
      });
    }).catch(() => setError('Failed to load Anime'));
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
        .anime-content-wrap {
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
            -webkit-text-stroke: 2px rgba(164,16,123,0.05);
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
            color: #A4107B;
          }
        }
        @media (max-width: 768px) {
          .anime-content-wrap {
            padding-bottom: 60px !important;
          }
          .home-section {
            margin-top: 32px !important;
          }
        }
      `}</style>

      <div className="desktop-watermark">ANIME</div>

      <div className="anime-content-wrap">
        <div style={{ position: 'relative', height: 0, overflow: 'visible' }}>
          <div style={{ position: 'absolute', top: '-250px', left: '50%', transform: 'translateX(-50%)', width: '1000px', height: '500px', background: 'radial-gradient(50% 50% at 50% 50%, rgba(164,16,123,0.18) 0%, transparent 100%)', pointerEvents: 'none' }} />
        </div>

        <div className="desktop-section-header">
          <h1 className="desktop-title">Explore <span>Anime</span></h1>
        </div>

        <div className="home-section">
          <CategoryRow title="Trending Anime" movies={data.trending} variant="portrait" />
        </div>

        <div className="home-section">
          <CategoryRow title="Top Rated Anime" movies={data.topRated} variant="portrait" />
        </div>

        <div className="home-section">
          <CategoryRow title="Action Anime" movies={data.action} variant="portrait" />
        </div>

        <div className="home-section">
          <CategoryRow title="Comedy Anime" movies={data.comedy} variant="portrait" />
        </div>

        <div className="home-section">
          <CategoryRow title="Fantasy & Sci-Fi" movies={data.fantasy} variant="portrait" />
        </div>

        <div className="home-section">
          <CategoryRow title="Drama Anime" movies={data.drama} variant="portrait" />
        </div>

        <div className="home-section">
          <CategoryRow title="Anime Movies" movies={data.movies} variant="portrait" />
        </div>

      </div>
    </div>
  );
}
