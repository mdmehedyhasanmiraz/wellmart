'use client';

import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Lock } from 'lucide-react';

interface BkashPaymentButtonProps {
  amount: number;
  user_id: string;
  order_id?: string;
  email: string;
  name: string;
  phone: string;
  purpose: 'order' | 'other';
  disabled?: boolean;
}

export default function BkashPaymentButton({
  amount,
  user_id,
  order_id,
  email,
  name,
  phone,
  purpose,
  disabled = false
}: BkashPaymentButtonProps) {
  const [paying, setPaying] = useState(false);

  const startPayment = async () => {
    if (disabled) {
      toast.error('Please fill in all required fields first');
      return;
    }

    setPaying(true);

    try {
      console.log('Starting bKash payment with:', {
        user_id,
        order_id,
        amount,
        email,
        name,
        phone,
        purpose
      });

      const { data } = await axios.post('/api/bkash/make-payment', {
        user_id,
        order_id,
        amount,
        email,
        name,
        phone,
        purpose
      });

      console.log('bKash payment response:', data);

      // Check for successful response and redirect URL
      if (data?.statusCode === 200 && data?.data?.bkashURL) {
        console.log('Redirecting to bKash URL:', data.data.bkashURL);
        // Redirect to bKash payment page
        window.location.href = data.data.bkashURL;
      } else {
        console.error('bKash payment failed:', data);
        toast.error(data?.statusMessage || data?.error || 'Payment could not be initiated');
      }
    } catch (error) {
      console.error('bKash payment exception:', error);
      toast.error('Payment could not be initiated');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={startPayment}
        disabled={paying || disabled}
        className="w-full bg-pink-600 text-white py-3 px-4 rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2 transition-colors"
      >
        {paying ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Processing...
          </>
        ) : (
          <>
            <img src="/logos/logo-bkash-round.svg" alt="bKash" className="w-6 h-6 rounded-full" />
            Pay with bKash - ৳{amount.toFixed(2)}
          </>
        )}
      </button>
      
      <div className="flex justify-center">
        <span className="text-xs text-green-500 flex items-center gap-1">
          <Lock className="w-3 h-3" />
          Secure Payment
        </span>
      </div>
      
      <div className="p-4 bg-blue-50 border-l-4 border-blue-400 text-blue-700 rounded-lg">
        <p className="text-sm text-center">
          💡 Having trouble with bKash payment? Contact us at{' '}
          <a href="https://wa.me/8801842221872" className="text-blue-600 hover:underline font-semibold">
            018422221872
          </a>
        </p>
      </div>
    </div>
  );
} 