import { Metadata } from 'next';
import { generateMetadata } from '@/lib/utils/seo';

export const metadata: Metadata = generateMetadata({
  title: 'Your Watch History',
  description: 'View the movies and TV shows you have recently watched on VOUXA.',
  path: '/history'
});

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
