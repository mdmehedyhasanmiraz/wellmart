'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'react-hot-toast';
import StarRating from './StarRating';
import { Review, ReviewFormData } from '@/types/reviews';

interface ReviewFormProps {
  productId: string;
  onReviewSubmitted?: (review: Review) => void;
  existingReview?: Review | null;
  onCancel?: () => void;
}

export default function ReviewForm({ 
  productId, 
  onReviewSubmitted, 
  existingReview,
  onCancel 
}: ReviewFormProps) {
  const [formData, setFormData] = useState<ReviewFormData>({
    rating: existingReview?.rating || 0,
    comment: existingReview?.comment || ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ rating?: string; comment?: string }>({});
  const supabase = createClient();

  const validateForm = () => {
    const newErrors: { rating?: string; comment?: string } = {};

    if (!formData.rating || formData.rating < 1) {
      newErrors.rating = 'Please select a rating';
    }

    if (!formData.comment.trim()) {
      newErrors.comment = 'Please write a review comment';
    } else if (formData.comment.trim().length < 10) {
      newErrors.comment = 'Review must be at least 10 characters long';
    } else if (formData.comment.trim().length > 1000) {
      newErrors.comment = 'Review must be less than 1000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Please log in to submit a review');
        return;
      }

      if (existingReview) {
        // Update existing review
        const { data, error } = await supabase
          .from('reviews')
          .update({
            rating: formData.rating,
            comment: formData.comment.trim(),
            status: 'pending' // Reset to pending when updated
          })
          .eq('id', existingReview.id)
          .select()
          .single();

        if (error) {
          throw error;
        }

        toast.success('Review updated successfully! It will be reviewed by our team.');
        onReviewSubmitted?.(data);
      } else {
        // Create new review
        const { data, error } = await supabase
          .from('reviews')
          .insert([{
            product_id: productId,
            user_id: user.id,
            rating: formData.rating,
            comment: formData.comment.trim(),
            status: 'pending'
          }])
          .select()
          .single();

        if (error) {
          throw error;
        }

        toast.success('Review submitted successfully! It will be reviewed by our team.');
        onReviewSubmitted?.(data);
      }

      // Reset form
      setFormData({ rating: 0, comment: '' });
      setErrors({});
    } catch (error: unknown) {
      console.error('Error submitting review:', error);
      
      if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
        toast.error('You have already reviewed this product');
      } else {
        toast.error('Failed to submit review. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }));
    if (errors.rating) {
      setErrors(prev => ({ ...prev, rating: undefined }));
    }
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const comment = e.target.value;
    setFormData(prev => ({ ...prev, comment }));
    if (errors.comment) {
      setErrors(prev => ({ ...prev, comment: undefined }));
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {existingReview ? 'Edit Your Review' : 'Write a Review'}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rating Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating *
          </label>
          <StarRating
            rating={formData.rating}
            onRatingChange={handleRatingChange}
            size="lg"
          />
          {errors.rating && (
            <p className="mt-1 text-sm text-red-600">{errors.rating}</p>
          )}
        </div>

        {/* Comment */}
        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
            Review Comment *
          </label>
          <textarea
            id="comment"
            rows={4}
            value={formData.comment}
            onChange={handleCommentChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
              errors.comment ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Share your experience with this product..."
            maxLength={1000}
          />
          <div className="flex justify-between items-center mt-1">
            {errors.comment && (
              <p className="text-sm text-red-600">{errors.comment}</p>
            )}
            <p className="text-sm text-gray-500 ml-auto">
              {formData.comment.length}/1000
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            {loading ? 'Submitting...' : (existingReview ? 'Update Review' : 'Submit Review')}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>

        {/* Info */}
        <p className="text-xs text-gray-500">
          * Reviews are moderated and may take 24-48 hours to appear. 
          {existingReview && ' Updating your review will reset it to pending status.'}
        </p>
      </form>
    </div>
  );
} 