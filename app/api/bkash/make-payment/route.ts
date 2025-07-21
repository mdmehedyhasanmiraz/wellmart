import { createPayment } from "@/lib/services/bkash";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { createPaymentRecord, updatePaymentRecord } from "@/lib/supabase/paymentUtils";
import { supabaseAdmin } from "@/lib/supabase/server";

const bkashConfig = {
  base_url: process.env.BKASH_BASE_URL!,
  username: process.env.BKASH_USERNAME!,
  password: process.env.BKASH_PASSWORD!,
  app_key: process.env.BKASH_APP_KEY!,
  app_secret: process.env.BKASH_APP_SECRET!,
  grant_token_url: process.env.BKASH_GRANT_TOKEN_URL!,
  create_payment_url: process.env.BKASH_CREATE_PAYMENT_URL!,
  execute_payment_url: process.env.BKASH_EXECUTE_PAYMENT_URL!,
};

export async function POST(req: NextRequest) {
  try {
    const { user_id, order_id, amount, email, name, phone, purpose } = await req.json();
    const webUrl = req.headers.get("origin") || "https://wellmart.com.bd";
    const paymentID = uuidv4().substring(0, 10);
    
    if (!amount || !email || !name || !user_id) {
      return NextResponse.json({
        statusCode: 2065,
        statusMessage: "amount, email, name, user_id required",
      });
    }

    if (!purpose) {
      return NextResponse.json({
        statusCode: 2065,
        statusMessage: "purpose required",
      });
    }
    
    if (amount < 1) {
      return NextResponse.json({
        statusCode: 2065,
        statusMessage: "minimum amount 1",
      });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({
        statusCode: 500,
        statusMessage: "Supabase admin client not available"
      });
    }

    // Validate user exists
    const userValidation = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', user_id)
      .single();

    if (userValidation.error || !userValidation.data) {
      console.error('User not found:', user_id, userValidation.error);
      return NextResponse.json({
        statusCode: 404,
        statusMessage: "User not found"
      });
    }

    // If order_id is provided, validate order exists
    if (order_id) {
      const orderValidation = await supabaseAdmin
        .from('user_orders')
        .select('id, total')
        .eq('id', order_id)
        .single();

      if (orderValidation.error || !orderValidation.data) {
        console.error('Order not found:', order_id, orderValidation.error);
        return NextResponse.json({
          statusCode: 404,
          statusMessage: "Order not found"
        });
      }

      // Validate amount matches order total
      if (orderValidation.data.total !== amount) {
        console.error('Amount mismatch:', { orderTotal: orderValidation.data.total, providedAmount: amount });
        return NextResponse.json({
          statusCode: 400,
          statusMessage: "Amount does not match order total"
        });
      }
    }

    console.log(`Validated user and order:`, { 
      user_id, 
      order_id, 
      amount,
      purpose
    });

    // Create payment record and prepare payment details in parallel
    const [paymentRecord, paymentDetails] = await Promise.all([
      createPaymentRecord({
        user_id: user_id,
        order_id: order_id,
        amount: amount,
        payment_channel: 'bkash',
        transaction_id: paymentID,
        purpose: purpose
      }),
      Promise.resolve({
        amount: amount,
        name: name,
        email: email,
        phone: phone || '',
        callbackURL: `${webUrl}/api/bkash/callback`,
        orderID: paymentID,
        reference: phone || 'user',
      })
    ]);

    if (!paymentRecord) {
      return NextResponse.json({
        statusCode: 500,
        statusMessage: "Failed to create payment record"
      });
    }

    console.log('Created payment record:', paymentRecord);
    console.log("Creating bKash payment with details:", paymentDetails);

    const createPaymentResponse = await createPayment(
      bkashConfig,
      paymentDetails
    );
    
    console.log("bKash payment response:", createPaymentResponse);

    if (createPaymentResponse.statusCode !== "0000") {
      // Update payment record to failed status
      await updatePaymentRecord(paymentRecord.id, { status: 'failed' });

      return NextResponse.json({
        statusCode: 500,
        statusMessage: createPaymentResponse.statusMessage || "Payment Failed",
        error: createPaymentResponse
      });
    }

    // Update payment record with bKash details
    await updatePaymentRecord(paymentRecord.id, {
      bkash_payment_id: createPaymentResponse.paymentID,
      bkash_url: createPaymentResponse.bkashURL
    });

    return NextResponse.json({
      statusCode: 200,
      statusMessage: "Payment created successfully",
      data: {
        paymentID: createPaymentResponse.paymentID,
        bkashURL: createPaymentResponse.bkashURL,
        orderID: paymentID
      }
    });

  } catch (error) {
    console.error("Error in make-payment:", error);
    return NextResponse.json({
      statusCode: 500,
      statusMessage: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
} 