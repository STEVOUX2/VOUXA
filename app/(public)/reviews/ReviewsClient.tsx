'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { deleteReview } from '@/app/actions/user';

interface ReviewItem {
  id: string;
  item_id: number;
  media_type: string;
  rating: number;
  review_text: string;
  has_spoiler: boolean;
  created_at: string;
}

interface EnrichedReview extends ReviewItem {
  title?: string;
  posterPath?: string;
  releaseDate?: string;
}

interface ReviewsClientProps {
  initialReviews: ReviewItem[];
}

export default function ReviewsClient({ initialReviews }: ReviewsClientProps) {
  const [reviews, setReviews] = useState<EnrichedReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'All' | 'Movies' | 'TV Shows'>('All');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviewDetails = async () => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
        if (!apiKey) {
          console.error("Missing TMDB API Key");
          // Fallback to basic details
          setReviews(initialReviews.map(r => ({ ...r, title: `${r.media_type.toUpperCase()} #${r.item_id}` })));
          setLoading(false);
          return;
        }

        const promises = initialReviews.map(async (review) => {
          const type = review.media_type === 'tv' ? 'tv' : 'movie';
          try {
            const res = await fetch(`https://api.themoviedb.org/3/${type}/${review.item_id}?api_key=${apiKey}`);
            if (!res.ok) throw new Error("TMDB Error");
            const data = await res.json();
            return {
              ...review,
              title: data.title || data.name || 'Unknown Title',
              posterPath: data.poster_path ? `https://image.tmdb.org/t/p/w342${data.poster_path}` : undefined,
              releaseDate: data.release_date || data.first_air_date || '',
            };
          } catch (e) {
            return {
              ...review,
              title: `Media item #${review.item_id}`,
              releaseDate: '',
            };
          }
        });

        const results = await Promise.all(promises);
        setReviews(results);
      } catch (err) {
        console.error("Failed to load review metadata:", err);
      } finally {
        setLoading(false);
      }
    };

    if (initialReviews && initialReviews.length > 0) {
      fetchReviewDetails();
    } else {
      setLoading(false);
    }
  }, [initialReviews]);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this review?")) {
      setDeletingId(id);
      const res = await deleteReview(id);
      if (res && 'success' in res && res.success) {
        setReviews(prev => prev.filter(r => r.id !== id));
      } else {
        alert("Failed to delete review. Please try again.");
      }
      setDeletingId(null);
    }
  };

  const filteredReviews = useMemo(() => {
    if (filter === 'Movies') return reviews.filter(r => r.media_type === 'movie');
    if (filter === 'TV Shows') return reviews.filter(r => r.media_type === 'tv');
    return reviews;
  }, [reviews, filter]);

  return (
    <div className="reviews-page" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
      <style>{`
        @media (max-width: 768px) {
          .reviews-page { padding: 0 16px !important; }
          .reviews-header { flex-direction: column !important; align-items: flex-start !important; gap: 16px !important; }
          .reviews-filters { width: 100% !important; overflow-x: auto; white-space: nowrap; padding-bottom: 4px; }
          .review-card { flex-direction: column !important; align-items: flex-start !important; padding: 16px !important; gap: 16px !important; }
          .review-card-top { width: 100% !important; flex-direction: column !important; align-items: flex-start !important; gap: 8px !important; }
          .review-card-meta { width: 100% !important; flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
        }
      `}</style>
      {/* Header */}
      <div className="reviews-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#F2F2F0', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>My Reviews</h1>
          <p style={{ color: '#7E7E7E', fontSize: '14px', margin: 0 }}>You have written {reviews.length} reviews.</p>
        </div>

        {/* Filter Controls */}
        <div className="reviews-filters" style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '4px' }}>
          {(['All', 'Movies', 'TV Shows'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: filter === type ? '#7B1016' : 'transparent',
                color: filter === type ? '#FFF' : '#B9B9B9',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: '160px', background: '#121212', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.04)', animation: 'pulse 1.5s infinite' }} />
          ))}
          <style>{`@keyframes pulse{0%,100%{opacity:0.6}50%{opacity:1}}`}</style>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4E4E4E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px' }}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <p style={{ color: '#7E7E7E', fontSize: '15px', margin: 0 }}>No reviews found under "{filter}".</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filteredReviews.map((review) => {
            const detailUrl = review.media_type === 'tv' ? `/tv/${review.item_id}` : `/movie/${review.item_id}`;
            const releaseYear = review.releaseDate ? new Date(review.releaseDate).getFullYear() : '';
            return (
              <div
                key={review.id}
                className="review-card"
                style={{
                  display: 'flex',
                  gap: '24px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '20px',
                  padding: '24px',
                  position: 'relative',
                  overflow: 'hidden',
                  alignItems: 'flex-start',
                }}
              >
                {/* Media Poster */}
                <Link href={detailUrl} style={{ flexShrink: 0 }}>
                  <div
                    style={{
                      width: '80px',
                      height: '120px',
                      borderRadius: '10px',
                      background: '#121212',
                      backgroundImage: review.posterPath ? `url(${review.posterPath})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      border: '1px solid rgba(255,255,255,0.08)',
                      transition: 'transform 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  />
                </Link>

                {/* Review Body */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                  <div className="review-card-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                    <div>
                      <Link href={detailUrl} style={{ textDecoration: 'none' }}>
                        <h3
                          style={{
                            fontSize: '17px',
                            fontWeight: 700,
                            color: '#F2F2F0',
                            margin: '0 0 4px 0',
                            transition: 'color 0.2s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.color = '#B1222E'}
                          onMouseLeave={e => e.currentTarget.style.color = '#F2F2F0'}
                        >
                          {review.title}
                        </h3>
                      </Link>
                      <span style={{ fontSize: '11px', color: '#7E7E7E', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                        {review.media_type === 'tv' ? 'TV Show' : 'Movie'}{releaseYear && ` · ${releaseYear}`}
                      </span>
                    </div>

                    {/* Stars / Score */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(177, 34, 46, 0.1)', padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(177, 34, 46, 0.2)' }}>
                      <span style={{ color: '#B1222E', fontSize: '12px', fontWeight: 800 }}>★</span>
                      <span style={{ color: '#F2F2F0', fontSize: '13px', fontWeight: 800 }}>{review.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Review Text */}
                  <p style={{ color: '#B9B9B9', fontSize: '14px', lineHeight: '1.6', margin: '4px 0 0 0', whiteSpace: 'pre-line' }}>
                    {review.has_spoiler ? (
                      <span style={{ fontStyle: 'italic', color: '#B1222E', fontWeight: 600 }}>[Warning: Spoiler review] </span>
                    ) : null}
                    {review.review_text}
                  </p>

                  {/* Footer Meta */}
                  <div className="review-card-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                    <span style={{ fontSize: '12px', color: '#555', fontWeight: 500 }}>
                      Reviewed on {new Date(review.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>

                    <button
                      onClick={() => handleDelete(review.id)}
                      disabled={deletingId === review.id}
                      style={{
                        background: 'rgba(185, 28, 28, 0.1)',
                        border: '1px solid rgba(185, 28, 28, 0.2)',
                        color: '#EF4444',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: deletingId === review.id ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        fontFamily: 'Inter, sans-serif',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(185, 28, 28, 0.2)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(185, 28, 28, 0.1)'; }}
                    >
                      {deletingId === review.id ? 'Deleting...' : 'Delete'}
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
