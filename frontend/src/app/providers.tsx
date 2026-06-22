'use client';

import { QueryClient, QueryClientProvider, MutationCache } from '@tanstack/react-query';
import { useState } from 'react';
import { ToastProvider, useToast } from '@/contexts/ToastContext';

function QueryProviderWithToast({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();
  
  const [queryClient] = useState(
    () =>
      new QueryClient({
        mutationCache: new MutationCache({
          onError: (error) => {
            showToast(error.message || 'An unexpected error occurred', 'error');
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <QueryProviderWithToast>
        {children}
      </QueryProviderWithToast>
    </ToastProvider>
  );
}
