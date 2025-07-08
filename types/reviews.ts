export interface Review {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  // Joined fields
  user?: {
    name: string;
    email: string;
  };
  product?: {
    name: string;
    slug: string;
  };
}

export interface ReviewFormData {
  rating: number;
  comment: string;
}

export interface ReviewStats {
  average_rating: number;
  review_count: number;
  rating_distribution: {
    [key: number]: number; // rating -> count
  };
}

export interface CreateReviewRequest {
  product_id: string;
  rating: number;
  comment: string;
}

export interface UpdateReviewRequest {
  id: string;
  status?: 'pending' | 'approved' | 'rejected';
  rating?: number;
  comment?: string;
}

export interface ReviewFilters {
  status?: 'pending' | 'approved' | 'rejected';
  rating?: number;
  product_id?: string;
  user_id?: string;
  page?: number;
  limit?: number;
} 