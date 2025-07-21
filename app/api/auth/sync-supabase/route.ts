import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AuthService } from '@/lib/services/auth';

// Create Supabase admin client
const supabaseAdmin = createClient(
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
    // Check if user is authenticated with our custom JWT
    if (!AuthService.isAuthenticated(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const currentUser = AuthService.getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    const { phone } = currentUser;

    console.log('🔄 Syncing Supabase session for phone:', phone);

    // Check if user already exists in Supabase auth
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    console.log('🔍 Found users in Supabase:', existingUsers?.users?.length || 0);
    
    if (listError) {
      console.error('Error listing users:', listError);
      return NextResponse.json(
        { error: 'Failed to check existing users' },
        { status: 500 }
      );
    }

    // Find existing user by phone
    const existingUser = existingUsers.users.find(user => 
      user.phone === phone || 
      user.email === `${phone}@wellmart.local`
    );
    
    console.log('🔍 Looking for user with phone:', phone);
    console.log('🔍 Existing user found:', !!existingUser);

          if (existingUser) {
        console.log('✅ User already exists in Supabase auth');
        
        // For existing users, we'll return success and let client handle session
        return NextResponse.json({ 
          success: true, 
          message: 'Supabase user exists, client will handle session',
          userExists: true,
          userId: existingUser.id
        });
      } else {
        // Create new user in Supabase auth
        console.log('🔄 Creating new user in Supabase auth');
        
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
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
          console.error('User creation error:', createError);
          return NextResponse.json(
            { error: 'Failed to create Supabase user' },
            { status: 500 }
          );
        }

        console.log('✅ New Supabase user created');
        return NextResponse.json({ 
          success: true, 
          message: 'Supabase user created successfully',
          userExists: false,
          userId: newUser.user.id
        });
      }

  } catch (error) {
    console.error('Supabase sync error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 