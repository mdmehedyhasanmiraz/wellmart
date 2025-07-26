'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'react-hot-toast';
import { X } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPopup() {
  const { isLoginPopupOpen, closeLoginPopup, checkUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpMode, setOtpMode] = useState(false);
  const [otpStep, setOtpStep] = useState<'request' | 'verify'>('request');
  const [otpCode, setOtpCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (isLoginPopupOpen) {
      // Reset form when popup opens
      setEmail('');
      setPassword('');
      setOtpCode('');
      setOtpMode(false);
      setOtpStep('request');
      setVerifying(false);
      setLoading(false);
    }
  }, [isLoginPopupOpen]);

  const handleLoginSuccess = async () => {
    await checkUser();
    closeLoginPopup();
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        toast.error(error.message);
        setLoading(false);
      }
    } catch (error) {
      toast.error('Google sign-in failed');
      console.error('Google sign-in failed', error);
      setLoading(false);
    }
  };

  const handleFacebookSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        toast.error(error.message);
        setLoading(false);
      }
    } catch (error) {
      toast.error('Facebook sign-in failed');
      console.error('Facebook sign-in failed', error);
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
      toast.success('Login successful!');
      await handleLoginSuccess();
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
      toast.success('Login successful!');
      await handleLoginSuccess();
    } catch (err) {
      toast.error('OTP verification failed');
      console.error('OTP verify error', err);
    } finally {
      setVerifying(false);
    }
  };

  if (!isLoginPopupOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={closeLoginPopup}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
          {/* Close button */}
          <button
            onClick={closeLoginPopup}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Content */}
          <div className="bg-gradient-to-br from-lime-50 to-white p-8">
            <div className="flex flex-col items-center">
              <Image src="/logos/logo-wellmart.png" alt="Wellmart Logo" width={140} height={140} className="mb-4" />
              <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
                Sign in
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Sign in with your email or social account
              </p>
            </div>
            <div className="mt-8 space-y-6">
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

              {/* Email & Password Form */}
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
                        {loading ? 'Sending OTP...' : 'Send OTP to Email'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div>
                      <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                        Enter 6-digit OTP sent to your email
                      </label>
                      <input
                        id="otp"
                        name="otp"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]{6}"
                        maxLength={6}
                        required
                        value={otpCode}
                        onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500 focus:z-10 text-base shadow-sm tracking-widest text-center"
                        placeholder="------"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <button
                        type="button"
                        className="text-sm text-gray-500 hover:text-lime-600 underline"
                        onClick={() => { setOtpStep('request'); setOtpCode(''); }}
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={verifying || otpCode.length !== 6}
                        className="group relative flex justify-center py-3 px-6 border border-transparent text-base font-semibold rounded-xl text-white bg-lime-600 hover:bg-lime-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lime-500 disabled:opacity-50 shadow-md"
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
      </div>
    </div>
  );
} 