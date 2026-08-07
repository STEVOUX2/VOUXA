import { Metadata } from 'next';
import { generateMetadata } from '@/lib/utils/seo';

export const metadata: Metadata = generateMetadata({
  title: 'Search Movies & TV Shows',
  description: 'Find your next favorite movie or TV show. Search the entire VOUXA catalog by title, actor, or genre.',
  path: '/search'
});

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
