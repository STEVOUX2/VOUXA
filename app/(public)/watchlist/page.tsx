import { auth } from '@/auth';
import { createClient } from '@/utils/supabase/server';
import WatchlistClient from './WatchlistClient';

export default async function WatchlistPage() {
  const session = await auth();
  const user = session?.user ?? null;

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: '#080808', paddingTop: '160px', paddingBottom: '120px', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '64px', background: 'rgba(255,255,255,0.03)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ 
            width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #5D0F14, #7B1016)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto',
            boxShadow: '0 4px 20px rgba(123,16,22,0.4)'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#F2F2F0', margin: '0 0 16px 0' }}>Your Watchlist</h1>
          <p style={{ color: '#7E7E7E', fontSize: '16px', lineHeight: '1.6', margin: '0 0 32px 0' }}>
            Keep track of all the movies, TV shows, and anime you want to watch. Sign in to sync your watchlist across all devices.
          </p>
          <p style={{ color: '#F2F2F0', fontSize: '15px', fontWeight: 600 }}>Please <a href="/auth/signin" style={{ color: '#B1222E' }}>Sign In</a> to continue.</p>
        </div>
      </div>
    );
  }

  const supabase = await createClient();

  // Fetch watchlist from Supabase
  const { data } = await supabase
    .from('user_watchlist')
    .select('tmdb_id, media_type')
    .eq('user_id', user.id)
    .order('added_at', { ascending: false });

  const items = data || [];

  return (
    <div style={{ minHeight: '100vh', background: '#080808', paddingTop: '120px', paddingBottom: '120px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <WatchlistClient initialItems={items} />
    </div>
  );
}
