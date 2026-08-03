import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

import { auth } from '@/auth';

export const metadata = { title: 'My Favorites | VOUXA' };

export default async function FavoritesPage() {
  const session = await auth();
  if (!session?.user) redirect('/');
  const supabase = await createClient();

  const { data: favorites } = await supabase
    .from('user_favorites')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  const items = favorites || [];
  const movieCount = items.filter(i => i.media_type === 'movie').length;
  const tvCount = items.filter(i => i.media_type === 'tv').length;

  return (
    <div className="favorites-page" style={{ backgroundColor: '#080808', color: '#F2F2F0', fontFamily: 'Inter, sans-serif', minHeight: '100vh', padding: '120px 64px 80px', boxSizing: 'border-box' }}>
      <style dangerouslySetInnerHTML={{__html: `
        .favorite-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          box-shadow: 0 8px 24px rgba(0,0,0,0.4);
        }
        .favorite-link:hover .favorite-card {
          transform: translateY(-6px);
          box-shadow: 0 16px 32px rgba(123, 16, 22, 0.15);
        }
        @media (max-width: 768px) {
          .favorites-page { padding: 100px 16px 40px !important; }
          .favorites-header { flex-direction: column !important; align-items: flex-start !important; gap: 16px !important; }
          .favorites-stats { flex-direction: column !important; gap: 8px !important; padding-left: 0 !important; }
          .favorites-grid { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)) !important; gap: 16px !important; }
        }
      `}} />
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header Section */}
        <div className="favorites-header" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '4px', height: '40px', backgroundColor: '#7B1016', borderRadius: '4px' }}></div>
            <h1 style={{ fontSize: '36px', fontWeight: 700, margin: 0, letterSpacing: '-0.5px' }}>My Favorites</h1>
            <span style={{ backgroundColor: 'rgba(123, 16, 22, 0.1)', color: '#7B1016', padding: '4px 12px', borderRadius: '100px', fontSize: '16px', fontWeight: 600, border: '1px solid rgba(123, 16, 22, 0.2)' }}>
              {items.length}
            </span>
          </div>
          
          <div className="favorites-stats" style={{ display: 'flex', gap: '24px', color: '#7E7E7E', fontSize: '14px', fontWeight: 500, paddingLeft: '20px' }}>
            <span>Total: <strong style={{ color: '#F2F2F0' }}>{items.length}</strong></span>
            <span>Movies: <strong style={{ color: '#F2F2F0' }}>{movieCount}</strong></span>
            <span>TV Shows: <strong style={{ color: '#F2F2F0' }}>{tvCount}</strong></span>
          </div>
        </div>

        {/* Content Section */}
        {items.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#7E7E7E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '24px' }}>
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            <h3 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 12px', color: '#F2F2F0' }}>No favorites yet</h3>
            <p style={{ color: '#7E7E7E', margin: '0 0 32px', fontSize: '16px', maxWidth: '400px', textAlign: 'center', lineHeight: 1.5 }}>Explore our collection and add your favorite movies and TV shows to this list.</p>
            <Link href="/" style={{ backgroundColor: '#7B1016', color: '#F2F2F0', padding: '14px 32px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '15px', transition: 'all 0.2s ease', cursor: 'pointer' }}>
              Explore Now
            </Link>
          </div>
        ) : (
          <div className="favorites-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '24px' }}>
            {items.map((item) => (
              <Link 
                key={item.id} 
                href={`/${item.media_type}/${item.item_id}`} 
                className="favorite-link"
                style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '12px', cursor: 'pointer' }}
              >
                <div 
                  className="favorite-card"
                  style={{ 
                    position: 'relative', 
                    width: '100%', 
                    aspectRatio: '2/3', 
                    borderRadius: '12px', 
                    overflow: 'hidden', 
                    backgroundColor: '#1A1A1A'
                  }}
                >
                  {item.poster_path ? (
                    <img 
                      src={`https://image.tmdb.org/t/p/w342${item.poster_path}`} 
                      alt={item.title} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7E7E7E', fontSize: '13px' }}>
                      No Image
                    </div>
                  )}
                  
                  {/* Media Type Badge */}
                  <div style={{ 
                    position: 'absolute', 
                    top: '12px', 
                    right: '12px', 
                    backgroundColor: 'rgba(0, 0, 0, 0.75)', 
                    backdropFilter: 'blur(4px)', 
                    color: '#F2F2F0', 
                    fontSize: '11px', 
                    fontWeight: 600, 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.5px' 
                  }}>
                    {item.media_type === 'movie' ? 'Movie' : 'TV Show'}
                  </div>
                </div>
                
                {/* Title */}
                <div>
                  <h4 style={{ 
                    margin: 0, 
                    fontSize: '15px', 
                    fontWeight: 600, 
                    color: '#F2F2F0', 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis' 
                  }}>
                    {item.title}
                  </h4>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
