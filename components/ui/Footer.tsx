'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();

  // Hide the footer inside watch party rooms
  if (pathname.startsWith('/watch-party/') && pathname !== '/watch-party') {
    return null;
  }

  return (
    <footer style={{ 
      background: '#080808', 
      borderTop: '1px solid rgba(255,255,255,0.03)', 
      padding: '80px 24px 32px', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      
      {/* Logo */}
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '9px', textDecoration: 'none', marginBottom: '28px' }}>
        <Image src="/logo.svg" alt="VOUXA Logo" width={150} height={42} style={{ height: '42px', width: 'auto', objectFit: 'contain' }} />
      </Link>

      {/* Main Links */}
      <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '56px' }}>
        <style>{`
          .footer-link {
            color: #B9B9B9;
            font-size: 13px;
            font-weight: 500;
            text-decoration: none;
            transition: color 0.25s;
          }
          .footer-link:hover {
            color: #F2F2F0;
          }
          .social-icon {
            color: #7E7E7E;
            transition: color 0.25s, transform 0.25s;
            display: flex;
            align-items: center;
          }
          .social-icon:hover {
            color: #ECE8DD;
            transform: translateY(-2px);
          }
        `}</style>
        <Link href="/" className="footer-link">Home</Link>
        <Link href="/movies" className="footer-link">Movies</Link>
        <Link href="/tv" className="footer-link">TV Shows</Link>
        <Link href="/anime" className="footer-link">Anime</Link>
        <Link href="/terms" className="footer-link">Terms</Link>
        <a href="mailto:contact@vouxa.app" className="footer-link">Contact</a>
      </div>

      {/* Dashed Separator */}
      <div style={{ width: '100%', maxWidth: '1100px', borderTop: '1px dashed rgba(255,255,255,0.1)', marginBottom: '32px' }} />

      {/* Bottom Row */}
      <div style={{ width: '100%', maxWidth: '1100px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', textAlign: 'center' }}>
        
        {/* Social Icons */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', justifyContent: 'center' }}>
          <a href="#" className="social-icon" aria-label="Discord">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
          </a>
          <a href="#" className="social-icon" aria-label="Instagram">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
          </a>
          <a href="#" className="social-icon" aria-label="Github">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3-.3 6-1.5 6-6.5a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 5 3 6.2 6 6.5a4.8 4.8 0 0 0-1 3.2v4"/><path d="M9 18c-4.5 1.5-5-2.5-7-3"/></svg>
          </a>
        </div>
        
        {/* Copyright & Disclaimer */}
        <div style={{ color: '#7E7E7E', fontSize: '13px' }}>
          <p style={{ margin: '0 0 6px 0' }}>© {currentYear} VOUXA. All rights reserved.</p>
          <p style={{ margin: 0, fontSize: '11px', opacity: 0.6, maxWidth: '600px', lineHeight: '1.5' }}>
            This site does not store any files on our server. We only link to media which is hosted on 3rd party services.
          </p>
        </div>
        
      </div>
    </footer>
  );
}
