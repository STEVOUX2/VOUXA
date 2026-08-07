'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { MovieCard } from '@/components/ui/MovieCard';

interface WatchlistItem {
  tmdb_id: string;
  media_type: string;
}

interface WatchlistClientProps {
  initialItems: WatchlistItem[];
}

export default function WatchlistClient({ initialItems }: WatchlistClientProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('Recently Added');

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
        if (!apiKey) {
          console.error("Missing TMDB API Key");
          setLoading(false);
          return;
        }

        const promises = initialItems.map(async (item, index) => {
          const type = item.media_type === 'tv' ? 'tv' : 'movie';
          const res = await fetch(`https://api.tmdb.org/3/${type}/${item.tmdb_id}?api_key=${apiKey}`);
          if (!res.ok) return null;
          
          const data = await res.json();
          return {
            ...data,
            media_type: item.media_type,
            original_index: index,
            title: data.title || data.name,
            genre_ids: data.genres?.map((g: { id: number }) => g.id) || []
          };
        });

        const results = await Promise.all(promises);
        setItems(results.filter(Boolean));
      } catch (err) {
        console.error("Failed to fetch watchlist details:", err);
      } finally {
        setLoading(false);
      }
    };

    if (initialItems && initialItems.length > 0) {
      fetchItems();
    } else {
      setLoading(false);
    }
  }, [initialItems]);

  const filteredItems = useMemo(() => {
    let filtered = items;
    
    // Type Filter
    if (filter === 'Movies') {
      filtered = filtered.filter(item => item.media_type === 'movie');
    } else if (filter === 'TV Shows') {
      filtered = filtered.filter(item => item.media_type === 'tv' && !item.genre_ids?.includes(16));
    } else if (filter === 'Anime') {
      filtered = filtered.filter(item => item.genre_ids?.includes(16)); // TMDB animation genre id is 16
    }

    // Search Filter
    if (search.trim()) {
      const s = search.toLowerCase();
      filtered = filtered.filter(item => item.title?.toLowerCase().includes(s));
    }

    // Sorting
    filtered = [...filtered];
    if (sort === 'A-Z') {
      filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sort === 'Z-A') {
      filtered.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
    } else {
      // Recently Added (reverse of provided initialItems array order)
      filtered.sort((a, b) => b.original_index - a.original_index);
    }

    return filtered;
  }, [items, filter, search, sort]);

  const totalCount = items.length;
  const moviesCount = items.filter(i => i.media_type === 'movie').length;
  const tvCount = items.filter(i => i.media_type === 'tv').length;

  return (
    <div className="watchlist-page" style={{ 
      backgroundColor: '#080808', 
      color: '#F2F2F0', 
      fontFamily: 'Inter, sans-serif', 
      minHeight: '100vh', 
      padding: '120px 64px 80px', 
      boxSizing: 'border-box' 
    }}>
      <style>{`
        @media (max-width: 768px) {
          .watchlist-page { padding: 100px 16px 40px !important; }
          .watchlist-header { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
          .watchlist-stats { flex-direction: column !important; gap: 12px !important; margin-bottom: 24px !important; }
          .watchlist-controls { flex-direction: column !important; align-items: stretch !important; gap: 16px !important; }
          .watchlist-filters { overflow-x: auto; white-space: nowrap; padding-bottom: 8px; }
          .watchlist-search-sort { flex-direction: column !important; }
          .watchlist-search-sort input, .watchlist-search-sort select { width: 100% !important; }
          .watchlist-grid { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)) !important; gap: 16px !important; }
        }
      `}</style>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Header Section */}
        <div className="watchlist-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ width: '4px', height: '32px', backgroundColor: '#7B1016', marginRight: '16px', borderRadius: '2px' }}></div>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: 0 }}>My Watchlist</h1>
          <span style={{ 
            marginLeft: '16px', 
            backgroundColor: 'rgba(255,255,255,0.05)', 
            color: '#7E7E7E', 
            padding: '4px 12px', 
            borderRadius: '16px', 
            fontSize: '14px', 
            fontWeight: '500',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            {totalCount} Items
          </span>
        </div>

        {/* Stats Row */}
        <div className="watchlist-stats" style={{ display: 'flex', gap: '24px', marginBottom: '40px', color: '#7E7E7E', fontSize: '14px' }}>
          <span>Total: <strong style={{ color: '#F2F2F0', fontWeight: '600' }}>{totalCount}</strong></span>
          <span>Movies: <strong style={{ color: '#F2F2F0', fontWeight: '600' }}>{moviesCount}</strong></span>
          <span>TV Shows: <strong style={{ color: '#F2F2F0', fontWeight: '600' }}>{tvCount}</strong></span>
        </div>

        {/* Filters & Actions */}
        <div className="watchlist-controls" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '40px', 
          flexWrap: 'wrap', 
          gap: '24px' 
        }}>
          {/* Tabs */}
          <div className="watchlist-filters" style={{ display: 'flex', gap: '8px' }}>
            {['All', 'Movies', 'TV Shows', 'Anime'].map(tab => {
              const isActive = filter === tab;
              return (
                <button 
                  key={tab}
                  onClick={() => setFilter(tab)}
                  style={{
                    padding: '8px 24px',
                    borderRadius: '24px',
                    border: `1px solid ${isActive ? '#7B1016' : 'rgba(255,255,255,0.1)'}`,
                    backgroundColor: isActive ? 'rgba(123, 16, 22, 0.1)' : 'transparent',
                    color: isActive ? '#F2F2F0' : '#7E7E7E',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          <div className="watchlist-search-sort" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            {/* Search Input */}
            <input 
              type="text"
              placeholder="Search watchlist..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                backgroundColor: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '10px 16px',
                color: '#F2F2F0',
                fontSize: '14px',
                width: '240px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
            />

            {/* Sort Dropdown */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              style={{
                backgroundColor: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '10px 16px',
                color: '#F2F2F0',
                fontSize: '14px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option style={{ backgroundColor: '#111' }} value="Recently Added">Recently Added</option>
              <option style={{ backgroundColor: '#111' }} value="A-Z">A-Z</option>
              <option style={{ backgroundColor: '#111' }} value="Z-A">Z-A</option>
            </select>
          </div>
        </div>

        {/* Content Grid */}
        {loading ? (
          <div className="watchlist-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '24px' }}>
            {Array.from({ length: 18 }).map((_, i) => (
              <div 
                key={i} 
                style={{ 
                  aspectRatio: '2/3', 
                  backgroundColor: 'rgba(255,255,255,0.05)', 
                  borderRadius: '12px', 
                  animation: 'pulse 1.5s infinite ease-in-out' 
                }} 
              />
            ))}
            <style>{`
              @keyframes pulse {
                0% { opacity: 0.3; }
                50% { opacity: 0.7; }
                100% { opacity: 0.3; }
              }
            `}</style>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="watchlist-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '24px' }}>
            {filteredItems.map(item => (
              <MovieCard key={item.id} movie={item} variant="portrait" />
            ))}
          </div>
        ) : (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '80px 20px', 
            border: '1px dashed rgba(255,255,255,0.1)', 
            borderRadius: '16px', 
            backgroundColor: 'rgba(255,255,255,0.02)' 
          }}>
            <svg 
              width="64" height="64" viewBox="0 0 24 24" 
              fill="none" stroke="#7E7E7E" strokeWidth="1.5" 
              strokeLinecap="round" strokeLinejoin="round" 
              style={{ marginBottom: '24px' }}
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: '#F2F2F0' }}>
              Your watchlist is empty
            </h3>
            <p style={{ color: '#7E7E7E', marginBottom: '24px', maxWidth: '300px', textAlign: 'center', lineHeight: '1.5' }}>
              {search 
                ? "No items match your current filters and search criteria." 
                : "Looks like you haven't added any movies, shows, or anime to your watchlist yet."}
            </p>
            {!search && (
              <Link 
                href="/" 
                style={{ 
                  backgroundColor: '#7B1016', 
                  color: '#F2F2F0', 
                  padding: '12px 24px', 
                  borderRadius: '8px', 
                  textDecoration: 'none', 
                  fontWeight: '500', 
                  transition: 'background 0.2s',
                  boxShadow: '0 4px 12px rgba(123,16,22,0.3)'
                }}
              >
                Browse Movies
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
