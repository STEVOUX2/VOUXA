'use client';

import { useState, useEffect, useMemo } from 'react';
import { MovieCard } from '@/components/ui/MovieCard';

type InitialItem = { tmdb_id: string | number; media_type: string; runtime?: number };

type FilterType = 'All' | 'Movies' | 'TV Shows' | 'Anime';
type SortType = 'Recent' | 'Oldest' | 'A-Z';

export default function HistoryClient({ initialItems }: { initialItems: InitialItem[] }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState<FilterType>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortType>('Recent');

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const promises = initialItems.map(async (item, index) => {
          const res = await fetch(
            `https://api.tmdb.org/3/${item.media_type}/${item.tmdb_id}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&language=en-US`
          );
          if (!res.ok) return null;
          const data = await res.json();
          return {
            ...data,
            media_type: item.media_type,
            title: data.title || data.name,
            original_index: index, // To preserve order for "Recently Watched"
            runtime_watched: item.runtime || 0,
          };
        });
        
        const results = await Promise.all(promises);
        setItems(results.filter(r => r !== null));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (initialItems.length > 0) {
      fetchDetails();
    } else {
      setLoading(false);
    }
  }, [initialItems]);

  const stats = useMemo(() => {
    const total = items.length;
    const movies = items.filter(i => i.media_type === 'movie').length;
    const tv = items.filter(i => i.media_type === 'tv').length;
    return { total, movies, tv };
  }, [items]);

  const filteredAndSortedItems = useMemo(() => {
    let result = [...items];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i => i.title?.toLowerCase().includes(q));
    }

    // Filter
    if (filter === 'Movies') {
      result = result.filter(i => i.media_type === 'movie');
    } else if (filter === 'TV Shows') {
      result = result.filter(i => i.media_type === 'tv' && i.original_language !== 'ja');
    } else if (filter === 'Anime') {
      result = result.filter(i => i.media_type === 'tv' && i.original_language === 'ja');
    }

    // Sort
    if (sortBy === 'Recent') {
      result.sort((a, b) => a.original_index - b.original_index); // Assuming earlier in list is more recent
    } else if (sortBy === 'Oldest') {
      result.sort((a, b) => b.original_index - a.original_index);
    } else if (sortBy === 'A-Z') {
      result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }

    return result;
  }, [items, searchQuery, filter, sortBy]);

  return (
    <div className="history-page" style={{
      backgroundColor: '#080808',
      minHeight: '100vh',
      fontFamily: 'Inter, sans-serif',
      color: '#F2F2F0'
    }}>
      <style>{`
        @media (max-width: 768px) {
          .history-container { padding: 100px 16px 40px !important; }
          .history-header { flex-direction: column !important; gap: 16px !important; align-items: flex-start !important; }
          .history-stats { flex-direction: column !important; gap: 16px !important; padding: 16px 0 !important; }
          .history-stats > div:nth-child(even) { height: 1px !important; width: 100% !important; margin: 4px 0 !important; }
          .history-controls { flex-direction: column !important; align-items: stretch !important; gap: 16px !important; padding: 16px !important; }
          .history-filters { overflow-x: auto; white-space: nowrap; padding-bottom: 8px; }
          .history-search-sort { flex-direction: column !important; min-width: 100% !important; }
          .history-search-sort input, .history-search-sort select { width: 100% !important; }
          .history-grid { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)) !important; gap: 16px !important; }
        }
      `}</style>
      <div className="history-container" style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '120px 64px 80px',
        boxSizing: 'border-box'
      }}>
        {/* Header & Stats */}
        <div className="history-header" style={{ marginBottom: '40px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ width: '4px', height: '32px', backgroundColor: '#7B1016', borderRadius: '2px' }} />
            <h1 style={{ fontSize: '36px', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
              Watch History
            </h1>
            <div style={{
              backgroundColor: 'rgba(123, 16, 22, 0.1)',
              color: '#7B1016',
              padding: '4px 12px',
              borderRadius: '999px',
              fontSize: '14px',
              fontWeight: 600,
              marginLeft: '8px'
            }}>
              {stats.total} items
            </div>
          </div>

          <div className="history-stats" style={{ display: 'flex', gap: '32px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', padding: '20px 0' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: '#7E7E7E', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Watched</span>
              <span style={{ fontSize: '24px', fontWeight: 600 }}>{stats.total}</span>
            </div>
            <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: '#7E7E7E', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Movies</span>
              <span style={{ fontSize: '24px', fontWeight: 600 }}>{stats.movies}</span>
            </div>
            <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: '#7E7E7E', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TV / Anime</span>
              <span style={{ fontSize: '24px', fontWeight: 600 }}>{stats.tv}</span>
            </div>
          </div>
        </div>

        {/* Controls: Search, Filter, Sort */}
        <div className="history-controls" style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          gap: '24px',
          marginBottom: '40px',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          padding: '16px 24px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)'
        }}>
          {/* Filters */}
          <div className="history-filters" style={{ display: 'flex', gap: '8px' }}>
            {(['All', 'Movies', 'TV Shows', 'Anime'] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  background: filter === f ? '#7B1016' : 'transparent',
                  color: filter === f ? '#FFFFFF' : '#7E7E7E',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '999px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="history-search-sort" style={{ display: 'flex', gap: '16px', flex: '1', minWidth: '300px', justifyContent: 'flex-end' }}>
            {/* Search */}
            <input
              type="text"
              placeholder="Search history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#F2F2F0',
                padding: '10px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                width: '240px'
              }}
            />

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortType)}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#F2F2F0',
                padding: '10px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="Recent" style={{ background: '#080808' }}>Recently Watched</option>
              <option value="Oldest" style={{ background: '#080808' }}>Oldest First</option>
              <option value="A-Z" style={{ background: '#080808' }}>A-Z</option>
            </select>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="history-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '24px'
          }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} style={{
                width: '100%',
                aspectRatio: '2/3',
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderRadius: '8px',
                animation: 'pulse 1.5s infinite ease-in-out'
              }}>
                <style>{`
                  @keyframes pulse {
                    0% { opacity: 0.5; }
                    50% { opacity: 1; }
                    100% { opacity: 0.5; }
                  }
                `}</style>
              </div>
            ))}
          </div>
        ) : filteredAndSortedItems.length > 0 ? (
          <div className="history-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '24px'
          }}>
            {filteredAndSortedItems.map((item) => (
              <MovieCard
                key={`${item.id}-${item.original_index}`}
                movie={item}
                variant="portrait"
              />
            ))}
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '120px 0',
            backgroundColor: 'rgba(255,255,255,0.02)',
            borderRadius: '16px',
            border: '1px dashed rgba(255,255,255,0.1)'
          }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#7E7E7E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '24px' }}>
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <h3 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 12px 0', color: '#F2F2F0' }}>No history found</h3>
            <p style={{ margin: 0, color: '#7E7E7E', fontSize: '16px', maxWidth: '400px', textAlign: 'center' }}>
              {searchQuery || filter !== 'All' 
                ? 'Try adjusting your filters or search query.' 
                : 'Start watching movies and shows, and they will appear here.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
