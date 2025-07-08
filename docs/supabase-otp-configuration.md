# Configure Supabase to Send OTP Codes Instead of Magic Links

## Issue
Supabase is sending magic links (clickable email links) instead of OTP codes that users can enter manually.

## Solution

### Step 1: Update Supabase Authentication Settings

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your Wellmart project
3. Navigate to **Authentication** → **Settings**
4. In the **"Email Auth"** section, look for these settings:

### Step 2: Configure Email Provider Settings

**Enable OTP Mode:**
- Find **"Enable email confirmations"** - Make sure this is **ENABLED**
- Find **"Enable email change confirmations"** - Make sure this is **ENABLED**
- Find **"Enable secure email change"** - This should be **ENABLED**

**Important:** The key setting is in your **email templates**. You need to configure the email template to send OTP codes.

### Step 3: Configure Email Templates

1. In the same Authentication Settings page, go to **"Email Templates"**
2. You'll see several templates:
   - **Magic Link** (this is what you're currently using)
   - **Email Change**
   - **Password Reset**
   - **Email Confirmation**

3. **For OTP Authentication, you need to customize the "Magic Link" template:**

```html
<!-- Example OTP Email Template -->
<h2>Your Verification Code</h2>
<p>Hello,</p>
<p>Your verification code is: <strong>{{ .Token }}</strong></p>
<p>This code will expire in 30 minutes.</p>
<p>If you didn't request this code, please ignore this email.</p>
<p>Best regards,<br>Wellmart Team</p>
```

### Step 4: Update Your Application Code

The issue is also in your application code. You need to use the correct Supabase method for OTP:

#### Current Code (Magic Link):
```tsx
// This sends magic links
const { error } = await supabase.auth.signInWithOtp({
  email,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`,
  },
});
```

#### Updated Code (OTP):
```tsx
// This sends OTP codes
const { error } = await supabase.auth.signInWithOtp({
  email,
  options: {
    shouldCreateUser: true, // For signup
    // Remove emailRedirectTo for OTP mode
  },
});
```

### Step 5: Update Your Login Component

Update your `wellmart/app/login/page.tsx`:

```tsx
const handleEmailSignIn = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Remove emailRedirectTo for OTP mode
        shouldCreateUser: false, // For login only
      },
    });

    if (error) {
      toast.error(error.message);
    } else {
      setShowOtpInput(true);
      toast.success('OTP sent to your email!');
    }
  } catch (error) {
    toast.error('An error occurred. Please try again.');
  } finally {
    setLoading(false);
  }
};
```

### Step 6: Update Your Signup Component

Update your `wellmart/app/signup/page.tsx`:

```tsx
const handleSignup = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithOtp({
      email: formData.email,
      options: {
        shouldCreateUser: true, // For signup
        data: {
          name: formData.name,
          phone: formData.phone,
          division: formData.division,
          district: formData.district,
          upazila: formData.upazila,
          street: formData.street,
        }
        // Remove emailRedirectTo for OTP mode
      }
    });

    if (authError) {
      toast.error(authError.message);
    } else {
      toast.success('OTP sent to your email! Please check your email and verify to complete registration.');
      router.push('/login');
    }
  } catch (error) {
    toast.error('An error occurred. Please try again.');
  } finally {
    setLoading(false);
  }
};
```

## Alternative: Use Password-Based Authentication

If you prefer a more traditional approach, you can switch to password-based authentication:

### Step 1: Enable Password Auth in Supabase
1. Go to **Authentication** → **Settings**
2. Enable **"Enable email confirmations"**
3. Enable **"Enable secure email change"**

### Step 2: Update Your Components
Use `signUp` and `signIn` methods instead of `signInWithOtp`:

```tsx
// For signup
const { data, error } = await supabase.auth.signUp({
  email: formData.email,
  password: password, // You'll need to add password field
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

## Testing

After making these changes:

1. **Test OTP Flow:**
   - Try signing up with a new email
   - Check if you receive an OTP code instead of a magic link
   - Enter the OTP code in your application

2. **Test Login Flow:**
   - Try logging in with an existing email
   - Verify OTP code is sent and works

## Troubleshooting

### If you still receive magic links:
1. **Check email template** - Make sure it's configured for OTP
2. **Remove emailRedirectTo** - This forces magic link mode
3. **Clear browser cache** - Sometimes cached settings persist

### If OTP codes don't work:
1. **Check Supabase logs** for any errors
2. **Verify email template** syntax
3. **Test with a different email** address

### If you want to keep magic links:
Magic links are actually more secure and user-friendly. You can:
1. **Keep the current setup**
2. **Update your UI** to explain the magic link process
3. **Remove the OTP input fields** from your components

## Recommendation

**Magic links are generally better** because:
- More secure (no code to enter manually)
- Better user experience (one-click verification)
- Less prone to user error
- Industry standard for modern authentication

If you specifically need OTP codes, follow the steps above. Otherwise, consider keeping magic links and updating your UI accordingly. 