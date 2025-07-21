"use server";
import supabase from "@/lib/supabase";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { BkashConfig, PaymentDetails } from "@/types/payment";

// In-memory token cache for faster access
let tokenCache: { token: string; expiresAt: number } | null = null;

export async function createPayment(
  bkashConfig: BkashConfig,
  paymentDetails: PaymentDetails
) {
  try {
    const { amount, callbackURL, orderID, reference } = paymentDetails;
    
    if (!amount) {
      return {
        statusCode: 2065,
        statusMessage: "amount required",
      };
    } else {
      if (amount < 1) {
        return {
          statusCode: 2065,
          statusMessage: "minimum amount 1",
        };
      }
    }

    if (!callbackURL) {
      return {
        statusCode: 2065,
        statusMessage: "callbackURL required",
      };
    }

    // Get token with optimized caching
    const token = await getOptimizedToken(bkashConfig);
    if (!token) {
      return {
        statusCode: 500,
        statusMessage: "Failed to get authentication token",
      };
    }

    // Create payment with the token
    const response = await axios.post(
      bkashConfig.create_payment_url || `${bkashConfig?.base_url}/tokenized/checkout/create`,
      {
        mode: "0011",
        payerReference: reference || "01000000000",
        callbackURL: callbackURL,
        merchantAssociationInfo: "MI05MID54RF09123456One",
        amount: amount.toString(),
        currency: "BDT",
        intent: "sale",
        merchantInvoiceNumber: orderID || "Inv0124"
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": token,
          "X-App-Key": bkashConfig?.app_key
        },
        timeout: 10000, // 10 second timeout
      }
    );

    return response?.data;
  } catch (e) {
    console.error("Create Bkash Payment Error:", e);
    return e;
  }
}

export async function executePayment(
  bkashConfig: BkashConfig,
  paymentID: string
) {
  try {
    console.log("Executing bKash payment for paymentID:", paymentID);
    
    // Get token with optimized caching
    const token = await getOptimizedToken(bkashConfig);
    if (!token) {
      console.error("Failed to get authentication token for execute payment");
      return {
        statusCode: 500,
        statusMessage: "Failed to get authentication token",
      };
    }

    console.log("Making execute payment request to bKash...");
    const response = await axios.post(
      bkashConfig.execute_payment_url || `${bkashConfig?.base_url}/tokenized/checkout/execute`,
      {
        paymentID,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": token,
          "X-App-Key": bkashConfig?.app_key
        },
        timeout: 10000, // 10 second timeout
      }
    );

    console.log("bKash execute payment response:", response?.data);
    return response?.data;
  } catch (error) {
    console.error("Error from bkash executePayment: ", error);
    if (axios.isAxiosError(error)) {
      console.error("Axios error details:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
    }
    return {
      statusCode: 500,
      statusMessage: "Execute payment failed",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

// Optimized token retrieval with in-memory cache
export const getOptimizedToken = async (bkashConfig: BkashConfig) => {
  try {
    const now = Date.now();
    
    // Check in-memory cache first (fastest)
    if (tokenCache && tokenCache.expiresAt > now) {
      console.log("Using cached token from memory");
      return tokenCache.token;
    }

    // Check database cache
    const findToken = await supabase.from("bkash").select("*").single();
    
    if (findToken?.data && findToken.data?.updated_at < new Date(now - 3300000)) {
      // Token is still valid (less than 55 minutes old, giving 5 min buffer)
      const token = findToken.data?.authToken;
      
      // Update in-memory cache
      tokenCache = {
        token,
        expiresAt: now + 3300000 // 55 minutes
      };
      
      console.log("Using cached token from database");
      return token;
    }

    // Get new token
    const newToken = await setToken(bkashConfig);
    
    if (newToken) {
      // Update in-memory cache
      tokenCache = {
        token: newToken,
        expiresAt: now + 3300000 // 55 minutes
      };
    }
    
    return newToken;
  } catch (e) {
    console.log("Error in getOptimizedToken:", e);
    return await setToken(bkashConfig);
  }
};

// Background token refresh function
export const refreshTokenInBackground = async (bkashConfig: BkashConfig) => {
  try {
    console.log("Background token refresh started...");
    const newToken = await setToken(bkashConfig);
    
    if (newToken) {
      const now = Date.now();
      tokenCache = {
        token: newToken,
        expiresAt: now + 3300000 // 55 minutes
      };
      console.log("Background token refresh completed");
    }
  } catch (error) {
    console.error("Background token refresh failed:", error);
  }
};

const setToken = async (bkashConfig: BkashConfig) => {
  try {
    console.log("Requesting new bKash token...");
    console.log("Using URL:", bkashConfig.grant_token_url);
    
    const response = await axios.post(
      bkashConfig.grant_token_url || `${bkashConfig?.base_url}/tokenized/checkout/token/grant`,
      {
        app_key: bkashConfig?.app_key,
        app_secret: bkashConfig?.app_secret
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "username": bkashConfig?.username,
          "password": bkashConfig?.password
        },
        timeout: 15000, // 15 second timeout for token requests
      }
    );

    console.log("Token response:", response?.data);

    if (response?.data?.id_token) {
      // Cache the token
      const findToken = await supabase.from("bkash").select("*").single();
      
      if (findToken?.data) {
        await supabase.from("bkash").update({
          authToken: response?.data?.id_token,
          updated_at: new Date().toISOString()
        }).eq('id', findToken.data.id);
      } else {
        await supabase.from("bkash").insert({
          authToken: response?.data?.id_token,
          updated_at: new Date().toISOString()
        });
      }
      
      return response?.data?.id_token;
    }
    
    return null;
  } catch (error) {
    console.error("Error setting token:", error);
    return null;
  }
}; 