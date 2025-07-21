'use client';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { User, Edit, Save, X } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { supabaseAuthService } from '@/lib/services/supabaseAuth';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  division?: string;
  district?: string;
  upazila?: string;
  street?: string;
}

export default function UserProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [emailChanged, setEmailChanged] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    division: '',
    district: '',
    upazila: '',
    street: '',
  });
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [awaitingOtp, setAwaitingOtp] = useState(false);
  const [isSupabaseSessionReady, setIsSupabaseSessionReady] = useState(false);
  // Remove all Google linking state and logic
  // const [googleLinked, setGoogleLinked] = useState(false);
  // const [googleEmail, setGoogleEmail] = useState('');
  // const [googleOtpSent, setGoogleOtpSent] = useState(false);
  // const [googleOtp, setGoogleOtp] = useState('');
  // const [googleOtpVerifying, setGoogleOtpVerifying] = useState(false);
  // const [canLinkGoogle, setCanLinkGoogle] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchUser();
    // Remove all Google linking logic
    // (async () => {
    //   const { data: supaUser } = await supabase.auth.getUser();
    //   const userObj = supaUser?.user;
    //   if (userObj && userObj.app_metadata?.provider === 'google') {
    //     setGoogleLinked(true);
    //     setGoogleEmail(userObj.email || '');
    //   } else if (userObj && userObj.identities) {
    //     const googleIdentity = userObj.identities.find((id: any) => id.provider === 'google');
    //     if (googleIdentity) {
    //       setGoogleLinked(true);
    //       setGoogleEmail(googleIdentity.identity_data?.email || userObj.email || '');
    //     }
    //   }
    // })();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const result = await response.json();

      if (result.success) {
        const userData = result.user;
        setUser(userData);
        setFormData({
          name: userData.name || '',
          phone: userData.phone || '',
          email: userData.email || '',
          division: userData.division || '',
          district: userData.district || '',
          upazila: userData.upazila || '',
          street: userData.street || '',
        });
      } else {
        toast.error('Error loading profile');
      }
    } catch (error) {
      toast.error('Error loading profile');
      console.error('Profile fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Check for Supabase session before email change
      const { data: supaUser } = await supabase.auth.getUser();
      if (formData.email !== user.email) {
        if (!supaUser && !isSupabaseSessionReady) {
          // 1. Sync user to Supabase Auth
          const syncRes = await fetch('/api/auth/sync-supabase', { method: 'POST' });
          const syncData = await syncRes.json();
          if (!syncData.success && !syncData.userExists) {
            toast.error('Could not sync user to Supabase Auth.');
            setSaving(false);
            return;
          }
          // 2. Send OTP to phone for Supabase Auth sign-in
          const { error: otpError } = await supabase.auth.signInWithOtp({ phone: user.phone });
          if (otpError) {
            toast.error('Failed to send OTP for authentication.');
            setSaving(false);
            return;
          }
          setOtpSent(true);
          setAwaitingOtp(true);
          setIsSupabaseSessionReady(false);
          toast.success('OTP sent to your phone. Please enter it to continue.');
          setSaving(false);
          return;
        }
        // If Supabase session exists, proceed as before
        const { error } = await supabase.auth.updateUser({ email: formData.email });
        if (error) {
          if (error.message && error.message.toLowerCase().includes('already registered')) {
            toast.error('This email is already in use. Please use a different email.');
          } else {
            toast.error(error.message || 'Failed to update email');
          }
          setSaving(false);
          return;
        }
        setEmailChanged(true);
        setIsSupabaseSessionReady(false);
        toast.success('A confirmation email has been sent. Please check your inbox and confirm your new email address.');
      }
      // Update other fields
      if (!emailChanged) { // Only update other fields if not waiting for email confirmation
        const response = await fetch('/api/auth/update-profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            phone: formData.phone,
            division: formData.division,
            district: formData.district,
            upazila: formData.upazila,
            street: formData.street,
          }),
        });
        const result = await response.json();
        if (result.success) {
          setUser({ ...user, ...formData });
          setEditing(false);
          toast.success('Profile updated successfully!');
        } else {
          toast.error(result.error || 'Error updating profile');
        }
      }
    } catch (error) {
      toast.error('Error updating profile');
      console.error('Profile update error:', error);
    } finally {
      setSaving(false);
    }
  };

  // Handle OTP verification for phone/OTP users
  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({ phone: user?.phone || '', token: otp, type: 'sms' });
      if (error) {
        toast.error('Invalid OTP. Please try again.');
        setSaving(false);
        return;
      }
      setAwaitingOtp(false);
      setOtpSent(false);
      setOtp('');
      // Re-check for Supabase session
      const { data: supaUser } = await supabase.auth.getUser();
      if (supaUser) {
        // Bridge session: set custom JWT session cookie
        const bridgeRes = await fetch('/api/auth/sync-supabase', { method: 'POST', credentials: 'include' });
        const bridgeData = await bridgeRes.json();
        if (bridgeData.success) {
          setIsSupabaseSessionReady(true);
          toast.success('Phone verified! You can now change your email.');
        } else {
          setIsSupabaseSessionReady(false);
          toast.error('Session not established. Please try again.');
        }
      } else {
        setIsSupabaseSessionReady(false);
        toast.error('Session not established. Please try again.');
      }
    } catch (err) {
      toast.error('Failed to verify OTP.');
    } finally {
      setSaving(false);
    }
  };

  // Helper to format phone to E.164
  function toE164(phone: string): string {
    if (!phone) return '';
    if (phone.startsWith('+')) return phone;
    if (phone.startsWith('880')) return '+' + phone;
    if (phone.startsWith('0')) return '+88' + phone;
    return phone;
  }

  // Remove Google linking handler and OTP logic
  // const handleLinkGoogle = async () => {
  //   try {
  //     // Check for Supabase session
  //     const { data: supaUser } = await supabase.auth.getUser();
  //     const userObj = supaUser?.user;
  //     if (!userObj) {
  //       toast.error('Please verify your phone (OTP) for Google linking.');
  //       return;
  //     }
  //     await supabase.auth.signInWithOAuth({
  //       provider: 'google',
  //       options: { queryParams: { flow: 'link' } }
  //     });
  //   } catch (error) {
  //     toast.error('Failed to link Google account.');
  //   }
  // };

  // Google OTP send handler
  // const handleSendGoogleOtp = async () => {
  //   setGoogleOtpVerifying(false);
  //   setGoogleOtpSent(false);
  //   setCanLinkGoogle(false);
  //   try {
  //     const phoneE164 = toE164(user?.phone || '');
  //     const { error } = await supabase.auth.signInWithOtp({ phone: phoneE164 });
  //     if (error) {
  //       console.error('OTP send error:', error);
  //       toast.error(error.message || 'Failed to send OTP for Google linking.');
  //       return;
  //     }
  //     setGoogleOtpSent(true);
  //     toast.success('OTP sent to your phone. Please enter it below.');
  //   } catch (error) {
  //     console.error('OTP send exception:', error);
  //     toast.error('Failed to send OTP for Google linking.');
  //   }
  // };

  // Google OTP verify handler
  // const handleVerifyGoogleOtp = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setGoogleOtpVerifying(true);
  //   try {
  //     const phoneE164 = toE164(user?.phone || '');
  //     const { data, error } = await supabase.auth.verifyOtp({ phone: phoneE164, token: googleOtp, type: 'sms' });
  //     if (error) {
  //       toast.error('Invalid OTP. Please try again.');
  //       setGoogleOtpVerifying(false);
  //       return;
  //     }
  //     setCanLinkGoogle(true);
  //     setGoogleOtpSent(false);
  //     setGoogleOtp('');
  //     toast.success('Phone verified! You can now link your Google account.');
  //   } catch (err) {
  //     console.error('OTP verify exception:', err);
  //     toast.error('Failed to verify OTP.');
  //   } finally {
  //     setGoogleOtpVerifying(false);
  //   }
  // };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        email: user.email || '',
        division: user.division || '',
        district: user.district || '',
        upazila: user.upazila || '',
        street: user.street || '',
      });
      setEmailChanged(false); // Reset email changed state on cancel
    }
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">My Profile</h1>
            <p className="text-gray-600">
              Manage your personal information and account details
            </p>
          </div>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center px-4 py-2 bg-lime-600 text-white rounded-lg hover:bg-lime-700 transition-colors"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </button>
              <button
                onClick={handleUpdateProfile}
                disabled={saving || emailChanged}
                className="inline-flex items-center px-4 py-2 bg-lime-600 text-white rounded-lg hover:bg-lime-700 disabled:opacity-50 transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Information */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center mb-6">
          <div className="w-16 h-16 bg-lime-100 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-lime-600" />
          </div>
          <div className="ml-4">
            <h2 className="text-lg font-semibold text-gray-900">{user?.name}</h2>
            <p className="text-gray-600">{user?.email}</p>
          </div>
        </div>

        {editing ? (
          <form onSubmit={(e) => { e.preventDefault(); handleUpdateProfile(); }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                  required
                  disabled={emailChanged}
                />
              </div>
              {/* Only show email field if user is NOT OTP-only */}
              {user?.email && !user?.email.endsWith('@wellmart.local') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                    required
                    disabled={emailChanged}
                  />
                  {emailChanged && (
                    <div className="mt-2 p-3 bg-lime-50 border border-lime-200 rounded text-lime-700 text-sm font-semibold">
                      A confirmation email has been sent to your new address. Please check your inbox and confirm to complete the change.<br />
                      <span className="text-xs text-gray-500">You cannot edit your profile until you confirm your new email address.</span>
                    </div>
                  )}
                </div>
              )}
              {/* For OTP users, do not show Google link or email field */}
              {/* Only show phone field for OTP users */}
              {user?.email && user?.email.endsWith('@wellmart.local') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                    required
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Division
                </label>
                <input
                  type="text"
                  value={formData.division}
                  onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  District
                </label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upazila
                </label>
                <input
                  type="text"
                  value={formData.upazila}
                  onChange={(e) => setFormData({ ...formData, upazila: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address
                </label>
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                />
              </div>
            </div>
            {awaitingOtp && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                <form onSubmit={handleOtpVerify} className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">Enter OTP sent to your phone</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                    maxLength={6}
                    required
                  />
                  <button
                    type="submit"
                    className="mt-2 px-4 py-2 bg-lime-600 text-white rounded-lg hover:bg-lime-700 transition-colors"
                    disabled={saving}
                  >
                    Verify OTP
                  </button>
                </form>
                <p className="text-xs text-gray-600 mt-2">After verifying, you can change your email address.</p>
              </div>
            )}
            {isSupabaseSessionReady && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm font-semibold">
                Phone verified! You can now change your email address and save changes.
              </div>
            )}
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <p className="text-gray-900">{user?.name || 'Not provided'}</p>
            </div>
            {/* Only show email if not OTP-only */}
            {user?.email && !user?.email.endsWith('@wellmart.local') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <p className="text-gray-900">{user?.email || 'Not provided'}</p>
              </div>
            )}
            {/* Only show phone if OTP-only */}
            {user?.email && user?.email.endsWith('@wellmart.local') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <p className="text-gray-900">{user?.phone || 'Not provided'}</p>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Division</label>
              <p className="text-gray-900">{user?.division || 'Not provided'}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
              <p className="text-gray-900">{user?.district || 'Not provided'}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Upazila</label>
              <p className="text-gray-900">{user?.upazila || 'Not provided'}</p>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
              <p className="text-gray-900">{user?.street || 'Not provided'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Account Actions */}
      {/* <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Actions</h2>
        <div className="space-y-3">
          <a
            href="/change-password"
            className="block w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="font-medium text-gray-900">Change Password</div>
            <div className="text-sm text-gray-600">Update your account password</div>
          </a>
        </div>
      </div> */}
    </div>
  );
} 