import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';

import PlaylistDetailClient from './PlaylistDetailClient';

import { auth } from '@/auth';

// Helper to slugify a string
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start
    .replace(/-+$/, '');            // Trim - from end
}

export default async function PlaylistDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  const supabase = await createClient();

  // Parse the slug: playlist-name-username
  // Split by hyphens. The last token should be the username
  const tokens = slug.split('-');
  if (tokens.length < 2) notFound();

  const authorUsername = tokens[tokens.length - 1];
  const playlistSlugTarget = tokens.slice(0, tokens.length - 1).join('-');

  // 1. Find the author profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', authorUsername)
    .single();

  if (!profile) {
    notFound();
  }

  const isOwner = session?.user?.id === profile.id;

  // 2. Fetch all public playlists for this user (or if owner, fetch all playlists including private)
  const query = supabase
    .from('playlists')
    .select('*')
    .eq('user_id', profile.id);
    
  if (!isOwner) {
    query.eq('is_public', true);
  }

  const { data: playlists } = await query;

  if (!playlists || playlists.length === 0) notFound();

  // Find the playlist that matches the slug target
  const targetPlaylist = playlists.find(p => slugify(p.name) === playlistSlugTarget);
  if (!targetPlaylist) notFound();

  // 3. Fetch playlist items
  const { data: items } = await supabase
    .from('playlist_items')
    .select('*')
    .eq('playlist_id', targetPlaylist.id)
    .order('position', { ascending: true });

  // 4. Fetch TMDB details for the items in parallel
  const KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
  const enrichedItems = await Promise.all(
    (items || []).map(async (item) => {
      try {
        const res = await fetch(
          `https://api.tmdb.org/3/${item.media_type}/${item.item_id}?api_key=${KEY}&language=en-US`
        );
        if (res.ok) {
          const detail = await res.json();
          return {
            ...item,
            tmdb_id: item.item_id,
            title: detail.title || detail.name,
            poster_path: detail.poster_path,
            vote_average: detail.vote_average,
            release_date: detail.release_date || detail.first_air_date,
          };
        }
      } catch (e) {
        console.error(e);
      }
      return item;
    })
  );

  const displayName = profile.display_name || profile.username || 'User';

  return (
    <PlaylistDetailClient
      playlist={targetPlaylist}
      initialItems={enrichedItems}
      isOwner={isOwner}
      authorProfile={profile}
      authorDisplayName={displayName}
    />
  );
}
