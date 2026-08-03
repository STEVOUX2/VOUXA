import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils/cn';
import { SmoothScrollProvider } from '@/components/providers/SmoothScrollProvider';
import { SessionProvider } from 'next-auth/react';
import { generateWebSiteJsonLd } from '@/lib/utils/seo';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-display', display: 'swap' });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vouxa.site';

export const viewport: Viewport = {
  themeColor: '#080808',
  colorScheme: 'dark',
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: '%s | VOUXA',
    default: 'VOUXA | Premium Cinematic Streaming',
  },
  description: 'Experience luxury cinema at home with VOUXA. Stream premium movies in HD.',
  openGraph: {
    title: 'VOUXA | Premium Cinematic Streaming',
    description: 'Experience luxury cinema at home with VOUXA. Stream premium movies in HD.',
    url: SITE_URL,
    siteName: 'VOUXA',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VOUXA | Premium Cinematic Streaming',
    description: 'Experience luxury cinema at home with VOUXA. Stream premium movies in HD.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(generateWebSiteJsonLd()) }}
        />
      </head>
      <body suppressHydrationWarning className={cn(
        'min-h-screen bg-background font-sans text-vtext antialiased',
        inter.variable,
        playfair.variable
      )}>
        <SessionProvider>
          <SmoothScrollProvider>
            {children}
          </SmoothScrollProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
