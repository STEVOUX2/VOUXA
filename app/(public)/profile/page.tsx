import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { createClient } from '@/lib/supabase/server';
import { getPreferences, getUserAchievements, getMyReviews } from '@/app/actions/user';
import { ProfileClient } from './ProfileClient';

export const metadata = {
  title: 'My Profile | VOUXA',
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/signin');

  const user = session.user;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const { data: historyItems } = await supabase
    .from('user_history')
    .select('runtime, duration, media_type, last_watched_at')
    .eq('user_id', user.id);

  let totalWatchMinutes = 0;
  let totalWatchedCount = 0;
  let movieCount = 0;
  let tvCount = 0;

  if (historyItems) {
    totalWatchMinutes = historyItems.reduce((sum, item) => sum + (item.runtime || 0), 0);
    
    // Filter completed items where watched runtime is at least 90% of total duration
    const completedItems = historyItems.filter(item => {
      const dur = item.duration || 0;
      if (item.media_type === 'movie') {
        const threshold = dur > 0 ? 0.9 * dur : 90; // fallback to 90 mins if duration is missing
        return item.runtime >= threshold;
      } else {
        const threshold = dur > 0 ? 0.9 * dur : 20; // fallback to 20 mins if duration is missing
        return item.runtime >= threshold;
      }
    });

    totalWatchedCount = completedItems.length;
    movieCount = completedItems.filter(i => i.media_type === 'movie').length;
    tvCount = completedItems.filter(i => i.media_type === 'tv' || i.media_type === 'anime').length;
  }

  const { preferences } = await getPreferences();
  const achievements = await getUserAchievements();
  const { reviews } = await getMyReviews();

  return (
    <div style={{ background: '#080808', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <ProfileClient
        user={user}
        profile={profile}
        preferences={preferences}
        totalWatchedCount={totalWatchedCount}
        totalWatchMinutes={totalWatchMinutes}
        movieCount={movieCount}
        tvCount={tvCount}
        achievementsData={achievements as any}
        initialReviews={reviews}
      />
    </div>
  );
}
