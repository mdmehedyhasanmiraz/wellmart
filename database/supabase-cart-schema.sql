-- User Carts table schema for Wellmart
-- This table stores user cart items with product relationships

-- Create user_carts table
CREATE TABLE IF NOT EXISTS public.user_carts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Ensure one cart item per user per product
    UNIQUE(user_id, product_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_carts_user_id ON public.user_carts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_carts_product_id ON public.user_carts(product_id);
CREATE INDEX IF NOT EXISTS idx_user_carts_created_at ON public.user_carts(created_at);

-- Enable Row Level Security
ALTER TABLE public.user_carts ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own cart items
CREATE POLICY "Users can view their own cart" ON public.user_carts
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own cart items
CREATE POLICY "Users can add to their own cart" ON public.user_carts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own cart items
CREATE POLICY "Users can update their own cart" ON public.user_carts
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own cart items
CREATE POLICY "Users can delete their own cart items" ON public.user_carts
    FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_cart_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_user_carts_updated_at 
    BEFORE UPDATE ON public.user_carts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_cart_updated_at_column();

-- Function to get cart count for a user
CREATE OR REPLACE FUNCTION get_user_cart_count(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    cart_count INTEGER;
BEGIN
    SELECT COALESCE(SUM(quantity), 0) INTO cart_count
    FROM public.user_carts
    WHERE user_id = user_uuid;
    
    RETURN cart_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get cart total for a user
CREATE OR REPLACE FUNCTION get_user_cart_total(user_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
    cart_total DECIMAL;
BEGIN
    SELECT COALESCE(SUM(uc.quantity * CASE 
        WHEN p.price_offer IS NOT NULL AND p.price_offer > 0 
        THEN p.price_offer 
        ELSE p.price_regular 
    END), 0) INTO cart_total
    FROM public.user_carts uc
    JOIN public.products p ON uc.product_id = p.id
    WHERE uc.user_id = user_uuid;
    
    RETURN cart_total;
END;
$$ LANGUAGE plpgsql;

-- Function to clear user cart
CREATE OR REPLACE FUNCTION clear_user_cart(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.user_carts WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to merge cart items (for guest to user conversion)
CREATE OR REPLACE FUNCTION merge_guest_cart(guest_cart JSONB, user_uuid UUID)
RETURNS VOID AS $$
DECLARE
    cart_item JSONB;
BEGIN
    -- Loop through guest cart items
    FOR cart_item IN SELECT * FROM jsonb_array_elements(guest_cart)
    LOOP
        -- Try to insert, if conflict then update quantity
        INSERT INTO public.user_carts (user_id, product_id, quantity)
        VALUES (
            user_uuid,
            (cart_item->>'product_id')::UUID,
            (cart_item->>'quantity')::INTEGER
        )
        ON CONFLICT (user_id, product_id)
        DO UPDATE SET 
            quantity = user_carts.quantity + (cart_item->>'quantity')::INTEGER,
            updated_at = timezone('utc'::text, now());
    END LOOP;
END;
$$ LANGUAGE plpgsql; 