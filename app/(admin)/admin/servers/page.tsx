import { createClient } from "@/lib/supabase/server";
import { ServerIcon } from "lucide-react";
import { ServersClient } from "./ServersClient";

export const metadata = {
  title: "Server Management | Admin | VOUXA",
};

export default async function AdminServersPage() {
  const supabase = await createClient();

  // Fetch servers
  const { data: servers, error } = await supabase
    .from("vouxa_servers")
    .select("*")
    .order("position", { ascending: true })
    .order("created_at", { ascending: false });

  return (
    <div style={{ paddingTop: '100px', paddingBottom: '100px', maxWidth: '1200px', margin: '0 auto', padding: '100px 32px' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '50%' }}>
          <ServerIcon size={32} className="text-blue-500" />
        </div>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#F2F2F0', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
            Server Management
          </h1>
          <p style={{ color: '#7E7E7E', fontSize: '16px', margin: 0, fontWeight: 500 }}>
            Configure and categorize streaming servers.
          </p>
        </div>
      </div>

      <ServersClient initialServers={servers || []} />
    </div>
  );
}
