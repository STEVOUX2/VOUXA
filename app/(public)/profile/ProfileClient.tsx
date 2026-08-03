'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { updateProfile, updatePreferences, deleteReview } from '@/app/actions/user';
import { logout } from '@/app/auth/actions';
import * as LucideIcons from 'lucide-react';

interface ProfileProps {
  user: any;
  profile: any;
  preferences: any;
  totalWatchedCount: number;
  totalWatchMinutes: number;
  movieCount: number;
  tvCount: number;
  achievementsData?: { all: any[], earned: any[] };
  initialReviews?: any[];
}

export function ProfileClient({ user, profile, preferences, totalWatchedCount, totalWatchMinutes, movieCount, tvCount, achievementsData, initialReviews = [] }: ProfileProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'goals' | 'reviews' | 'settings' | 'preferences'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reviews, setReviews] = useState(initialReviews);

  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [editUsername, setEditUsername] = useState(profile?.username || '');
  const [currentUsername, setCurrentUsername] = useState(profile?.username || '');
  const [liveUsername, setLiveUsername] = useState(profile?.display_name || profile?.username || user.user_metadata?.first_name || user.email?.split('@')[0] || 'User');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [language, setLanguage] = useState(preferences?.language || 'en');
  const [autoplayNext, setAutoplayNext] = useState(preferences?.autoplay_next !== false);
  const [defaultQuality, setDefaultQuality] = useState(preferences?.default_quality || 'auto');
  const [emailNotifications, setEmailNotifications] = useState(preferences?.email_notifications !== false);
  const [langOpen, setLangOpen] = useState(false);
  const [qualityOpen, setQualityOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const isAdmin = profile?.is_admin || false;
  const username = liveUsername;
  const hours = Math.floor(totalWatchMinutes / 60);
  const minutes = totalWatchMinutes % 60;

  // Member since
  const memberDate = profile?.created_at || user?.created_at;
  const memberSince = memberDate ? new Date(memberDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await updateProfile(formData);
    if (res.error) {
      showToast(res.error, 'error');
    } else {
      setIsEditing(false);
      if (displayName.trim()) setLiveUsername(displayName.trim());
      if (editUsername.trim()) setCurrentUsername(editUsername.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      router.refresh();
    }
    setLoading(false);
  };

  const handleSavePrefs = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPrefsLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set('autoplayNext', autoplayNext.toString());
    formData.set('emailNotifications', emailNotifications.toString());
    const res = await updatePreferences(formData);
    if (res.error) showToast(res.error, 'error');
    else { setSaved(true); showToast('Preferences saved successfully!', 'success'); setTimeout(() => setSaved(false), 2000); }
    setPrefsLoading(false);
  };

  const navLinks = [
    { href: '/watchlist', label: 'Watchlist', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> },
    { href: '/history', label: 'History', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
    { href: '/favorites', label: 'Favorites', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> },
    { href: '/playlists', label: 'Playlists', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> },
    { href: '/reviews', label: 'My Reviews', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
    { href: '/achievements', label: 'Achievements', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg> },
  ];

  const tabs = ['overview', 'goals', 'settings', 'preferences'] as const;

  const handleShareProfile = () => {
    const url = `${window.location.origin}/u/${currentUsername}`;
    navigator.clipboard.writeText(url);
    showToast('Profile link copied to clipboard!', 'success');
  };

  const getAchievementIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.Award;
    return <IconComponent size={28} strokeWidth={1.5} />;
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        .profile-nav-link { text-decoration: none; }
        .profile-nav-link:hover .profile-nav-item { background: rgba(255,255,255,0.06) !important; border-color: rgba(255,255,255,0.1) !important; }
        .toggle-row:hover { background: rgba(255,255,255,0.04) !important; }
        .action-btn:hover { opacity: 0.85; transform: translateY(-1px); }
        .sidebar-link:hover { background: rgba(255,255,255,0.05) !important; color: #F2F2F0 !important; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.3s ease; }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px) translateY(0); } to { opacity: 1; transform: translateX(0) translateY(0); } }
        
        @media (max-width: 768px) {
          .banner-container { height: 160px !important; }
          .profile-container { padding: 0 16px 80px !important; }
          .profile-header-row { flex-direction: column !important; align-items: center !important; margin-bottom: 32px !important; }
          .profile-avatar-group { flex-direction: column !important; align-items: center !important; margin-top: -60px !important; text-align: center; }
          .profile-avatar { width: 100px !important; height: 100px !important; }
          .header-actions-group { flex-wrap: wrap !important; justify-content: center !important; margin-top: 16px !important; }
          .stats-strip { grid-template-columns: repeat(2, 1fr) !important; gap: 12px !important; margin-bottom: 24px !important; }
          .stats-item { padding: 16px !important; flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
          .tabs-container { 
            overflow-x: auto; 
            max-width: 100%; 
            -webkit-overflow-scrolling: touch; 
            margin: 0 auto 32px !important;
            scrollbar-width: none;
          }
          .tabs-container::-webkit-scrollbar {
            display: none !important;
          }
          .two-column-layout { grid-template-columns: 1fr !important; display: flex !important; flex-direction: column !important; gap: 24px !important; }
          .sidebar-inner { 
            display: flex !important; 
            flex-direction: row !important; 
            overflow-x: auto; 
            padding: 0 !important; 
            margin: 0 !important;
            background: transparent !important;
            border: none !important;
            white-space: nowrap; 
            border-radius: 0 !important; 
            scrollbar-width: none;
            -webkit-overflow-scrolling: touch;
            width: 100%;
            justify-content: flex-start;
            gap: 8px !important;
          }
          .sidebar-inner::-webkit-scrollbar {
            display: none !important;
          }
          .sidebar-inner > a:first-of-type {
            margin-left: 0 !important;
          }
          .sidebar-title { 
            display: none !important;
            position: absolute !important;
            visibility: hidden !important;
            width: 0 !important;
            height: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .sidebar-link { border-bottom: none !important; border-right: none !important; padding: 10px 18px !important; border-radius: 8px; background: rgba(255,255,255,0.03) !important; border: 1px solid rgba(255,255,255,0.06) !important; }
          .sidebar-link > svg:last-child { display: none; }
          .account-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
          .badges-grid { grid-template-columns: 1fr !important; }
          .prefs-grid { grid-template-columns: 1fr !important; }
          .edit-avatar-group { flex-direction: column !important; text-align: center !important; }
        }
      `}</style>

      {/* Banner */}
      <div className="banner-container" style={{
        position: 'relative', height: '240px', overflow: 'hidden',
        background: 'linear-gradient(135deg, #0d0d0d 0%, #1a0608 40%, #0d0508 70%, #080808 100%)',
      }}>
        {/* Decorative elements */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 100% at 50% 120%, rgba(123,16,22,0.25) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(123,16,22,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(123,16,22,0.5), rgba(123,16,22,0.8), rgba(123,16,22,0.5), transparent)' }} />

        {/* Decorative grid lines */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />

        {/* VOUXA watermark */}
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', fontSize: '120px', fontWeight: 900, color: 'rgba(255,255,255,0.02)', letterSpacing: '-0.05em', userSelect: 'none', pointerEvents: 'none', whiteSpace: 'nowrap' }}>
          VOUXA
        </div>

      </div>

      {/* Main Layout */}
      <div className="profile-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 40px 80px', position: 'relative' }}>

        {/* Profile Header Row */}
        <div className="profile-header-row" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '48px' }}>
          {/* Avatar + Name */}
          <div className="profile-avatar-group" style={{ display: 'flex', alignItems: 'flex-end', gap: '28px', marginTop: '-60px' }}>
            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div className="profile-avatar" style={{
                width: '120px', height: '120px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #7B1016, #5D0F14, #3D0A0F)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '44px', fontWeight: 800, color: '#F2F2F0',
                border: '4px solid #080808',
                boxShadow: '0 8px 32px rgba(123,16,22,0.5)',
                overflow: 'hidden',
              }}>
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : username[0]?.toUpperCase()}
              </div>
              {/* Online dot */}
              <div style={{ position: 'absolute', bottom: '6px', right: '6px', width: '18px', height: '18px', background: '#22c55e', borderRadius: '50%', border: '3px solid #080808' }} />
            </div>

            {/* Name & meta */}
            <div style={{ paddingBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#F2F2F0', margin: 0, letterSpacing: '-0.03em' }}>{username}</h1>
                {isAdmin && (
                  <span style={{ background: 'linear-gradient(135deg, rgba(123,16,22,0.3), rgba(93,15,20,0.2))', border: '1px solid rgba(123,16,22,0.5)', borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: 700, color: '#ff6b6b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Admin</span>
                )}
              </div>
              <div style={{ fontSize: '14px', color: '#7E7E7E', fontWeight: 400 }}>{user.email}</div>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="header-actions-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '8px' }}>
            {saved && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#22c55e', fontSize: '13px', fontWeight: 600 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Saved!
              </div>
            )}
            <button
              onClick={handleShareProfile}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #7B1016, #5D0F14)', border: 'none', borderRadius: '10px', padding: '10px 18px', color: '#F2F2F0', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(123,16,22,0.3)' }}
              className="action-btn"
            >
              <LucideIcons.Share2 size={16} />
              Share Profile
            </button>
            <button
              onClick={() => setIsEditing(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 18px', color: '#F2F2F0', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
              className="action-btn"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit Profile
            </button>
            <form action={async () => { await logout(); }}>
              <button type="submit" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(123,16,22,0.1)', border: '1px solid rgba(123,16,22,0.3)', borderRadius: '10px', padding: '10px 18px', color: '#ff6b6b', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }} className="action-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Sign Out
              </button>
            </form>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="stats-strip" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '40px' }}>
          {[
            { label: 'Total Watched', value: totalWatchedCount, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>, color: '#F2F2F0', accent: 'rgba(255,255,255,0.06)' },
            { label: 'Movies Watched', value: movieCount, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="17" y1="17" x2="22" y2="17"/></svg>, color: '#60a5fa', accent: 'rgba(96,165,250,0.07)' },
            { label: 'Shows Watched', value: tvCount, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>, color: '#a78bfa', accent: 'rgba(167,139,250,0.07)' },
            { label: 'Hours Watched', value: `${hours}h ${minutes}m`, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, color: '#ff6b6b', accent: 'rgba(123,16,22,0.1)' },
          ].map((stat, i) => (
            <div key={i} className="stats-item" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: stat.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color, flexShrink: 0 }}>
                {stat.icon}
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: stat.color, lineHeight: 1.1 }}>{stat.value}</div>
                <div style={{ fontSize: '12px', color: '#7E7E7E', fontWeight: 500, marginTop: '2px' }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="tabs-container" style={{ display: 'flex', gap: '4px', marginBottom: '32px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '4px', border: '1px solid rgba(255,255,255,0.05)', width: 'fit-content' }}>
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '10px 22px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              background: activeTab === tab ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: activeTab === tab ? '#F2F2F0' : '#7E7E7E',
              fontSize: '13px', fontWeight: 600, transition: 'all 0.2s',
              textTransform: 'capitalize',
              boxShadow: activeTab === tab ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
            }}>
              {tab}
            </button>
          ))}
        </div>

        {/* Two-Column Layout */}
        <div className="two-column-layout" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px', alignItems: 'start' }}>

          {/* LEFT SIDEBAR */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Quick Links */}
            <div className="sidebar-inner" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden' }}>
              <div className="sidebar-title" style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '11px', fontWeight: 700, color: '#4E4E4E', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Library
              </div>
              {navLinks.map(link => (
                <Link key={link.href} href={link.href} className="sidebar-link" style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 20px',
                  color: '#B9B9B9', textDecoration: 'none', fontSize: '14px', fontWeight: 500,
                  borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'all 0.15s',
                }}>
                  <span style={{ opacity: 0.6 }}>{link.icon}</span>
                  {link.label}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto', opacity: 0.3 }}><polyline points="9 18 15 12 9 6"/></svg>
                </Link>
              ))}
            </div>

            {/* Admin Panel */}
            {isAdmin && (
              <Link href="/admin" style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 20px',
                background: 'rgba(123,16,22,0.08)', border: '1px solid rgba(123,16,22,0.2)', borderRadius: '12px',
                color: '#ff6b6b', textDecoration: 'none', fontSize: '14px', fontWeight: 600, transition: 'all 0.15s',
              }} className="sidebar-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Admin Panel
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto' }}><polyline points="9 18 15 12 9 6"/></svg>
              </Link>
            )}
          </div>

          {/* RIGHT CONTENT */}
          <div className="fade-in" key={activeTab}>

            {activeTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Account Info */}
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden' }}>
                  <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#F2F2F0' }}>Account Information</h2>
                  </div>
                  <div className="account-grid" style={{ padding: '28px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    {[
                      { label: 'Display Name', value: username },
                      { label: 'Email Address', value: user.email },
                      { label: 'Member Since', value: memberSince },
                      { label: 'Account Type', value: isAdmin ? 'Administrator' : 'Standard Member' },
                    ].map((item, i) => (
                      <div key={i}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#4E4E4E', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>{item.label}</div>
                        <div style={{ fontSize: '15px', fontWeight: 500, color: '#F2F2F0' }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Watch Activity */}
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden' }}>
                  <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#F2F2F0' }}>Watch Activity</h2>
                  </div>
                  <div style={{ padding: '28px' }}>
                    {/* Progress bar visual */}
                    <div style={{ marginBottom: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ fontSize: '13px', color: '#7E7E7E', fontWeight: 500 }}>Movies</span>
                        <span style={{ fontSize: '13px', color: '#60a5fa', fontWeight: 700 }}>{movieCount}</span>
                      </div>
                      <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: 'linear-gradient(90deg, #60a5fa, #3b82f6)', borderRadius: '3px', width: `${totalWatchedCount > 0 ? (movieCount / totalWatchedCount * 100) : 0}%`, transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ fontSize: '13px', color: '#7E7E7E', fontWeight: 500 }}>TV Shows & Anime</span>
                        <span style={{ fontSize: '13px', color: '#a78bfa', fontWeight: 700 }}>{tvCount}</span>
                      </div>
                      <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: 'linear-gradient(90deg, #a78bfa, #8b5cf6)', borderRadius: '3px', width: `${totalWatchedCount > 0 ? (tvCount / totalWatchedCount * 100) : 0}%`, transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                    <div style={{ paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: '#7E7E7E' }}>Total time invested in great stories</span>
                      <span style={{ fontSize: '16px', fontWeight: 700, color: '#ff6b6b' }}>{hours}h {minutes}m</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'goals' && achievementsData && (
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden' }}>
                <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#F2F2F0' }}>Goals & Badges</h2>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#7E7E7E' }}>Complete challenges to earn premium badges</p>
                </div>
                <div style={{ padding: '28px' }}>
                  {['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'].map(rarity => {
                    const group = achievementsData.all.filter(a => a.rarity === rarity);
                    if (!group.length) return null;
                    
                    const rarityColors: Record<string, { bg: string, border: string, text: string }> = {
                      common: { bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.1)', text: '#B9B9B9' },
                      uncommon: { bg: 'rgba(34,197,94,0.05)', border: 'rgba(34,197,94,0.2)', text: '#4ade80' },
                      rare: { bg: 'rgba(59,130,246,0.05)', border: 'rgba(59,130,246,0.2)', text: '#60a5fa' },
                      epic: { bg: 'rgba(168,85,247,0.05)', border: 'rgba(168,85,247,0.2)', text: '#c084fc' },
                      legendary: { bg: 'rgba(234,179,8,0.05)', border: 'rgba(234,179,8,0.2)', text: '#facc15' },
                      mythic: { bg: 'rgba(239,68,68,0.05)', border: 'rgba(239,68,68,0.2)', text: '#f87171' }
                    };
                    const colors = rarityColors[rarity];

                    return (
                      <div key={rarity} style={{ marginBottom: '32px' }}>
                        <h3 style={{ fontSize: '12px', fontWeight: 700, color: colors.text, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>{rarity} Badges</h3>
                        <div className="badges-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                          {group.map((ach: any) => {
                            const isEarned = achievementsData.earned.some(e => e.achievement_id === ach.id);
                            return (
                              <div key={ach.id} style={{
                                display: 'flex', gap: '16px', padding: '16px',
                                background: isEarned ? colors.bg : 'rgba(255,255,255,0.01)',
                                border: `1px solid ${isEarned ? colors.border : 'rgba(255,255,255,0.03)'}`,
                                borderRadius: '12px', opacity: isEarned ? 1 : 0.4,
                                filter: isEarned ? 'none' : 'grayscale(100%)',
                                transition: 'all 0.3s'
                              }}>
                                <div style={{
                                  width: '56px', height: '56px', borderRadius: '12px',
                                  background: isEarned ? `linear-gradient(135deg, ${colors.border}, transparent)` : 'rgba(255,255,255,0.05)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  color: isEarned ? colors.text : '#7E7E7E', flexShrink: 0,
                                  boxShadow: isEarned ? `0 0 20px ${colors.border}` : 'none'
                                }}>
                                  {getAchievementIcon(ach.icon)}
                                </div>
                                <div>
                                  <div style={{ fontSize: '14px', fontWeight: 700, color: isEarned ? '#F2F2F0' : '#7E7E7E', marginBottom: '4px' }}>{ach.name}</div>
                                  <div style={{ fontSize: '12px', color: '#7E7E7E', lineHeight: 1.4 }}>{ach.description}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden' }}>
                <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#F2F2F0' }}>My Reviews</h2>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#7E7E7E' }}>Manage your reviews</p>
                </div>
                <div style={{ padding: '28px' }}>
                  {reviews.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#7E7E7E', fontSize: '14px', padding: '40px 0' }}>You haven't written any reviews yet.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {reviews.map((rev: any) => (
                        <div key={rev.id} style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <div>
                              <Link href={`/${rev.media_type}/${rev.item_id}`} style={{ color: '#F2F2F0', fontWeight: 600, fontSize: '15px', textDecoration: 'none' }}>
                                Review for Item #{rev.item_id}
                              </Link>
                              <div style={{ fontSize: '12px', color: '#7E7E7E', marginTop: '4px' }}>
                                Rating: <span style={{ color: '#fbbf24' }}>★ {rev.rating}/10</span> • {new Date(rev.created_at).toLocaleDateString()}
                              </div>
                            </div>
                            <button
                              onClick={async () => {
                                if (!window.confirm('Delete this review?')) return;
                                const res = await deleteReview(rev.id);
                                if (res.success) {
                                  setReviews(reviews.filter((r: any) => r.id !== rev.id));
                                  showToast('Review deleted successfully', 'success');
                                } else {
                                  showToast(res.error || 'Failed to delete', 'error');
                                }
                              }}
                              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ff6b6b', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                            >
                              <LucideIcons.Trash2 size={14} />
                            </button>
                          </div>
                          <p style={{ margin: 0, fontSize: '14px', color: '#ECE8DD', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                            {rev.review_text}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden' }}>
                <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#F2F2F0' }}>Edit Profile</h2>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#7E7E7E' }}>Update your display name and avatar</p>
                </div>
                <div style={{ padding: '28px' }}>
                  <form onSubmit={handleSave}>
                    {/* Avatar */}
                    <div className="edit-avatar-group" style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px', padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div onClick={() => fileInputRef.current?.click()} style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #7B1016, #5D0F14)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 700, color: '#F2F2F0', cursor: 'pointer', overflow: 'hidden', flexShrink: 0, position: 'relative', border: '2px dashed rgba(255,255,255,0.15)', margin: '0 auto' }}>
                        {avatarPreview ? <img src={avatarPreview} alt="Avatar preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : username[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: '#F2F2F0', marginBottom: '4px' }}>Profile Photo</div>
                        <div style={{ fontSize: '13px', color: '#7E7E7E', marginBottom: '12px' }}>JPG, PNG or GIF. Max 5MB.</div>
                        <button type="button" onClick={() => fileInputRef.current?.click()} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 14px', color: '#F2F2F0', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                          Upload Photo
                        </button>
                        <input type="file" name="avatar" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
                      </div>
                    </div>

                    {/* Display Name */}
                    <div style={{ marginBottom: '24px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#7E7E7E', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Display Name</label>
                      <input
                        type="text" name="displayName" value={displayName}
                        onChange={e => setDisplayName(e.target.value)}
                        placeholder="Enter a display name"
                        style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#F2F2F0', padding: '14px 16px', borderRadius: '10px', fontSize: '15px', outline: 'none', fontFamily: 'Inter, sans-serif' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button type="submit" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#7B1016', border: 'none', borderRadius: '10px', padding: '12px 24px', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'all 0.2s' }}>
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden' }}>
                <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#F2F2F0' }}>Playback Preferences</h2>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#7E7E7E' }}>Customize your streaming experience</p>
                </div>
                <div style={{ padding: '28px' }}>
                  <form onSubmit={handleSavePrefs}>
                    <div className="prefs-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                      {/* Language Select */}
                      <div style={{ position: 'relative' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#7E7E7E', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Interface Language</label>
                        <div 
                          onClick={() => { setLangOpen(!langOpen); setQualityOpen(false); }}
                          style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#F2F2F0', padding: '12px 16px', borderRadius: '10px', fontSize: '14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s', userSelect: 'none' }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
                          onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                        >
                          <span>{language === 'en' ? 'English' : language === 'es' ? 'Español' : 'Français'}</span>
                          <LucideIcons.ChevronDown size={16} style={{ transform: langOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: '#7E7E7E' }} />
                        </div>
                        <input type="hidden" name="language" value={language} />
                        {langOpen && (
                          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '6px', background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', overflow: 'hidden', zIndex: 100, boxShadow: '0 12px 32px rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)' }}>
                            {[
                              { val: 'en', label: 'English' },
                              { val: 'es', label: 'Español' },
                              { val: 'fr', label: 'Français' }
                            ].map(opt => (
                              <div 
                                key={opt.val}
                                onClick={() => { setLanguage(opt.val); setLangOpen(false); }}
                                style={{ padding: '12px 16px', fontSize: '14px', color: language === opt.val ? '#ff6b6b' : '#B9B9B9', background: language === opt.val ? 'rgba(123,16,22,0.1)' : 'transparent', cursor: 'pointer', transition: 'all 0.15s' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#F2F2F0'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = language === opt.val ? 'rgba(123,16,22,0.1)' : 'transparent'; e.currentTarget.style.color = language === opt.val ? '#ff6b6b' : '#B9B9B9'; }}
                              >
                                {opt.label}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Quality Select */}
                      <div style={{ position: 'relative' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#7E7E7E', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Default Quality</label>
                        <div 
                          onClick={() => { setQualityOpen(!qualityOpen); setLangOpen(false); }}
                          style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#F2F2F0', padding: '12px 16px', borderRadius: '10px', fontSize: '14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s', userSelect: 'none' }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
                          onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                        >
                          <span>{defaultQuality === 'auto' ? 'Auto (Recommended)' : defaultQuality === '1080p' ? '1080p High' : '720p Medium'}</span>
                          <LucideIcons.ChevronDown size={16} style={{ transform: qualityOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: '#7E7E7E' }} />
                        </div>
                        <input type="hidden" name="defaultQuality" value={defaultQuality} />
                        {qualityOpen && (
                          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '6px', background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', overflow: 'hidden', zIndex: 100, boxShadow: '0 12px 32px rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)' }}>
                            {[
                              { val: 'auto', label: 'Auto (Recommended)' },
                              { val: '1080p', label: '1080p High' },
                              { val: '720p', label: '720p Medium' }
                            ].map(opt => (
                              <div 
                                key={opt.val}
                                onClick={() => { setDefaultQuality(opt.val); setQualityOpen(false); }}
                                style={{ padding: '12px 16px', fontSize: '14px', color: defaultQuality === opt.val ? '#ff6b6b' : '#B9B9B9', background: defaultQuality === opt.val ? 'rgba(123,16,22,0.1)' : 'transparent', cursor: 'pointer', transition: 'all 0.15s' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#F2F2F0'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = defaultQuality === opt.val ? 'rgba(123,16,22,0.1)' : 'transparent'; e.currentTarget.style.color = defaultQuality === opt.val ? '#ff6b6b' : '#B9B9B9'; }}
                              >
                                {opt.label}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '28px' }}>
                      {[
                        { label: 'Autoplay Next Episode', desc: 'Automatically play the next episode in a series.', value: autoplayNext, toggle: () => setAutoplayNext(!autoplayNext) },
                        { label: 'Email Notifications', desc: 'Receive recommendations and account updates.', value: emailNotifications, toggle: () => setEmailNotifications(!emailNotifications) },
                      ].map((pref, i) => (
                        <div key={i} className="toggle-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', transition: 'background 0.2s' }}>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: '#F2F2F0', marginBottom: '3px' }}>{pref.label}</div>
                            <div style={{ fontSize: '12px', color: '#7E7E7E' }}>{pref.desc}</div>
                          </div>
                          <div onClick={pref.toggle} style={{ width: '44px', height: '24px', background: pref.value ? '#7B1016' : 'rgba(255,255,255,0.1)', borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: 'background 0.25s', flexShrink: 0, marginLeft: '24px' }}>
                            <div style={{ position: 'absolute', top: '2px', left: pref.value ? '22px' : '2px', width: '20px', height: '20px', background: pref.value ? '#ff6b6b' : '#fff', borderRadius: '50%', transition: 'left 0.25s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    <button type="submit" disabled={prefsLoading} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#7B1016', border: 'none', borderRadius: '10px', padding: '12px 24px', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: prefsLoading ? 'not-allowed' : 'pointer', opacity: prefsLoading ? 0.7 : 1, transition: 'all 0.2s' }}>
                      {prefsLoading ? 'Saving...' : 'Save Preferences'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}>
          <div style={{ width: '100%', maxWidth: '440px', background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '32px', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#F2F2F0', marginBottom: '24px', margin: '0 0 24px' }}>Edit Profile</h2>
            <form onSubmit={handleSave}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                <div onClick={() => fileInputRef.current?.click()} style={{ width: '90px', height: '90px', borderRadius: '50%', background: 'linear-gradient(135deg, #7B1016, #5D0F14)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 700, color: '#F2F2F0', cursor: 'pointer', overflow: 'hidden', border: '2px dashed rgba(255,255,255,0.2)' }}>
                  {avatarPreview ? <img src={avatarPreview} alt="Avatar preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : username[0]?.toUpperCase()}
                </div>
                <input type="file" name="avatar" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#7E7E7E', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Display Name</label>
                <input type="text" name="displayName" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Enter display name" style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#F2F2F0', padding: '12px 16px', borderRadius: '10px', fontSize: '15px', outline: 'none', fontFamily: 'Inter, sans-serif' }} />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#7E7E7E', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Username</label>
                <input type="text" name="username" value={editUsername} onChange={e => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))} placeholder="Enter username (alphanumeric only)" style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#F2F2F0', padding: '12px 16px', borderRadius: '10px', fontSize: '15px', outline: 'none', fontFamily: 'Inter, sans-serif' }} />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => { setIsEditing(false); setAvatarPreview(profile?.avatar_url || null); setDisplayName(profile?.display_name || ''); setEditUsername(profile?.username || ''); }} style={{ flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '10px', color: '#ECE8DD', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={loading} style={{ flex: 1, background: '#7B1016', border: 'none', padding: '12px', borderRadius: '10px', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>{loading ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '32px', right: '32px', zIndex: 1000,
          background: toast.type === 'error' ? 'rgba(123,16,22,0.92)' : 'rgba(15,15,15,0.92)',
          border: toast.type === 'error' ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.08)',
          color: '#F2F2F0', padding: '14px 24px', borderRadius: '12px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)',
          fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: '10px',
          animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {toast.type === 'error' ? <LucideIcons.AlertCircle size={16} style={{ color: '#ff6b6b' }} /> : <LucideIcons.CheckCircle size={16} style={{ color: '#22c55e' }} />}
          {toast.message}
        </div>
      )}
    </>
  );
}
