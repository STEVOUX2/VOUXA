import { cache } from 'react';
import { TMDBMovie, TMDBSearchResult } from './types';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

function getApiKey(): string {
  const key = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY;
  if (!key) throw new Error('TMDB API key not configured');
  return key;
}

export const getMovieDetails = cache(async (tmdbId: number): Promise<TMDBMovie> => {
  const response = await fetch(
    `${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${getApiKey()}&append_to_response=credits&language=en-US`,
    { next: { revalidate: 3600 } }
  );

  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status} for movie ${tmdbId}`);
  }

  return response.json();
});

export const searchMovies = cache(async (query: string, page = 1): Promise<TMDBSearchResult> => {
  const response = await fetch(
    `${TMDB_BASE_URL}/search/movie?api_key=${getApiKey()}&query=${encodeURIComponent(query)}&page=${page}&language=en-US`,
    { next: { revalidate: 300 } }
  );

  if (!response.ok) {
    throw new Error(`TMDB search error: ${response.status}`);
  }

  return response.json();
});

export function getImageUrl(path: string | null, size: string = 'w500'): string {
  if (!path) return '/placeholder-poster.svg';
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function getBackdropUrl(path: string | null, size: string = 'w1280'): string {
  if (!path) return '';
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function getProfileUrl(path: string | null, size: string = 'w185'): string {
  if (!path) return '/placeholder-avatar.svg';
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}
