'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'react-hot-toast';
import { X, Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPopup() {
  const { isLoginPopupOpen, closeLoginPopup, checkUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpMode, setIsOtpMode] = useState(false);
  
  const supabase = createClient();

  useEffect(() => {
    if (isLoginPopupOpen) {
      // Reset form when popup opens
      setEmail('');
      setPassword('');
      setOtp('');
      setIsOtpSent(false);
      setIsOtpMode(false);
    }
  }, [isLoginPopupOpen]);

  const handleLoginSuccess = async () => {
    await checkUser();
    closeLoginPopup();
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('Login successful!');
        await handleLoginSuccess();
      }
    } catch (error) {
      toast.error('An error occurred during login');
      console.error('Login error', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    if (!isOtpSent) {
      // Send OTP
      setIsLoading(true);
      try {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) {
          toast.error(error.message);
        } else {
          setIsOtpSent(true);
          toast.success('OTP sent to your email!');
        }
      } catch (error) {
        toast.error('Failed to send OTP');
        console.error('Failed to send OTP', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Verify OTP
      if (!otp) {
        toast.error('Please enter the OTP');
        return;
      }

      setIsLoading(true);
      try {
        const { error } = await supabase.auth.verifyOtp({
          email,
          token: otp,
          type: 'email',
        });

        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Login successful!');
          await handleLoginSuccess();
        }
      } catch (error) {
        toast.error('Invalid OTP');
        console.error('Failed to login with OTP', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast.error(error.message);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Failed to login with Google', error);
      toast.error('Failed to login with Google');
      setIsLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast.error(error.message);
        setIsLoading(false);
      }
    } catch (error) {
      toast.error('Failed to login with Facebook');
      console.error('Failed to login with Facebook', error);
      setIsLoading(false);
    }
  };

  const handleBackToOptions = () => {
    setIsOtpMode(false);
    setIsOtpSent(false);
    setOtp('');
    setPassword('');
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
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Sign In</h2>
            <button
              onClick={closeLoginPopup}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {!isOtpMode ? (
              // Login Options
              <div className="space-y-6">
                {/* Email/Password Login */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Login with Email</h3>
                  <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="email"
                          id="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                          placeholder="Enter your email"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                          placeholder="Enter your password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-lime-600 hover:bg-lime-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        'Sign In'
                      )}
                    </button>
                  </form>
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or continue with</span>
                  </div>
                </div>

                {/* OTP Login Option */}
                <div>
                  <button
                    onClick={() => setIsOtpMode(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    Login with OTP
                  </button>
                </div>

                {/* Social Login */}
                <div className="space-y-3">
                  <button
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2 px-4 rounded-lg border border-gray-300 transition-colors flex items-center justify-center gap-3"
                  >
                    <Image
                      src="/logos/logo-google.svg"
                      alt="Google"
                      width={20}
                      height={20}
                    />
                    Continue with Google
                  </button>

                  <button
                    onClick={handleFacebookLogin}
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-3"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Continue with Facebook
                  </button>
                </div>

                {/* Register Link */}
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Don&apos;t have an account?{' '}
                    <button
                      onClick={() => {
                        // For now, just show a message. You can implement registration popup later
                        toast.success('Registration is handled through the login process. Please use one of the login methods above.');
                      }}
                      className="text-lime-600 hover:text-lime-700 font-medium"
                    >
                      Sign up here
                    </button>
                  </p>
                </div>
              </div>
            ) : (
              // OTP Login
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <button
                    onClick={handleBackToOptions}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h3 className="text-lg font-medium text-gray-900">Login with OTP</h3>
                </div>

                <form onSubmit={handleOtpLogin} className="space-y-4">
                  <div>
                    <label htmlFor="otp-email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="email"
                        id="otp-email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                        placeholder="Enter your email"
                        required
                        disabled={isOtpSent}
                      />
                    </div>
                  </div>

                  {isOtpSent && (
                    <div>
                      <label htmlFor="otp-code" className="block text-sm font-medium text-gray-700 mb-1">
                        Enter OTP
                      </label>
                      <input
                        type="text"
                        id="otp-code"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                        placeholder="Enter 6-digit OTP"
                        maxLength={6}
                        required
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        We&apos;ve sent a 6-digit code to {email}
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-lime-600 hover:bg-lime-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : isOtpSent ? (
                      'Verify OTP'
                    ) : (
                      'Send OTP'
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 