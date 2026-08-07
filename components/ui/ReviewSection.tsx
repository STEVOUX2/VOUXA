'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { addReview, voteReview } from '@/app/actions/user';

interface Review {
  id: string;
  rating: number;
  review_text: string;
  has_spoiler: boolean;
  created_at: string;
  profiles: { display_name: string | null; avatar_url: string | null; username: string | null };
  review_votes: { vote: string; user_id: string }[];
}

interface Props {
  itemId: number;
  mediaType: string;
  initialReviews: Review[];
  currentUserId?: string;
}

export function ReviewSection({ itemId, mediaType, initialReviews, currentUserId }: Props) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [hasSpoiler, setHasSpoiler] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [revealedSpoilers, setRevealedSpoilers] = useState<Set<string>>(new Set());
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const router = useRouter();

  // Always re-fetch reviews client-side to ensure freshness
  useEffect(() => {
    if (!itemId) return;
    fetch(`/api/reviews?itemId=${itemId}&mediaType=${mediaType}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.reviews) setReviews(data.reviews); })
      .catch(() => {});
  }, [itemId, mediaType]);

  useEffect(() => {
    setReviews(initialReviews);
  }, [initialReviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRating) { setSubmitError('Please select a star rating.'); return; }
    if (!currentUserId) { setSubmitError('Please sign in to leave a review.'); return; }
    setSubmitting(true);
    setSubmitError('');
    const res = await addReview(itemId, mediaType, selectedRating, reviewText, hasSpoiler);
    if (res.error) { setSubmitError(res.error); }
    else {
      setSubmitSuccess(true);
      
      // Optimistic update
      const newReview = {
        id: Math.random().toString(), // temporary ID
        rating: selectedRating,
        review_text: reviewText,
        has_spoiler: hasSpoiler,
        created_at: new Date().toISOString(),
        profiles: { display_name: 'You', avatar_url: null, username: 'you' },
        review_votes: []
      };
      setReviews(prev => [newReview, ...prev]);

      setReviewText('');
      setSelectedRating(0);
      setHasSpoiler(false);
      router.refresh(); 
      setTimeout(() => setSubmitSuccess(false), 3000);
    }
    setSubmitting(false);
  };

  const handleVote = async (reviewId: string, vote: 'agree' | 'disagree') => {
    if (!currentUserId) return;
    await voteReview(reviewId, vote);
    // Optimistic update
    setReviews(prev => prev.map(r => {
      if (r.id !== reviewId) return r;
      const existingVote = r.review_votes.find(v => v.user_id === currentUserId);
      let newVotes = r.review_votes.filter(v => v.user_id !== currentUserId);
      if (!existingVote || existingVote.vote !== vote) {
        newVotes = [...newVotes, { vote, user_id: currentUserId }];
      }
      return { ...r, review_votes: newVotes };
    }));
  };

  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  return (
    <div className="review-section" style={{ marginTop: '64px', paddingTop: '40px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <style>{`
        @media (max-width: 768px) {
          .review-section { margin-top: 32px !important; padding-top: 24px !important; }
          .review-form { padding: 16px !important; }
          .review-form-actions { flex-direction: column !important; align-items: stretch !important; }
          .review-form-actions label { margin-bottom: 8px; }
          .review-form-actions div { width: 100%; justify-content: space-between; }
          .review-form-actions button { width: 100%; }
          .review-item { flex-direction: column !important; gap: 12px !important; padding: 16px !important; }
          .review-item-header { flex-direction: column !important; align-items: flex-start !important; gap: 4px !important; }
          .review-item-actions { flex-wrap: wrap !important; }
        }
      `}</style>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
        <div style={{ width: '3px', height: '28px', background: 'linear-gradient(180deg, #7B1016, #5D0F14)', borderRadius: '999px' }} />
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#F2F2F0', margin: 0 }}>Community Reviews</h2>
        {avgRating && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(123,16,22,0.15)', border: '1px solid rgba(123,16,22,0.3)', borderRadius: '20px', padding: '4px 14px' }}>
            <span style={{ color: '#ff6b6b', fontSize: '16px' }}>★</span>
            <span style={{ color: '#F2F2F0', fontWeight: 700, fontSize: '15px' }}>{avgRating}</span>
            <span style={{ color: '#7E7E7E', fontSize: '13px' }}>({reviews.length})</span>
          </div>
        )}
      </div>

      {/* Review Form */}
      <div className="review-form" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#F2F2F0', marginBottom: '16px' }}>Write a Review</h3>
        <form onSubmit={handleSubmit}>
          {/* Star selector */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
            {[1,2,3,4,5].map(star => (
              <button
                key={star} type="button"
                onClick={() => setSelectedRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '28px', color: star <= (hoverRating || selectedRating) ? '#ff6b6b' : 'rgba(255,255,255,0.15)', transition: 'color 0.15s, transform 0.15s', transform: star <= (hoverRating || selectedRating) ? 'scale(1.2)' : 'scale(1)', padding: '0 2px' }}
              >★</button>
            ))}
            {selectedRating > 0 && <span style={{ marginLeft: '8px', color: '#7E7E7E', fontSize: '14px', alignSelf: 'center' }}>{['','Terrible','Bad','OK','Good','Excellent'][selectedRating]}</span>}
          </div>

          <textarea
            value={reviewText}
            onChange={e => setReviewText(e.target.value)}
            placeholder="Share your thoughts about this title... (optional)"
            rows={3}
            style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#ECE8DD', padding: '12px 16px', borderRadius: '10px', fontSize: '14px', fontFamily: 'Inter, sans-serif', resize: 'vertical', outline: 'none', marginBottom: '12px' }}
          />

          <div className="review-form-actions" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#B9B9B9', fontSize: '14px' }}>
              <input type="checkbox" checked={hasSpoiler} onChange={e => setHasSpoiler(e.target.checked)} style={{ accentColor: '#7B1016', width: '16px', height: '16px' }} />
              ⚠️ Contains spoilers
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {submitError && <span style={{ color: '#ff6b6b', fontSize: '13px' }}>{submitError}</span>}
              {submitSuccess && <span style={{ color: '#4ade80', fontSize: '13px' }}>✓ Review submitted!</span>}
              <button type="submit" disabled={submitting} style={{ background: '#7B1016', border: 'none', color: '#fff', padding: '10px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', opacity: submitting ? 0.7 : 1, transition: 'all 0.2s' }}>
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <p style={{ color: '#7E7E7E', fontSize: '15px', textAlign: 'center', padding: '32px' }}>No reviews yet. Be the first!</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {reviews.map(review => {
            const name = review.profiles?.display_name || review.profiles?.username || 'Anonymous';
            const agreeCount = review.review_votes.filter(v => v.vote === 'agree').length;
            const disagreeCount = review.review_votes.filter(v => v.vote === 'disagree').length;
            const myVote = review.review_votes.find(v => v.user_id === currentUserId)?.vote;
            const isRevealed = revealedSpoilers.has(review.id);

            return (
              <div key={review.id} className="review-item" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', padding: '20px', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                {/* Avatar */}
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #7B1016, #5D0F14)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, color: '#F2F2F0', flexShrink: 0, overflow: 'hidden' }}>
                    {review.profiles?.avatar_url ? <img src={review.profiles.avatar_url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : name[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
                    <div className="review-item-header" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, color: '#F2F2F0', fontSize: '14px' }}>{name}</span>
                      <span style={{ color: '#ff6b6b', fontSize: '13px' }}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                      {review.has_spoiler && <span style={{ background: 'rgba(255, 107, 107, 0.15)', color: '#ff6b6b', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(255,107,107,0.3)' }}>⚠️ SPOILER</span>}
                      <span style={{ color: '#4E4E4E', fontSize: '12px', marginLeft: 'auto' }}>{new Date(review.created_at).toLocaleDateString()}</span>
                    </div>

                    {review.review_text && (
                      review.has_spoiler && !isRevealed ? (
                        <div style={{ position: 'relative' }}>
                          <p style={{ color: '#B9B9B9', fontSize: '14px', lineHeight: 1.6, filter: 'blur(4px)', userSelect: 'none', margin: '0 0 8px 0' }}>{review.review_text}</p>
                          <button onClick={() => setRevealedSpoilers(prev => new Set([...prev, review.id]))} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#ECE8DD', padding: '6px 16px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Show Spoiler</button>
                        </div>
                      ) : (
                        <p style={{ color: '#B9B9B9', fontSize: '14px', lineHeight: 1.6, margin: '0 0 12px 0' }}>{review.review_text}</p>
                      )
                    )}

                    {/* Vote buttons */}
                    <div className="review-item-actions" style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <button onClick={() => handleVote(review.id, 'agree')} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: myVote === 'agree' ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${myVote === 'agree' ? 'rgba(74,222,128,0.4)' : 'rgba(255,255,255,0.08)'}`, color: myVote === 'agree' ? '#4ade80' : '#7E7E7E', padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'Inter, sans-serif' }}>
                        👍 Agree {agreeCount > 0 && agreeCount}
                      </button>
                      <button onClick={() => handleVote(review.id, 'disagree')} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: myVote === 'disagree' ? 'rgba(255,107,107,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${myVote === 'disagree' ? 'rgba(255,107,107,0.4)' : 'rgba(255,255,255,0.08)'}`, color: myVote === 'disagree' ? '#ff6b6b' : '#7E7E7E', padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'Inter, sans-serif' }}>
                        👎 Disagree {disagreeCount > 0 && disagreeCount}
                      </button>
                    </div>
                  </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
