import { NextRequest, NextResponse } from 'next/server';
import { smsService } from '@/lib/services/sms';

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Validate phone number format
    const phoneRegex = /^(\+?880|0)?1[3-9]\d{8}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Please use Bangladeshi mobile number.' },
        { status: 400 }
      );
    }

    const result = await smsService.sendOTP(phone);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        otp: result.otp, // Only included in development
      });
    } else {
      // Return 400 for client errors, 500 for server errors
      const statusCode = result.message.includes('not configured') ? 500 : 400;
      return NextResponse.json(
        { error: result.message },
        { status: statusCode }
      );
    }
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 