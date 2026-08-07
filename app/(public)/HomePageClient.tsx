'use client';

import { useState, useEffect } from 'react';
import { HeroSection } from '@/components/ui/HeroSection';
import { CategoryRow } from '@/components/ui/CategoryRow';
import { MovieCard } from '@/components/ui/MovieCard';

interface MovieData {
  hero: any[];
  top10: any[];
  trending: any[];
  topRated: any[];
  newReleases: any[];
  comedy: any[];
  popularGrid: any[];
}

const CACHE_KEY = 'vouxa_home_cache';
const CACHE_TTL = 5 * 60 * 1000;
export const CW_KEY = 'vouxa_continue_watching';

function readCache(): MovieData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return data;
  } catch { return null; }
}

function writeCache(data: MovieData) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch {}
}

function readLocalCW(): any[] {
  try {
    const raw = localStorage.getItem(CW_KEY);
    if (!raw) return [];
    const items = JSON.parse(raw);
    return items.sort((a: any, b: any) => b.watchedAt - a.watchedAt).slice(0, 10);
  } catch { return []; }
}

export function HomePageClient({ continueWatching = [] }: { continueWatching?: any[] }) {
  const [heroMovies, setHeroMovies] = useState<any[]>([]);
  const [trendingRow, setTrendingRow] = useState<any[]>([]);
  const [top10Row, setTop10Row] = useState<any[]>([]);
  const [continueWatchingItems, setContinueWatchingItems] = useState<any[]>([]);
  const [personalRecs, setPersonalRecs] = useState<any[]>([]);
  const [personalRecsLabel, setPersonalRecsLabel] = useState('');
  const [phase1Done, setPhase1Done] = useState(false);
  const [topRated, setTopRated] = useState<any[]>([]);
  const [comedy, setComedy] = useState<any[]>([]);
  const [popularGrid, setPopularGrid] = useState<any[]>([]);
  const [phase2Done, setPhase2Done] = useState(false);
  const [fatalError, setFatalError] = useState<string | null>(null);

  useEffect(() => {
    const KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
    if (!KEY) { setFatalError('Missing TMDB API key'); return; }

    const get = (endpoint: string) =>
      fetch(`https://api.tmdb.org/3/${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${KEY}&language=en-US`)
        .then(r => r.ok ? r.json() : Promise.reject(r.status))
        .then(j => j.results || j)
        .catch(() => []);

    const cached = readCache();
    if (cached) {
      setHeroMovies(cached.hero);
      setTop10Row(cached.top10);
      setTrendingRow(cached.trending);
      setTopRated(cached.topRated);
      setComedy(cached.comedy);
      setPopularGrid(cached.popularGrid);
      setPhase1Done(true);
      setPhase2Done(true);
    } else {
      get('trending/all/day').then(trending => {
        if (!trending.length) { setFatalError('No content'); return; }
        const mapped = trending.map((m: any) => ({ ...m, media_type: m.media_type || 'movie' }));
        setHeroMovies(mapped.slice(0, 20));
        setTop10Row(mapped.slice(0, 10));
        setTrendingRow(mapped.slice(1, 21));
        setPhase1Done(true);

        Promise.all([
          get('movie/top_rated'),
          get('discover/movie?with_genres=35'),
          Promise.all([
            fetch(`https://api.tmdb.org/3/movie/popular?api_key=${KEY}&language=en-US&page=1`).then(r => r.json()),
            fetch(`https://api.tmdb.org/3/movie/popular?api_key=${KEY}&language=en-US&page=2`).then(r => r.json()),
          ]).then(pages => Array.from(new Map(pages.flatMap((p: any) => p.results || []).map((m: any) => [m.id, m])).values())),
        ]).then(([tr, com, pop]) => {
          const topRatedData = (tr as any[]).slice(0, 20).map((m: any) => ({ ...m, media_type: 'movie' }));
          const comedyData   = (com as any[]).slice(0, 20).map((m: any) => ({ ...m, media_type: 'movie' }));
          const popularData  = (pop as any[]).map((m: any) => ({ ...m, media_type: m.media_type || 'movie' }));
          setTopRated(topRatedData);
          setComedy(comedyData);
          setPopularGrid(popularData);
          setPhase2Done(true);
          writeCache({ hero: mapped.slice(0, 20), top10: mapped.slice(0, 10), trending: mapped.slice(1, 21), topRated: topRatedData, newReleases: [], comedy: comedyData, popularGrid: popularData });
        });
      }).catch(() => setFatalError('Failed to load content'));
    }

    // ── Continue Watching: merge localStorage + Supabase ────────────────
    const localItems = readLocalCW();

    const supabaseItems = continueWatching.map(item => ({
      tmdbId: parseInt(item.tmdb_id),
      mediaType: item.media_type,
      title: item.title || null,
      posterPath: item.poster_path || null,
      runtime: item.runtime || 0,
      duration: item.duration || 0,
      watchedAt: item.last_watched_at ? new Date(item.last_watched_at).getTime() : Date.now(),
    }));

    const localIds = new Set(localItems.map((i: any) => `${i.tmdbId}-${i.mediaType}`));
    const merged = [
      ...localItems.map((l: any) => {
        const matchingSupa = supabaseItems.find((s: any) => s.tmdbId === l.tmdbId && s.mediaType === l.mediaType);
        return {
          ...l,
          duration: l.duration || matchingSupa?.duration || 0
        };
      }),
      ...supabaseItems.filter(s => !localIds.has(`${s.tmdbId}-${s.mediaType}`)),
    ].sort((a, b) => b.watchedAt - a.watchedAt).slice(0, 10);

    if (merged.length > 0) {
      const needsDetails = merged.filter((item: any) => !item.posterPath || !item.title || !item.duration);

      const enrich = (items: any[], detailMap: Record<string, any>) =>
        items.map((item: any) => {
          const detail = detailMap[`${item.tmdbId}-${item.mediaType}`];
          return {
            ...item,
            title: item.title || detail?.title || detail?.name || 'Unknown',
            posterPath: item.posterPath || detail?.poster_path || null,
            totalDuration: item.duration || detail?.runtime || (item.mediaType === 'tv' ? 45 : 100)
          };
        });

      if (needsDetails.length > 0) {
        Promise.all(
          needsDetails.map((item: any) =>
            fetch(`https://api.tmdb.org/3/${item.mediaType === 'tv' ? 'tv' : 'movie'}/${item.tmdbId}?api_key=${KEY}&language=en-US`)
              .then(r => r.ok ? r.json() : null).catch(() => null)
          )
        ).then(details => {
          const detailMap: Record<string, any> = {};
          needsDetails.forEach((item: any, i: number) => { if (details[i]) detailMap[`${item.tmdbId}-${item.mediaType}`] = details[i]; });
          const enriched = enrich(merged, detailMap);
          setContinueWatchingItems(enriched);
          if (enriched.length > 0) {
            const first = enriched[0];
            setPersonalRecsLabel(first.title || 'Something You Watched');
            fetch(`https://api.tmdb.org/3/${first.mediaType === 'tv' ? 'tv' : 'movie'}/${first.tmdbId}/recommendations?api_key=${KEY}&language=en-US`)
              .then(r => r.json()).then(data => setPersonalRecs((data.results || []).slice(0, 14).map((m: any) => ({ ...m, media_type: first.mediaType })))).catch(() => {});
          }
        });
      } else {
        // Fetch details anyway for runtime to ensure accuracy
        Promise.all(
          merged.map((item: any) =>
            fetch(`https://api.tmdb.org/3/${item.mediaType === 'tv' ? 'tv' : 'movie'}/${item.tmdbId}?api_key=${KEY}&language=en-US`)
              .then(r => r.ok ? r.json() : null).catch(() => null)
          )
        ).then(details => {
          const detailMap: Record<string, any> = {};
          merged.forEach((item: any, i: number) => { if (details[i]) detailMap[`${item.tmdbId}-${item.mediaType}`] = details[i]; });
          const enriched = enrich(merged, detailMap);
          setContinueWatchingItems(enriched);
        });

        if (merged.length > 0) {
          const first = merged[0];
          setPersonalRecsLabel(first.title || 'Something You Watched');
          fetch(`https://api.tmdb.org/3/${first.mediaType === 'tv' ? 'tv' : 'movie'}/${first.tmdbId}/recommendations?api_key=${KEY}&language=en-US`)
            .then(r => r.json()).then(data => setPersonalRecs((data.results || []).slice(0, 14).map((m: any) => ({ ...m, media_type: first.mediaType })))).catch(() => {});
        }
      }
    }

  }, [continueWatching]);

  if (fatalError) {
    return (
      <div style={{ background: '#080808', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
        <p style={{ color: '#7E7E7E', fontFamily: 'Inter, sans-serif', fontSize: '16px' }}>{fatalError}</p>
        <button onClick={() => { localStorage.removeItem(CACHE_KEY); window.location.reload(); }}
          style={{ background: 'linear-gradient(135deg,#5D0F14,#7B1016)', color: '#ECE8DD', border: 'none', borderRadius: '8px', padding: '10px 24px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
          Retry
        </button>
      </div>
    );
  }

  if (!phase1Done) {
    return (
      <div style={{ background: '#080808', minHeight: '100vh' }}>
        <div style={{ width: '100%', height: '100vh', background: 'linear-gradient(135deg, #0E0E0E 0%, #111 50%, #0E0E0E 100%)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.02) 50%, transparent 100%)', animation: 'shimmer 1.6s infinite', backgroundSize: '400px 100%' }} />
          <style>{`@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}`}</style>
          <div style={{ position: 'absolute', bottom: '80px', left: '80px' }}>
            <div style={{ width: '320px', height: '56px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', marginBottom: '16px' }} />
            <div style={{ width: '200px', height: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', marginBottom: '10px' }} />
            <div style={{ width: '380px', height: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', marginBottom: '6px' }} />
            <div style={{ width: '300px', height: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', marginBottom: '28px' }} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ width: '110px', height: '44px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px' }} />
              <div style={{ width: '110px', height: '44px', background: 'rgba(255,255,255,0.04)', borderRadius: '999px' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#080808', minHeight: '100vh', overflowX: 'hidden' }}>
      <HeroSection movies={heroMovies} />

      <style>{`
        .home-content-wrap {
          padding-bottom: 100px;
        }
        .home-section {
          margin-top: 56px;
        }
        .cw-card-wrapper {
          width: 320px;
        }
        .cw-card-inner {
          width: 320px;
        }
        .cw-image-wrapper {
          width: 320px;
          height: 180px;
        }
        
        @media (max-width: 768px) {
          .home-content-wrap {
            padding-bottom: 60px !important;
          }
          .home-section {
            margin-top: 32px !important;
          }
          .cw-card-wrapper {
            width: 250px !important;
          }
          .cw-card-inner {
            width: 250px !important;
            border-radius: 10px !important;
          }
          .cw-image-wrapper {
            width: 250px !important;
            height: 140px !important;
          }
          .cw-section-padding {
            padding-left: 16px !important;
            padding-right: 16px !important;
            scroll-padding-inline-start: 16px !important;
          }
        }
      `}</style>

      <div className="home-content-wrap">
        {/* ── Continue Watching ── */}
        {continueWatchingItems.length > 0 && (
          <div className="home-section">
            <div className="cw-section-padding" style={{ paddingLeft: '48px', paddingRight: '48px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '2px', height: '18px', background: 'linear-gradient(180deg, #7B1016, #5D0F14)', borderRadius: '999px' }} />
              <h2 style={{ fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 700, fontSize: '17px', color: '#F2F2F0', margin: 0, letterSpacing: '-0.01em' }}>
                Continue Watching
              </h2>
            </div>
            <div className="cw-section-padding" style={{ paddingLeft: '48px', paddingRight: '48px', scrollPaddingInlineStart: '48px', display: 'flex', gap: '16px', overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', scrollSnapType: 'x mandatory' }}>
              <style>{`div::-webkit-scrollbar{display:none;} .cw-card-wrapper { scroll-snap-align: start; }`}</style>
              {continueWatchingItems.map((item: any) => {
                const posterUrl = item.posterPath ? `https://image.tmdb.org/t/p/w780${item.posterPath}` : ''; // Use higher resolution poster/backdrop
                const href = item.mediaType === 'tv' ? `/tv/${item.tmdbId}?play=true` : `/movie/${item.tmdbId}?play=true`;
                const estimatedTotal = item.totalDuration || (item.mediaType === 'tv' ? 45 : 100);
                const pct = Math.min(100, Math.round(((item.runtime || 0) / estimatedTotal) * 100));
                return (
                  <a key={`${item.tmdbId}-${item.mediaType}`} href={href} className="cw-card-wrapper" style={{ textDecoration: 'none', flexShrink: 0, display: 'block' }}>
                    <div className="cw-card-inner" style={{ borderRadius: '14px', overflow: 'hidden', background: '#080808', border: '1px solid rgba(255,255,255,0.07)', transition: 'transform 0.25s, box-shadow 0.25s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-6px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 20px 48px rgba(0,0,0,0.7)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}>
                      <div className="cw-image-wrapper" style={{ position: 'relative', background: '#111' }}>
                        {posterUrl
                          ? <img src={posterUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333' }}><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="20" height="20" rx="2.18"/></svg></div>
                        }
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0)', transition: 'background 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.45)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0)'}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(123,16,22,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '0'}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                          </div>
                        </div>
                        <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, color: '#FFF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          {item.mediaType === 'tv' ? 'TV' : 'Movie'}
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)' }}>
                        <div style={{ height: '100%', width: `${Math.max(pct, 2)}%`, background: 'linear-gradient(90deg, #7B1016, #C1252E)', transition: 'width 0.4s' }} />
                      </div>
                      <div style={{ padding: '12px 14px' }}>
                        <p style={{ color: '#F2F2F0', fontSize: '13px', fontWeight: 600, margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Inter, sans-serif' }}>{item.title || 'Unknown'}</p>
                        <p style={{ color: '#888', fontSize: '11px', margin: 0, fontFamily: 'Inter, sans-serif' }}>
                          {item.mediaType === 'tv' && item.season && item.episode ? (
                            <span>
                              <span style={{ color: '#F2F2F0' }}>S{item.season} E{item.episode}</span>
                              {item.runtime ? (() => {
                                const totalSeconds = Math.round(item.runtime);
                                const hours = Math.floor(totalSeconds / 3600);
                                const mins = Math.floor((totalSeconds % 3600) / 60);
                                const secs = totalSeconds % 60;
                                if (hours > 0) return ` • ${hours}h ${mins}m ${secs}s watched`;
                                return ` • ${mins}m ${secs}s watched`;
                              })() : ' • Just started'}
                            </span>
                          ) : (
                            item.runtime ? (() => {
                              const totalSeconds = Math.round(item.runtime);
                              const hours = Math.floor(totalSeconds / 3600);
                              const mins = Math.floor((totalSeconds % 3600) / 60);
                              const secs = totalSeconds % 60;
                              if (hours > 0) return `${hours}h ${mins}m ${secs}s watched`;
                              return `${mins}m ${secs}s watched`;
                            })() : 'Just started'
                          )}
                        </p>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        <div className="home-section">
          <CategoryRow title="TOP 10 Today" movies={top10Row} variant="portrait" showTop10 />
        </div>

        <div className="home-section">
          <CategoryRow title="Trending Now" movies={trendingRow} variant="landscape" showToggles />
        </div>

        <div className="home-section" style={{ transition: 'opacity 0.5s', opacity: phase2Done ? 1 : 0.3 }}>
          <CategoryRow title="Top Rated" movies={topRated} variant="landscape" showToggles />
        </div>

        {personalRecs.length > 0 && (
          <div className="home-section">
            <CategoryRow title={`Because you watched: ${personalRecsLabel}`} movies={personalRecs} variant="landscape" showToggles />
          </div>
        )}

        <div className="home-section" style={{ transition: 'opacity 0.5s', opacity: phase2Done ? 1 : 0.3 }}>
          <CategoryRow title="Comedy" movies={comedy} variant="landscape" showToggles />
        </div>

        {phase2Done && popularGrid.length > 0 && (
          <div className="explore-more-section" style={{ marginTop: '72px', paddingLeft: '48px', paddingRight: '48px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
              <div style={{ width: '2px', height: '18px', background: 'linear-gradient(180deg, #7B1016, #5D0F14)', borderRadius: '999px' }} />
              <h2 style={{ fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 700, fontSize: '17px', color: '#F2F2F0', margin: 0, letterSpacing: '-0.01em' }}>Explore More</h2>
            </div>
            <style>{`
              .explore-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(175px, 1fr));
                gap: 32px 16px;
                align-items: start;
              }
              @media (max-width: 768px) {
                .explore-more-section {
                  display: none !important;
                }
              }
            `}</style>
            <div className="explore-grid">
              {popularGrid.map((movie, idx) => <MovieCard key={movie.id} movie={movie} index={idx % 12} variant="portrait" gridMode={true} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
