'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'react-hot-toast';
import { Review, ReviewStats } from '@/types/reviews';
import { ReviewService } from '@/lib/services/reviews';
import ReviewSummary from './ReviewSummary';
import ReviewForm from './ReviewForm';
import ReviewList from './ReviewList';
import { User } from '@supabase/supabase-js';

interface ReviewsSectionProps {
  productId: string;
  productSlug: string;
}

export default function ReviewsSection({ productId, productSlug }: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    average_rating: 0,
    review_count: 0,
    rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  const supabase = createClient();
  const reviewService = new ReviewService();

  useEffect(() => {
    checkUser();
    loadReviews();
  }, [productId]);

  useEffect(() => {
    if (user) {
      loadUserReview();
    }
  }, [user, productId]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const loadReviews = async () => {
    try {
      setLoading(true);
      const [reviewsData, statsData] = await Promise.all([
        reviewService.getProductReviews(productId, { page: 1, limit: 10 }),
        reviewService.getProductReviewStats(productId)
      ]);
      
      setReviews(reviewsData);
      setStats(statsData);
      setHasMore(reviewsData.length === 10);
    } catch (error) {
      console.error('Error loading reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const loadUserReview = async () => {
    try {
      const userReviewData = await reviewService.getUserReview(productId, user?.id || '');
      setUserReview(userReviewData);
    } catch (error) {
      console.error('Error loading user review:', error);
    }
  };

  const loadMoreReviews = async () => {
    try {
      const nextPage = page + 1;
      const newReviews = await reviewService.getProductReviews(productId, { 
        page: nextPage, 
        limit: 10,
        rating: selectedRating || undefined
      });
      
      setReviews(prev => [...prev, ...newReviews]);
      setPage(nextPage);
      setHasMore(newReviews.length === 10);
    } catch (error) {
      console.error('Error loading more reviews:', error);
      toast.error('Failed to load more reviews');
    }
  };

  const handleReviewSubmitted = async (newReview: Review) => {
    setUserReview(newReview);
    setShowForm(false);
    
    // Reload reviews and stats
    await loadReviews();
    toast.success('Review submitted successfully!');
  };

  const handleRatingFilter = async (rating: number | null) => {
    setSelectedRating(rating);
    setPage(1);
    setHasMore(true);
    
    try {
      const filteredReviews = await reviewService.getProductReviews(productId, {
        page: 1,
        limit: 10,
        rating: rating || undefined
      });
      
      setReviews(filteredReviews);
      setHasMore(filteredReviews.length === 10);
    } catch (error) {
      console.error('Error filtering reviews:', error);
      toast.error('Failed to filter reviews');
    }
  };

  const handleEditReview = () => {
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setShowForm(false);
  };

  return (
    <div className="space-y-8">
      {/* Review Summary */}
      <ReviewSummary 
        stats={stats}
        onRatingFilter={handleRatingFilter}
        selectedRating={selectedRating}
      />

      {/* Review Form */}
      {user && !showForm && !userReview && (
        <div className="text-center">
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium transition-colors"
          >
            Write a Review
          </button>
        </div>
      )}

      {user && showForm && (
        <ReviewForm
          productId={productId}
          existingReview={userReview}
          onReviewSubmitted={handleReviewSubmitted}
          onCancel={handleCancelEdit}
        />
      )}

      {/* User's Review Display */}
      {user && userReview && !showForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-blue-900">Your Review</h4>
            <button
              onClick={handleEditReview}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Edit
            </button>
          </div>
          <div className="bg-white rounded p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-4 h-4 ${
                      star <= userReview.rating
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {userReview.status === 'pending' && '(Pending Review)'}
                {userReview.status === 'rejected' && '(Rejected)'}
              </span>
            </div>
            <p className="text-sm text-gray-700">{userReview.comment}</p>
          </div>
        </div>
      )}

      {/* Login Prompt */}
      {!user && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <h4 className="font-medium text-gray-900 mb-2">Want to review this product?</h4>
          <p className="text-gray-600 mb-4">
            Sign in to share your experience and help other customers make informed decisions.
          </p>
          <a
            href={`/login?next=/products/${productSlug}`}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
          >
            Sign In to Review
          </a>
        </div>
      )}

      {/* Reviews List */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Customer Reviews ({stats.review_count})
        </h3>
        <ReviewList
          reviews={reviews}
          loading={loading}
          onLoadMore={loadMoreReviews}
          hasMore={hasMore}
          showUserInfo={true}
        />
      </div>
    </div>
  );
} 