import { Metadata } from 'next';
import { generateMetadata } from '@/lib/utils/seo';

export const metadata: Metadata = generateMetadata({
  title: 'Your Favorites',
  description: 'View your favorite movies and TV shows saved to your VOUXA profile.',
  path: '/favorites'
});

export default function FavoritesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
