import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get('itemId');
  const mediaType = searchParams.get('mediaType');

  if (!itemId || !mediaType) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('reviews')
    .select('*, profiles(display_name, avatar_url, username), review_votes(vote, user_id)')
    .eq('item_id', parseInt(itemId))
    .eq('media_type', mediaType)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reviews: data || [] });
}
