import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const page = searchParams.get('page') || '1';
  
  const KEY = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY;
  
  if (!KEY) {
    return NextResponse.json({ error: 'Missing TMDB API Key' }, { status: 500 });
  }

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  try {
    const res = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${KEY}&language=en-US&query=${encodeURIComponent(query)}&page=${page}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
