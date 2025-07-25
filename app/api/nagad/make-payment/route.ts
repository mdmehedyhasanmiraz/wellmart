import { NextRequest, NextResponse } from 'next/server';

// --- DEMO Nagad config ---
// TODO: Replace these with your real Nagad credentials and endpoints
const nagadConfig = {
  base_url: process.env.NAGAD_BASE_URL || 'https://sandbox.mynagad.com/remote-payment-gateway-uat/api/dfs',
  merchant_id: process.env.NAGAD_MERCHANT_ID || 'YOUR_MERCHANT_ID',
  merchant_number: process.env.NAGAD_MERCHANT_NUMBER || 'YOUR_MERCHANT_NUMBER',
  public_key: process.env.NAGAD_PUBLIC_KEY || 'YOUR_PUBLIC_KEY',
  private_key: process.env.NAGAD_PRIVATE_KEY || 'YOUR_PRIVATE_KEY',
  callback_url: process.env.NAGAD_CALLBACK_URL || 'https://yourdomain.com/api/nagad/callback',
};

// --- DEMO: Helper to simulate Nagad API call ---
async function demoNagadAuth() {
  // TODO: Replace with real Nagad auth API call
  // Simulate getting an access token
  return {
    access_token: 'demo_access_token',
    token_type: 'Bearer',
    expires_in: 3600,
  };
}

// Add a type for the payment params
interface DemoNagadPaymentParams {
  amount: number;
  email: string;
  name: string;
}

async function demoNagadCreatePayment({ amount, email, name }: DemoNagadPaymentParams) {
  // TODO: Replace with real Nagad payment initiation API call
  // Simulate getting a payment URL
  return {
    payment_url: 'https://sandbox.mynagad.com/payment/demo-payment-url',
    payment_ref: 'DEMO123456',
  };
}

export async function POST(req: NextRequest) {
  try {
    const { user_id, amount, email, name, phone, purpose } = await req.json();
    console.log(user_id, amount, email, name, phone, purpose);

    // Validate input
    if (!amount || !email || !name) {
      return NextResponse.json({
        statusCode: 400,
        statusMessage: 'amount, email, name required',
      });
    }

    // --- DEMO: Step 1: Authenticate with Nagad ---
    // TODO: Replace with real Nagad authentication
    const authResult = await demoNagadAuth();
    if (!authResult.access_token) {
      return NextResponse.json({
        statusCode: 500,
        statusMessage: 'Failed to authenticate with Nagad',
      });
    }

    // --- DEMO: Step 2: Initiate payment with Nagad ---
    // TODO: Replace with real Nagad payment initiation
    const paymentResult = await demoNagadCreatePayment({ amount, email, name });
    if (!paymentResult.payment_url) {
      return NextResponse.json({
        statusCode: 500,
        statusMessage: 'Failed to create Nagad payment',
      });
    }

    // --- DEMO: Step 3: Return payment URL to frontend ---
    return NextResponse.json({
      statusCode: 200,
      statusMessage: 'Nagad payment initiated (demo)',
      data: {
        nagadURL: paymentResult.payment_url,
        paymentRef: paymentResult.payment_ref,
        // Add any other info you want to return
      },
    });
  } catch (error) {
    console.error('Error in Nagad make-payment:', error);
    return NextResponse.json({
      statusCode: 500,
      statusMessage: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
} 