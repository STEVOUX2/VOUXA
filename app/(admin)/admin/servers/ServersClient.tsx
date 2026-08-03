'use client';

import { useState } from 'react';
import { addServer, updateServer, deleteServer } from './actions';
import { EyeIcon, EyeOffIcon, Edit2Icon, Trash2Icon, PlusIcon, GripVertical } from 'lucide-react';

export function ServersClient({ initialServers }: { initialServers: any[] }) {
  const [servers, setServers] = useState(initialServers);
  const [isEditing, setIsEditing] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', url_template: '', media_type: 'movie', is_hidden: false });
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('movie');
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const categories = ['movie', 'tv', 'anime', 'general'];

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const list = servers
      .filter(s => s.media_type === activeCategory)
      .sort((a, b) => (a.position || 0) - (b.position || 0));

    const draggedItem = list[draggedIndex];
    const remainingItems = list.filter((_, idx) => idx !== draggedIndex);
    
    // Insert dragged item at target index
    const reorderedList = [
      ...remainingItems.slice(0, targetIndex),
      draggedItem,
      ...remainingItems.slice(targetIndex)
    ];

    // Re-assign positions based on new index
    const updatedServers = [...servers];
    for (let i = 0; i < reorderedList.length; i++) {
      const server = reorderedList[i];
      server.position = i + 1;
      
      const match = updatedServers.find(s => s.id === server.id);
      if (match) match.position = i + 1;
      
      await updateServer(server.id, { position: i + 1 });
    }

    setServers(updatedServers);
    setDraggedIndex(null);
  };

  const handleMove = async (server: any, direction: 'up' | 'down') => {
    const list = servers
      .filter(s => s.media_type === server.media_type)
      .sort((a, b) => (a.position || 0) - (b.position || 0));
      
    const index = list.findIndex(s => s.id === server.id);
    if (index === -1) return;
    
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    
    const targetServer = list[targetIndex];
    
    // Swap positions
    const currentPos = server.position || 0;
    const targetPos = targetServer.position || 0;
    
    const newPosSelf = targetPos;
    const newPosTarget = currentPos === targetPos ? currentPos + (direction === 'up' ? -1 : 1) : currentPos;
    
    server.position = newPosSelf;
    targetServer.position = newPosTarget;
    
    // Update locally
    setServers([...servers]);
    
    // Update DB
    await updateServer(server.id, { position: newPosSelf });
    await updateServer(targetServer.id, { position: newPosTarget });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      await updateServer(isEditing.id, formData);
      setServers(servers.map(s => s.id === isEditing.id ? { ...s, ...formData } : s));
    } else {
      const res = await addServer(formData);
      if (res.success) {
        window.location.reload(); // Simple reload to get new ID
      }
    }
    setShowModal(false);
  };

  const handleEdit = (s: any) => {
    setIsEditing(s);
    setFormData({ name: s.name, url_template: s.url_template, media_type: s.media_type, is_hidden: s.is_hidden });
    setShowModal(true);
  };

  const handleAddNew = () => {
    setIsEditing(null);
    setFormData({ name: '', url_template: '', media_type: 'movie', is_hidden: false });
    setShowModal(true);
  };

  const toggleHide = async (s: any) => {
    await updateServer(s.id, { is_hidden: !s.is_hidden });
    setServers(servers.map(serv => serv.id === s.id ? { ...serv, is_hidden: !s.is_hidden } : serv));
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this server?")) {
      await deleteServer(id);
      setServers(servers.filter(s => s.id !== id));
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        {/* Category Sort / Filter Select */}
        <div style={{ position: 'relative', width: '200px' }}>
          <div 
            onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
            style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: '8px', padding: '10px 16px', color: '#fff', cursor: 'pointer', textTransform: 'capitalize',
              fontWeight: 600, fontSize: '14px'
            }}
          >
            <span>Sort: {activeCategory === 'tv' ? 'Series' : activeCategory}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: filterDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
          
          {filterDropdownOpen && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px', zIndex: 100,
              background: '#121212', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
              overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              display: 'flex', flexDirection: 'column', padding: '4px'
            }}>
              {[
                { id: 'movie', name: 'Movie' },
                { id: 'tv', name: 'Series' },
                { id: 'anime', name: 'Anime' },
                { id: 'general', name: 'General' }
              ].map((opt) => (
                <div 
                  key={opt.id} 
                  onClick={() => { setActiveCategory(opt.id); setFilterDropdownOpen(false); }}
                  style={{
                    padding: '10px 12px', fontSize: '14px', color: activeCategory === opt.id ? '#F2F2F0' : '#B9B9B9',
                    background: activeCategory === opt.id ? 'rgba(123,16,22,0.4)' : 'transparent',
                    borderRadius: '4px', cursor: 'pointer', transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => { if (activeCategory !== opt.id) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                  onMouseLeave={e => { if (activeCategory !== opt.id) e.currentTarget.style.background = 'transparent' }}
                >
                  {opt.name}
                </div>
              ))}
            </div>
          )}
        </div>

        <button onClick={handleAddNew} style={{
          background: '#7B1016', color: '#fff', padding: '10px 20px', borderRadius: '8px',
          border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600
        }}>
          <PlusIcon size={18} /> Add Server
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#F2F2F0', marginBottom: '16px', textTransform: 'capitalize' }}>
            {activeCategory === 'tv' ? 'Series' : activeCategory} Servers
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(() => {
              const uniqueNames = new Set();
              return servers
                .filter(s => activeCategory === 'general' ? true : s.media_type === activeCategory)
                .filter(s => {
                  if (activeCategory === 'general') {
                    if (uniqueNames.has(s.name.toLowerCase())) return false;
                    uniqueNames.add(s.name.toLowerCase());
                  }
                  return true;
                })
                .sort((a, b) => (a.position || 0) - (b.position || 0));
            })()
            .map((s, idx, arr) => (
                <div 
                  key={s.id} 
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, idx)}
                  style={{
                    background: draggedIndex === idx ? 'rgba(123, 16, 22, 0.15)' : 'rgba(23, 23, 23, 0.6)', 
                    border: draggedIndex === idx ? '1px dashed #7B1016' : '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '12px', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    opacity: s.is_hidden ? 0.5 : 1,
                    cursor: 'grab',
                    transition: 'background 0.2s, border 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {/* Drag handle */}
                    <div style={{ color: '#7E7E7E', cursor: 'grab', display: 'flex', alignItems: 'center' }}>
                      <GripVertical size={20} />
                    </div>
                    {/* Sort buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <button 
                        disabled={idx === 0}
                        onClick={() => handleMove(s, 'up')} 
                        style={{ background: 'transparent', border: 'none', cursor: idx === 0 ? 'not-allowed' : 'pointer', color: idx === 0 ? '#444' : '#B9B9B9', padding: 0 }}
                      >
                        ▲
                      </button>
                      <button 
                        disabled={idx === arr.length - 1}
                        onClick={() => handleMove(s, 'down')} 
                        style={{ background: 'transparent', border: 'none', cursor: idx === arr.length - 1 ? 'not-allowed' : 'pointer', color: idx === arr.length - 1 ? '#444' : '#B9B9B9', padding: 0 }}
                      >
                        ▼
                      </button>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <h3 style={{ margin: 0, color: '#F2F2F0', fontSize: '16px', fontWeight: 600 }}>{s.name}</h3>
                        {s.is_hidden && <span style={{ background: 'rgba(255,255,255,0.1)', color: '#B9B9B9', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>HIDDEN</span>}
                        {activeCategory === 'general' && (
                          <span style={{ background: 'rgba(255,255,255,0.05)', color: '#7E7E7E', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, textTransform: 'capitalize' }}>
                            {s.media_type}
                          </span>
                        )}
                        <span style={{ fontSize: '11px', color: '#7E7E7E' }}>Pos: {s.position || 0}</span>
                      </div>
                      <p style={{ margin: '4px 0 0 0', color: '#7E7E7E', fontSize: '13px', fontFamily: 'monospace' }}>{s.url_template}</p>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => toggleHide(s)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', padding: '8px', borderRadius: '8px', color: '#B9B9B9', cursor: 'pointer' }}>
                      {s.is_hidden ? <EyeIcon size={16} /> : <EyeOffIcon size={16} />}
                    </button>
                    <button onClick={() => handleEdit(s)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', padding: '8px', borderRadius: '8px', color: '#B9B9B9', cursor: 'pointer' }}>
                      <Edit2Icon size={16} />
                    </button>
                    <button onClick={() => handleDelete(s.id)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', padding: '8px', borderRadius: '8px', color: '#ff6b6b', cursor: 'pointer' }}>
                      <Trash2Icon size={16} />
                    </button>
                  </div>
                </div>
              ))}
            {(() => {
              const uniqueNames = new Set();
              const filtered = servers
                .filter(s => activeCategory === 'general' ? true : s.media_type === activeCategory)
                .filter(s => {
                  if (activeCategory === 'general') {
                    if (uniqueNames.has(s.name.toLowerCase())) return false;
                    uniqueNames.add(s.name.toLowerCase());
                  }
                  return true;
                });
              return filtered.length === 0;
            })() && (
              <div style={{ color: '#7E7E7E', textAlign: 'center', padding: '32px' }}>No servers configured for this category.</div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#171717', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '500px' }}>
            <h2 style={{ margin: '0 0 24px 0', color: '#F2F2F0', fontSize: '20px' }}>{isEditing ? 'Edit Server' : 'Add Server'}</h2>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#B9B9B9', fontSize: '13px', fontWeight: 600 }}>Server Name</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px', color: '#fff', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#B9B9B9', fontSize: '13px', fontWeight: 600 }}>URL Template (use {'{id}'} for tmdb_id)</label>
                <input required value={formData.url_template} onChange={e => setFormData({...formData, url_template: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px', color: '#fff', outline: 'none', fontFamily: 'monospace' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#B9B9B9', fontSize: '13px', fontWeight: 600 }}>Category</label>
                <div style={{ position: 'relative' }}>
                  <div 
                    onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                    style={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', 
                      borderRadius: '8px', padding: '12px', color: '#fff', cursor: 'pointer', textTransform: 'capitalize' 
                    }}
                  >
                    <span>{formData.media_type === 'tv' ? 'TV Shows' : formData.media_type}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: categoryDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                  
                  {categoryDropdownOpen && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px', zIndex: 100,
                      background: '#121212', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                      overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                      display: 'flex', flexDirection: 'column', padding: '4px'
                    }}>
                      {[
                        { id: 'movie', name: 'Movies' },
                        { id: 'tv', name: 'TV Shows' },
                        { id: 'anime', name: 'Anime' },
                        { id: 'general', name: 'General' }
                      ].map((opt) => (
                        <div 
                          key={opt.id} 
                          onClick={() => { setFormData({ ...formData, media_type: opt.id }); setCategoryDropdownOpen(false); }}
                          style={{
                            padding: '10px 12px', fontSize: '14px', color: formData.media_type === opt.id ? '#F2F2F0' : '#B9B9B9',
                            background: formData.media_type === opt.id ? 'rgba(123,16,22,0.4)' : 'transparent',
                            borderRadius: '4px', cursor: 'pointer', transition: 'background 0.2s'
                          }}
                          onMouseEnter={e => { if (formData.media_type !== opt.id) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                          onMouseLeave={e => { if (formData.media_type !== opt.id) e.currentTarget.style.background = 'transparent' }}
                        >
                          {opt.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ background: 'transparent', color: '#B9B9B9', border: 'none', padding: '10px 20px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                <button type="submit" style={{ background: '#7B1016', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
