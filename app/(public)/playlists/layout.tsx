import { Metadata } from 'next';
import { generateMetadata } from '@/lib/utils/seo';

export const metadata: Metadata = generateMetadata({
  title: 'Your Playlists',
  description: 'Manage and view your custom playlists on VOUXA.',
  path: '/playlists'
});

export default function PlaylistsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
