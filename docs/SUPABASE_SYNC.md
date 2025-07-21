# Supabase Authentication Sync

This document explains how the custom JWT authentication system syncs with Supabase authentication using phone numbers.

## Overview

The application uses a custom OTP-based authentication system with JWT tokens, but also syncs with Supabase's authentication system to enable Supabase-specific features like RLS policies and real-time subscriptions.

## How It Works

### 1. Custom Authentication Flow (Primary)
- User enters phone number
- OTP is sent via SMS
- User verifies OTP
- Custom JWT token is generated and stored in HTTP-only cookie
- User is authenticated with custom system
- All application features use custom JWT authentication

### 2. Supabase User Sync Process
After successful custom authentication:
- System creates/verifies user exists in Supabase auth using phone number
- User account is synced to Supabase for feature compatibility
- No active Supabase session is created (security-focused approach)
- Supabase user exists for RLS policies and database operations

### 3. Authentication Strategy
- **Primary**: Custom JWT system handles all user authentication
- **Secondary**: Supabase user accounts exist for database features
- **Security**: No active Supabase sessions to avoid conflicts
- **Compatibility**: Enables Supabase RLS policies and real-time features

## Files and Components

### Core Services
- `lib/services/auth.ts` - Custom JWT authentication
- `lib/services/supabaseAuth.ts` - Supabase authentication sync
- `hooks/useSupabaseSync.ts` - React hook for sync management

### API Routes
- `app/api/auth/verify-otp/route.ts` - Main authentication endpoint
- `app/api/auth/sync-supabase/route.ts` - Server-side Supabase sync

### UI Components
- `components/SupabaseSyncStatus.tsx` - Shows sync status in dashboard
- Updated login page to trigger sync after authentication

## Usage

### Automatic Sync
The sync happens automatically after successful login. Users don't need to do anything.

### Manual Sync Check
Users can check their Supabase sync status in the dashboard:
- Green checkmark: Supabase synced
- Yellow warning: Supabase not synced
- Refresh button to re-check status

### Error Handling
- If Supabase sync fails, the user can still use the application
- Custom authentication continues to work independently
- Sync errors are logged but don't block user access

## Benefits

1. **Seamless Integration**: Users get both authentication systems automatically
2. **Feature Compatibility**: Enables Supabase RLS policies and real-time features
3. **Fallback Support**: Application works even if Supabase sync fails
4. **Phone-Based**: Uses phone numbers for both systems, maintaining consistency
5. **Custom JWT Primary**: Main authentication uses custom JWT system for reliability
6. **Supabase User Sync**: User accounts are synced to Supabase for feature compatibility

## Configuration

### Environment Variables Required
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SITE_URL=your_site_url
```

### Supabase Settings
- Enable phone authentication in Supabase dashboard
- Configure SMS provider settings
- Set up appropriate RLS policies

## Troubleshooting

### Common Issues

1. **Sync Fails**: Check Supabase service role key and URL
2. **Phone Not Found**: Ensure phone format matches Supabase expectations
3. **Session Conflicts**: Clear browser storage if needed

### Debug Steps
1. Check browser console for sync logs
2. Verify Supabase dashboard for user creation
3. Test with different phone numbers
4. Check network requests in browser dev tools

## Security Considerations

- Service role key is only used server-side
- Phone numbers are validated before sync
- Failed sync doesn't compromise custom authentication
- Sessions are independent and secure 