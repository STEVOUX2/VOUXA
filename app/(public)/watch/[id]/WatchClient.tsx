'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { VideoPlayer } from '@/components/ui/VideoPlayer';

export function WatchClient({ initialMovie, initialSubtitles, idParam }: { initialMovie: any, initialSubtitles: any[], idParam: string }) {
  const [movie, setMovie] = useState(initialMovie);
  const [subtitles, setSubtitles] = useState(initialSubtitles);
  const [loading, setLoading] = useState(!initialMovie);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialMovie) return;

    async function fetchFromTmdb() {
      try {
        const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
        if (!TMDB_API_KEY) throw new Error("Missing API Key");

        const tmdbId = parseInt(idParam);
        const res = await fetch(`https://api.tmdb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}`);
        
        if (!res.ok) {
          if (res.status === 404) throw new Error("Movie not found");
          throw new Error("Failed to fetch from TMDB");
        }
        
        const tmdbData = await res.json();
        setMovie({
          id: tmdbData.id.toString(),
          tmdb_id: tmdbData.id,
          title: tmdbData.title,
          tagline: tmdbData.tagline,
        });
        setSubtitles([]);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchFromTmdb();
  }, [initialMovie, idParam]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-24 w-24 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-center space-y-4">
          <h1 className="text-3xl text-vtext">404 - {error || "Movie Not Found"}</h1>
          <Link href="/" className="text-primary hover:underline">Return Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col animate-fade-in pt-40 mt-4">
      <div className="px-6 md:px-12 pb-4">
        <Link href={`/movie/${movie.id}`} className="text-vtext-secondary hover:text-primary transition-colors inline-flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg hover:bg-white/10 relative z-10">
          <span>&larr;</span> Back to Details
        </Link>
      </div>
      
      <div className="flex-1 w-full max-w-[1600px] mx-auto flex flex-col px-4 md:px-8 pb-12">
        {/* Removed aspect-video and overflow-hidden here because VideoPlayer handles its own aspect ratio and controls! */}
        <div className="w-full">
          <VideoPlayer 
            tmdbId={movie.tmdb_id}
            title={movie.title}
            subtitles={subtitles}
          />
        </div>
        
        <div className="mt-8 space-y-2 px-2 max-w-6xl mx-auto w-full">
          <h1 className="text-4xl font-display text-vtext font-bold tracking-wide">{movie.title}</h1>
          {movie.tagline && <p className="text-primary/80 italic text-lg">{movie.tagline}</p>}
        </div>
      </div>
    </div>
  );
}
