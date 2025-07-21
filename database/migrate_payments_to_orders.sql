-- Migration script to consolidate payments into user_orders table
-- Run this after you've verified the new payment columns work correctly

-- Step 1: Add payment columns to user_orders (if not already done)
ALTER TABLE public.user_orders 
ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
ADD COLUMN IF NOT EXISTS payment_transaction_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS payment_channel TEXT CHECK (payment_channel IN ('bkash', 'nagad', 'bank')),
ADD COLUMN IF NOT EXISTS bkash_payment_id TEXT,
ADD COLUMN IF NOT EXISTS bkash_url TEXT,
ADD COLUMN IF NOT EXISTS payment_amount NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS payment_currency TEXT DEFAULT 'BDT',
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_reference TEXT,
ADD COLUMN IF NOT EXISTS payment_notes TEXT;

-- Step 2: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_orders_payment_status ON public.user_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_user_orders_payment_transaction_id ON public.user_orders(payment_transaction_id);
CREATE INDEX IF NOT EXISTS idx_user_orders_payment_channel ON public.user_orders(payment_channel);
CREATE INDEX IF NOT EXISTS idx_user_orders_payment_date ON public.user_orders(payment_date);

-- Step 3: Migrate existing payment data (if you have any)
-- This will copy payment information from the payments table to user_orders
-- Only run this if you have existing payment data you want to preserve

/*
UPDATE public.user_orders 
SET 
  payment_status = p.status,
  payment_transaction_id = p.transaction_id,
  payment_channel = p.payment_channel,
  bkash_payment_id = p.bkash_payment_id,
  bkash_url = p.bkash_url,
  payment_amount = p.amount,
  payment_date = p.created_at,
  payment_reference = p.transaction_id
FROM public.payments p
WHERE user_orders.id = p.order_id;
*/

-- Step 4: Update existing orders to have proper payment_status
UPDATE public.user_orders 
SET payment_status = CASE 
    WHEN status = 'paid' THEN 'paid'
    WHEN status = 'completed' THEN 'paid'
    WHEN status = 'delivered' THEN 'paid'
    WHEN status = 'shipped' THEN 'paid'
    ELSE 'pending'
END
WHERE payment_status IS NULL;

-- Step 5: Set payment_amount to total for existing orders
UPDATE public.user_orders 
SET payment_amount = total 
WHERE payment_amount IS NULL;

-- Step 6: Set payment_channel to payment_method for existing orders
UPDATE public.user_orders 
SET payment_channel = payment_method 
WHERE payment_channel IS NULL;

-- Step 7: Drop the old payments table (ONLY AFTER VERIFYING EVERYTHING WORKS)
-- Uncomment the following lines when you're ready to remove the old table:

/*
-- Drop indexes first
DROP INDEX IF EXISTS idx_payments_user_id;
DROP INDEX IF EXISTS idx_payments_order_id;
DROP INDEX IF EXISTS idx_payments_transaction_id;
DROP INDEX IF EXISTS idx_payments_status;

-- Drop policies
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can insert their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can update their own payments" ON public.payments;
DROP POLICY IF EXISTS "Service role can manage all payments" ON public.payments;

-- Drop the table
DROP TABLE IF EXISTS public.payments;
*/

-- Step 8: Verify the migration
-- Run these queries to verify everything is working:

-- Check that all orders have payment_status
SELECT COUNT(*) as orders_without_payment_status 
FROM public.user_orders 
WHERE payment_status IS NULL;

-- Check payment status distribution
SELECT payment_status, COUNT(*) 
FROM public.user_orders 
GROUP BY payment_status;

-- Check payment channel distribution
SELECT payment_channel, COUNT(*) 
FROM public.user_orders 
WHERE payment_channel IS NOT NULL
GROUP BY payment_channel; 