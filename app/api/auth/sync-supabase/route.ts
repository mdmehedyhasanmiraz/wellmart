import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AuthService } from '@/lib/services/auth';
import { supabaseAdmin } from '@/lib/supabase/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Create Supabase admin client
const supabaseAdminLocal = supabaseAdmin || createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: NextRequest) {
  try {
    // 1. Try custom JWT session
    if (AuthService.isAuthenticated(request)) {
      const currentUser = AuthService.getCurrentUser(request);
      if (!currentUser) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 401 }
        );
      }
      const { phone } = currentUser;
      // ... existing code for syncing user ...
      // Check if user already exists in Supabase auth
      const { data: existingUsers, error: listError } = await supabaseAdminLocal.auth.admin.listUsers();
      if (listError) {
        return NextResponse.json(
          { error: 'Failed to check existing users' },
          { status: 500 }
        );
      }
      const existingUser = existingUsers.users.find(user => 
        user.phone === phone || 
        user.email === `${phone}@wellmart.local`
      );
      if (existingUser) {
        return NextResponse.json({ 
          success: true, 
          message: 'Supabase user exists, client will handle session',
          userExists: true,
          userId: existingUser.id
        });
      } else {
        // Create new user in Supabase auth
        const { data: newUser, error: createError } = await supabaseAdminLocal.auth.admin.createUser({
          email: `${phone}@wellmart.local`,
          phone: phone,
          email_confirm: true,
          phone_confirm: true,
          user_metadata: {
            name: `User_${phone.slice(-4)}`,
            role: 'customer'
          }
        });
        if (createError) {
          return NextResponse.json(
            { error: 'Failed to create Supabase user' },
            { status: 500 }
          );
        }
        return NextResponse.json({ 
          success: true, 
          message: 'Supabase user created successfully',
          userExists: false,
          userId: newUser.user.id
        });
      }
    }

    // 2. Bridge Supabase Auth session to custom JWT session
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user: supaUser } } = await supabase.auth.getUser();
    if (supaUser) {
      // Find or create user in your users table
      if (!supabaseAdminLocal) {
        return NextResponse.json({ error: 'Database not available' }, { status: 500 });
      }
      // Try to find user by supabase id or email
      let { data: dbUser, error: dbError } = await supabaseAdminLocal
        .from('users')
        .select('*')
        .eq('id', supaUser.id)
        .single();
      if (dbError || !dbUser) {
        // Try by email
        const { data: dbUserByEmail } = await supabaseAdminLocal
          .from('users')
          .select('*')
          .eq('email', supaUser.email)
          .single();
        dbUser = dbUserByEmail || dbUser;
      }
      if (!dbUser) {
        // Create user in your users table
        const { data: newDbUser } = await supabaseAdminLocal.from('users')
          .insert([{
            id: supaUser.id,
            name: supaUser.user_metadata?.name || supaUser.email?.split('@')[0] || 'User',
            phone: supaUser.phone || '',
            email: supaUser.email || '',
            role: supaUser.user_metadata?.role || 'customer',
          }])
          .select()
          .single();
        dbUser = newDbUser;
      }
      if (!dbUser) {
        return NextResponse.json({ error: 'Failed to find or create user' }, { status: 500 });
      }
      // Issue custom JWT session
      const token = AuthService.generateToken({
        id: dbUser.id,
        name: dbUser.name,
        phone: dbUser.phone,
        email: dbUser.email,
        role: dbUser.role,
        division: dbUser.division,
        district: dbUser.district,
        upazila: dbUser.upazila,
        street: dbUser.street,
      });
      const response = NextResponse.json({
        success: true,
        message: 'Session bridged',
        user: dbUser
      });
      AuthService.setSessionCookie(response, token);
      return response;
    }

    // Not authenticated
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Sync Supabase error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );  
  }
} 