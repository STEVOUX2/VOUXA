import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@/auth';
import { AlertTriangleIcon } from 'lucide-react';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Fetch global settings
  const { data: settings } = await supabase.from('vouxa_settings').select('*').eq('id', 1).single();

  let isMaintenance = settings?.maintenance_mode === true;

  // If maintenance mode is active, check if user is an admin via Auth.js
  if (isMaintenance) {
    const session = await auth();
    if ((session?.user as any)?.isAdmin) {
      isMaintenance = false; // Bypass maintenance mode for admins
    }
  }

  if (isMaintenance) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
        <div className="bg-surface/50 border border-vborder p-12 rounded-3xl max-w-lg w-full backdrop-blur-xl">
          <AlertTriangleIcon size={64} className="text-primary mx-auto mb-6 opacity-80" />
          <h1 className="text-3xl font-display font-bold text-white mb-4">Under Maintenance</h1>
          <p className="text-vtext-muted text-lg leading-relaxed">
            {settings?.maintenance_text || "We are currently performing maintenance. Please check back later."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      {settings?.announcement_text && (
        <div className="bg-primary text-white text-center py-2 px-4 text-sm font-semibold tracking-wide">
          {settings.announcement_text}
        </div>
      )}
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
