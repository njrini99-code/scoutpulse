'use client';

import { useEffect, useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
  animation?: 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'scale';
}

const TRANSITION_DURATION = 300; // 300ms for consistency
const EASING = 'cubic-bezier(0.4, 0, 0.2, 1)'; // Material Design easing

export function PageTransition({
  children,
  className,
  animation = 'fade',
}: PageTransitionProps) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setDisplayChildren(children);
      setIsTransitioning(false);
    }, TRANSITION_DURATION);

    return () => clearTimeout(timer);
  }, [pathname, children]);

  const animationClasses = {
    fade: isTransitioning ? 'opacity-0' : 'opacity-100',
    'slide-up': isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0',
    'slide-down': isTransitioning ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0',
    'slide-left': isTransitioning ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0',
    'slide-right': isTransitioning ? 'opacity-0 -translate-x-4' : 'opacity-100 translate-x-0',
    scale: isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100',
  };

  return (
    <div
      className={cn(
        'transition-all duration-300',
        animationClasses[animation],
        className
      )}
      style={{
        transitionDuration: `${TRANSITION_DURATION}ms`,
        transitionTimingFunction: EASING,
      }}
    >
      {displayChildren}
    </div>
  );
}

// Global page transition wrapper for layout
export function PageTransitionProvider({ children }: { children: ReactNode }) {
  return (
    <PageTransition animation="fade">
      {children}
    </PageTransition>
  );
}
