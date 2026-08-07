import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getMovieDetails } from '@/lib/tmdb/client';

export async function POST(request: Request) {
  const supabase = await createClient();
  
  // Verify admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const { ids } = await request.json();
    if (!Array.isArray(ids)) {
      return NextResponse.json({ error: 'ids must be an array' }, { status: 400 });
    }

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    for (const tmdbId of ids) {
      let retries = 3;
      let successFetch = false;
      let tmdbData;

      while (retries > 0 && !successFetch) {
        try {
          tmdbData = await getMovieDetails(tmdbId);
          successFetch = true;
        } catch (err: any) {
          if (err.message?.includes('429')) {
            retries--;
            await sleep(1000); // Wait longer on 429
          } else {
            throw err;
          }
        }
      }

      if (!successFetch || !tmdbData) {
        failed++;
        errors.push(`ID ${tmdbId}: Failed after retries or non-429 error`);
        continue;
      }

      try {
        const genres = tmdbData.genres?.map((g: any) => g.name) || [];
        const director = tmdbData.credits?.crew?.find((c: any) => c.job === 'Director')?.name;
        const cast = tmdbData.credits?.cast?.slice(0, 20).map((c: any) => ({
          id: c.id,
          name: c.name,
          character: c.character,
          profile_path: c.profile_path
        })) || [];

        const movieData = {
          tmdb_id: tmdbData.id,
          title: tmdbData.title,
          original_title: tmdbData.original_title,
          overview: tmdbData.overview,
          tagline: tmdbData.tagline,
          poster_path: tmdbData.poster_path,
          backdrop_path: tmdbData.backdrop_path,
          release_date: tmdbData.release_date,
          runtime: tmdbData.runtime,
          vote_average: tmdbData.vote_average,
          vote_count: tmdbData.vote_count,
          popularity: tmdbData.popularity,
          genres: JSON.stringify(genres),
          director,
          cast: JSON.stringify(cast),
          status: tmdbData.status,
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('movies')
          .upsert(movieData, { onConflict: 'tmdb_id' });

        if (error) throw error;
        success++;
      } catch (err: any) {
        failed++;
        errors.push(`ID ${tmdbId}: ${err.message}`);
      }
      
      // Delay between requests to respect rate limit (~50/sec max, we do 200ms = 5/sec)
      await sleep(200);
    }

    return NextResponse.json({ success, failed, errors });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
