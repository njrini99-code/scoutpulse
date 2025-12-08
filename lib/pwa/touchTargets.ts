// Touch Target Optimization Utilities
// Ensures all interactive elements meet minimum 44x44px touch target size
// ═══════════════════════════════════════════════════════════════════════════

export const MIN_TOUCH_TARGET = 44; // Minimum touch target size in pixels (iOS/Android standard)

/**
 * Get touch-optimized button classes
 * Ensures buttons meet minimum touch target size
 */
export function getTouchButtonClasses(baseClasses: string = ''): string {
  return `${baseClasses} min-h-[${MIN_TOUCH_TARGET}px] min-w-[${MIN_TOUCH_TARGET}px]`;
}

/**
 * Get touch-optimized input classes
 * Ensures inputs have adequate padding for touch
 */
export function getTouchInputClasses(baseClasses: string = ''): string {
  return `${baseClasses} min-h-[${MIN_TOUCH_TARGET}px] px-4 py-3`;
}

/**
 * Get touch-optimized link classes
 * Ensures links have adequate padding for touch
 */
export function getTouchLinkClasses(baseClasses: string = ''): string {
  return `${baseClasses} min-h-[${MIN_TOUCH_TARGET}px] min-w-[${MIN_TOUCH_TARGET}px] inline-flex items-center justify-center px-4 py-2`;
}

/**
 * Check if device is touch-enabled
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore
    navigator.msMaxTouchPoints > 0
  );
}

/**
 * Get device type for responsive optimizations
 */
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

/**
 * Get viewport size for testing
 */
export function getViewportSize(): { width: number; height: number } {
  if (typeof window === 'undefined') return { width: 0, height: 0 };
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}
