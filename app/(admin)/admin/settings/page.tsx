import { createClient } from "@/lib/supabase/server";
import { SettingsIcon } from "lucide-react";
import { SettingsClient } from "./SettingsClient";

export const metadata = {
  title: "Settings | Admin | VOUXA",
};

export default async function AdminSettingsPage() {
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from("vouxa_settings")
    .select("*")
    .eq("id", 1)
    .single();

  const initialSettings = settings || {
    maintenance_mode: false,
    maintenance_text: 'We are currently performing maintenance. Please check back later.',
    announcement_text: '',
    server_warning_text: "If video isn't playing or buffering, try switching to another server. Try waiting on a server if it's loading, some take a bit of time. Some servers may contain a few ads."
  };

  return (
    <div style={{ paddingTop: '100px', paddingBottom: '100px', maxWidth: '1200px', margin: '0 auto', padding: '100px 32px' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '50%' }}>
          <SettingsIcon size={32} className="text-vtext-muted" />
        </div>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#F2F2F0', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
            Platform Settings
          </h1>
          <p style={{ color: '#7E7E7E', fontSize: '16px', margin: 0, fontWeight: 500 }}>
            Manage global platform visibility and announcements.
          </p>
        </div>
      </div>

      <SettingsClient initialSettings={initialSettings} />
    </div>
  );
}
