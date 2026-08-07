'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';
import { SearchModal } from './SearchModal';
import { Film } from 'lucide-react';

function NavLink({ href, label, icon }: { href: string, label: React.ReactNode, icon?: React.ReactNode }) {
  return (
    <Link href={href} style={{
      display: 'flex', alignItems: 'center', gap: '5px',
      color: '#B9B9B9',
      fontSize: '13px', fontWeight: 500,
      fontFamily: 'Inter, system-ui, sans-serif',
      textDecoration: 'none',
      letterSpacing: '0.01em',
      transition: 'color 0.25s',
    }}
      onMouseEnter={(e) => (e.currentTarget.style.color = '#F2F2F0')}
      onMouseLeave={(e) => (e.currentTarget.style.color = '#B9B9B9')}
    >
      {icon}
      {label}
    </Link>
  );
}

export function Header({ isAdmin = false }: { isAdmin?: boolean }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Hide the global header inside watch party rooms (they have their own top bar)
  if (pathname.startsWith('/watch-party/') && pathname !== '/watch-party') {
    return null;
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const avatarLetter =
    user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <>
    <style>{`
      .header-container {
        padding: 0 64px !important;
      }
      .nav-desktop {
        display: flex;
      }
      .hamburger-btn {
        display: none;
      }
      @media (max-width: 768px) {
        .header-container {
          padding: 0 20px !important;
        }
        .nav-desktop {
          display: none !important;
        }
        .hamburger-btn {
          display: flex;
          flex-direction: column;
        }
      }
      @media (max-width: 480px) {
        .header-container {
          padding: 0 16px !important;
        }
      }
      .drawer-link {
        display: flex;
        align-items: center;
        height: 52px;
        font-size: 18px;
        color: #B9B9B9;
        text-decoration: none;
        padding-left: 24px;
        position: relative;
        transition: color 0.2s;
      }
      .drawer-link:hover, .drawer-link.active {
        color: #F2F2F0;
      }
      .drawer-link.active::before {
        content: '';
        position: absolute;
        left: 0;
        top: 10px;
        bottom: 10px;
        width: 4px;
        background-color: #7B1016;
        border-top-right-radius: 4px;
        border-bottom-right-radius: 4px;
      }
      .drawer-link.watch-party-highlight {
        color: #ff6b6b !important;
        font-weight: 600;
        background: rgba(123, 16, 22, 0.08);
        margin: 6px 16px;
        padding-left: 16px !important;
        border-radius: 8px;
        border: 1px solid rgba(123, 16, 22, 0.25);
        height: 48px;
        box-shadow: 0 4px 12px rgba(123, 16, 22, 0.1);
      }
      .drawer-link.watch-party-highlight:hover {
        background: rgba(123, 16, 22, 0.15) !important;
        color: #ff8b8b !important;
        border-color: rgba(123, 16, 22, 0.4);
      }
      .drawer-link.watch-party-highlight.active::before {
        display: none !important;
      }
    `}</style>
    <header className="header-container" style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '80px',
      backgroundColor: isScrolled ? 'rgba(8,8,8,0.92)' : 'rgba(0,0,0,0)',
      backdropFilter: isScrolled ? 'blur(16px)' : 'none',
      WebkitBackdropFilter: isScrolled ? 'blur(16px)' : 'none',
      borderBottom: 'none',
      transition: 'background-color 0.45s cubic-bezier(.22,1,.36,1)',
    }}>

      {/* Left: Logo + Content Nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '48px', height: '100%' }}>

        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '9px', textDecoration: 'none' }}>
          <Image src="/logo.svg" alt="VOUXA Logo" width={100} height={28} priority style={{ height: '28px', width: 'auto', objectFit: 'contain' }} />
        </Link>

        {/* Content Nav */}
        {!isAdmin && (
          <nav className="nav-desktop" style={{ alignItems: 'center', gap: '28px' }}>
            <NavLink href="/" label="Home" />
            <NavLink href="/movies" label="Movies" />
            <NavLink href="/tv" label="TV Shows" />
            <NavLink href="/anime" label="Anime" />
          </nav>
        )}
      </div>

      {/* Right: Personal Nav + Search + User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        
        {/* Personal Nav */}
        {!isAdmin && (
          <nav className="nav-desktop" style={{ alignItems: 'center', gap: '24px' }}>
            <NavLink href="/watch-party" label={<span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Film size={14} color="#ff6b6b" /> Watch Party</span>} />
          </nav>
        )}

        {/* Utilities */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button 
            onClick={() => setSearchOpen(true)}
            style={{ 
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              color: '#7E7E7E', display: 'flex', alignItems: 'center', transition: 'color 0.25s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#F2F2F0')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#7E7E7E')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>

          {user ? (
            <Link 
              href="/profile"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: user.image
                  ? 'transparent'
                  : 'linear-gradient(135deg, #7B1016, #5D0F14)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 4px 10px rgba(123,16,22,0.3)',
                transition: 'all 0.2s',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              title="My Profile"
            >
              {user.image ? (
                <Image src={user.image} alt="avatar" width={34} height={34} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                avatarLetter
              )}
            </Link>
          ) : (
            <Link
              href="/auth/signin"
              id="btn-signin-header"
              style={{
                background: '#F2F2F0', border: 'none', cursor: 'pointer', padding: '8px 20px',
                color: '#080808', display: 'flex', alignItems: 'center', borderRadius: '999px',
                fontSize: '14px', fontWeight: 700, transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(242,242,240,0.15)',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(242,242,240,0.25)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(242,242,240,0.15)'; }}
            >
              Sign In
            </Link>
          )}

          {/* Hamburger Menu Button */}
          <button
            className="hamburger-btn"
            onClick={() => setDrawerOpen(!drawerOpen)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '10px',
              justifyContent: 'center',
              alignItems: 'center',
              width: '44px',
              height: '44px',
              zIndex: 2001,
              position: drawerOpen ? 'fixed' : 'relative',
              right: drawerOpen ? '20px' : 'auto',
            }}
          >
            <div style={{
              width: '20px', height: '2px', backgroundColor: '#B9B9B9', transition: 'all 0.3s',
              transform: drawerOpen ? 'rotate(45deg) translate(4px, 4.5px)' : 'none',
              marginBottom: drawerOpen ? '0' : '4px'
            }} />
            <div style={{
              width: '20px', height: '2px', backgroundColor: '#B9B9B9', transition: 'all 0.3s',
              opacity: drawerOpen ? 0 : 1,
              marginBottom: drawerOpen ? '0' : '4px'
            }} />
            <div style={{
              width: '20px', height: '2px', backgroundColor: '#B9B9B9', transition: 'all 0.3s',
              transform: drawerOpen ? 'rotate(-45deg) translate(4px, -4.5px)' : 'none'
            }} />
          </button>
        </div>
      </div>
    </header>

    {/* Mobile Drawer Overlay */}
    {drawerOpen && (
      <div 
        onClick={() => setDrawerOpen(false)}
        style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          zIndex: 1999,
        }}
      />
    )}

    {/* Mobile Drawer */}
    <div style={{
      position: 'fixed',
      top: 0,
      right: drawerOpen ? 0 : '-280px',
      width: '280px',
      height: '100vh',
      background: 'linear-gradient(180deg, rgba(26, 6, 8, 0.82) 0%, rgba(13, 13, 13, 0.90) 100%)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderLeft: '1px solid rgba(255,255,255,0.08)',
      zIndex: 2000,
      transition: 'right 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      display: 'flex',
      flexDirection: 'column',
      paddingTop: '24px',
      boxShadow: drawerOpen ? '-10px 0 40px rgba(0,0,0,0.6)' : 'none',
    }}>
      <div style={{ paddingLeft: '24px', marginBottom: '32px' }}>
        <Link href="/" onClick={() => setDrawerOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '9px', textDecoration: 'none' }}>
          <Image src="/logo.svg" alt="VOUXA Logo" width={100} height={28} style={{ height: '28px', width: 'auto', objectFit: 'contain' }} />
        </Link>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <Link href="/" className={`drawer-link ${pathname === '/' ? 'active' : ''}`} onClick={() => setDrawerOpen(false)}>Home</Link>
        <Link href="/movies" className={`drawer-link ${pathname === '/movies' ? 'active' : ''}`} onClick={() => setDrawerOpen(false)}>Movies</Link>
        <Link href="/tv" className={`drawer-link ${pathname === '/tv' ? 'active' : ''}`} onClick={() => setDrawerOpen(false)}>TV Shows</Link>
        <Link href="/anime" className={`drawer-link ${pathname === '/anime' ? 'active' : ''}`} onClick={() => setDrawerOpen(false)}>Anime</Link>
        <Link href="/watch-party" className={`drawer-link watch-party-highlight ${pathname === '/watch-party' ? 'active' : ''}`} onClick={() => setDrawerOpen(false)}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Film size={18} color="#ff6b6b" /> Watch Party
          </span>
        </Link>
      </nav>

      <div style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {user ? (
          <>
            <Link href="/profile" onClick={() => setDrawerOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: '#F2F2F0', marginBottom: '20px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: user.image ? 'transparent' : 'linear-gradient(135deg, #7B1016, #5D0F14)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {user.image ? <Image src={user.image} alt="avatar" width={32} height={32} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{fontSize:'12px', fontWeight:700}}>{avatarLetter}</span>}
              </div>
              <span style={{ fontSize: '15px', fontWeight: 500 }}>Profile</span>
            </Link>
            <button onClick={() => { setDrawerOpen(false); handleSignOut(); }} style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', color: '#B9B9B9', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
              Sign Out
            </button>
          </>
        ) : (
          <Link href="/auth/signin" onClick={() => setDrawerOpen(false)} style={{ display: 'block', textAlign: 'center', width: '100%', padding: '12px', background: '#F2F2F0', color: '#080808', textDecoration: 'none', borderRadius: '999px', fontSize: '14px', fontWeight: 700 }}>
            Sign In
          </Link>
        )}
      </div>
    </div>

    <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
