'use client';

import { useState, Suspense } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { createClient } from '@/utils/supabase/client';
import { getAndClearRedirectUrl } from '@/utils/redirectUtils';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpMode, setOtpMode] = useState(false);
  const [otpStep, setOtpStep] = useState<'request' | 'verify'>('request');
  const [otpCode, setOtpCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await supabase.auth.signInWithOAuth({ provider: 'google' });
    } catch (error) {
      toast.error('Google sign-in failed');
      console.error('Google sign-in failed', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookSignIn = async () => {
    setLoading(true);
    try {
      await supabase.auth.signInWithOAuth({ provider: 'facebook' });
    } catch (error) {
      toast.error('Facebook sign-in failed');
      console.error('Facebook sign-in failed', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailPasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message || 'Login failed');
        setLoading(false);
        return;
      }
      toast.success('Login successful! Redirecting...');
      
      // Get the redirect URL and navigate
      const redirectUrl = getAndClearRedirectUrl();
      router.push(redirectUrl);
    } catch (err) {
      toast.error('Login failed');
      console.error('Login failed', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailOtpSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        },
      });
      if (error) {
        toast.error(error.message || 'Failed to send OTP');
        setLoading(false);
        return;
      }
      setOtpStep('verify');
      toast.success('OTP sent to your email!');
    } catch (err) {
      toast.error('Failed to send OTP');
      console.error('OTP error', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'email',
      });
      if (error) {
        toast.error(error.message || 'Invalid OTP');
        setVerifying(false);
        return;
      }
      toast.success('Login successful! Redirecting...');
      
      // Get the redirect URL and navigate
      const redirectUrl = getAndClearRedirectUrl();
      router.push(redirectUrl);
    } catch (err) {
      toast.error('OTP verification failed');
      console.error('OTP verify error', err);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="flex flex-col items-center">
          <Image src="/logos/logo-wellmart.png" alt="Wellmart Logo" width={140} height={140} className="mb-4" />
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in with your email or social account
          </p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md">
          {/* Social Sign-In Buttons */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-gray-300 rounded-xl bg-white text-gray-700 font-semibold shadow-sm hover:bg-gray-50 transition-colors mb-2"
          >
            <img src="/logos/logo-google.svg" alt="Google" className="w-5 h-5" />
            Continue with Google
          </button>
          <button
            type="button"
            onClick={handleFacebookSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-gray-300 rounded-xl bg-white text-gray-700 font-semibold shadow-sm hover:bg-gray-50 transition-colors mb-4"
          >
            <img src="/logos/logo-google.svg" alt="Facebook" className="w-5 h-5" />
            Continue with Facebook
          </button>
          
          {/* Email Sign-In Toggle */}
          <div className="flex justify-center mb-2">
            <button
              type="button"
              className={`px-4 py-2 rounded-l-lg border ${!otpMode ? 'bg-lime-600 text-white' : 'bg-gray-100 text-gray-700'} font-semibold`}
              onClick={() => { setOtpMode(false); setOtpStep('request'); }}
            >
              Email & Password
            </button>
            <button
              type="button"
              className={`px-4 py-2 rounded-r-lg border ${otpMode ? 'bg-lime-600 text-white' : 'bg-gray-100 text-gray-700'} font-semibold`}
              onClick={() => { setOtpMode(true); setOtpStep('request'); }}
            >
              Email OTP
            </button>
          </div>

          {/* Email Sign-In Forms */}
          {!otpMode ? (
            <form onSubmit={handleEmailPasswordSignIn} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500 focus:z-10 text-base shadow-sm"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500 focus:z-10 text-base shadow-sm"
                  placeholder="••••••••"
                />
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-base font-semibold rounded-xl text-white bg-lime-600 hover:bg-lime-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lime-500 disabled:opacity-50 shadow-md"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </div>
            </form>
          ) : (
            /* OTP Forms */
            otpStep === 'request' ? (
              <form onSubmit={handleEmailOtpSignIn} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500 focus:z-10 text-base shadow-sm"
                    placeholder="you@example.com"
                  />
                </div>
                
                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-base font-semibold rounded-xl text-white bg-lime-600 hover:bg-lime-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lime-500 disabled:opacity-50 shadow-md"
                  >
                    {loading ? 'Sending OTP...' : 'Send OTP'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                    Enter OTP
                  </label>
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    required
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value)}
                    className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500 focus:z-10 text-base shadow-sm"
                    placeholder="Enter the 6-digit code"
                    maxLength={6}
                  />
                </div>
                
                <div>
                  <button
                    type="submit"
                    disabled={verifying}
                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-base font-semibold rounded-xl text-white bg-lime-600 hover:bg-lime-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lime-500 disabled:opacity-50 shadow-md"
                  >
                    {verifying ? 'Verifying...' : 'Verify OTP'}
                  </button>
                </div>
              </form>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
} 