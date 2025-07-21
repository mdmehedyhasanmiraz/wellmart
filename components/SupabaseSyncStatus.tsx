'use client';

import { useSupabaseSync } from '@/hooks/useSupabaseSync';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

export const SupabaseSyncStatus = () => {
  const { hasSupabaseSession, isSyncing, syncError, checkSupabaseSession } = useSupabaseSync();

  const handleRefresh = async () => {
    await checkSupabaseSession();
  };

  if (hasSupabaseSession === null) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
        Checking Supabase sync...
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      {hasSupabaseSession ? (
        <>
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-green-700">User in Supabase</span>
        </>
      ) : (
        <>
          <AlertCircle className="w-4 h-4 text-yellow-500" />
          <span className="text-yellow-700">User not in Supabase</span>
        </>
      )}
      
      <button
        onClick={handleRefresh}
        disabled={isSyncing}
        className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
        title="Refresh sync status"
      >
        <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
      </button>
      
      {syncError && (
        <span className="text-red-600 text-xs">({syncError})</span>
      )}
    </div>
  );
}; 