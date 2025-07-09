'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'react-hot-toast';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/dashboard';

  const supabase = createClient();

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setEmailError(false);

    try {
      console.log('Sending OTP to:', email); // Debug log
      
      // Try to sign in first (existing user)
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false, // Try existing user first
        },
      });

      // If user doesn't exist, try to create new user
      if (error && error.message.includes('User not found')) {
        console.log('User not found, creating new user...');
        setIsNewUser(true);
        
        const { error: signUpError } = await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: true, // Create new user
            data: {
              name: email.split('@')[0], // Use email prefix as name
              email: email,
            }
          },
        });

        if (signUpError) {
          console.error('Sign up error:', signUpError);
          toast.error(`Error: ${signUpError.message}`);
        } else {
          setShowOtpInput(true);
          toast.success('Account created! OTP sent to your email.');
        }
      } else if (error) {
        console.error('Supabase error:', error);
        
        // Handle specific email errors
        if (error.message.includes('Error sending magic link email')) {
          setEmailError(true);
          toast.error('Email service is temporarily unavailable. Please try Google sign-in.');
        } else {
          toast.error(`Error: ${error.message}`);
        }
      } else {
        setShowOtpInput(true);
        toast.success('OTP sent to your email!');
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });

      if (error) {
        toast.error(error.message);
      } else if (data.user) {
        // Check if user exists in our users table
        const { data: existingUser } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (!existingUser && isNewUser) {
          // Create user in our users table for new users
          const userData = {
            id: data.user.id,
            name: data.user.user_metadata?.name || email.split('@')[0],
            email: data.user.email,
            phone: '',
            division: '',
            district: '',
            upazila: '',
            street: '',
            role: 'customer', // Default role
          };

          const { error: insertError } = await supabase
            .from('users')
            .insert([userData]);

          if (insertError) {
            console.error('Error inserting user:', insertError);
            // Continue anyway, user can update their profile later
          }
        }

        // Check user role and redirect accordingly
        const { data: userDetails } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (userDetails?.role === 'admin' || userDetails?.role === 'manager') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
        toast.success('Login successful!');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
      console.error('OTP verification error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${next}`,
        },
      });

      if (error) {
        toast.error(error.message);
        setLoading(false);
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
      console.error('Google sign in error:', error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to Wellmart
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email to get started. New users will be created automatically.
          </p>
        </div>
        
        <div className="mt-8 space-y-6">
          {/* Google Sign In Button */}
          <div>
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in with Google'}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">Or continue with email</span>
            </div>
          </div>

          {/* Email Sign In Form */}
          {!showOtpInput ? (
            <form onSubmit={handleEmailSignIn} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`appearance-none relative block w-full px-3 py-2 border ${
                      emailError ? 'border-red-300' : 'border-gray-300'
                    } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-lime-500 focus:border-lime-500 focus:z-10 sm:text-sm`}
                    placeholder="Enter your email"
                  />
                </div>
                {emailError && (
                  <p className="mt-2 text-sm text-red-600">
                    Email service unavailable. Please use Google sign-in.
                  </p>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-lime-600 hover:bg-lime-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lime-500 disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send OTP'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleOtpVerification} className="space-y-6">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                  Enter OTP
                </label>
                <div className="mt-1">
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    autoComplete="one-time-code"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-lime-500 focus:border-lime-500 focus:z-10 sm:text-sm"
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                  />
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  We&apos;ve sent a 6-digit code to {email}
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowOtpInput(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lime-500"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-lime-600 hover:bg-lime-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lime-500 disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-lime-600"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
} 