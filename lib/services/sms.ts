interface SMSResponse {
  error: number;
  msg: string;
  data?: {
    request_id?: number;
    balance?: string;
  };
}

interface OTPData {
  phone: string;
  otp: string;
  expiresAt: Date;
}

// In-memory storage for OTPs (in production, use Redis or database)
// Using a global variable to persist across server restarts
declare global {
  var otpStorage: Map<string, OTPData> | undefined;
}

if (!global.otpStorage) {
  global.otpStorage = new Map<string, OTPData>();
}

const otpStorage = global.otpStorage;

export class SMSService {
  private apiKey: string = 'dnNvEE1TlXgNOisnvzsAF9609gMwPlq8CEL3ZbBO';
  private baseUrl = 'https://api.sms.net.bd';

  constructor() {
    // API key is hardcoded for direct use
  }

  private checkApiKey(): boolean {
    if (!this.apiKey) {
      console.error('SMS API key is not configured');
      return false;
    }
    return true;
  }

  // Generate a random 6-digit OTP
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Send SMS with OTP
  async sendOTP(phone: string): Promise<{ success: boolean; message: string; otp?: string }> {
    try {
      // Check if API key is configured
      if (!this.checkApiKey()) {
        return {
          success: false,
          message: 'SMS service is not configured. Please contact administrator.',
        };
      }

      // Format phone number to ensure it starts with 880
      const formattedPhone = this.formatPhoneNumber(phone);
      
      // Generate OTP
      const otp = this.generateOTP();
      
      // Create message
      const message = `Your Wellmart verification code is: ${otp}. Valid for 5 minutes.`;
      
      // Send SMS
      const response = await fetch(`${this.baseUrl}/sendsms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          api_key: this.apiKey,
          msg: message,
          to: formattedPhone,
        }),
      });

      const result: SMSResponse = await response.json();

      if (result.error === 0) {
        // Store OTP with expiration (5 minutes)
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        otpStorage.set(formattedPhone, {
          phone: formattedPhone,
          otp,
          expiresAt,
        });

        // Clean up expired OTPs
        this.cleanupExpiredOTPs();

        return {
          success: true,
          message: 'OTP sent successfully',
          otp: undefined, // Never return OTP in production
        };
      } else {
        console.error('SMS API Error:', result);
        return {
          success: false,
          message: this.getErrorMessage(result.error),
        };
      }
    } catch (error) {
      console.error('SMS Service Error:', error);
      return {
        success: false,
        message: 'Failed to send OTP. Please try again.',
      };
    }
  }

  // Verify OTP
  verifyOTP(phone: string, otp: string): { success: boolean; message: string } {
    const formattedPhone = this.formatPhoneNumber(phone);
    
    // Try to find OTP with different phone number formats
    let storedData = otpStorage.get(formattedPhone);
    
    if (!storedData) {
      // Try with original phone number
      storedData = otpStorage.get(phone);
    }
    
    if (!storedData) {
      // Try with phone number without country code
      const withoutCountryCode = phone.replace(/^880/, '0');
      storedData = otpStorage.get(withoutCountryCode);
    }
    
    if (!storedData) {
      // Try with phone number with +880
      const withPlus = '+880' + phone.replace(/^880/, '').replace(/^0/, '');
      storedData = otpStorage.get(withPlus);
    }

    if (!storedData) {
      return {
        success: false,
        message: 'OTP not found. Please request a new OTP.',
      };
    }

    if (new Date() > storedData.expiresAt) {
      otpStorage.delete(formattedPhone);
      return {
        success: false,
        message: 'OTP has expired. Please request a new OTP.',
      };
    }

    if (storedData.otp !== otp) {
      return {
        success: false,
        message: 'Invalid OTP. Please try again.',
      };
    }

    // Remove OTP after successful verification
    otpStorage.delete(formattedPhone);

    return {
      success: true,
      message: 'OTP verified successfully',
    };
  }

  // Check SMS balance
  async getBalance(): Promise<{ success: boolean; balance?: string; message: string }> {
    try {
      // Check if API key is configured
      if (!this.checkApiKey()) {
        return {
          success: false,
          message: 'SMS service is not configured. Please contact administrator.',
        };
      }

      const response = await fetch(`${this.baseUrl}/user/balance/?api_key=${this.apiKey}`);
      const result: SMSResponse = await response.json();

      if (result.error === 0) {
        return {
          success: true,
          balance: result.data?.balance,
          message: 'Balance retrieved successfully',
        };
      } else {
        return {
          success: false,
          message: this.getErrorMessage(result.error),
        };
      }
    } catch (error) {
      console.error('Balance check error:', error);
      return {
        success: false,
        message: 'Failed to check balance',
      };
    }
  }

  // Format phone number to ensure it starts with 880
  private formatPhoneNumber(phone: string): string {
    let formatted = phone.replace(/\D/g, ''); // Remove non-digits
    
    // If it starts with 0, replace with 880
    if (formatted.startsWith('0')) {
      formatted = '880' + formatted.substring(1);
    }
    
    // If it doesn't start with 880, add it
    if (!formatted.startsWith('880')) {
      formatted = '880' + formatted;
    }
    
    return formatted;
  }

  // Clean up expired OTPs
  private cleanupExpiredOTPs(): void {
    const now = new Date();
    for (const [phone, data] of otpStorage.entries()) {
      if (now > data.expiresAt) {
        otpStorage.delete(phone);
      }
    }
  }

  // Get error message based on error code
  private getErrorMessage(errorCode: number): string {
    const errorMessages: Record<number, string> = {
      400: 'Invalid request parameters',
      403: 'Access denied',
      404: 'Resource not found',
      405: 'Authorization required',
      409: 'Server error',
      410: 'Account expired',
      411: 'Reseller account expired or suspended',
      412: 'Invalid schedule',
      413: 'Invalid sender ID',
      414: 'Message is empty',
      415: 'Message is too long',
      416: 'No valid number found',
      417: 'Insufficient balance',
      420: 'Content blocked',
      421: 'Can only send SMS to registered phone number until first balance recharge',
    };

    return errorMessages[errorCode] || 'Unknown error occurred';
  }
}

// Export singleton instance
export const smsService = new SMSService(); 