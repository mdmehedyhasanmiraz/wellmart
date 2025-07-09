-- Banners table schema for Wellmart
-- This table stores banner images and configuration for the hero section

-- Create banners table
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subtitle TEXT,
    image_url TEXT NOT NULL,
    link_url TEXT,
    position VARCHAR(50) NOT NULL CHECK (position IN ('main', 'card1', 'card2', 'card3', 'card4')),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_banners_position ON public.banners(position);
CREATE INDEX IF NOT EXISTS idx_banners_is_active ON public.banners(is_active);
CREATE INDEX IF NOT EXISTS idx_banners_sort_order ON public.banners(sort_order);

-- Enable Row Level Security
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Anyone can view active banners
CREATE POLICY "Anyone can view active banners" ON public.banners
    FOR SELECT USING (is_active = true);

-- Only admins can manage banners
CREATE POLICY "Admins can manage banners" ON public.banners
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'manager')
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_banner_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_banners_updated_at 
    BEFORE UPDATE ON public.banners 
    FOR EACH ROW 
    EXECUTE FUNCTION update_banner_updated_at_column();

-- Function to get banners by position
CREATE OR REPLACE FUNCTION get_banners_by_position(banner_position VARCHAR)
RETURNS TABLE (
    id UUID,
    title VARCHAR,
    subtitle TEXT,
    image_url TEXT,
    link_url TEXT,
    position VARCHAR,
    is_active BOOLEAN,
    sort_order INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        b.title,
        b.subtitle,
        b.image_url,
        b.link_url,
        b.position,
        b.is_active,
        b.sort_order
    FROM public.banners b
    WHERE b.position = banner_position 
    AND b.is_active = true
    ORDER BY b.sort_order ASC, b.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get all active banners
CREATE OR REPLACE FUNCTION get_active_banners()
RETURNS TABLE (
    id UUID,
    title VARCHAR,
    subtitle TEXT,
    image_url TEXT,
    link_url TEXT,
    position VARCHAR,
    sort_order INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        b.title,
        b.subtitle,
        b.image_url,
        b.link_url,
        b.position,
        b.sort_order
    FROM public.banners b
    WHERE b.is_active = true
    ORDER BY b.position, b.sort_order ASC, b.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Insert sample banners (you can modify these URLs to match your actual images)
INSERT INTO public.banners (title, subtitle, image_url, link_url, position, sort_order) VALUES
('Health & Wellness', 'Discover our premium health products', 'https://your-project.supabase.co/storage/v1/object/public/images/banners/main-banner.jpg', '/shop?category=vitamins', 'main', 1),
('Medicines', 'Quality medicines for all', 'https://your-project.supabase.co/storage/v1/object/public/images/banners/card1.jpg', '/shop?category=medicines', 'card1', 1),
('Personal Care', 'Take care of yourself', 'https://your-project.supabase.co/storage/v1/object/public/images/banners/card2.jpg', '/shop?category=personal-care', 'card2', 1),
('Baby Care', 'Safe products for your little ones', 'https://your-project.supabase.co/storage/v1/object/public/images/banners/card3.jpg', '/shop?category=baby-care', 'card3', 1),
('Health Devices', 'Monitor your health', 'https://your-project.supabase.co/storage/v1/object/public/images/banners/card4.jpg', '/shop?category=health-devices', 'card4', 1)
ON CONFLICT DO NOTHING; 

-- Coupons table
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
    discount_value NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
    min_order NUMERIC(10,2),
    max_uses INTEGER,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- User Coupons table
CREATE TABLE IF NOT EXISTS public.user_coupons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, coupon_id)
); 