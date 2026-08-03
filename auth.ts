import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Discord from 'next-auth/providers/discord';
import Credentials from 'next-auth/providers/credentials';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Admin Supabase client (service role) for profile upserts
function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        emailOrUsername: { label: 'Email or Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const input = credentials?.emailOrUsername as string;
        const password = credentials?.password as string;

        if (!input || !password) return null;

        const supabase = getAdminSupabase();

        // Look up by email or username
        const isEmail = input.includes('@');
        const query = supabase
          .from('profiles')
          .select('id, email, username, first_name, last_name, avatar_url, is_admin, password_hash');

        const { data: profile } = isEmail
          ? await query.eq('email', input).single()
          : await query.eq('username', input).single();

        if (!profile || !profile.password_hash) return null;

        const valid = await bcrypt.compare(password, profile.password_hash);
        if (!valid) return null;

        return {
          id: profile.id,
          email: profile.email,
          name: `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() || profile.username,
          image: profile.avatar_url ?? null,
          username: profile.username,
          isAdmin: profile.is_admin ?? false,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // For OAuth providers, upsert the profile in Supabase
      if (account?.provider === 'google' || account?.provider === 'discord') {
        const supabase = getAdminSupabase();

        // Lookup existing user by email to get their UUID, or generate a new one
        const { data: existing } = await supabase.from('profiles').select('id').eq('email', user.email!).single();
        const userId = existing?.id || crypto.randomUUID();

        const { error } = await supabase.from('profiles').upsert(
          {
            id: userId,
            email: user.email!,
            first_name: user.name?.split(' ')[0] ?? '',
            last_name: user.name?.split(' ').slice(1).join(' ') ?? '',
            avatar_url: user.image ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'email', ignoreDuplicates: false }
        );
        if (error) console.error("OAuth profile upsert error:", error);
      }
      return true;
    },

    async jwt({ token, user, account }) {
      if (user) {
        // First login — embed user data into JWT
        token.userId = user.id;
        token.username = (user as any).username ?? null;
        token.isAdmin = (user as any).isAdmin ?? false;
      }

      // For OAuth logins, fetch is_admin and username from Supabase
      if (account && (account.provider === 'google' || account.provider === 'discord')) {
        const supabase = getAdminSupabase();
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin, username, id')
          .eq('email', token.email!)
          .single();

        if (profile) {
          token.userId = profile.id;
          token.isAdmin = profile.is_admin ?? false;
          token.username = profile.username ?? null;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        (session.user as any).username = token.username;
        (session.user as any).isAdmin = token.isAdmin;
      }
      return session;
    },
  },
});
