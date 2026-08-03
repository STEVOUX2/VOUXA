import { NextResponse } from 'next/server';

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const BASE_URL = 'https://api.tmdb.org/3';

export const revalidate = 3600; // Cache for 1 hour

export async function GET(request: Request) {
  try {
    if (!TMDB_API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const pages = parseInt(searchParams.get('pages') || '5');
    
    const fetchPromises = [];
    for (let i = 1; i <= pages; i++) {
      fetchPromises.push(
        fetch(`${BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=${i}`)
          .then(res => res.json())
      );
    }
    
    const results = await Promise.all(fetchPromises);
    const allMovies = results.flatMap(res => res.results || []);
    
    // Deduplicate
    const uniqueMovies = Array.from(new Map(allMovies.map(m => [m.id, m])).values());

    return NextResponse.json({ results: uniqueMovies });
  } catch (error) {
    console.error('Error fetching popular movies:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
