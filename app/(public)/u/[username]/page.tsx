import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { AchievementShowcase } from './AchievementShowcase';
import { generateMetadata as getSeoMetadata, generatePersonJsonLd } from '@/lib/utils/seo';

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase.from('profiles').select('*').eq('username', username).single();
  
  if (!profile) return getSeoMetadata({ title: 'User Not Found', path: `/u/${username}` });
  
  const displayName = profile.display_name || profile.username || 'Anonymous';
  return getSeoMetadata({ 
    title: `${displayName} (@${profile.username})`, 
    description: `Check out ${displayName}'s profile on VOUXA to see their favorite movies, playlists, and reviews.`,
    path: `/u/${username}`,
    image: profile.avatar_url || undefined
  });
}

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase.from('profiles').select('*').eq('username', username).single();
  if (!profile) notFound();

  const [{ data: reviews }, { data: favorites }, { data: playlists }, { data: pointsRow }, { count: watchCount }, { data: allAchievements }, { data: earnedAchievements }] = await Promise.all([
    supabase.from('reviews').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(4),
    supabase.from('user_favorites').select('*').eq('user_id', profile.id).limit(8),
    supabase.from('playlists').select('*, playlist_items(count)').eq('user_id', profile.id).eq('is_public', true),
    supabase.from('user_points').select('total_points').eq('user_id', profile.id).single(),
    supabase.from('user_history').select('id', { count: 'exact', head: true }).eq('user_id', profile.id),
    supabase.from('achievements').select('*'),
    supabase.from('user_achievements').select('*').eq('user_id', profile.id)
  ]);

  const displayName = profile.display_name || profile.username || 'Anonymous';
  const totalPoints = pointsRow?.total_points || 0;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            generatePersonJsonLd({
              username: profile.username,
              displayName: profile.display_name,
              avatarUrl: profile.avatar_url,
            })
          ),
        }}
      />
      <div style={{ background: '#080808', minHeight: '100vh', padding: '120px 64px 80px', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <style>{`
          .fav-card {
            border-radius: 10px;
            overflow: hidden;
            background: #171717;
            transition: transform 0.2s ease;
          }
          .fav-card:hover {
            transform: translateY(-3px);
          }
          .playlist-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          padding: '20px';
          transition: all 0.2s ease;
        }
        .playlist-card:hover {
          background: rgba(255,255,255,0.04) !important;
          transform: translateY(-2px);
        }
      `}</style>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        {/* Profile Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px', marginBottom: '56px', padding: '32px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px' }}>
          <div style={{ width: '96px', height: '96px', borderRadius: '50%', background: 'linear-gradient(135deg, #7B1016, #5D0F14)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', fontWeight: 800, color: '#F2F2F0', flexShrink: 0, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 24px rgba(123,16,22,0.3)' }}>
            {profile.avatar_url ? <img src={profile.avatar_url} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : displayName[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#F2F2F0', margin: '0 0 4px 0' }}>{displayName}</h1>
            <p style={{ color: '#7E7E7E', fontSize: '15px', margin: '0 0 16px 0' }}>@{profile.username}</p>
            {profile.bio && <p style={{ color: '#B9B9B9', fontSize: '14px', margin: 0, lineHeight: 1.6 }}>{profile.bio}</p>}
          </div>
          {/* Stats */}
          <div style={{ display: 'flex', gap: '24px', flexShrink: 0 }}>
            {[{ label: 'Watched', value: watchCount || 0 }, { label: 'Points', value: totalPoints }, { label: 'Reviews', value: reviews?.length || 0 }].map(stat => (
              <div key={stat.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#F2F2F0' }}>{Number(stat.value).toLocaleString()}</div>
                <div style={{ fontSize: '11px', color: '#7E7E7E', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <AchievementShowcase achievements={allAchievements || []} earned={earnedAchievements || []} />

        {/* Favorites */}
        {favorites && favorites.length > 0 && (
          <div style={{ marginBottom: '48px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ width: '3px', height: '20px', background: 'linear-gradient(180deg, #7B1016, #5D0F14)', borderRadius: '999px' }} />
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#F2F2F0', margin: 0 }}>Favorites</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
              {favorites.map((fav: any) => (
                <Link key={fav.id} href={`/${fav.media_type}/${fav.item_id}`} style={{ textDecoration: 'none', display: 'block' }}>
                  <div className="fav-card">
                    {fav.poster_path ? <img src={`https://image.tmdb.org/t/p/w342${fav.poster_path}`} alt={fav.title} style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', display: 'block' }} /> : <div style={{ width: '100%', aspectRatio: '2/3', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4E4E4E' }}>🎬</div>}
                    <div style={{ padding: '8px 10px' }}><p style={{ color: '#F2F2F0', fontSize: '12px', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fav.title}</p></div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Public Playlists */}
        {playlists && playlists.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ width: '3px', height: '20px', background: 'linear-gradient(180deg, #7B1016, #5D0F14)', borderRadius: '999px' }} />
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#F2F2F0', margin: 0 }}>Public Playlists</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
              {playlists.map((pl: any) => (
                <Link key={pl.id} href={`/playlists/${slugify(pl.name)}-${profile.username}`} style={{ textDecoration: 'none' }}>
                  <div className="playlist-card" style={{ padding: '20px' }}>
                    <div style={{ fontSize: '28px', marginBottom: '10px' }}>📋</div>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: '#F2F2F0', marginBottom: '4px' }}>{pl.name}</div>
                    <div style={{ fontSize: '13px', color: '#7E7E7E' }}>{pl.playlist_items?.[0]?.count || 0} items</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      </div>
    </>
  );
}

// Helper to slugify a string
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
