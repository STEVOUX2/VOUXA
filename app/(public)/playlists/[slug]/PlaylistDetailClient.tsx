'use client';

import { useState } from 'react';
import Link from 'next/link';
import { updatePlaylist, addToPlaylist, removeFromPlaylist, searchMedia, deletePlaylist } from '@/app/actions/user';
import * as LucideIcons from 'lucide-react';

interface PlaylistDetailClientProps {
  playlist: any;
  initialItems: any[];
  isOwner: boolean;
  authorProfile: any;
  authorDisplayName: string;
}

export default function PlaylistDetailClient({ playlist: initialPlaylist, initialItems, isOwner, authorProfile, authorDisplayName }: PlaylistDetailClientProps) {
  const [playlist, setPlaylist] = useState(initialPlaylist);
  const [items, setItems] = useState<any[]>(initialItems);
  
  // Settings Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(playlist.name);
  const [description, setDescription] = useState(playlist.description || '');
  const [isPublic, setIsPublic] = useState(playlist.is_public);
  const [coverStyle, setCoverStyle] = useState(playlist.cover_style || 'gradient-1');
  const [customCoverUrl, setCustomCoverUrl] = useState(playlist.cover_style?.startsWith('http') ? playlist.cover_style : '');
  const [saveLoading, setSaveLoading] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const gradients: Record<string, string> = {
    'gradient-1': 'linear-gradient(135deg, #7B1016 0%, #2A0508 100%)',
    'gradient-2': 'linear-gradient(135deg, #5D0F14 0%, #1A0305 100%)',
    'gradient-3': 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)',
    'gradient-4': 'linear-gradient(135deg, #065f46 0%, #022c22 100%)',
    'gradient-5': 'linear-gradient(135deg, #78350f 0%, #451a03 100%)',
  };

  const getCoverBackground = (style: string) => {
    if (!style) return gradients['gradient-1'];
    if (style.startsWith('http')) {
      return `url(${style}) center/cover no-repeat`;
    }
    return gradients[style] || gradients['gradient-1'];
  };

  // Search TMDB
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const res = await searchMedia(query);
      if (res.results) {
        setSearchResults((res.results || []).filter((r: any) => r.media_type === 'movie' || r.media_type === 'tv').slice(0, 5));
      } else if (res.error) {
        showToast(res.error, 'error');
      }
    } catch (e) {
      console.error(e);
    }
    setSearchLoading(false);
  };

  // Add Item to Playlist
  const handleAddItem = async (item: any) => {
    const title = item.title || item.name;
    const posterPath = item.poster_path;
    
    const res = await addToPlaylist(playlist.id, item.id, item.media_type, title, posterPath);
    if (res.error) {
      showToast(res.error, 'error');
    } else {
      showToast(`Added ${title} to playlist!`, 'success');
      setItems(prev => [
        ...prev,
        {
          id: Math.random().toString(), // local fallback id
          playlist_id: playlist.id,
          tmdb_id: item.id,
          media_type: item.media_type,
          title,
          poster_path: posterPath,
          vote_average: item.vote_average,
          release_date: item.release_date || item.first_air_date
        }
      ]);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  // Remove Item from Playlist
  const handleRemoveItem = async (itemId: number, mediaType: string, title: string) => {
    const res = await removeFromPlaylist(playlist.id, itemId, mediaType);
    if (res.error) {
      showToast(res.error, 'error');
    } else {
      showToast(`Removed ${title}`, 'success');
      setItems(prev => prev.filter(item => !(item.tmdb_id === itemId && item.media_type === mediaType)));
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    const finalCover = customCoverUrl.trim() || coverStyle;
    const res = await updatePlaylist(playlist.id, name, description, isPublic, finalCover);
    if (res.error) {
      showToast(res.error, 'error');
    } else {
      showToast('Playlist updated successfully!', 'success');
      setPlaylist((prev: any) => ({
        ...prev,
        name,
        description,
        is_public: isPublic,
        cover_style: finalCover
      }));
      setIsEditing(false);
    }
    setSaveLoading(false);
  };

  const handleDeletePlaylist = async () => {
    if (!window.confirm("Are you sure you want to delete this playlist? This action cannot be undone.")) return;
    const res = await deletePlaylist(playlist.id);
    if (res.error) {
      showToast(res.error, 'error');
    } else {
      showToast('Playlist deleted!', 'success');
      window.location.href = '/playlists';
    }
  };

  return (
    <div style={{ background: '#080808', minHeight: '100vh', padding: '120px 64px 80px', fontFamily: 'Inter, system-ui, sans-serif', color: '#F2F2F0' }}>
      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        .remove-btn {
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .item-card:hover .remove-btn {
          opacity: 1;
        }
      `}</style>
      
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        {/* Breadcrumb */}
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Link href={`/u/${authorProfile.username}`} style={{ color: '#7E7E7E', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
              @{authorProfile.username}
            </Link>
            <span style={{ color: '#4E4E4E', margin: '0 8px' }}>/</span>
            <span style={{ color: '#F2F2F0', fontSize: '14px', fontWeight: 500 }}>Playlists</span>
          </div>
          {isOwner && (
            <button 
              onClick={() => setIsEditing(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', padding: '10px 18px', borderRadius: '10px', color: '#F2F2F0', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
            >
              <LucideIcons.Settings size={16} />
              Playlist Settings
            </button>
          )}
        </div>

        {/* Playlist Header Card */}
        <div style={{ display: 'flex', gap: '32px', marginBottom: '40px', padding: '32px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
          {/* Cover Art */}
          <div style={{ 
            width: '100px', height: '100px', borderRadius: '20px', 
            background: getCoverBackground(playlist.cover_style), 
            border: '1px solid rgba(255,255,255,0.1)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            fontSize: '44px', color: '#fff', flexShrink: 0,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
          }}>
            {!playlist.cover_style?.startsWith('http') && '📋'}
          </div>
          <div style={{ zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#F2F2F0', margin: 0, letterSpacing: '-0.02em' }}>{playlist.name}</h1>
              {!playlist.is_public && (
                <span style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', padding: '3px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 700, color: '#7E7E7E', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <LucideIcons.Lock size={10} /> Private
                </span>
              )}
            </div>
            {playlist.description && (
              <p style={{ color: '#B9B9B9', fontSize: '15px', margin: '0 0 12px 0', lineHeight: 1.5 }}>{playlist.description}</p>
            )}
            <p style={{ color: '#7E7E7E', fontSize: '14px', margin: 0 }}>
              Curated by <Link href={`/u/${authorProfile.username}`} style={{ color: '#ff6b6b', textDecoration: 'none', fontWeight: 600 }}>{authorDisplayName}</Link> · {items.length} {items.length === 1 ? 'item' : 'items'}
            </p>
          </div>
        </div>

        {/* Curator Add Movies Section */}
        {isOwner && (
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px', marginBottom: '40px', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '3px', height: '18px', background: 'linear-gradient(180deg,#7B1016,#5D0F14)', borderRadius: '999px' }} />
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#F2F2F0', margin: 0 }}>Add Movies & TV Shows</h2>
            </div>
            
            <div style={{ position: 'relative', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '0 16px', width: '100%', boxSizing: 'border-box' }}>
                <LucideIcons.Search size={18} style={{ color: '#7E7E7E', marginRight: '12px' }} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => handleSearch(e.target.value)}
                  placeholder="Search by title..." 
                  style={{ width: '100%', background: 'transparent', border: 'none', color: '#F2F2F0', padding: '14px 0', fontSize: '14px', outline: 'none', fontFamily: 'Inter, sans-serif' }}
                />
              </div>

              {/* Live search results overlay */}
              {searchResults.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px', background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden', zIndex: 100, boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}>
                  {searchResults.map((item: any) => {
                    const poster = item.poster_path ? `https://image.tmdb.org/t/p/w92${item.poster_path}` : '';
                    const year = item.release_date || item.first_air_date ? new Date(item.release_date || item.first_air_date).getFullYear() : 'N/A';
                    
                    return (
                      <div 
                        key={item.id} 
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div style={{ width: '36px', height: '54px', borderRadius: '6px', background: '#222', overflow: 'hidden', flexShrink: 0 }}>
                            {poster ? <img src={poster} alt={item.title || item.name || 'Poster'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🎬'}
                          </div>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#F2F2F0' }}>{item.title || item.name}</div>
                            <div style={{ fontSize: '12px', color: '#7E7E7E', marginTop: '3px' }}>
                              {item.media_type === 'tv' ? 'TV Show' : 'Movie'} · {year} · ★ {item.vote_average?.toFixed(1) || '0.0'}
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleAddItem(item)}
                          style={{ background: '#7B1016', border: 'none', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', transition: 'background 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#98141C'}
                          onMouseLeave={e => e.currentTarget.style.background = '#7B1016'}
                        >
                          <LucideIcons.Plus size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Items List */}
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', background: 'rgba(255,255,255,0.01)', borderRadius: '20px', border: '1px dashed rgba(255,255,255,0.08)' }}>
            <LucideIcons.Film size={48} style={{ color: '#4E4E4E', marginBottom: '16px' }} />
            <p style={{ color: '#7E7E7E', fontSize: '15px', margin: 0 }}>This playlist doesn't have any items yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '20px' }}>
            {items.map((item: any) => {
              const posterUrl = item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : '';
              const href = item.media_type === 'tv' ? `/tv/${item.tmdb_id}` : `/movie/${item.tmdb_id}`;
              const year = item.release_date ? new Date(item.release_date).getFullYear() : '';
              
              return (
                <div key={item.id} className="item-card" style={{ position: 'relative' }}>
                  <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>
                    <div style={{ borderRadius: '12px', overflow: 'hidden', background: '#171717', border: '1px solid rgba(255,255,255,0.05)', transition: 'transform 0.2s, box-shadow 0.2s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 24px rgba(0,0,0,0.5)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
                    >
                      <div style={{ position: 'relative', width: '100%', aspectRatio: '2/3', background: '#111' }}>
                        {posterUrl ? (
                          <img src={posterUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4E4E4E' }}>🎬</div>
                        )}
                        <div style={{ position: 'absolute', top: '6px', left: '6px', background: 'rgba(0,0,0,0.7)', padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 700, color: '#B9B9B9', textTransform: 'uppercase' }}>
                          {item.media_type === 'tv' ? 'TV' : 'Movie'}
                        </div>
                      </div>
                      <div style={{ padding: '10px 12px' }}>
                        <p style={{ color: '#F2F2F0', fontSize: '13px', fontWeight: 600, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.title}
                        </p>
                        <p style={{ color: '#7E7E7E', fontSize: '11px', margin: 0 }}>
                          ★ {item.vote_average ? item.vote_average.toFixed(1) : '0.0'} · {year}
                        </p>
                      </div>
                    </div>
                  </Link>

                  {/* Creator delete item handle */}
                  {isOwner && (
                    <button 
                      className="remove-btn"
                      onClick={() => handleRemoveItem(item.tmdb_id, item.media_type, item.title)}
                      style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(255,255,255,0.1)', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff6b6b', cursor: 'pointer', zIndex: 10, backdropFilter: 'blur(5px)' }}
                    >
                      <LucideIcons.Trash size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Playlist Edit Settings Modal */}
      {isEditing && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}>
          <div style={{ width: '100%', maxWidth: '440px', background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '32px', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#F2F2F0', marginBottom: '24px', margin: '0 0 24px' }}>Playlist Settings</h2>
            <form onSubmit={handleSaveSettings}>
              {/* Name */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#7E7E7E', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Playlist Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Enter playlist name" style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#F2F2F0', padding: '12px 16px', borderRadius: '10px', fontSize: '15px', outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }} />
              </div>

              {/* Description */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#7E7E7E', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Add an optional description..." style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#F2F2F0', padding: '12px 16px', borderRadius: '10px', fontSize: '15px', outline: 'none', fontFamily: 'Inter, sans-serif', resize: 'vertical', height: '80px', boxSizing: 'border-box' }} />
              </div>

              {/* Public/Private Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#F2F2F0', marginBottom: '2px' }}>Public Playlist</div>
                  <div style={{ fontSize: '11px', color: '#7E7E7E' }}>Visible on your profile and search.</div>
                </div>
                <div onClick={() => setIsPublic(!isPublic)} style={{ width: '44px', height: '24px', background: isPublic ? '#7B1016' : 'rgba(255,255,255,0.1)', borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: 'background 0.25s', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: '2px', left: isPublic ? '22px' : '2px', width: '20px', height: '20px', background: isPublic ? '#ff6b6b' : '#fff', borderRadius: '50%', transition: 'left 0.25s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
                </div>
              </div>

              {/* Cover selector */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#7E7E7E', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Playlist Cover</label>
                
                {/* Presets */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                  {Object.keys(gradients).map(gradKey => (
                    <div 
                      key={gradKey}
                      onClick={() => { setCoverStyle(gradKey); setCustomCoverUrl(''); }}
                      style={{ 
                        width: '40px', height: '40px', borderRadius: '8px', 
                        background: gradients[gradKey], cursor: 'pointer', 
                        border: coverStyle === gradKey && !customCoverUrl ? '2px solid #ff6b6b' : '2px solid transparent',
                        boxSizing: 'border-box', transition: 'all 0.15s'
                      }}
                    />
                  ))}
                </div>

                <div style={{ fontSize: '11px', color: '#7E7E7E', marginBottom: '6px' }}>Or enter custom cover image URL</div>
                <input 
                  type="text" 
                  value={customCoverUrl} 
                  onChange={e => setCustomCoverUrl(e.target.value)} 
                  placeholder="https://example.com/image.jpg" 
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#F2F2F0', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }} 
                />
              </div>

              {/* Delete Playlist Button */}
              <div style={{ marginBottom: '24px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px' }}>
                <button 
                  type="button" 
                  onClick={handleDeletePlaylist} 
                  style={{ width: '100%', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', padding: '12px', borderRadius: '10px', color: '#f87171', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
                >
                  <LucideIcons.Trash2 size={15} />
                  Delete Playlist
                </button>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setIsEditing(false)} style={{ flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '10px', color: '#ECE8DD', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={saveLoading} style={{ flex: 1, background: '#7B1016', border: 'none', padding: '12px', borderRadius: '10px', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: saveLoading ? 'not-allowed' : 'pointer', opacity: saveLoading ? 0.7 : 1 }}>{saveLoading ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '32px', right: '32px', zIndex: 1000,
          background: toast.type === 'error' ? 'rgba(123,16,22,0.92)' : 'rgba(15,15,15,0.92)',
          border: toast.type === 'error' ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.08)',
          color: '#F2F2F0', padding: '14px 24px', borderRadius: '12px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)',
          fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: '10px',
          animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {toast.type === 'error' ? <LucideIcons.AlertCircle size={16} style={{ color: '#ff6b6b' }} /> : <LucideIcons.CheckCircle size={16} style={{ color: '#22c55e' }} />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
