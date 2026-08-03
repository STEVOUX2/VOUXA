import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { UsersIcon } from "lucide-react";

export const metadata = {
  title: "User Management | Admin | VOUXA",
};

export default async function AdminUsersPage() {
  const supabase = await createClient();

  // We need the service role key to list all users from auth.users
  const adminClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch all auth users
  const { data: authData, error: authError } = await adminClient.auth.admin.listUsers();
  const authUsers = authData?.users || [];

  // Fetch all profiles to check admin status
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, is_admin, username");

  // Merge them
  const mergedUsers = authUsers.map((authUser) => {
    const profile = profiles?.find((p) => p.id === authUser.id);
    const displayName = profile?.username || authUser.user_metadata?.first_name || authUser.user_metadata?.username || 'Unknown';
    return {
      id: authUser.id,
      email: authUser.email,
      username: displayName,
      is_admin: profile?.is_admin || false,
      created_at: authUser.created_at,
    };
  });

  // Sort by created_at desc
  mergedUsers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div style={{ paddingTop: '100px', paddingBottom: '100px', maxWidth: '1200px', margin: '0 auto', padding: '100px 32px' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '50%' }}>
          <UsersIcon size={32} className="text-primary" />
        </div>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#F2F2F0', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
            User Management
          </h1>
          <p style={{ color: '#7E7E7E', fontSize: '16px', margin: 0, fontWeight: 500 }}>
            Manage registered users and their permissions.
          </p>
        </div>
      </div>

      <div style={{ background: 'rgba(23, 23, 23, 0.6)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
              <th style={{ padding: '20px 24px', color: '#B9B9B9', fontWeight: 600, fontSize: '14px' }}>User Details</th>
              <th style={{ padding: '20px 24px', color: '#B9B9B9', fontWeight: 600, fontSize: '14px' }}>Role</th>
              <th style={{ padding: '20px 24px', color: '#B9B9B9', fontWeight: 600, fontSize: '14px' }}>Joined</th>
              <th style={{ padding: '20px 24px', color: '#B9B9B9', fontWeight: 600, fontSize: '14px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mergedUsers?.map((user) => (
              <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#7B1016', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
                      {user.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <div style={{ color: '#F2F2F0', fontWeight: 600, fontSize: '15px' }}>{user.username !== 'Unknown' ? user.username : (user.email?.split('@')[0] || 'Unknown')}</div>
                      <div style={{ color: '#7E7E7E', fontSize: '13px', marginTop: '4px' }}>{user.email || user.id}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '20px 24px' }}>
                  <span style={{ 
                    padding: '6px 12px', 
                    borderRadius: '999px', 
                    fontSize: '12px', 
                    fontWeight: 600,
                    background: user.is_admin ? 'rgba(123, 16, 22, 0.2)' : 'rgba(255,255,255,0.05)',
                    color: user.is_admin ? '#ff6b6b' : '#B9B9B9',
                    border: user.is_admin ? '1px solid rgba(123, 16, 22, 0.3)' : '1px solid rgba(255,255,255,0.1)'
                  }}>
                    {user.is_admin ? 'Admin' : 'User'}
                  </span>
                </td>
                <td style={{ padding: '20px 24px', color: '#B9B9B9', fontSize: '14px' }}>
                  {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </td>
                <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                  <button style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#F2F2F0', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                    Manage
                  </button>
                </td>
              </tr>
            ))}
            {(!profiles || profiles.length === 0) && (
              <tr>
                <td colSpan={4} style={{ padding: '48px', textAlign: 'center', color: '#7E7E7E' }}>
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
