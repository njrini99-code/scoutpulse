'use client';

/**
 * Animation Examples and Usage Guide
 * 
 * This file demonstrates how to use the animation components and utilities
 * throughout the ScoutPulse application with consistent 300ms timing.
 */

import { useState, useEffect } from 'react';
import { LoadingScreen } from './LoadingScreen';
import { AnimatedButton, AnimatedInput, AnimatedCard, AnimatedLink } from './MicroInteractions';
import { Skeleton, SkeletonText, SkeletonCard, DashboardSkeleton } from './EnhancedSkeleton';
import { PageTransition } from './PageTransition';

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE: Loading Screen with Progress
// ═══════════════════════════════════════════════════════════════════════════

export function LoadingExample() {
  return (
    <LoadingScreen
      message="Loading your dashboard..."
      showProgress
      progress={75} // 0-100
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE: Animated Button with Micro-interactions
// ═══════════════════════════════════════════════════════════════════════════

export function ButtonExample() {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <AnimatedButton variant="primary" size="lg" loading={loading} onClick={handleClick}>
        Submit Form
      </AnimatedButton>
      
      <AnimatedButton variant="secondary" size="md" ripple>
        Secondary Action
      </AnimatedButton>
      
      <AnimatedButton variant="ghost" size="sm">
        Cancel
      </AnimatedButton>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE: Animated Input with Validation
// ═══════════════════════════════════════════════════════════════════════════

export function InputExample() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const validateEmail = (value: string) => {
    if (!value.includes('@')) {
      setError('Please enter a valid email');
    } else {
      setError('');
    }
  };

  return (
    <AnimatedInput
      label="Email Address"
      type="email"
      value={email}
      onChange={(e) => {
        setEmail(e.target.value);
        validateEmail(e.target.value);
      }}
      error={error}
      placeholder="you@example.com"
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE: Skeleton Loading States
// ═══════════════════════════════════════════════════════════════════════════

export function SkeletonExample() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate data loading
    setTimeout(() => setLoading(false), 2000);
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div>
      {/* Your actual content */}
      <h1>Content Loaded</h1>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE: Page Transition Wrapper
// ═══════════════════════════════════════════════════════════════════════════

export function PageExample() {
  return (
    <PageTransition animation="slide-up">
      <div className="p-6">
        <h1>Page Content</h1>
        <p>This page will animate in with a slide-up effect (300ms)</p>
      </div>
    </PageTransition>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE: Animated Card
// ═══════════════════════════════════════════════════════════════════════════

export function CardExample() {
  return (
    <AnimatedCard hover onClick={() => console.log('Card clicked')}>
      <h3 className="text-lg font-semibold mb-2">Card Title</h3>
      <p className="text-gray-400">Card content with hover effects</p>
    </AnimatedCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE: Navigation Links
// ═══════════════════════════════════════════════════════════════════════════

export function NavigationExample() {
  return (
    <nav className="flex gap-4">
      <AnimatedLink href="/dashboard" active>
        Dashboard
      </AnimatedLink>
      <AnimatedLink href="/players">
        Players
      </AnimatedLink>
      <AnimatedLink href="/coaches">
        Coaches
      </AnimatedLink>
    </nav>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// USAGE NOTES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * All animations use consistent 300ms timing with cubic-bezier(0.4, 0, 0.2, 1) easing
 * 
 * Key Components:
 * - LoadingScreen: Full-screen loading with ScoutPulse branding and progress
 * - PageTransition: Wraps pages for smooth transitions
 * - AnimatedButton: Buttons with ripple effects and loading states
 * - AnimatedInput: Form inputs with focus animations and validation
 * - AnimatedCard: Cards with hover effects
 * - AnimatedLink: Navigation links with underline animations
 * - Skeleton components: Content placeholders during loading
 * 
 * Import from:
 * - @/components/ui/LoadingScreen
 * - @/components/ui/PageTransition
 * - @/components/ui/MicroInteractions
 * - @/components/ui/EnhancedSkeleton
 * - @/lib/animations (for animation constants and utilities)
 */
