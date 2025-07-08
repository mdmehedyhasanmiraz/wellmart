# Reviews System Documentation

## Overview

The Wellmart reviews system provides a comprehensive solution for product reviews with moderation capabilities. Users can submit reviews, and admins can moderate them before they appear publicly.

## Features

### For Customers
- **Submit Reviews**: Logged-in users can submit reviews with ratings (1-5 stars) and comments
- **Edit Reviews**: Users can edit their pending reviews
- **View Reviews**: See approved reviews for products with rating distribution
- **Review Status**: Track the status of their submitted reviews

### For Admins/Managers
- **Review Moderation**: Approve, reject, or delete reviews
- **Review Management**: View all reviews with filtering options
- **Bulk Actions**: Manage multiple reviews efficiently
- **Review Statistics**: View review analytics and insights

## Database Schema

### Reviews Table
```sql
CREATE TABLE public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, product_id)
);
```

### Key Features
- **One Review Per User Per Product**: Enforced by unique constraint
- **Rating Validation**: Must be between 1-5 stars
- **Status Management**: pending → approved/rejected
- **Automatic Timestamps**: created_at and updated_at
- **Cascade Deletion**: Reviews deleted when user or product is deleted

## Row Level Security (RLS)

### Policies
1. **Public View**: Anyone can view approved reviews
2. **User Access**: Users can view their own reviews (any status)
3. **User Creation**: Logged-in users can create reviews
4. **User Updates**: Users can update their pending reviews
5. **User Deletion**: Users can delete their pending reviews
6. **Admin Access**: Admins/managers can view, update, and delete any review

## Components

### 1. StarRating Component
**File**: `components/reviews/StarRating.tsx`

Interactive star rating component with hover effects and customizable sizes.

**Props**:
- `rating`: Current rating (1-5)
- `onRatingChange`: Callback for rating changes
- `size`: 'sm' | 'md' | 'lg'
- `readonly`: Boolean for read-only mode
- `showValue`: Boolean to show numeric value

### 2. ReviewForm Component
**File**: `components/reviews/ReviewForm.tsx`

Form for submitting and editing reviews with validation.

**Features**:
- Rating selection with star interface
- Comment textarea with character limits
- Form validation
- Error handling
- Loading states

### 3. ReviewList Component
**File**: `components/reviews/ReviewList.tsx`

Displays list of reviews with pagination and filtering.

**Features**:
- Review cards with user info
- Expandable long comments
- Pagination support
- Loading states
- Empty state handling

### 4. ReviewSummary Component
**File**: `components/reviews/ReviewSummary.tsx`

Shows review statistics and rating distribution.

**Features**:
- Average rating display
- Rating distribution chart
- Clickable rating filters
- Review insights

### 5. ReviewsSection Component
**File**: `components/reviews/ReviewsSection.tsx`

Main component that combines all review functionality.

**Features**:
- Review summary
- Review form (for logged-in users)
- Review list
- User review display
- Login prompts

## Service Layer

### ReviewService Class
**File**: `lib/services/reviews.ts`

Handles all review-related database operations.

**Methods**:
- `getProductReviews()`: Fetch reviews for a product
- `getUserReview()`: Get user's review for a product
- `createReview()`: Create new review
- `updateReview()`: Update existing review
- `deleteReview()`: Delete review
- `getProductReviewStats()`: Get review statistics
- `getAllReviews()`: Get all reviews (admin)
- `approveReview()`: Approve a review
- `rejectReview()`: Reject a review
- `getPendingReviewsCount()`: Get pending reviews count

## Pages

### 1. Product Page
**File**: `app/products/[slug]/page.tsx`

Integrates reviews section into product pages.

**Features**:
- Product details with rating display
- Reviews section integration
- Breadcrumb navigation
- Responsive design

### 2. Admin Reviews Page
**File**: `app/admin/reviews/page.tsx`

Admin interface for managing reviews.

**Features**:
- Review listing with filters
- Review moderation actions
- Status management
- Bulk operations
- Review details modal

## Setup Instructions

### 1. Database Setup
Run the SQL schema in your Supabase database:

```bash
# Execute the schema file
psql -h your-supabase-host -U postgres -d postgres -f supabase-reviews-schema.sql
```

### 2. Environment Variables
Ensure your Supabase environment variables are configured:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Component Integration
Add the ReviewsSection to your product pages:

```tsx
import ReviewsSection from '@/components/reviews/ReviewsSection';

// In your product page component
<ReviewsSection productId={product.id} productSlug={product.slug} />
```

## Usage Examples

### Creating a Review
```tsx
const reviewService = new ReviewService();
const review = await reviewService.createReview({
  product_id: 'product-uuid',
  rating: 5,
  comment: 'Great product!'
}, user.id);
```

### Getting Product Reviews
```tsx
const reviews = await reviewService.getProductReviews('product-uuid', {
  status: 'approved',
  page: 1,
  limit: 10
});
```

### Moderating a Review
```tsx
// Approve a review
await reviewService.approveReview('review-uuid');

// Reject a review
await reviewService.rejectReview('review-uuid');
```

## Review Workflow

### Customer Journey
1. **Browse Product**: Customer visits product page
2. **Login**: Customer logs in to submit review
3. **Submit Review**: Customer fills review form and submits
4. **Pending Status**: Review is marked as pending
5. **Admin Review**: Admin reviews and moderates
6. **Published**: Approved reviews appear on product page

### Admin Workflow
1. **Review Queue**: Admin checks pending reviews
2. **Review Content**: Admin reads review and checks for violations
3. **Take Action**: Approve, reject, or delete review
4. **Update Status**: Review status is updated accordingly
5. **Monitor**: Admin monitors review quality and user feedback

## Security Considerations

### Input Validation
- Rating must be 1-5
- Comment length limits (10-1000 characters)
- XSS prevention in comments
- SQL injection prevention

### Access Control
- RLS policies enforce access control
- Users can only manage their own reviews
- Admins have full access to all reviews
- Public can only view approved reviews

### Data Integrity
- Unique constraint prevents duplicate reviews
- Cascade deletion maintains referential integrity
- Automatic timestamp updates
- Status validation

## Performance Optimizations

### Database Indexes
- Product ID index for fast product review queries
- User ID index for user review queries
- Status index for filtering
- Created at index for sorting

### Caching Strategy
- Review statistics cached at product level
- Review lists paginated for performance
- User review cached to avoid repeated queries

### Frontend Optimizations
- Lazy loading of review components
- Pagination to limit initial load
- Debounced search and filtering
- Optimistic updates for better UX

## Troubleshooting

### Common Issues

1. **Reviews Not Appearing**
   - Check review status (must be 'approved')
   - Verify RLS policies
   - Check user permissions

2. **Cannot Submit Review**
   - Ensure user is logged in
   - Check for existing review (one per user per product)
   - Validate form inputs

3. **Admin Cannot Moderate**
   - Verify admin/manager role
   - Check RLS policies
   - Ensure proper authentication

### Debug Steps
1. Check browser console for errors
2. Verify Supabase connection
3. Test RLS policies
4. Check user roles and permissions
5. Validate database constraints

## Future Enhancements

### Planned Features
- Review helpfulness voting
- Review images/videos
- Review replies from sellers
- Review analytics dashboard
- Automated moderation (AI)
- Review export functionality
- Review templates
- Review incentives system

### Technical Improvements
- Real-time review updates
- Advanced filtering options
- Review search functionality
- Review sentiment analysis
- Review spam detection
- Review notification system 