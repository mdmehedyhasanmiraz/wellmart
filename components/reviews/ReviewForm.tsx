'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'react-hot-toast';
import StarRating from './StarRating';
import { Review, ReviewFormData } from '@/types/reviews';
import { checkUserPurchase, PurchaseVerificationResult } from '@/utils/purchaseVerification';

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
  const [purchaseVerification, setPurchaseVerification] = useState<PurchaseVerificationResult | null>(null);
  const [checkingPurchase, setCheckingPurchase] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: string; phone: string } | null>(null);
  const supabase = createClient();

  // Get current user from custom authentication
  const getCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const result = await response.json();
      
      if (result.success) {
        setCurrentUser(result.user);
        return result.user;
      } else {
        setCurrentUser(null);
        return null;
      }
    } catch (error) {
      console.error('Error getting current user:', error);
      setCurrentUser(null);
      return null;
    }
  };

  // Check purchase verification on component mount
  useEffect(() => {
    const checkPurchase = async () => {
      try {
        const user = await getCurrentUser();
        
        if (!user) {
          setCheckingPurchase(false);
          return;
        }

        const verification = await checkUserPurchase(user.id, productId);
        setPurchaseVerification(verification);
      } catch (error) {
        console.error('Error checking purchase verification:', error);
      } finally {
        setCheckingPurchase(false);
      }
    };

    checkPurchase();
  }, [productId]);

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

    // Check if user has purchased the product (only for new reviews)
    if (!existingReview && purchaseVerification && !purchaseVerification.hasPurchased) {
      toast.error('You must purchase this product before you can review it');
      return;
    }

    setLoading(true);

    try {
      const user = await getCurrentUser();
      
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

  // If user is not logged in, show login message
  if (!currentUser && !checkingPurchase) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Write a Review</h3>
        <div className="text-center py-8">
          <div className="text-gray-500 mb-4">
            <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <p className="text-lg font-medium">Please log in to write a review</p>
            <p className="text-sm text-gray-400 mt-1">You need to be logged in to submit reviews</p>
          </div>
          <a
            href="/login"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            Log In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {existingReview ? 'Edit Your Review' : 'Write a Review'}
      </h3>

      {/* Purchase Verification Status */}
      {checkingPurchase ? (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-sm text-blue-700">Verifying purchase status...</span>
          </div>
        </div>
      ) : currentUser && purchaseVerification && !existingReview ? (
        purchaseVerification.hasPurchased ? (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-green-700">
                ✓ Verified purchase! You can review this product.
                {purchaseVerification.orderCount > 1 && (
                  <span className="ml-1 text-xs text-green-600">
                    (Purchased {purchaseVerification.orderCount} times)
                  </span>
                )}
              </span>
            </div>
          </div>
        ) : (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-red-700">
                You must purchase this product before you can review it.
              </span>
            </div>
          </div>
        )
      ) : null}
      
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
              readonly={!currentUser || (!existingReview && purchaseVerification ? !purchaseVerification.hasPurchased : false)}
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
            } ${!currentUser || (!existingReview && purchaseVerification && !purchaseVerification.hasPurchased) ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            placeholder={!currentUser ? "Please log in to write a review" : (!existingReview && purchaseVerification && !purchaseVerification.hasPurchased ? "You must purchase this product to review it" : "Share your experience with this product...")}
            maxLength={1000}
            disabled={!currentUser || (!existingReview && purchaseVerification ? !purchaseVerification.hasPurchased : false)}
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
            disabled={loading || !currentUser || (!existingReview && purchaseVerification ? !purchaseVerification.hasPurchased : false)}
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