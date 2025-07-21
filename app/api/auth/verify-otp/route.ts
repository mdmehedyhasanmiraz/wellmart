import { NextRequest, NextResponse } from 'next/server';
import { smsService } from '@/lib/services/sms';
import { supabaseAdmin } from '@/lib/supabase/server';
import { AuthService, User } from '@/lib/services/auth';

export async function POST(request: NextRequest) {
  try {
    const { phone, otp } = await request.json();

    if (!phone || !otp) {
      return NextResponse.json(
        { error: 'Phone number and OTP are required' },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database access not configured' },
        { status: 500 }
      );
    }

    // Verify OTP
    const verificationResult = smsService.verifyOTP(phone, otp);

    if (!verificationResult.success) {
      return NextResponse.json(
        { error: verificationResult.message },
        { status: 400 }
      );
    }

    // OTP is valid, now handle user authentication
    // Check if user exists by phone number
    const { data: existingUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      // PGRST116 is "not found" error
      console.error('Database error:', userError);
      return NextResponse.json(
        { error: 'Database error occurred' },
        { status: 500 }
      );
    }

    let user: User;
    let isNewUser = false;

    if (existingUser) {
      // User exists
      user = {
        id: existingUser.id,
        name: existingUser.name,
        phone: existingUser.phone,
        email: existingUser.email,
        role: existingUser.role,
        division: existingUser.division,
        district: existingUser.district,
        upazila: existingUser.upazila,
        street: existingUser.street,
      };
    } else {
      // Create new user
      isNewUser = true;
      
      const userId = crypto.randomUUID(); // Generate unique ID
      
      // Create user record in our users table
      const { error: insertError } = await supabaseAdmin
        .from('users')
        .insert([{
          id: userId,
          name: `User_${phone.slice(-4)}`,
          phone: phone,
          email: `${phone}@wellmart.local`,
          role: 'customer',
        }]);

      if (insertError) {
        console.error('User table insert error:', insertError);
        return NextResponse.json(
          { error: 'Failed to create user account' },
          { status: 500 }
        );
      }

      user = {
        id: userId,
        name: `User_${phone.slice(-4)}`,
        phone: phone,
        email: `${phone}@wellmart.local`,
        role: 'customer',
      };
    }

    // Generate custom JWT token
    const token = AuthService.generateToken(user);
    console.log('🔍 Generated JWT token for user:', user.id);

    // Create response with session cookie
    const response = NextResponse.json({
      success: true,
      message: verificationResult.message,
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
        name: user.name,
        isNewUser,
      },
      shouldSyncSupabase: true, // Flag to trigger Supabase sync on client
    });

    // Set session cookie
    AuthService.setSessionCookie(response, token);
    console.log('🔍 Session cookie set for user:', user.id);

    return response;

  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 