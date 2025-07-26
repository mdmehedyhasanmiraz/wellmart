import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const supabase = createClientComponentClient();

export async function redirectBasedOnRole() {
  const { data: userInfo } = await supabase
    .from('users')
    .select('role')
    .eq('id', (await supabase.auth.getUser()).data.user?.id)
    .single();

  if (userInfo?.role === 'admin' || userInfo?.role === 'manager') {
    return '/admin';
  } else {
    return '/dashboard';
  }
}

// Save the current page URL for post-login redirect
export function saveRedirectUrl(url?: string) {
  const currentUrl = url || (typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/');
  if (typeof window !== 'undefined') {
    localStorage.setItem('redirectAfterLogin', currentUrl);
  }
}

// Get the saved redirect URL and clear it
export function getAndClearRedirectUrl(): string {
  if (typeof window !== 'undefined') {
    const redirectUrl = localStorage.getItem('redirectAfterLogin');
    localStorage.removeItem('redirectAfterLogin');
    return redirectUrl || '/dashboard';
  }
  return '/dashboard';
}

// Check if user needs to be redirected to login
export function shouldRedirectToLogin(requiredRole?: string): boolean {
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem('user');
    if (!user) return true;
    
    if (requiredRole) {
      try {
        const userData = JSON.parse(user);
        return userData.role !== requiredRole;
      } catch {
        return true;
      }
    }
  }
  return false;
} 