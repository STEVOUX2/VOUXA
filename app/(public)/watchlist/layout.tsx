import { Metadata } from 'next';
import { generateMetadata } from '@/lib/utils/seo';

export const metadata: Metadata = generateMetadata({
  title: 'Your Watchlist',
  description: 'View the movies and TV shows you have saved to watch later on VOUXA.',
  path: '/watchlist'
});

export default function WatchlistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
