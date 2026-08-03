import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { WatchPartyRoom } from './WatchPartyRoom';
import { generateMetadata as getSeoMetadata } from '@/lib/utils/seo';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return getSeoMetadata({ 
    title: `Watch Party: ${code.toUpperCase()}`, 
    description: `Join my watch party on VOUXA! Room Code: ${code.toUpperCase()}`,
    path: `/watch-party/${code}`
  });
}

export default async function WatchPartyRoomPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const supabase = await createClient();

  const session = await auth();
  if (!session?.user) redirect('/');

  const { data: party } = await supabase
    .from('watch_parties')
    .select('*')
    .eq('room_code', code.toUpperCase())
    .single();

  if (!party) notFound();

  // Load initial messages
  const { data: messages } = await supabase
    .from('party_messages')
    .select('*')
    .eq('party_id', party.id)
    .order('created_at', { ascending: true })
    .limit(100);

  // Load members
  const { data: members } = await supabase
    .from('party_members')
    .select('*')
    .eq('party_id', party.id)
    .eq('is_active', true);

  // Get current user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, username, avatar_url')
    .eq('id', session.user.id)
    .single();

  const displayName = profile?.display_name || profile?.username || session.user.email?.split('@')[0] || 'User';

  const { data: serversData } = await supabase
    .from('vouxa_servers')
    .select('*')
    .or(`media_type.eq.${party.media_type},media_type.eq.general`)
    .eq('is_hidden', false)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });

  return (
    <WatchPartyRoom
      party={party}
      initialMessages={messages || []}
      initialMembers={members || []}
      initialServers={serversData || []}
      currentUserId={session.user.id || ''}
      currentUserName={displayName}
      currentUserAvatar={profile?.avatar_url || null}
    />
  );
}
