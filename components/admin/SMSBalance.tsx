'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface SMSBalanceData {
  balance: string;
  message: string;
}

export default function SMSBalance() {
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const checkBalance = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/sms-balance');
      const result = await response.json();

      if (result.success) {
        setBalance(result.balance);
        toast.success('Balance updated successfully');
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error('Error checking SMS balance:', error);
      toast.error('Failed to check SMS balance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkBalance();
  }, []);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">SMS Balance</h3>
        <button
          onClick={checkBalance}
          disabled={loading}
          className="px-3 py-1 text-sm bg-lime-600 text-white rounded hover:bg-lime-700 disabled:opacity-50"
        >
          {loading ? 'Checking...' : 'Refresh'}
        </button>
      </div>
      
      <div className="text-center">
        {balance !== null ? (
          <div className="text-3xl font-bold text-lime-600">
            ৳{balance}
          </div>
        ) : (
          <div className="text-gray-500">Loading...</div>
        )}
        <p className="text-sm text-gray-600 mt-2">
          Available SMS credits
        </p>
      </div>
    </div>
  );
} 