import { createClient } from '@/utils/supabase/server';
import { Review, CreateReviewRequest, UpdateReviewRequest, ReviewFilters, ReviewStats } from '@/types/reviews';

export class ReviewService {
  private async getSupabase() {
    return await createClient();
  }

  // Get reviews for a product
  async getProductReviews(productId: string, filters?: ReviewFilters): Promise<Review[]> {
    const supabase = await this.getSupabase();
    let query = supabase
      .from('reviews')
      .select(`
        *,
        user:users(name, email),
        product:products(name, slug)
      `)
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status);
    } else {
      // Default to approved reviews for public view
      query = query.eq('status', 'approved');
    }

    if (filters?.rating) {
      query = query.eq('rating', filters.rating);
    }

    if (filters?.page && filters?.limit) {
      const from = (filters.page - 1) * filters.limit;
      const to = from + filters.limit - 1;
      query = query.range(from, to);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching reviews:', error);
      throw new Error('Failed to fetch reviews');
    }

    return data || [];
  }

  // Get user's review for a product
  async getUserReview(productId: string, userId: string): Promise<Review | null> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user review:', error);
      throw new Error('Failed to fetch user review');
    }

    return data;
  }

  // Create a new review
  async createReview(reviewData: CreateReviewRequest, userId: string): Promise<Review> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from('reviews')
      .insert([{
        ...reviewData,
        user_id: userId,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating review:', error);
      throw new Error('Failed to create review');
    }

    return data;
  }

  // Update a review
  async updateReview(reviewId: string, updateData: Omit<UpdateReviewRequest, 'id'>): Promise<Review> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from('reviews')
      .update(updateData)
      .eq('id', reviewId)
      .select()
      .single();

    if (error) {
      console.error('Error updating review:', error);
      throw new Error('Failed to update review');
    }

    return data;
  }

  // Delete a review
  async deleteReview(reviewId: string): Promise<void> {
    const supabase = await this.getSupabase();
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (error) {
      console.error('Error deleting review:', error);
      throw new Error('Failed to delete review');
    }
  }

  // Get review statistics for a product
  async getProductReviewStats(productId: string): Promise<ReviewStats> {
    const supabase = await this.getSupabase();
    // Get approved reviews for rating distribution
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('rating')
      .eq('product_id', productId)
      .eq('status', 'approved');

    if (error) {
      console.error('Error fetching review stats:', error);
      throw new Error('Failed to fetch review statistics');
    }

    // Calculate rating distribution
    const ratingDistribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRating = 0;
    let reviewCount = 0;

    reviews?.forEach((review: { rating: number }) => {
      ratingDistribution[review.rating]++;
      totalRating += review.rating;
      reviewCount++;
    });

    const averageRating = reviewCount > 0 ? Math.round((totalRating / reviewCount) * 10) / 10 : 0;

    return {
      average_rating: averageRating,
      review_count: reviewCount,
      rating_distribution: ratingDistribution
    };
  }

  // Get all reviews for admin management
  async getAllReviews(filters?: ReviewFilters): Promise<Review[]> {
    const supabase = await this.getSupabase();
    let query = supabase
      .from('reviews')
      .select(`
        *,
        user:users(name, email),
        product:products(name, slug)
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.rating) {
      query = query.eq('rating', filters.rating);
    }

    if (filters?.product_id) {
      query = query.eq('product_id', filters.product_id);
    }

    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    if (filters?.page && filters?.limit) {
      const from = (filters.page - 1) * filters.limit;
      const to = from + filters.limit - 1;
      query = query.range(from, to);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching all reviews:', error);
      throw new Error('Failed to fetch reviews');
    }

    return data || [];
  }

  // Approve a review
  async approveReview(reviewId: string): Promise<Review> {
    return this.updateReview(reviewId, { status: 'approved' });
  }

  // Reject a review
  async rejectReview(reviewId: string): Promise<Review> {
    return this.updateReview(reviewId, { status: 'rejected' });
  }

  // Get pending reviews count for admin dashboard
  async getPendingReviewsCount(): Promise<number> {
    const supabase = await this.getSupabase();
    const { count, error } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (error) {
      console.error('Error fetching pending reviews count:', error);
      return 0;
    }

    return count || 0;
  }
} 