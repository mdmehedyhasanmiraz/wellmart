import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/auth';

export async function GET(request: NextRequest) {
  try {
    // Test JWT token generation
    const testUser = {
      id: 'test-user-id',
      name: 'Test User',
      phone: '01842221872',
      email: 'test@example.com',
      role: 'customer' as const,
    };

    const token = AuthService.generateToken(testUser);
    console.log('🔍 Generated JWT token:', token);

    // Test JWT token verification
    const decoded = AuthService.verifyToken(token);
    console.log('🔍 Decoded JWT token:', decoded);

    // Test session cookie
    const response = NextResponse.json({
      success: true,
      token: token,
      decoded: decoded,
      message: 'JWT test successful'
    });

    AuthService.setSessionCookie(response, token);

    return response;

  } catch (error) {
    console.error('JWT test error:', error);
    return NextResponse.json({
      success: false,
      error: 'JWT test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 