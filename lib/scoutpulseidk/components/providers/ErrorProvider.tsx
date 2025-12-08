'use client';

import { ReactNode } from 'react';
import {
  GlobalErrorProvider,
  AppErrorBoundary,
  GlobalErrorDisplay,
} from '@/lib/errors/GlobalErrorHandler';

interface ErrorProviderProps {
  children: ReactNode;
}

export function ErrorProvider({ children }: ErrorProviderProps) {
  return (
    <GlobalErrorProvider
      maxErrors={10}
      maxRetries={3}
      onError={(error) => {
        // Optional: Send to analytics
        console.log('[ErrorProvider] Error reported:', error.error.message);
      }}
      onRecovery={(errorId, action) => {
        // Optional: Track recovery actions
        console.log('[ErrorProvider] Recovery action:', action, 'for error:', errorId);
      }}
    >
      <AppErrorBoundary>
        {children}
      </AppErrorBoundary>
      <GlobalErrorDisplay />
    </GlobalErrorProvider>
  );
}

export default ErrorProvider;
