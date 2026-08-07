'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Smile, Ghost, Heart, Zap, Rocket, Lightbulb, Search, SlidersHorizontal } from 'lucide-react';
import { MovieCard } from '@/components/ui/MovieCard';

const GENRES = [
  { id: 28, name: 'Action' }, { id: 35, name: 'Comedy' }, { id: 18, name: 'Drama' },
  { id: 27, name: 'Horror' }, { id: 10749, name: 'Romance' }, { id: 878, name: 'Sci-Fi' },
  { id: 53, name: 'Thriller' }, { id: 16, name: 'Animation' }, { id: 12, name: 'Adventure' },
  { id: 99, name: 'Documentary' }, { id: 9648, name: 'Mystery' }, { id: 14, name: 'Fantasy' },
];

const MOODS = [
  { label: 'Funny', genreId: 35, icon: <Smile size={16} /> },
  { label: 'Scary', genreId: 27, icon: <Ghost size={16} /> },
  { label: 'Romantic', genreId: 10749, icon: <Heart size={16} /> },
  { label: 'Thrilling', genreId: 53, icon: <Zap size={16} /> },
  { label: 'Epic', genreId: 12, icon: <Rocket size={16} /> },
  { label: 'Thought-provoking', genreId: 18, icon: <Lightbulb size={16} /> },
];

