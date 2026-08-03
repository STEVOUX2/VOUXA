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

  if (movie) {
    const { data } = await supabase.from('subtitles').select('*').eq('movie_id', movie.id);
    subtitles = data || [];
  }

  return <WatchClient initialMovie={movie} initialSubtitles={subtitles} idParam={id} />;
}
