'use client';

import Link from "next/link";
import { UsersIcon, ServerIcon, FilmIcon, SettingsIcon } from "lucide-react";

export default function AdminDashboardPage() {
  const options = [
    {
      title: "User Management",
      description: "Manage registered users, view details, and control access.",
      icon: <UsersIcon size={32} className="text-primary" />,
      href: "/admin/users",
    },
    {
      title: "Server Management",
      description: "Add, edit, and organize streaming servers by category.",
      icon: <ServerIcon size={32} className="text-blue-500" />,
      href: "/admin/servers",
    },
    {
      title: "TMDB Curation",
      description: "Customize homepage categories and feature top movies.",
      icon: <FilmIcon size={32} className="text-purple-500" />,
      href: "/admin/tmdb",
    },
    {
      title: "Platform Settings",
      description: "Toggle maintenance mode and edit global announcements.",
      icon: <SettingsIcon size={32} className="text-vtext-muted" />,
      href: "/admin/settings",
    },
  ];

  return (
    <div style={{ paddingTop: '120px', paddingBottom: '100px', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '64px' }}>
        <h1 style={{ fontSize: '48px', fontWeight: 900, color: '#F2F2F0', margin: '0 0 16px 0', letterSpacing: '-0.03em', textTransform: 'uppercase' }}>
          Admin Control Center
        </h1>
        <p style={{ color: '#7E7E7E', fontSize: '18px', margin: 0, fontWeight: 500, maxWidth: '600px' }}>
          Select a module below to configure and manage the VOUXA platform.
        </p>
      </div>

      <div style={{ 
        maxWidth: '1200px', 
        width: '100%',
        padding: '0 32px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px'
      }}>
        {options.map((opt, i) => (
          <Link key={i} href={opt.href} style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'rgba(23, 23, 23, 0.6)', 
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.05)', 
              borderRadius: '24px', 
              padding: '40px 32px',
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              textAlign: 'center',
              gap: '20px',
              height: '100%',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(30, 30, 30, 0.8)';
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(23, 23, 23, 0.6)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.border = '1px solid rgba(255,255,255,0.05)';
            }}
            >
              <div style={{ 
                background: 'rgba(255,255,255,0.03)', 
                padding: '20px', 
                borderRadius: '50%',
                marginBottom: '8px'
              }}>
                {opt.icon}
              </div>
              <div>
                <h2 style={{ color: '#F2F2F0', fontSize: '20px', fontWeight: 700, margin: '0 0 12px 0' }}>{opt.title}</h2>
                <p style={{ color: '#7E7E7E', fontSize: '14px', lineHeight: '1.5', margin: 0 }}>{opt.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

    </div>
  );
}
