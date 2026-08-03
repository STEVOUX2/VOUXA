import { auth } from '@/auth';

export interface CurrentUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  username?: string | null;
  isAdmin: boolean;
}

/**
 * Server-side helper to get the current authenticated user from Auth.js JWT session.
 * Drop-in replacement for `supabase.auth.getUser()`.
 *
 * Returns null if the user is not logged in.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  return {
    id: session.user.id,
    email: session.user.email!,
    name: session.user.name ?? null,
    image: session.user.image ?? null,
    username: (session.user as any).username ?? null,
    isAdmin: (session.user as any).isAdmin ?? false,
  };
}
