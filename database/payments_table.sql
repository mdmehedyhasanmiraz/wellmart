-- Create payments table for bKash and other payment methods
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    order_id UUID REFERENCES public.user_orders(id),
    amount NUMERIC(10,2) NOT NULL,
    payment_channel TEXT NOT NULL CHECK (payment_channel IN ('bkash', 'nagad', 'bank')),
    transaction_id TEXT NOT NULL UNIQUE,
    bkash_payment_id TEXT,
    bkash_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    purpose TEXT NOT NULL CHECK (purpose IN ('order', 'other')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON public.payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- Create bKash token table for caching authentication tokens
CREATE TABLE IF NOT EXISTS public.bkash (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    authToken TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert initial bKash record (will be updated with actual token)
INSERT INTO public.bkash (authToken, updated_at) 
VALUES ('', now())
ON CONFLICT DO NOTHING;

-- Add RLS policies
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bkash ENABLE ROW LEVEL SECURITY;

-- Policies for payments table
CREATE POLICY "Users can view their own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments" ON public.payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payments" ON public.payments
    FOR UPDATE USING (auth.uid() = user_id);

-- Admin policies (for service role)
CREATE POLICY "Service role can manage all payments" ON public.payments
    FOR ALL USING (auth.role() = 'service_role');

-- Policies for bkash table (admin only)
CREATE POLICY "Service role can manage bkash tokens" ON public.bkash
    FOR ALL USING (auth.role() = 'service_role'); 