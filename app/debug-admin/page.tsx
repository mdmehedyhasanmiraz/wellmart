import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

export default async function DebugAdminPage() {
  const supabase = createServerComponentClient({ cookies });

  // Get current user from auth
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  let userDetails = null;
  let userError = null;

  if (user) {
    // Try to get user details from database
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    userDetails = data;
    userError = error;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Access Debug</h1>
          {/* Auth Status */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Authentication Status</h2>
            <div className="bg-gray-100 p-4 rounded">
              <p><strong>User ID:</strong> {user?.id || 'Not authenticated'}</p>
              <p><strong>Email:</strong> {user?.email || 'Not authenticated'}</p>
              <p><strong>Auth Error:</strong> {authError?.message || 'None'}</p>
            </div>
          </div>
          {/* Database Status */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Database Status</h2>
            <div className="bg-gray-100 p-4 rounded">
              {userDetails ? (
                <div>
                  <p><strong>User Found:</strong> ✅ Yes</p>
                  <p><strong>Name:</strong> {userDetails.name}</p>
                  <p><strong>Email:</strong> {userDetails.email}</p>
                  <p><strong>Role:</strong> 
                    <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                      userDetails.role === 'admin' ? 'bg-red-100 text-red-800' :
                      userDetails.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {userDetails.role}
                    </span>
                  </p>
                  <p><strong>Has Admin Access:</strong> {['admin', 'manager'].includes(userDetails.role) ? '✅ Yes' : '❌ No'}</p>
                </div>
              ) : (
                <div>
                  <p><strong>User Found:</strong> ❌ No</p>
                  <p><strong>Error:</strong> {userError?.message || 'Unknown error'}</p>
                  <p><strong>Error Code:</strong> {userError?.code || 'None'}</p>
                  <p><strong>Error Details:</strong> {userError?.details || 'None'}</p>
                </div>
              )}
            </div>
          </div>
          {/* Actions */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Actions</h2>
            <div className="space-y-2">
              {!userDetails && (
                <form action="/debug-admin/create-user" method="POST" className="inline">
                  <input type="hidden" name="userId" value={user?.id || ''} />
                  <input type="hidden" name="userEmail" value={user?.email || ''} />
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create User with Admin Role
                  </button>
                </form>
              )}
              {userDetails && userDetails.role !== 'admin' && (
                <form action="/debug-admin/update-role" method="POST" className="inline">
                  <input type="hidden" name="userId" value={user?.id || ''} />
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Update Role to Admin
                  </button>
                </form>
              )}
              {userDetails && userDetails.role === 'admin' && (
                <a
                  href="/admin"
                  className="bg-lime-600 text-white px-4 py-2 rounded-lg hover:bg-lime-700 transition-colors inline-block"
                >
                  Go to Admin Panel
                </a>
              )}
            </div>
          </div>
          {/* Instructions */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-medium text-yellow-800 mb-2">What to do:</h3>
            <ol className="text-sm text-yellow-700 space-y-1">
              <li>1. If user is not found, click "Create User with Admin Role"</li>
              <li>2. If user exists but role is not admin, click "Update Role to Admin"</li>
              <li>3. If user has admin role, click "Go to Admin Panel"</li>
              <li>4. If you still get errors, check the RLS policies</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
} 