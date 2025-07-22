"use client";

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'react-hot-toast';

export default function AdminResetPage() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin-set-password`
      });
      if (error) {
        toast.error(error.message || 'Failed to send reset link');
        setLoading(false);
        return;
      }
      setSent(true);
      toast.success('Password reset link sent! Check your email.');
    } catch (err) {
      toast.error('Failed to send reset link');
      console.error('Failed to send reset link', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-lime-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white/90 shadow-xl rounded-2xl p-8 border border-gray-100">
        <div className="flex flex-col items-center">
          <h2 className="mt-2 text-center text-2xl font-extrabold text-gray-900">
            Admin Password Reset
          </h2>
        </div>
        {!sent ? (
          <form onSubmit={handleSendReset} className="mt-8 space-y-6">
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
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-base font-semibold rounded-xl text-white bg-lime-600 hover:bg-lime-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lime-500 disabled:opacity-50 shadow-md"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-8 text-center text-green-700 font-semibold">
            Password reset link sent!<br />
            Please check your email and follow the instructions to reset your password.
          </div>
        )}
      </div>
    </div>
  );
} 