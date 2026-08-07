import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { WatchPartyLobby } from './WatchPartyLobby';

export const metadata = { title: 'Watch Parties | VOUXA' };
export const dynamic = 'force-dynamic';

export default async function WatchPartyPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  return <WatchPartyLobby isLoggedIn={!!session} />;
}
