import { executePayment } from "@/lib/services/bkash";
import { NextRequest, NextResponse } from "next/server";
import { getPaymentByTransactionId, updatePaymentRecord } from "@/lib/supabase/paymentUtils";
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
    const { paymentID, status, transactionStatus, merchantInvoiceNumber } = await req.json();
    
    console.log("bKash callback received:", {
      paymentID,
      status,
      transactionStatus,
      merchantInvoiceNumber
    });

    if (!paymentID) {
      return NextResponse.json({
        statusCode: 400,
        statusMessage: "paymentID required"
      });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({
        statusCode: 500,
        statusMessage: "Supabase admin client not available"
      });
    }

    // Find payment record by transaction ID (merchantInvoiceNumber)
    const paymentRecord = await getPaymentByTransactionId(merchantInvoiceNumber);
    
    if (!paymentRecord) {
      console.error('Payment record not found for transaction ID:', merchantInvoiceNumber);
      return NextResponse.json({
        statusCode: 404,
        statusMessage: "Payment record not found"
      });
    }

    console.log('Found payment record:', paymentRecord);

    // Execute the payment
    const executeResponse = await executePayment(bkashConfig, paymentID);
    
    console.log("bKash execute response:", executeResponse);

    if (executeResponse.statusCode === "0000") {
      // Payment successful
      await updatePaymentRecord(paymentRecord.id, {
        status: 'completed'
      });

      // Update the order status (payment record is now the order itself)
      await supabaseAdmin
        .from('user_orders')
        .update({ 
          status: 'paid',
          payment_status: 'paid',
          payment_date: new Date().toISOString()
        })
        .eq('id', paymentRecord.order_id);

      return NextResponse.json({
        statusCode: 200,
        statusMessage: "Payment completed successfully"
      });
    } else {
      // Payment failed
      await updatePaymentRecord(paymentRecord.id, {
        status: 'failed'
      });

      return NextResponse.json({
        statusCode: 400,
        statusMessage: executeResponse.statusMessage || "Payment failed",
        error: executeResponse
      });
    }

  } catch (error) {
    console.error("Error in bKash callback:", error);
    return NextResponse.json({
      statusCode: 500,
      statusMessage: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
} 