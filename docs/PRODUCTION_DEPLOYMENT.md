# Production Deployment Checklist - SMS Integration

This checklist ensures the SMS OTP integration is properly deployed to production.

## Configuration

The SMS API key is configured directly in the code and ready for use.

### Required Environment Variables

```env
# Required for Supabase admin operations
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Required for Supabase client
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## Database Migration

Run the phone index migration in your Supabase database:

```sql
-- Execute the migration script
\i database/add-phone-index.sql
```

Or manually run:
```sql
CREATE UNIQUE INDEX idx_users_phone ON public.users(phone) WHERE phone IS NOT NULL;
```

## Verification Steps

### 1. Environment Variables
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set and valid
- [ ] All Supabase environment variables are configured
- [ ] SMS API key is configured in code (already done)

### 2. Database
- [ ] Phone index is created (`idx_users_phone`)
- [ ] Users table has the phone field
- [ ] RLS policies are in place

### 3. API Endpoints
- [ ] `/api/auth/send-otp` responds correctly
- [ ] `/api/auth/verify-otp` responds correctly
- [ ] `/api/admin/sms-balance` responds correctly (admin only)

### 4. Frontend
- [ ] Login page shows both email and phone tabs
- [ ] Phone number validation works
- [ ] OTP input and verification works
- [ ] Admin dashboard shows SMS balance

### 5. SMS Service
- [ ] SMS API key is working
- [ ] SMS balance can be retrieved
- [ ] OTP messages are being sent
- [ ] Phone number formatting works correctly

## Testing in Production

### 1. Test Phone Login
1. Go to login page
2. Select "Phone" tab
3. Enter a valid Bangladeshi number (e.g., `01712345678`)
4. Check if SMS is received
5. Enter OTP to complete login

### 2. Test Admin Features
1. Login as admin user
2. Check SMS balance in admin dashboard
3. Verify balance is displayed correctly

### 3. Test Error Handling
1. Try invalid phone numbers
2. Try expired OTPs
3. Check error messages are user-friendly

## Monitoring

### 1. SMS Balance
- Monitor SMS balance regularly via admin dashboard
- Set up alerts for low balance
- Track SMS usage patterns

### 2. Error Logs
- Monitor server logs for SMS API errors
- Check for failed OTP attempts
- Monitor user login patterns

### 3. Performance
- Monitor API response times
- Check for any timeout issues
- Monitor database performance

## Security Considerations

### 1. API Key Security
- [ ] SMS API key is stored securely
- [ ] API key is not exposed in client-side code
- [ ] API key has appropriate permissions

### 2. Rate Limiting
- Consider implementing rate limiting for OTP requests
- Monitor for abuse patterns
- Set up alerts for unusual activity

### 3. Data Protection
- Phone numbers are stored securely
- OTPs are not logged or stored permanently
- User privacy is maintained

## Backup Plans

### 1. SMS Service Failure
- Have backup SMS provider ready
- Implement fallback to email OTP
- Monitor SMS delivery rates

### 2. Database Issues
- Regular database backups
- Monitor database performance
- Have rollback plan ready

## Support Documentation

### 1. User Support
- Document common issues and solutions
- Provide troubleshooting guide
- Set up support channels

### 2. Admin Support
- Document admin dashboard usage
- Provide SMS balance monitoring guide
- Set up admin notifications

## Post-Deployment

### 1. Monitoring
- Monitor system for 24-48 hours after deployment
- Check for any errors or issues
- Verify all functionality works as expected

### 2. User Communication
- Inform users about new phone login option
- Provide clear instructions for phone login
- Address any user concerns

### 3. Documentation Update
- Update user documentation
- Update admin documentation
- Update API documentation if needed

## Rollback Plan

If issues arise, you can temporarily disable phone login by:

1. Removing the phone tab from the login page
2. Disabling the SMS API routes
3. Reverting to email-only authentication

The system will continue to work with email OTP and Google sign-in. 