const LANGUAGES = [
  { code: 'en', name: 'English' }, { code: 'ko', name: 'Korean' },
  { code: 'ja', name: 'Japanese' }, { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' }, { code: 'hi', name: 'Hindi' },
];

function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';

  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filters
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [minRating, setMinRating] = useState('');
  const [activeMode, setActiveMode] = useState<'search' | 'discover'>('search');

  const discover = async () => {
    setLoading(true);
    let url = `/api/tmdb-discover?`;
    if (selectedGenre) url += `genre=${selectedGenre}&`;
    if (selectedLanguage) url += `language=${selectedLanguage}&`;
    if (yearFrom) url += `yearFrom=${yearFrom}&`;
    if (yearTo) url += `yearTo=${yearTo}&`;
    if (minRating) url += `minRating=${minRating}&`;
    const res = await fetch(url);
    const data = await res.json();
    setResults((data.results || []).map((m: any) => ({ ...m, media_type: 'movie' })));
    setLoading(false);
  };

  useEffect(() => {
    if (!query && activeMode === 'search') { setResults([]); return; }
    if (activeMode === 'search' && query) {
      const fetchResults = async () => {
        setLoading(true);
        const res = await fetch(`/api/tmdb-search?query=${encodeURIComponent(query)}&page=1`);
        const data = await res.json();
        setResults((data.results || []).filter((i: any) => i.media_type === 'movie' || i.media_type === 'tv'));
        setLoading(false);
      };
      fetchResults();
    }
  }, [query, activeMode]);

  const labelStyle = { fontSize: '12px', fontWeight: 700, color: '#7E7E7E', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '8px', display: 'block' };
  const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#ECE8DD', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', outline: 'none', fontFamily: 'Inter, sans-serif', transition: 'all 0.2s' };

  return (
    <div style={{ background: '#080808', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif', position: 'relative' }} className="search-container">
      {/* Ambient cinematic glow */}
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '100vw', height: '600px', background: 'radial-gradient(100% 100% at 50% 0%, rgba(123,16,22,0.15) 0%, transparent 100%)', pointerEvents: 'none', zIndex: 0 }} />

      <style>{`
        .search-container {
          padding: 120px 64px 80px;
        }
        .search-header, .mood-label {
          text-align: center;
        }
        .search-tabs, .mood-buttons {
          justify-content: center;
        }
        .glass-panel {
          background: rgba(15,15,15,0.7);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 10px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(123,16,22,0.15) inset;
          border-radius: 16px;
          padding: 24px;
          margin: 0 auto 40px;
          max-width: 700px;
        }
        .gradient-text {
          background: linear-gradient(135deg, #fff 0%, #B9B9B9 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        select:focus, input:focus {
          border-color: rgba(123,16,22,0.6) !important;
          background: rgba(123,16,22,0.05) !important;
        }
        @media (max-width: 768px) {
          .search-container {
            padding: 100px 16px 60px;
          }
          .glass-panel {
            padding: 24px 16px;
          }
        }
      `}</style>

      <div style={{ maxWidth: '1400px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ marginBottom: '48px' }} className="search-header">
          <h1 className="gradient-text" style={{ fontSize: '48px', fontWeight: 900, margin: '0 0 12px 0', letterSpacing: '-0.03em' }}>Search & Discover</h1>
          <p style={{ color: '#7E7E7E', fontSize: '16px', margin: 0, fontWeight: 500 }}>Find your next favorite movie or show.</p>
        </div>

        {/* Mode Toggle */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '40px' }} className="search-tabs">
          <button onClick={() => { setActiveMode('search'); setShowFilters(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 28px', borderRadius: '30px', border: activeMode === 'search' ? '1px solid rgba(123,16,22,0.5)' : '1px solid transparent', background: activeMode === 'search' ? 'rgba(123,16,22,0.15)' : 'rgba(255,255,255,0.03)', color: activeMode === 'search' ? '#fff' : '#888', fontWeight: 700, fontSize: '15px', cursor: 'pointer', transition: 'all 0.3s', fontFamily: 'Inter, sans-serif' }}><Search size={18} /> Search by Title</button>
          <button onClick={() => { setActiveMode('discover'); setShowFilters(true); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 28px', borderRadius: '30px', border: activeMode === 'discover' ? '1px solid rgba(123,16,22,0.5)' : '1px solid transparent', background: activeMode === 'discover' ? 'rgba(123,16,22,0.15)' : 'rgba(255,255,255,0.03)', color: activeMode === 'discover' ? '#fff' : '#888', fontWeight: 700, fontSize: '15px', cursor: 'pointer', transition: 'all 0.3s', fontFamily: 'Inter, sans-serif' }}><SlidersHorizontal size={18} /> Advanced Filters</button>
        </div>

        {/* Mood Quick Picks */}
        <div style={{ marginBottom: '48px' }}>
          <p style={{ ...labelStyle }} className="mood-label">Pick a Mood</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }} className="mood-buttons">
            {MOODS.map(mood => (
              <button key={mood.label} onClick={() => { setSelectedGenre(mood.genreId); setActiveMode('discover'); discover(); }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: '#ECE8DD', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'Inter, sans-serif', backdropFilter: 'blur(10px)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(123,16,22,0.2)'; e.currentTarget.style.borderColor = 'rgba(123,16,22,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'none'; }}
              >
                {mood.icon} {mood.label}
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {(showFilters || activeMode === 'discover') && (
          <div className="glass-panel">
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#F2F2F0', marginBottom: '16px' }}>Advanced Filters</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Genre</label>
                <select value={selectedGenre || ''} onChange={e => setSelectedGenre(e.target.value ? Number(e.target.value) : null)} style={{ ...inputStyle }}>
                  <option value="" style={{ background: '#121212' }}>All Genres</option>
                  {GENRES.map(g => <option key={g.id} value={g.id} style={{ background: '#121212' }}>{g.name}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Language</label>
                <select value={selectedLanguage} onChange={e => setSelectedLanguage(e.target.value)} style={{ ...inputStyle }}>
                  <option value="" style={{ background: '#121212' }}>Any Language</option>
                  {LANGUAGES.map(l => <option key={l.code} value={l.code} style={{ background: '#121212' }}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>From Year</label>
                <input type="number" placeholder="e.g. 2000" value={yearFrom} onChange={e => setYearFrom(e.target.value)} style={{ ...inputStyle }} min="1900" max="2030" />
              </div>
              <div>
                <label style={labelStyle}>To Year</label>
                <input type="number" placeholder="e.g. 2024" value={yearTo} onChange={e => setYearTo(e.target.value)} style={{ ...inputStyle }} min="1900" max="2030" />
              </div>
              <div>
                <label style={labelStyle}>Min Rating (1-10)</label>
                <input type="number" placeholder="e.g. 7" value={minRating} onChange={e => setMinRating(e.target.value)} style={{ ...inputStyle }} min="1" max="10" step="0.5" />
              </div>
            </div>
            <button onClick={discover} style={{ marginTop: '20px', background: '#7B1016', border: 'none', color: '#fff', padding: '12px 32px', borderRadius: '10px', fontWeight: 700, fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'Inter, sans-serif' }}>Find Movies</button>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} style={{ aspectRatio: '2/3', background: '#171717', borderRadius: '10px', animation: 'pulse 1.5s infinite' }} />
            ))}
            <style>{`@keyframes pulse{0%,100%{opacity:0.6}50%{opacity:1}}`}</style>
          </div>
        ) : results.length > 0 ? (
          <>
            <style>{`
              .search-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
                gap: 24px;
                align-items: start;
              }
              @media (max-width: 600px) {
                .search-grid {
                  grid-template-columns: repeat(3, 1fr) !important;
                  gap: 16px 8px !important;
                  justify-content: center;
                  justify-items: center;
                }
              }
            `}</style>
            <div className="search-grid">
              {results.map((item: any, idx: number) => <MovieCard key={item.id} movie={item} index={idx % 12} variant="portrait" gridMode={true} />)}
            </div>
          </>
        ) : query ? (
          <p style={{ color: '#7E7E7E', fontSize: '16px', textAlign: 'center', padding: '60px 0' }}>No results for "{query}"</p>
        ) : (
          <p style={{ color: '#4E4E4E', fontSize: '15px', textAlign: 'center', padding: '60px 0' }}>Use the mood buttons or filters to discover movies.</p>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return <Suspense><SearchResults /></Suspense>;
}
