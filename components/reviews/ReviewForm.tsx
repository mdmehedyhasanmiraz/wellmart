'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'react-hot-toast';
import StarRating from './StarRating';
import { checkUserPurchase } from '@/utils/purchaseVerification';
import { useAuth } from '@/contexts/AuthContext';

interface ReviewFormData {
  rating: number;
  comment: string;
}

interface ReviewFormProps {
  productId: string;
  onReviewSubmitted: () => void;
  existingReview?: {
    id: string;
    rating: number;
    comment: string;
  } | null;
  onCancel?: () => void;
}

interface PurchaseVerificationResult {
  hasPurchased: boolean;
  orderId?: string;
  purchaseDate?: string;
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
  const { requireAuth } = useAuth();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const newErrors: { rating?: string; comment?: string } = {};
    
    if (formData.rating === 0) {
      newErrors.rating = 'Please select a rating';
    }
    
    if (!formData.comment.trim()) {
      newErrors.comment = 'Please write a review comment';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!currentUser) {
      requireAuth();
      return;
    }

    setLoading(true);
    
    try {
      const reviewData = {
        user_id: currentUser.id,
        product_id: productId,
        rating: formData.rating,
        comment: formData.comment.trim(),
      };

      let response;
      
      if (existingReview) {
        // Update existing review
        response = await supabase
          .from('reviews')
          .update(reviewData)
          .eq('id', existingReview.id)
          .select();
      } else {
        // Create new review
        response = await supabase
          .from('reviews')
          .insert([reviewData])
          .select();
      }

      if (response.error) {
        throw response.error;
      }

      toast.success(existingReview ? 'Review updated successfully!' : 'Review submitted successfully!');
      onReviewSubmitted();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review. Please try again.');
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
          <button
            onClick={() => requireAuth()}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  // If checking purchase verification, show loading
  if (checkingPurchase) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Write a Review</h3>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Verifying purchase...</p>
        </div>
      </div>
    );
  }

  // If user hasn't purchased the product, show message
  if (purchaseVerification && !purchaseVerification.hasPurchased) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Write a Review</h3>
        <div className="text-center py-8">
          <div className="text-gray-500 mb-4">
            <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-lg font-medium">Purchase Required</p>
            <p className="text-sm text-gray-400 mt-1">You need to purchase this product to write a review</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {existingReview ? 'Edit Your Review' : 'Write a Review'}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rating */}
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
            Your Review *
          </label>
          <textarea
            id="comment"
            value={formData.comment}
            onChange={handleCommentChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Share your experience with this product..."
          />
          {errors.comment && (
            <p className="mt-1 text-sm text-red-600">{errors.comment}</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white font-medium py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Submitting...' : (existingReview ? 'Update Review' : 'Submit Review')}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
} 