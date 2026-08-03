import { NextResponse } from 'next/server';

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const BASE_URL = 'https://api.tmdb.org/3';

export const revalidate = 3600;

export async function GET() {
  try {
    if (!TMDB_API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const res = await fetch(`${BASE_URL}/trending/all/day?api_key=${TMDB_API_KEY}&language=en-US`);
    if (!res.ok) throw new Error('Failed to fetch trending');
    
    const data = await res.json();
    return NextResponse.json({ results: data.results || [] });
  } catch (error) {
    console.error('Error fetching trending:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
