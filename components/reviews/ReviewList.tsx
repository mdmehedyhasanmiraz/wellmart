'use client';

import { useState } from 'react';
import { Review } from '@/types/reviews';
import StarRating from './StarRating';

interface ReviewListProps {
  reviews: Review[];
  loading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  showUserInfo?: boolean;
}

export default function ReviewList({ 
  reviews, 
  loading = false, 
  onLoadMore, 
  hasMore = false,
  showUserInfo = true 
}: ReviewListProps) {
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());

  const toggleReviewExpansion = (reviewId: string) => {
    const newExpanded = new Set(expandedReviews);
    if (newExpanded.has(reviewId)) {
      newExpanded.delete(reviewId);
    } else {
      newExpanded.add(reviewId);
    }
    setExpandedReviews(newExpanded);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      approved: { color: 'bg-green-100 text-green-800', text: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', text: 'Rejected' }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-2">
          <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No reviews yet</h3>
        <p className="text-gray-500">Be the first to review this product!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Reviews */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="bg-white rounded-lg border border-gray-200 p-4">
            {/* Review Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                {showUserInfo && (
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-blue-600 font-medium text-sm">
                      {review.user?.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  {showUserInfo && (
                    <p className="font-medium text-gray-900">
                      {review.user?.name || 'Anonymous'}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <StarRating rating={review.rating} readonly size="sm" />
                    <span className="text-sm text-gray-500">
                      {formatDate(review.created_at)}
                    </span>
                  </div>
                </div>
              </div>
              {getStatusBadge(review.status)}
            </div>

            {/* Review Content */}
            <div className="text-gray-700">
              {review.comment.length > 200 && !expandedReviews.has(review.id) ? (
                <div>
                  <p className="text-sm">
                    {review.comment.substring(0, 200)}...
                  </p>
                  <button
                    onClick={() => toggleReviewExpansion(review.id)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-1"
                  >
                    Read more
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-sm whitespace-pre-wrap">
                    {review.comment}
                  </p>
                  {review.comment.length > 200 && expandedReviews.has(review.id) && (
                    <button
                      onClick={() => toggleReviewExpansion(review.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-1"
                    >
                      Show less
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Review Footer */}
            {review.updated_at !== review.created_at && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Updated on {formatDate(review.updated_at)}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Loading...' : 'Load More Reviews'}
          </button>
        </div>
      )}

      {/* Loading More Indicator */}
      {loading && reviews.length > 0 && (
        <div className="text-center py-4">
          <div className="inline-flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-sm text-gray-600">Loading more reviews...</span>
          </div>
        </div>
      )}
    </div>
  );
} 