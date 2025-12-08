'use client';

import { ReactNode } from 'react';
import { PageTransitionProvider } from '@/components/ui/PageTransition';

export function AnimationProvider({ children }: { children: ReactNode }) {
  return (
    <PageTransitionProvider>
      {children}
    </PageTransitionProvider>
  );
}
