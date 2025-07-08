# Fix OTP Expiry Warning in Supabase

## Issue
Your Supabase authentication is showing this warning:
> "OTP expiry exceeds recommended threshold. We have detected that you have enabled the email provider with the OTP expiry set to more than an hour. It is recommended to set this value to less than an hour."

## Solution

### Step 1: Access Supabase Dashboard
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your Wellmart project
3. Navigate to **Authentication** → **Settings**

### Step 2: Update OTP Expiry Settings
1. In the Authentication Settings page, look for **"Email Auth"** section
2. Find the **"OTP Expiry"** setting
3. Change the value from the current setting (likely 24 hours or more) to **3600 seconds (1 hour)** or less
4. Recommended values:
   - **3600 seconds (1 hour)** - Standard recommendation
   - **1800 seconds (30 minutes)** - More secure
   - **900 seconds (15 minutes)** - Very secure

### Step 3: Save Changes
1. Click **"Save"** to apply the changes
2. The warning should disappear after saving

## Why This Matters

### Security Benefits
- **Reduced attack window**: Shorter expiry times reduce the risk of unauthorized access
- **Better security practices**: Aligns with industry standards for OTP security
- **Compliance**: Meets security requirements for many applications

### User Experience Considerations
- **Balance security and convenience**: 1 hour is usually sufficient for users to check their email
- **Clear communication**: Make sure users know they need to act quickly
- **Fallback options**: Consider providing alternative authentication methods

## Recommended Settings

```json
{
  "otp_expiry": 3600,  // 1 hour in seconds
  "enable_signup": true,
  "enable_confirmations": true,
  "enable_notifications": true
}
```

## Update Your Application (Optional)

You might want to update your login/signup components to inform users about the shorter expiry time:

### Update Login Page
```tsx
// In wellmart/app/login/page.tsx
// Add this message to inform users about OTP expiry

<div className="text-center mt-4">
  <p className="text-sm text-gray-600">
    OTP will expire in 1 hour. Please check your email and verify promptly.
  </p>
</div>
```

### Update Signup Page
```tsx
// In wellmart/app/signup/page.tsx
// Add this message to inform users about OTP expiry

<div className="text-center mt-4">
  <p className="text-sm text-gray-600">
    Verification link will expire in 1 hour. Please check your email and verify promptly.
  </p>
</div>
```

## Additional Security Recommendations

### 1. Rate Limiting
Consider implementing rate limiting for OTP requests:
- Limit OTP requests per email address
- Add cooldown periods between requests
- Monitor for suspicious activity

### 2. Email Templates
Customize your Supabase email templates to:
- Clearly state the expiry time
- Provide clear instructions
- Include your branding

### 3. Alternative Authentication
Consider adding:
- Google OAuth (already implemented)
- SMS verification (if needed)
- Backup email addresses

## Testing the Changes

After updating the OTP expiry:

1. **Test the signup flow**:
   - Create a new account
   - Check if OTP expires correctly after 1 hour

2. **Test the login flow**:
   - Try logging in with email OTP
   - Verify the expiry behavior

3. **Test edge cases**:
   - Try using expired OTP
   - Test multiple OTP requests

## Monitoring

After implementing these changes:

1. **Monitor user feedback** about OTP expiry
2. **Track failed authentication attempts**
3. **Monitor support requests** related to OTP issues
4. **Adjust settings** if needed based on user behavior

## Troubleshooting

### If users complain about short expiry:
1. **Increase slightly** to 2 hours (7200 seconds)
2. **Improve email delivery** to reduce delays
3. **Add clear messaging** about expiry times

### If you need longer expiry for specific use cases:
1. **Use different auth methods** for those cases
2. **Implement custom expiry logic** in your application
3. **Consider session-based authentication** for longer access

## Final Notes

- The 1-hour expiry is a **security best practice**
- Most users check their email within minutes
- Clear communication helps users understand the urgency
- Monitor and adjust based on your specific user needs

This change will improve your application's security posture and remove the warning from your Supabase dashboard. 