# SMS OTP Integration

This document describes the SMS OTP integration using the SMS.net.bd API for user authentication.

## Overview

The SMS OTP system provides phone-based authentication for users. The system integrates with Supabase Auth and automatically creates user accounts for new phone numbers.

## Features

- **Phone-based OTP**: Users can login using their Bangladeshi mobile number
- **Automatic user creation**: New users are automatically created when they first login
- **Supabase integration**: Seamless integration with Supabase Auth system
- **Role-based access**: Support for customer and admin roles
- **Development mode**: OTP codes are logged in development for testing

## API Endpoints

### Send OTP
- **URL**: `/api/auth/send-otp`
- **Method**: `POST`
- **Body**: `{ "phone": "01XXXXXXXXX" }`
- **Response**: `{ "success": true, "message": "OTP sent successfully" }`

### Verify OTP
- **URL**: `/api/auth/verify-otp`
- **Method**: `POST`
- **Body**: `{ "phone": "01XXXXXXXXX", "otp": "123456" }`
- **Response**: `{ "success": true, "user": {...}, "sessionUrl": "..." }`

### Magic Link Callback
- **URL**: `/auth/magic-link`
- **Method**: `GET`
- **Purpose**: Handles magic link authentication and redirects users to appropriate dashboard

## Configuration

The SMS API key is configured directly in the code for immediate use. The API key is:

```
dnNvEE1TlXgNOisnvzsAF9609gMwPlq8CEL3ZbBO
```

For Supabase admin operations, ensure you have:
```env
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Database Schema

The system uses the existing `users` table with a unique index on the `phone` field:

```sql
-- Unique index on phone for phone-based authentication
CREATE UNIQUE INDEX idx_users_phone ON public.users(phone) WHERE phone IS NOT NULL;
```

## Phone Number Format

The system automatically formats phone numbers to ensure they start with the Bangladesh country code (880):

- `01XXXXXXXXX` → `8801XXXXXXXXX`
- `+8801XXXXXXXXX` → `8801XXXXXXXXX`
- `8801XXXXXXXXX` → `8801XXXXXXXXX`

## OTP Storage

OTPs are stored in memory with a 5-minute expiration. In production, consider using Redis or a database for better scalability.

## Authentication Flow

1. **User enters phone number** → OTP is sent via SMS
2. **User enters OTP** → OTP is verified
3. **Magic link is generated** → Points to `/auth/magic-link`
4. **Magic link redirects to server route** → Server extracts tokens from hash
5. **Server sets session** → Using Supabase server client
6. **Server checks user role** → Queries database for user role
7. **Server redirects** → To appropriate dashboard (admin/customer)

## User Database Synchronization

The system automatically synchronizes user data with Supabase:

- **New users**: Created in both Supabase Auth and users table
- **Existing users**: Retrieved from users table
- **User metadata**: Stored in users table with role information
- **Session management**: Handled through Supabase magic links

## Security Features

- OTP expiration after 5 minutes
- Automatic cleanup of expired OTPs
- Phone number validation
- Server-side session management
- Role-based access control
- Development mode OTP logging

## Usage

### User Login Flow

1. User enters phone number on login page
2. System sends OTP via SMS
3. User enters OTP
4. System verifies OTP and creates/authenticates user
5. User is redirected to appropriate dashboard based on role

### Admin Access

Users with admin role are automatically redirected to `/admin` dashboard.
Regular users are redirected to `/dashboard`.

## Error Handling

The system handles various SMS API errors:

- **400**: Invalid request parameters
- **403**: Access denied
- **404**: Resource not found
- **405**: Authorization required
- **409**: Server error
- **410**: Account expired
- **411**: Reseller account expired
- **412**: Invalid schedule
- **413**: Invalid sender ID
- **414**: Message is empty
- **415**: Message is too long
- **416**: No valid number found
- **417**: Insufficient balance
- **420**: Content blocked
- **421**: Can only send SMS to registered phone number

## Testing

The system is production-ready and will send actual SMS messages. OTP codes are never returned in API responses for security reasons.

## Troubleshooting

### Common Issues

1. **SMS not sending**: Check API key and balance
2. **Invalid phone number**: Ensure number starts with 01 and has 11 digits
3. **OTP not working**: Check if OTP has expired (5 minutes)
4. **Authentication failed**: Check server logs for magic link errors
5. **Redirect issues**: Verify magic link callback route is working

### Debug Steps

1. Verify API key in SMS service
2. Check SMS balance via admin dashboard
3. Verify phone number format
4. Check server logs for API errors
5. Test magic link callback route
6. Verify Supabase session creation

## Future Enhancements

- Redis integration for OTP storage
- SMS delivery reports
- Bulk SMS functionality
- Rate limiting for OTP requests
- Phone number verification before OTP
- Backup SMS providers
- Enhanced user profile management 