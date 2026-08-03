import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import PlaylistsClient from './PlaylistsClient';

import { auth } from '@/auth';

export const metadata = { title: 'My Playlists | VOUXA' };

export default async function PlaylistsPage() {
  const session = await auth();
  if (!session?.user) redirect('/');
  const supabase = await createClient();

  const { data: playlists } = await supabase
    .from('playlists')
    .select('*, playlist_items(count)')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', session.user.id)
    .single();

  return <PlaylistsClient initialPlaylists={playlists || []} username={profile?.username || ''} />;
}
