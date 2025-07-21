export interface PaymentDetails {
  amount: number;
  callbackURL: string;
  orderID: string;
  reference: string;
  name: string;
  email: string;
  phone: string;
}

export interface BkashConfig {
  base_url: string | undefined;
  username: string | undefined;
  password: string | undefined;
  app_key: string | undefined;
  app_secret: string | undefined;
  grant_token_url: string | undefined;
  create_payment_url: string | undefined;
  execute_payment_url: string | undefined;
}

export interface PaymentRecord {
  id: string;
  user_id: string;
  order_id?: string;
  amount: number;
  payment_channel: 'bkash' | 'nagad' | 'bank';
  transaction_id: string;
  bkash_payment_id?: string;
  bkash_url?: string;
  status: 'pending' | 'completed' | 'failed';
  purpose: 'order' | 'other';
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentRequest {
  user_id: string;
  order_id?: string;
  amount: number;
  email: string;
  name: string;
  phone: string;
  purpose: 'order' | 'other';
}

export interface PaymentResponse {
  statusCode: number;
  statusMessage: string;
  data?: {
    paymentID: string;
    bkashURL: string;
    orderID: string;
  };
  error?: any;
} 