import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Access the global OTP storage
    const otpStorage = (global as any).otpStorage;
    
    if (!otpStorage) {
      return NextResponse.json({
        error: 'OTP storage not initialized',
        storage: null
      });
    }

    const storageData = Array.from(otpStorage.entries()).map((entry: any) => {
      const [phone, data] = entry;
      return {
        phone,
        otp: data.otp,
        expiresAt: data.expiresAt,
        isExpired: new Date() > data.expiresAt
      };
    });

    return NextResponse.json({
      success: true,
      storage: storageData,
      count: otpStorage.size
    });
  } catch (error) {
    console.error('Test OTP storage error:', error);
    return NextResponse.json(
      { error: 'Failed to check OTP storage' },
      { status: 500 }
    );
  }
} 