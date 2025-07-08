# Supabase Auth Setup for Wellmart

This guide will help you set up Supabase Authentication in your Wellmart project with Google sign-in and OTP-based email authentication.

## Prerequisites

1. A Supabase project
2. Google OAuth credentials (for Google sign-in)
3. Environment variables configured

## Step 1: Supabase Project Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note down your project URL and anon key from the API settings

## Step 2: Environment Variables

Create a `.env.local` file in your wellmart project root with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Step 3: Database Schema

Run the SQL commands from `supabase-schema.sql` in your Supabase SQL editor:

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase-schema.sql`
4. Execute the SQL commands

This will create:
- `public.users` table with all required fields
- Row Level Security (RLS) policies
- Indexes for better performance
- Triggers for automatic timestamp updates

## Step 4: Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client IDs
5. Set up OAuth consent screen
6. Create OAuth 2.0 Client ID for Web application
7. Add authorized redirect URIs:
   - `https://your-project-ref.supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (for development)
8. Copy the Client ID and Client Secret

## Step 5: Configure Supabase Auth

1. In your Supabase dashboard, go to Authentication → Settings
2. Under "Auth Providers", enable Google
3. Enter your Google OAuth Client ID and Client Secret
4. Save the settings

## Step 6: Email Templates (Optional)

1. Go to Authentication → Email Templates
2. Customize the email templates for:
   - Magic Link (OTP)
   - Email Change
   - Password Reset

## Step 7: Create Admin User

After setting up the database, you can create an admin user:

1. Sign up normally through the application
2. Go to your Supabase dashboard → Table Editor → users
3. Find your user record and change the role from 'customer' to 'admin'

Or run this SQL (replace with your actual user ID):

```sql
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'your-admin-email@example.com';
```

## Step 8: Testing

1. Start your development server: `npm run dev`
2. Test the following flows:
   - Google sign-in
   - Email OTP sign-in
   - User registration
   - Role-based redirects

## File Structure

```
wellmart/
├── app/
│   ├── admin/page.tsx              # Admin/Manager dashboard
│   ├── auth/callback/route.ts      # OAuth callback handler
│   ├── dashboard/page.tsx          # Customer dashboard
│   ├── login/page.tsx              # Login page
│   ├── not-authorized/page.tsx     # Access denied page
│   └── signup/page.tsx             # Registration page
├── lib/
│   ├── supabase.ts                 # Main Supabase client
│   └── supabase/server.ts          # Server-side admin client
├── utils/
│   ├── supabase/
│   │   ├── client.ts               # Client-side Supabase client
│   │   └── server.ts               # Server-side Supabase client
│   └── redirectUtils.ts            # Role-based redirect utilities
├── middleware.ts                   # Route protection middleware
├── supabase-schema.sql             # Database schema
└── SUPABASE_SETUP.md               # This file
```

## Features Implemented

✅ **Authentication Methods:**
- Google OAuth sign-in
- Email OTP (magic link) authentication
- No password required for email sign-in

✅ **User Management:**
- User registration with profile data
- Role-based access control (admin, manager, customer)
- Automatic user creation in custom users table

✅ **Route Protection:**
- Middleware-based route protection
- Role-based redirects:
  - Admin/Manager → `/admin`
  - Customer → `/dashboard`

✅ **User Roles:**
- **Admin**: Full access to admin dashboard
- **Manager**: Access to admin dashboard (same as admin)
- **Customer**: Access to customer dashboard only

✅ **User Profile Fields:**
- Name
- Phone
- Email
- Division
- District
- Upazila
- Street
- Role (with validation)

## Security Features

- Row Level Security (RLS) enabled
- Role-based access policies
- Secure OAuth redirects
- Session management
- Automatic role validation

## Troubleshooting

### Common Issues:

1. **"Missing Supabase environment variables"**
   - Check your `.env.local` file
   - Ensure variables are properly set

2. **"Auth callback error"**
   - Verify Google OAuth redirect URIs
   - Check Supabase auth settings

3. **"Not authorized" errors**
   - Ensure user has proper role in database
   - Check RLS policies

4. **OTP not working**
   - Verify email templates in Supabase
   - Check spam folder

### Support

If you encounter issues:
1. Check Supabase logs in dashboard
2. Verify environment variables
3. Test with different browsers
4. Check network tab for API errors 