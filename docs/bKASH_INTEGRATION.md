# bKash Payment Integration

This document describes the bKash payment integration implemented in the Wellmart e-commerce platform.

## Overview

The bKash payment integration allows customers to pay for their orders using bKash, a popular mobile financial service in Bangladesh. The integration follows the same pattern as implemented in the skilltori.com project.

## Architecture

### Components

1. **Payment Types** (`types/payment.ts`)
   - Defines TypeScript interfaces for payment-related data structures
   - Includes `PaymentDetails`, `BkashConfig`, `PaymentRecord`, etc.

2. **bKash Service** (`lib/services/bkash.ts`)
   - Handles bKash API communication
   - Manages authentication token caching
   - Provides functions for creating and executing payments

3. **Payment Utilities** (`lib/supabase/paymentUtils.ts`)
   - Database operations for payment records
   - CRUD operations for payments table

4. **API Endpoints**
   - `/api/bkash/make-payment` - Initiates bKash payment
   - `/api/bkash/callback` - Handles bKash payment callbacks

5. **UI Components**
   - `BkashPaymentButton` - Payment button component
   - Integrated into checkout page

### Database Schema

#### User Orders Table (Consolidated)
Payment information is now stored directly in the `user_orders` table with these additional columns:

```sql
-- Payment-related columns in user_orders table
ALTER TABLE public.user_orders 
ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
ADD COLUMN payment_transaction_id TEXT UNIQUE,
ADD COLUMN payment_channel TEXT CHECK (payment_channel IN ('bkash', 'nagad', 'bank')),
ADD COLUMN bkash_payment_id TEXT,
ADD COLUMN bkash_url TEXT,
ADD COLUMN payment_amount NUMERIC(10, 2),
ADD COLUMN payment_currency TEXT DEFAULT 'BDT',
ADD COLUMN payment_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN payment_reference TEXT,
ADD COLUMN payment_notes TEXT;
```

#### bKash Token Table
```sql
CREATE TABLE public.bkash (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    authToken TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

## Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# bKash Configuration
BKASH_BASE_URL=https://tokenized.sandbox.bka.sh/v1.2.0-beta
BKASH_USERNAME=your_bkash_username
BKASH_PASSWORD=your_bkash_password
BKASH_APP_KEY=your_bkash_app_key
BKASH_APP_SECRET=your_bkash_app_secret
BKASH_GRANT_TOKEN_URL=https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout/token/grant
BKASH_CREATE_PAYMENT_URL=https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout/create
BKASH_EXECUTE_PAYMENT_URL=https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout/execute
```

## Payment Flow

1. **User selects bKash payment** in checkout
2. **Form validation** ensures all required fields are filled
3. **Payment initiation** via `/api/bkash/make-payment`
4. **Payment record creation** in database
5. **bKash payment creation** via bKash API
6. **User redirected** to bKash payment page
7. **Payment completion** handled by bKash callback
8. **Order status updated** to 'paid'

## Usage

### In Checkout Page

The bKash payment is automatically integrated into the checkout page. When a user selects bKash as the payment method and is logged in, the `BkashPaymentButton` component is displayed.

```tsx
<BkashPaymentButton
  amount={total}
  user_id={user.id}
  email={billing.email || user.email || ''}
  name={billing.name}
  phone={billing.phone}
  purpose="order"
  disabled={!isFormValid}
/>
```

### Manual Payment Creation

You can also create payments programmatically:

```typescript
import { createPaymentRecord } from '@/lib/supabase/paymentUtils';

const paymentRecord = await createPaymentRecord({
  user_id: 'user-uuid',
  order_id: 'order-uuid',
  amount: 1000,
  payment_channel: 'bkash',
  transaction_id: 'unique-transaction-id',
  purpose: 'order'
});
```

## Security

- All payment operations require user authentication
- Row Level Security (RLS) policies protect payment data
- Service role is used for admin operations
- Payment amounts are validated against order totals
- Transaction IDs are unique and validated

## Error Handling

The integration includes comprehensive error handling:

- Network timeouts (10-15 seconds)
- Invalid payment amounts
- Missing required fields
- Authentication failures
- Database operation failures

## Testing

To test the integration:

1. Set up sandbox bKash credentials
2. Create a test order
3. Select bKash payment method
4. Complete the payment flow
5. Verify payment status in database

## Troubleshooting

### Common Issues

1. **Token expiration**: Tokens are automatically refreshed
2. **Network timeouts**: Check bKash API availability
3. **Invalid amounts**: Ensure amount matches order total
4. **Missing user**: User must be logged in for bKash payment

### Logs

Check the following for debugging:
- Browser console for client-side errors
- Server logs for API endpoint errors
- Database logs for payment record issues

## Dependencies

- `uuid` - For generating unique transaction IDs
- `axios` - For HTTP requests to bKash API
- `@supabase/auth-helpers-nextjs` - For authentication
- `react-hot-toast` - For user notifications

## Future Enhancements

- Support for other payment methods (Nagad, Bank Transfer)
- Payment status webhooks
- Refund functionality
- Payment analytics and reporting
- Mobile app integration 