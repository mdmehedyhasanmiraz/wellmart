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