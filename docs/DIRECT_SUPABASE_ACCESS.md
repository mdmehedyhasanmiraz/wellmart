# Direct Supabase Access Setup

This guide explains how to set up direct Supabase access for admin users, bypassing the API endpoints for better performance and user experience.

## Overview

The admin panel has been updated to use direct Supabase queries instead of API endpoints. This provides:
- **Better Performance**: Direct database access without API overhead
- **Real-time Updates**: Immediate feedback on operations
- **Simplified Code**: Less complexity in the frontend
- **Better Error Handling**: Direct access to Supabase error messages

## Prerequisites

1. **Admin User Role**: Ensure your user has the `admin` role in the database
2. **RLS Policies**: The database must have proper RLS policies for admin access

## Setup Steps

### Step 1: Run the RLS Policy Update Script

Execute the following SQL script in your Supabase SQL editor:

```sql
-- Run the script from: database/fix-admin-direct-access.sql
```

This script will:
- Create helper functions to check admin status
- Update RLS policies for products, categories, and companies tables
- Allow admin users full access to these tables
- Maintain public read access for active products

### Step 2: Verify Your User Role

Check that your user has the `admin` role:

```sql
SELECT 
    id,
    email,
    role,
    created_at
FROM public.users 
WHERE email = 'your-email@example.com';
```

If your role is not `admin`, update it:

```sql
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

### Step 3: Test Direct Access

After running the script, test the admin panel:

1. **Products Page**: Should load products directly from Supabase
2. **Categories Page**: Should load categories directly from Supabase  
3. **Companies Page**: Should load companies directly from Supabase
4. **Product Edit Page**: Should load and update products directly

## Updated Pages

The following pages now use direct Supabase access:

### Admin Pages
- ✅ `/admin/products` - Products list with direct queries
- ✅ `/admin/products/[id]` - Product edit with direct queries
- ✅ `/admin/categories` - Categories list with direct queries
- ✅ `/admin/companies` - Companies list with direct queries

### Key Features
- **Real-time Search**: Instant filtering as you type
- **Direct Updates**: Immediate status changes without page refresh
- **Better Error Messages**: Direct Supabase error feedback
- **Enhanced Logging**: Detailed console logs for debugging

## Troubleshooting

### Issue: "Permission denied" errors
**Solution**: Run the RLS policy update script and ensure your user has `admin` role.

### Issue: Data not loading
**Solution**: Check browser console for detailed error messages. Verify authentication status.

### Issue: Updates not working
**Solution**: Ensure you're logged in as an admin user. Check the network tab for any failed requests.

## RLS Policy Details

The updated policies allow:

1. **Public Access**: Read access to active products and all categories/companies
2. **Admin Access**: Full CRUD access for admin and manager users
3. **Security**: Proper authentication checks using JWT metadata

## Performance Benefits

- **Reduced Latency**: No API endpoint overhead
- **Fewer Network Requests**: Direct database queries
- **Better Caching**: Supabase client-side caching
- **Real-time Features**: Immediate UI updates

## Migration Notes

- The API endpoints (`/api/admin/data` and `/api/admin/mutations`) are still available for backward compatibility
- All existing functionality is preserved
- Error handling has been improved with detailed logging
- Loading states provide better user feedback

## Next Steps

1. Test all admin functionality
2. Monitor performance improvements
3. Check browser console for any remaining issues
4. Update any custom components that might still use the old API endpoints

## Support

If you encounter any issues:
1. Check the browser console for error messages
2. Verify your user role is `admin`
3. Ensure the RLS policies are properly applied
4. Check the network tab for failed requests 