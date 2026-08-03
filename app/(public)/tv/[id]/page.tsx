import { generateMetadata as getSeoMetadata, generateTvSeriesJsonLd } from '@/lib/utils/seo';
import { TvDetailClient } from './TvDetailClient';
import { auth } from '@/auth';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  try {
    const KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
    const res = await fetch(`https://api.tmdb.org/3/tv/${id}?api_key=${KEY}&language=en-US`);
    const tv = await res.json();
    if (!tv || !tv.name) return getSeoMetadata({ title: 'TV Series Not Found', description: 'This TV series could not be found.', path: `/tv/${id}` });
    
    const image = tv.backdrop_path 
      ? `https://image.tmdb.org/t/p/w1280${tv.backdrop_path}` 
      : tv.poster_path 
        ? `https://image.tmdb.org/t/p/w1280${tv.poster_path}` 
        : undefined;

    return getSeoMetadata({ 
      title: tv.name, 
      description: tv.overview, 
      image,
      path: `/tv/${id}`
    });
  } catch (error) {
    return getSeoMetadata({ title: 'TV Series Not Found', description: 'This TV series could not be found.', path: `/tv/${id}` });
  }
}

export default async function TvDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  
  const KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
  let isAnime = false;
  try {
    const res = await fetch(`https://api.tmdb.org/3/tv/${id}?api_key=${KEY}&language=en-US`);
    const tvShow = await res.json();
    const isAnimation = tvShow.genres?.some((g: any) => g.id === 16);
    const isJapanese = tvShow.origin_country?.includes('JP') || tvShow.original_language === 'ja';
    if (isAnimation && isJapanese) {
      isAnime = true;
    }
  } catch (err) {}

  const targetCategory = isAnime ? 'anime' : 'tv';

  const session = await auth();
  const user = session?.user ?? null;

  const { data: serversData } = await supabase
    .from('vouxa_servers')
    .select('*')
    .or(`media_type.eq.${targetCategory},media_type.eq.general`)
    .eq('is_hidden', false)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });

  const servers = serversData || [];

  const { data: settings } = await supabase
    .from('vouxa_settings')
    .select('server_warning_text')
    .eq('id', 1)
    .single();

  const warningText = settings?.server_warning_text || "If video isn't playing or buffering, try switching to another server. Try waiting on a server if it's loading, some take a bit of time. Some servers may contain a few ads.";
  
  let tv = null;
  try {
    const res = await fetch(`https://api.tmdb.org/3/tv/${id}?api_key=${KEY}&language=en-US`);
    tv = await res.json();
  } catch (err) {}

  return (
    <>
      {tv && tv.name && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(generateTvSeriesJsonLd(tv)) }}
        />
      )}
      <TvDetailClient 
        idParam={id} 
        initialServers={servers} 
        warningText={warningText} 
        currentUserId={user?.id}
      />
    </>
  );
}
