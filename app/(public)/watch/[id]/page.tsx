import { createClient } from '@/lib/supabase/server';
import { WatchClient } from './WatchClient';

export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const supabase = await createClient();
  
  let movie = null;
  let subtitles: any[] = [];

  if (isUuid) {
    const { data } = await supabase.from('movies').select('*').eq('id', id).single();
    movie = data;
  } else {
    const { data } = await supabase.from('movies').select('*').eq('tmdb_id', parseInt(id)).single();
    movie = data;
  }

  let initialRuntime = 0;
  
  if (movie) {
    const { data } = await supabase.from('subtitles').select('*').eq('movie_id', movie.id);
    subtitles = data || [];
    
    // Fetch user history to get exact resume time
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    if (user) {
      const { data: history } = await supabase
        .from('user_history')
        .select('runtime')
        .eq('user_id', user.id)
        .eq('tmdb_id', movie.tmdb_id?.toString() || id)
        .single();
      
      if (history && history.runtime) {
        initialRuntime = history.runtime;
      }
    }
  }

  return <WatchClient initialMovie={movie} initialSubtitles={subtitles} idParam={id} initialRuntime={initialRuntime} />;
}
