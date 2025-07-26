# Debugging Guide: Supabase Service Role Key & Product Loading Issues

## Problem Summary
The products are loading slowly or not at all, likely due to missing or incorrectly configured Supabase service role key.

## Root Cause Analysis

### 1. Missing Environment Variables
The application requires a `.env.local` file with the following critical variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` 
- `SUPABASE_SERVICE_ROLE_KEY` (most critical for server-side operations)

### 2. Service Role Key Issues
- The service role key is required for server-side API routes that bypass Row Level Security (RLS)
- Without it, `supabaseAdmin` client fails to initialize
- This causes all product loading APIs to fail or timeout

### 3. Performance Issues
- Complex joins without proper indexing
- Multiple sequential database queries
- No caching mechanism

## Debugging Steps

### Step 1: Check Environment Variables
1. Navigate to `/debug-database` page
2. Check if all environment variables are set
3. Look for "❌ Missing" indicators

### Step 2: Test Service Role Key
1. Click "Test Service Role Key" button on debug page
2. Check the response for:
   - Service role key configuration status
   - Database connection tests
   - Query performance timing
   - RLS bypass functionality

### Step 3: Test Product Loading APIs
1. Click "Test All Endpoints" on debug page
2. Check performance of:
   - Featured Products (should be < 1000ms)
   - Top Products (should be < 1000ms)
   - Shop Products (should be < 2000ms)

### Step 4: Check Database Indexes
Run this SQL in your Supabase SQL editor:
```sql
-- Check if performance indexes exist
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE indexname LIKE 'idx_%'
AND schemaname = 'public'
AND tablename = 'products';
```

## Solutions

### Solution 1: Set Up Environment Variables
1. Copy `env-template.txt` to `.env.local`
2. Fill in your Supabase credentials:
   - Go to https://supabase.com/dashboard/project/[your-project]/settings/api
   - Copy the Project URL, anon key, and service role key
3. Restart the development server

### Solution 2: Verify Supabase Configuration
1. Ensure your Supabase project is active
2. Check that the service role key has the correct permissions
3. Verify RLS policies are properly configured

### Solution 3: Database Optimization
If indexes are missing, run:
```sql
-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_company_id ON products(company_id);
```

### Solution 4: API Performance Monitoring
The enhanced debug page now includes:
- Timing information for all API calls
- Detailed error messages
- Service role key specific tests
- Performance benchmarks

## Expected Performance
After fixing the issues:
- **Featured Products**: < 500ms
- **Top Products**: < 500ms  
- **Shop Products**: < 1000ms
- **Product Details**: < 800ms

## Troubleshooting Checklist

- [ ] `.env.local` file exists with correct Supabase credentials
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set and valid
- [ ] Supabase project is active and accessible
- [ ] Database indexes are created
- [ ] RLS policies are properly configured
- [ ] Development server restarted after env changes
- [ ] No console errors in browser developer tools
- [ ] Network tab shows successful API responses

## Common Error Messages

### "supabaseAdmin is not available"
- **Cause**: Missing or invalid service role key
- **Solution**: Check `.env.local` file and restart server

### "Database service not available"
- **Cause**: Service role key not configured
- **Solution**: Add `SUPABASE_SERVICE_ROLE_KEY` to environment

### "RLS policy violation"
- **Cause**: Using anon key for server operations
- **Solution**: Ensure service role key is used for admin operations

### Slow loading times (> 2000ms)
- **Cause**: Missing database indexes or complex queries
- **Solution**: Add performance indexes and optimize queries

## Next Steps
1. Create `.env.local` file with your Supabase credentials
2. Restart the development server
3. Visit `/debug-database` to verify everything is working
4. **Run the performance optimization script** (see below)
5. Test product loading on the main site
6. Monitor performance and adjust as needed

## Performance Optimization

### Step 1: Run Database Optimization
1. Go to your Supabase dashboard → SQL Editor
2. Copy and paste the contents of `database/optimize-product-performance.sql`
3. Execute the script to add missing indexes
4. This should reduce query times from 800ms to < 200ms

### Step 2: Verify Optimization
1. Run `database/check-performance.sql` to verify indexes were created
2. Check the debug page again - timing should be much faster
3. Expected performance after optimization:
   - **Featured Products**: < 200ms
   - **Top Products**: < 200ms
   - **Shop Products**: < 500ms

### Step 3: Monitor Performance
- The enhanced API now includes timing information in responses
- Check browser console for detailed performance logs
- Use the debug page to monitor improvements 