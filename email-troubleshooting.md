# Email Delivery Troubleshooting Guide

## Issue: Emails are not being sent from Supabase

This guide will help you diagnose and fix email delivery issues in your Supabase project.

## Step 1: Check Supabase Email Settings

### 1.1 Verify Email Provider Configuration
1. Go to **Supabase Dashboard** → **Authentication** → **Settings**
2. Check if **"Enable email confirmations"** is **ENABLED**
3. Verify **"Enable email change confirmations"** is **ENABLED**
4. Check **"Enable secure email change"** is **ENABLED**

### 1.2 Check Email Templates
1. Go to **Authentication** → **Settings** → **Email Templates**
2. Verify the **"Magic Link"** template is properly configured
3. Make sure the template has valid HTML content

## Step 2: Check Supabase Logs

### 2.1 View Authentication Logs
1. Go to **Supabase Dashboard** → **Logs**
2. Filter by **"Auth"** events
3. Look for any error messages related to email sending
4. Check for rate limiting or configuration errors

### 2.2 Check Edge Function Logs (if applicable)
If you're using Edge Functions for email, check those logs too.

## Step 3: Test Email Configuration

### 3.1 Test with Supabase CLI
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Test email sending
supabase auth test-email your-email@example.com
```

### 3.2 Test Email Templates
1. Go to **Authentication** → **Settings** → **Email Templates**
2. Click **"Test"** button on any template
3. Enter your email address
4. Check if you receive the test email

## Step 4: Common Issues and Solutions

### 4.1 Email Provider Issues
**Problem:** Supabase's default email provider might be having issues
**Solution:** 
1. Check Supabase status page: https://status.supabase.com/
2. Consider switching to a custom SMTP provider

### 4.2 Custom SMTP Configuration
If you want to use your own email provider:

1. Go to **Authentication** → **Settings**
2. Scroll down to **"SMTP Settings"**
3. Configure with your email provider:
   - **Host:** smtp.gmail.com (for Gmail)
   - **Port:** 587
   - **Username:** your-email@gmail.com
   - **Password:** App password (not regular password)
   - **Sender Name:** Wellmart
   - **Sender Email:** your-email@gmail.com

### 4.3 Gmail SMTP Setup
For Gmail specifically:
1. Enable 2-factor authentication
2. Generate an App Password
3. Use the App Password in SMTP settings

### 4.4 Rate Limiting
**Problem:** Too many email requests
**Solution:**
1. Check if you're hitting rate limits
2. Implement proper error handling
3. Add delays between requests

## Step 5: Debug Your Application Code

### 5.1 Add Better Error Handling
Update your login component to show more detailed errors:

```tsx
const handleEmailSignIn = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    console.log('Sending OTP to:', email); // Debug log
    
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
      },
    });

    console.log('Supabase response:', { data, error }); // Debug log

    if (error) {
      console.error('Supabase error:', error); // Debug log
      toast.error(`Error: ${error.message}`);
    } else {
      setShowOtpInput(true);
      toast.success('OTP sent to your email!');
    }
  } catch (error) {
    console.error('Unexpected error:', error); // Debug log
    toast.error('An error occurred. Please try again.');
  } finally {
    setLoading(false);
  }
};
```

### 5.2 Test with Different Email
Try testing with:
1. A different email address
2. A Gmail address (usually more reliable)
3. Check spam/junk folders

## Step 6: Alternative Solutions

### 6.1 Use Password-Based Authentication
If email OTP continues to fail, consider switching to password-based auth:

```tsx
// For signup
const { data, error } = await supabase.auth.signUp({
  email: formData.email,
  password: 'temporary-password', // You can change this later
  options: {
    data: {
      name: formData.name,
      // ... other user data
    }
  }
});

// For login
const { data, error } = await supabase.auth.signInWithPassword({
  email: email,
  password: password,
});
```

### 6.2 Use Google OAuth Only
Temporarily disable email auth and use only Google OAuth:

1. Go to **Authentication** → **Settings**
2. Disable **"Enable email confirmations"**
3. Keep Google OAuth enabled
4. Update your UI to show only Google sign-in

### 6.3 Implement Custom Email Service
Use a service like SendGrid, Mailgun, or AWS SES:

```tsx
// Example with SendGrid
const sendOTPEmail = async (email: string, otp: string) => {
  const response = await fetch('/api/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp })
  });
  return response.ok;
};
```

## Step 7: Quick Diagnostic Checklist

- [ ] Email confirmations enabled in Supabase
- [ ] Email templates configured properly
- [ ] No errors in Supabase logs
- [ ] Test email works in Supabase dashboard
- [ ] Using valid email address
- [ ] Checked spam/junk folders
- [ ] No rate limiting issues
- [ ] SMTP configured (if using custom provider)

## Step 8: Contact Supabase Support

If none of the above solutions work:

1. **Check Supabase Status:** https://status.supabase.com/
2. **Community Forum:** https://github.com/supabase/supabase/discussions
3. **Discord:** https://discord.supabase.com/
4. **Email Support:** If you have a paid plan

## Immediate Action Items

1. **Check Supabase logs** for specific error messages
2. **Test email templates** in the dashboard
3. **Try with a different email address**
4. **Check spam/junk folders**
5. **Consider switching to custom SMTP** if the issue persists

Let me know what you find in the logs and I can help you with the specific error! 