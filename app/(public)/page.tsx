import { Suspense } from 'react';
import { auth } from '@/auth';
import { createClient } from '@/lib/supabase/server';
import { generateMetadata as getSeoMetadata } from '@/lib/utils/seo';
import { HomePageClient } from './HomePageClient';

export const metadata = getSeoMetadata({
  title: 'Home',
  description: 'Stream premium cinematic movies on VOUXA.',
});

export default async function HomePage() {
  const session = await auth();
  const user = session?.user ?? null;
  
  let continueWatching: any[] = [];
  
  if (user) {
    const supabase = await createClient();
    // Use last_watched_at - select duration to compute watch percentage accurately
    const { data: history, error } = await supabase
      .from('user_history')
      .select('id, tmdb_id, media_type, title, poster_path, runtime, duration, last_watched_at')
      .eq('user_id', user.id)
      .order('last_watched_at', { ascending: false })
      .limit(10);
      
    if (history && !error) {
      continueWatching = history.filter(h => h.tmdb_id); // only valid entries
    }
  }

  return <HomePageClient continueWatching={continueWatching} />;
}
