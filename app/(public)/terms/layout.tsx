import { Metadata } from 'next';
import { generateMetadata } from '@/lib/utils/seo';

export const metadata: Metadata = generateMetadata({
  title: 'Terms of Service & Privacy Policy',
  description: 'Read the Terms of Service and Privacy Policy for VOUXA.',
  path: '/terms'
});

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
