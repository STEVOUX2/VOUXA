import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const sort = searchParams.get('sort') || 'popularity';
  const genre = searchParams.get('genre');
  const year = searchParams.get('year');

  const supabase = await createClient();
  let query = supabase.from('movies').select('*', { count: 'exact' });

  if (genre) {
    query = query.ilike('genres', `%${genre}%`);
  }
  
  if (year) {
    query = query.gte('release_date', `${year}-01-01`).lte('release_date', `${year}-12-31`);
  }

  switch (sort) {
    case 'date':
      query = query.order('release_date', { ascending: false });
      break;
    case 'rating':
      query = query.order('vote_average', { ascending: false });
      break;
    case 'title':
      query = query.order('title', { ascending: true });
      break;
    case 'popularity':
    default:
      query = query.order('popularity', { ascending: false });
      break;
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data: movies, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    movies,
    count,
    page,
    totalPages: count ? Math.ceil(count / limit) : 0
  });
}
