import { auth } from '@/auth';
import { getMyReviews } from '@/app/actions/user';
import ReviewsClient from './ReviewsClient';

export const metadata = {
  title: 'My Reviews | VOUXA',
};

export default async function MyReviewsPage() {
  const session = await auth();
  const user = session?.user ?? null;

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: '#080808', paddingTop: '160px', paddingBottom: '120px', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '64px', background: 'rgba(255,255,255,0.03)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ 
            width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #5D0F14, #7B1016)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto',
            boxShadow: '0 4px 20px rgba(123,16,22,0.4)'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#F2F2F0', margin: '0 0 16px 0' }}>My Reviews</h1>
          <p style={{ color: '#7E7E7E', fontSize: '16px', lineHeight: '1.6', margin: '0 0 32px 0' }}>
            Manage the reviews and ratings you have shared. Sign in to view and edit your reviews.
          </p>
          <p style={{ color: '#F2F2F0', fontSize: '15px', fontWeight: 600 }}>Please <a href="/auth/signin" style={{ color: '#B1222E' }}>Sign In</a> to continue.</p>
        </div>
      </div>
    );
  }

  const { reviews } = await getMyReviews();

  return (
    <div style={{ minHeight: '100vh', background: '#080808', paddingTop: '120px', paddingBottom: '120px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <ReviewsClient initialReviews={reviews || []} />
    </div>
  );
}
