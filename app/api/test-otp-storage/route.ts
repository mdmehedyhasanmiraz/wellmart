import { NextResponse } from 'next/server';

type OtpStorageType = Map<string, { otp: string; expiresAt: Date }>;

function getOtpStorage(): OtpStorageType | null {
  if (!(globalThis as any).otpStorage) {
    return null;
  }
  return (globalThis as any).otpStorage as OtpStorageType;
}

export async function GET() {
  try {
    // Access the global OTP storage safely
    const otpStorage = getOtpStorage();
    
    if (!otpStorage) {
      return NextResponse.json({
        error: 'OTP storage not initialized',
        storage: null
      });
    }

    const storageData = Array.from(otpStorage.entries()).map((entry: [string, { otp: string; expiresAt: Date }]) => {
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