-- Reviews table schema for Wellmart
-- This table stores product reviews with moderation capabilities

-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Ensure one review per user per product
    UNIQUE(user_id, product_id)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at);

-- Enable Row Level Security
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view approved reviews for any product
CREATE POLICY "Users can view approved reviews" ON public.reviews
    FOR SELECT USING (status = 'approved');

-- Users can view their own reviews (any status)
CREATE POLICY "Users can view their own reviews" ON public.reviews
    FOR SELECT USING (auth.uid() = user_id);

-- Logged in users can create reviews
CREATE POLICY "Logged in users can create reviews" ON public.reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending reviews
CREATE POLICY "Users can update their own pending reviews" ON public.reviews
    FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- Users can delete their own pending reviews
CREATE POLICY "Users can delete their own pending reviews" ON public.reviews
    FOR DELETE USING (auth.uid() = user_id AND status = 'pending');

-- Admins and managers can view all reviews
CREATE POLICY "Admins can view all reviews" ON public.reviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'manager')
        )
    );

-- Admins and managers can update any review
CREATE POLICY "Admins can update any review" ON public.reviews
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'manager')
        )
    );

-- Admins and managers can delete any review
CREATE POLICY "Admins can delete any review" ON public.reviews
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'manager')
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_reviews_updated_at 
    BEFORE UPDATE ON public.reviews 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to get average rating for a product
CREATE OR REPLACE FUNCTION get_product_average_rating(product_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
    avg_rating DECIMAL;
BEGIN
    SELECT COALESCE(AVG(rating), 0) INTO avg_rating
    FROM public.reviews
    WHERE product_id = product_uuid AND status = 'approved';
    
    RETURN ROUND(avg_rating, 1);
END;
$$ LANGUAGE plpgsql;

-- Function to get review count for a product
CREATE OR REPLACE FUNCTION get_product_review_count(product_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    review_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO review_count
    FROM public.reviews
    WHERE product_id = product_uuid AND status = 'approved';
    
    RETURN review_count;
END;
$$ LANGUAGE plpgsql;

-- Add computed columns to products table for ratings
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Function to update product rating statistics
CREATE OR REPLACE FUNCTION update_product_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the product's average rating and review count
    UPDATE public.products 
    SET 
        average_rating = get_product_average_rating(NEW.product_id),
        review_count = get_product_review_count(NEW.product_id)
    WHERE id = NEW.product_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update product stats when review status changes
CREATE TRIGGER update_product_rating_stats_trigger
    AFTER UPDATE OF status ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_product_rating_stats();

-- Trigger to update product stats when review is inserted
CREATE TRIGGER update_product_rating_stats_insert_trigger
    AFTER INSERT ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_product_rating_stats();

-- Trigger to update product stats when review is deleted
CREATE TRIGGER update_product_rating_stats_delete_trigger
    AFTER DELETE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_product_rating_stats();

-- Insert some sample reviews (optional - for testing)
-- INSERT INTO public.reviews (user_id, product_id, rating, comment, status) VALUES
-- ('sample-user-id', 'sample-product-id', 5, 'Great product! Highly recommended.', 'approved'),
-- ('sample-user-id', 'sample-product-id', 4, 'Good quality, fast delivery.', 'approved'); 