import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // For Supabase Auth, sign out is handled on the client side.
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
      supabaseSignOut: true // Tell client to also sign out from Supabase
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
} 