import { auth } from '@/auth';
import { createClient } from '@/utils/supabase/server';
import HistoryClient from './HistoryClient';

export default async function HistoryPage() {
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
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#F2F2F0', margin: '0 0 16px 0' }}>Watch History</h1>
          <p style={{ color: '#7E7E7E', fontSize: '16px', lineHeight: '1.6', margin: '0 0 32px 0' }}>
            Keep track of everything you&apos;ve watched. Sign in to view and manage your viewing history across all devices.
          </p>
          <p style={{ color: '#F2F2F0', fontSize: '15px', fontWeight: 600 }}>Please <a href="/auth/signin" style={{ color: '#B1222E' }}>Sign In</a> to continue.</p>
        </div>
      </div>
    );
  }

  const supabase = await createClient();

  // Fetch history from Supabase
  const { data } = await supabase
    .from('user_history')
    .select('tmdb_id, media_type, runtime')
    .eq('user_id', user.id)
    .order('last_watched_at', { ascending: false });

  const items = data || [];

  return (
    <div style={{ minHeight: '100vh', background: '#080808', paddingTop: '120px', paddingBottom: '120px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <HistoryClient initialItems={items} />
    </div>
  );
}
