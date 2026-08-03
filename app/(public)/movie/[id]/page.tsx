import { auth } from '@/auth';
import { createClient } from '@/lib/supabase/server';
import { generateMetadata as getSeoMetadata, generateMovieJsonLd } from '@/lib/utils/seo';
import { MovieDetailClient } from './MovieDetailClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const supabase = await createClient();
  let movie = null;
  if (isUuid) {
    const { data } = await supabase.from('movies').select('*').eq('id', id).single();
    movie = data;
  } else {
    const { data } = await supabase.from('movies').select('*').eq('tmdb_id', parseInt(id)).single();
    movie = data;
    
    // Fallback to TMDB if not in DB yet
    if (!movie) {
      try {
        const res = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&language=en-US`);
        if (res.ok) {
          movie = await res.json();
        }
      } catch (e) {}
    }
  }
  if (!movie) return getSeoMetadata({ title: 'Movie Not Found', description: 'This movie could not be found.', path: `/movie/${id}` });
  
  const image = movie.backdrop_path 
    ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` 
    : movie.poster_path 
      ? `https://image.tmdb.org/t/p/w1280${movie.poster_path}` 
      : undefined;

  return getSeoMetadata({ 
    title: movie.title, 
    description: movie.overview, 
    image,
    path: `/movie/${id}`
  });
}

export default async function MovieDetailPage({ params }: { params: Promise<{ id: string }> }) {
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
    const { data: subsData } = await supabase.from('subtitles').select('*').eq('movie_id', movie.id);
    subtitles = subsData || [];
  }

  const { data: serversData } = await supabase
    .from('vouxa_servers')
    .select('*')
    .or('media_type.eq.movie,media_type.eq.general')
    .eq('is_hidden', false)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });

  const servers = serversData || [];

  const { data: settings } = await supabase
    .from('vouxa_settings')
    .select('server_warning_text')
    .eq('id', 1)
    .single();

  const warningText = settings?.server_warning_text || "If video isn't playing or buffering, try switching to another server.";

  // Fetch reviews for this movie
  const tmdbId = isUuid ? movie?.tmdb_id : parseInt(id);
  const { data: reviewsData } = await supabase
    .from('reviews')
    .select('*, profiles(display_name, avatar_url, username), review_votes(vote, user_id)')
    .eq('item_id', tmdbId || 0)
    .eq('media_type', 'movie')
    .order('created_at', { ascending: false });

  const reviews = reviewsData || [];

  // Get current user for review ownership
  const session = await auth();
  const user = session?.user ?? null;

  return (
    <>
      {movie && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(generateMovieJsonLd(movie)) }}
        />
      )}
      <MovieDetailClient
        initialMovie={movie}
        initialSubtitles={subtitles}
        initialServers={servers}
        warningText={warningText}
        idParam={id}
        initialReviews={reviews}
        currentUserId={user?.id}
      />
    </>
  );
}
