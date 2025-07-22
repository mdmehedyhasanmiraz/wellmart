"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'react-hot-toast';

export default function AdminSetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const type = searchParams.get('type');
    const accessToken = searchParams.get('access_token');
    setIsRecovery(type === 'recovery' && !!accessToken);
  }, [searchParams]);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast.error(error.message || 'Failed to reset password');
        setLoading(false);
        return;
      }
      toast.success('Password reset successful! Please log in.');
      router.push('/admin-login');
    } catch (err) {
      toast.error('Failed to reset password');
      console.error('Failed to reset password', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-lime-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white/90 shadow-xl rounded-2xl p-8 border border-gray-100">
        <div className="flex flex-col items-center">
          <h2 className="mt-2 text-center text-2xl font-extrabold text-gray-900">
            Set New Password
          </h2>
        </div>
        {isRecovery ? (
          <form onSubmit={handleSetPassword} className="mt-8 space-y-6">
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                id="new-password"
                name="new-password"
                type="password"
                autoComplete="new-password"
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500 focus:z-10 text-base shadow-sm"
                placeholder="Enter new password"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500 focus:z-10 text-base shadow-sm"
                placeholder="Confirm new password"
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-base font-semibold rounded-xl text-white bg-lime-600 hover:bg-lime-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lime-500 disabled:opacity-50 shadow-md"
              >
                {loading ? 'Resetting...' : 'Set New Password'}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-8 text-center text-gray-700 font-semibold">
            Invalid or expired reset link.<br />
            Please request a new password reset.
          </div>
        )}
      </div>
    </div>
  );
} 