'use client';
import { useState } from 'react';
import Link from 'next/link';
import { createPlaylist } from '@/app/actions/user';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export default function PlaylistsClient({ initialPlaylists, username }: { initialPlaylists: any[], username: string }) {
  const [playlists, setPlaylists] = useState(initialPlaylists);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    const res = await createPlaylist(name, description, isPublic);
    if (res.playlist) {
      setPlaylists(prev => [{ ...res.playlist, playlist_items: [{ count: 0 }] }, ...prev]);
      setName('');
      setDescription('');
      setIsPublic(true);
      setShowCreate(false);
    }
    setLoading(false);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#F2F2F0',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'Inter, sans-serif',
    outline: 'none',
    boxSizing: 'border-box'
  };

  // Predefined gradients for thumbnails
  const gradients = [
    'linear-gradient(135deg, #7B1016 0%, #2A0508 100%)',
    'linear-gradient(135deg, #5D0F14 0%, #1A0305 100%)',
    'linear-gradient(135deg, #98141C 0%, #3B070B 100%)',
    'linear-gradient(135deg, #4A080C 0%, #080808 100%)'
  ];

  return (
    <div style={{ background: '#080808', minHeight: '100vh', padding: '120px 64px 80px', fontFamily: 'Inter, system-ui, sans-serif', color: '#F2F2F0', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h1 style={{ fontSize: '36px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>My Playlists</h1>
            <span style={{ background: 'rgba(123, 16, 22, 0.2)', color: '#7B1016', padding: '4px 12px', borderRadius: '20px', fontSize: '14px', fontWeight: 600, border: '1px solid rgba(123, 16, 22, 0.3)' }}>
              {playlists.length} {playlists.length === 1 ? 'Playlist' : 'Playlists'}
            </span>
          </div>
          <button 
            onClick={() => setShowCreate(true)} 
            style={{ background: '#7B1016', border: 'none', color: '#fff', padding: '12px 24px', borderRadius: '8px', fontWeight: 600, fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Inter, sans-serif', transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#98141C'}
            onMouseLeave={e => e.currentTarget.style.background = '#7B1016'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            New Playlist
          </button>
        </div>

        {/* Content */}
        {playlists.length === 0 && !showCreate ? (
          <div style={{ textAlign: 'center', padding: '100px 0', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '16px', background: 'rgba(255,255,255,0.01)' }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#7E7E7E" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '24px' }}>
              <path d="M21 15V6M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM12 12H3M16 6H3M12 18H3"/>
            </svg>
            <p style={{ fontSize: '20px', color: '#F2F2F0', marginBottom: '8px', fontWeight: 600 }}>No playlists yet</p>
            <p style={{ fontSize: '15px', color: '#7E7E7E', marginBottom: '24px', maxWidth: '300px', margin: '0 auto 24px' }}>Create your first playlist to organize and save your favorite movies.</p>
            <button 
              onClick={() => setShowCreate(true)} 
              style={{ background: '#7B1016', border: 'none', color: '#fff', padding: '12px 28px', borderRadius: '8px', fontWeight: 600, fontSize: '15px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
            >
              Create Playlist
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {playlists.map((pl: any, idx: number) => {
              const defaultGradient = gradients[idx % gradients.length];
              const gradientsMap: Record<string, string> = {
                'gradient-1': 'linear-gradient(135deg, #7B1016 0%, #2A0508 100%)',
                'gradient-2': 'linear-gradient(135deg, #5D0F14 0%, #1A0305 100%)',
                'gradient-3': 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)',
                'gradient-4': 'linear-gradient(135deg, #065f46 0%, #022c22 100%)',
                'gradient-5': 'linear-gradient(135deg, #78350f 0%, #451a03 100%)',
              };
              const coverBg = pl.cover_style 
                ? (pl.cover_style.startsWith('http') ? `url(${pl.cover_style}) center/cover no-repeat` : gradientsMap[pl.cover_style] || defaultGradient)
                : defaultGradient;
              const date = new Date(pl.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
              
              return (
                <Link key={pl.id} href={`/playlists/${slugify(pl.name)}-${username}`} style={{ textDecoration: 'none' }}>
                  <div 
                    style={{ 
                      background: 'rgba(255,255,255,0.03)', 
                      border: '1px solid rgba(255,255,255,0.08)', 
                      borderRadius: '12px', 
                      overflow: 'hidden', 
                      transition: 'all 0.2s ease', 
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%'
                    }}
                    onMouseEnter={e => { 
                      e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; 
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; 
                      e.currentTarget.style.transform = 'translateY(-4px)'; 
                    }}
                    onMouseLeave={e => { 
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; 
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; 
                      e.currentTarget.style.transform = 'none'; 
                    }}
                  >
                    {/* Thumbnail */}
                    <div style={{ height: '140px', background: coverBg, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15V6M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM12 12H3M16 6H3M12 18H3"/>
                      </svg>
                      <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, color: '#F2F2F0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {pl.playlist_items?.[0]?.count || 0} items
                      </div>
                    </div>
                    
                    {/* Card Body */}
                    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#F2F2F0', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, paddingRight: '12px' }}>
                          {pl.name}
                        </h3>
                        {pl.is_public ? (
                          <span title="Public" style={{ color: '#7E7E7E', display: 'flex' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg></span>
                        ) : (
                          <span title="Private" style={{ color: '#7B1016', display: 'flex' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>
                        )}
                      </div>
                      
                      <p style={{ 
                        fontSize: '14px', 
                        color: '#7E7E7E', 
                        margin: '0 0 16px 0', 
                        display: '-webkit-box', 
                        WebkitLineClamp: 2, 
                        WebkitBoxOrient: 'vertical', 
                        overflow: 'hidden', 
                        lineHeight: '1.5',
                        flex: 1
                      }}>
                        {pl.description || 'No description provided.'}
                      </p>
                      
                      <div style={{ fontSize: '12px', color: 'rgba(126, 126, 126, 0.7)', marginTop: 'auto' }}>
                        Created {date}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '480px', background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#F2F2F0', margin: 0 }}>Create Playlist</h2>
              <button onClick={() => setShowCreate(false)} style={{ background: 'transparent', border: 'none', color: '#7E7E7E', cursor: 'pointer', display: 'flex', padding: '4px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#7E7E7E', marginBottom: '8px' }}>Playlist Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="E.g. Sci-Fi Masterpieces" 
                  style={inputStyle} 
                  required 
                  autoFocus
                />
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#7E7E7E', marginBottom: '8px' }}>Description <span style={{ fontWeight: 400, opacity: 0.7 }}>(Optional)</span></label>
                <textarea 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  placeholder="What's this playlist about?" 
                  style={{ ...inputStyle, resize: 'vertical' as const, minHeight: '100px' }} 
                />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontSize: '15px', color: '#F2F2F0', fontWeight: 600, marginBottom: '4px' }}>Make Public</div>
                  <div style={{ fontSize: '13px', color: '#7E7E7E' }}>Anyone can view this playlist</div>
                </div>
                <div onClick={() => setIsPublic(!isPublic)} style={{ width: '48px', height: '26px', background: isPublic ? '#7B1016' : 'rgba(255,255,255,0.1)', borderRadius: '13px', position: 'relative', cursor: 'pointer', transition: 'background 0.3s ease' }}>
                  <div style={{ position: 'absolute', top: '3px', left: isPublic ? '25px' : '3px', width: '20px', height: '20px', background: '#fff', borderRadius: '50%', transition: 'left 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '16px' }}>
                <button type="button" onClick={() => setShowCreate(false)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: 'none', padding: '14px', borderRadius: '8px', color: '#F2F2F0', fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>Cancel</button>
                <button type="submit" disabled={loading || !name.trim()} style={{ flex: 1, background: '#7B1016', border: 'none', padding: '14px', borderRadius: '8px', color: '#fff', fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 600, cursor: (loading || !name.trim()) ? 'not-allowed' : 'pointer', opacity: (loading || !name.trim()) ? 0.6 : 1, transition: 'background 0.2s' }} onMouseEnter={e => { if(!loading && name.trim()) e.currentTarget.style.background = '#98141C'; }} onMouseLeave={e => { if(!loading && name.trim()) e.currentTarget.style.background = '#7B1016'; }}>{loading ? 'Creating...' : 'Create Playlist'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
