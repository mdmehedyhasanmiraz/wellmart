'use client';

import { ReviewStats } from '@/types/reviews';
import StarRating from './StarRating';

interface ReviewSummaryProps {
  stats: ReviewStats;
  onRatingFilter?: (rating: number | null) => void;
  selectedRating?: number | null;
}

export default function ReviewSummary({ 
  stats, 
  onRatingFilter, 
  selectedRating 
}: ReviewSummaryProps) {
  const totalReviews = stats.review_count;
  const averageRating = stats.average_rating;

  const getRatingPercentage = (rating: number) => {
    if (totalReviews === 0) return 0;
    return Math.round((stats.rating_distribution[rating] / totalReviews) * 100);
  };

  const handleRatingClick = (rating: number) => {
    if (onRatingFilter) {
      onRatingFilter(selectedRating === rating ? null : rating);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Reviews</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Overall Rating */}
        <div className="text-center">
          <div className="mb-2">
            <StarRating rating={averageRating} readonly size="lg" showValue />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">
            {averageRating.toFixed(1)}
          </p>
          <p className="text-sm text-gray-600">
            Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}
          </p>
          
          {totalReviews === 0 && (
            <p className="text-sm text-gray-500 mt-2">
              No reviews yet
            </p>
          )}
        </div>

        {/* Rating Distribution */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 mb-3">Rating Distribution</p>
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = stats.rating_distribution[rating] || 0;
            const percentage = getRatingPercentage(rating);
            const isSelected = selectedRating === rating;
            
            return (
              <button
                key={rating}
                onClick={() => handleRatingClick(rating)}
                disabled={!onRatingFilter || count === 0}
                className={`w-full flex items-center gap-3 p-2 rounded-md transition-colors ${
                  isSelected 
                    ? 'bg-blue-50 border border-blue-200' 
                    : count > 0 
                      ? 'hover:bg-gray-50' 
                      : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-1 min-w-[60px]">
                  <span className="text-sm font-medium text-gray-700">{rating}</span>
                  <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                
                <div className="min-w-[40px] text-right">
                  <span className="text-sm text-gray-600">{count}</span>
                </div>
              </button>
            );
          })}
          
          {onRatingFilter && selectedRating && (
            <button
              onClick={() => onRatingFilter(null)}
              className="w-full mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear filter
            </button>
          )}
        </div>
      </div>

      {/* Review Insights */}
      {totalReviews > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Review Insights</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Excellent (5★)</p>
              <p className="font-medium text-gray-900">
                {getRatingPercentage(5)}% of reviews
              </p>
            </div>
            <div>
              <p className="text-gray-600">Good (4★)</p>
              <p className="font-medium text-gray-900">
                {getRatingPercentage(4)}% of reviews
              </p>
            </div>
            <div>
              <p className="text-gray-600">Average (3★)</p>
              <p className="font-medium text-gray-900">
                {getRatingPercentage(3)}% of reviews
              </p>
            </div>
            <div>
              <p className="text-gray-600">Poor (1-2★)</p>
              <p className="font-medium text-gray-900">
                {getRatingPercentage(1) + getRatingPercentage(2)}% of reviews
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 