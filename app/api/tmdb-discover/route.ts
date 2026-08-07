import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const genre = searchParams.get('genre');
  const language = searchParams.get('language');
  const yearFrom = searchParams.get('yearFrom');
  const yearTo = searchParams.get('yearTo');
  const minRating = searchParams.get('minRating');
  
  const KEY = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY;
  
  if (!KEY) {
    return NextResponse.json({ error: 'Missing TMDB API Key' }, { status: 500 });
  }

  let url = `https://api.themoviedb.org/3/discover/movie?api_key=${KEY}&language=en-US&sort_by=popularity.desc&page=1`;
  
  if (genre) url += `&with_genres=${genre}`;
  if (language) url += `&with_original_language=${language}`;
  if (yearFrom) url += `&primary_release_date.gte=${yearFrom}-01-01`;
  if (yearTo) url += `&primary_release_date.lte=${yearTo}-12-31`;
  if (minRating) url += `&vote_average.gte=${minRating}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
