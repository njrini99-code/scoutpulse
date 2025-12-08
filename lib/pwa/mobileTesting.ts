// Mobile Testing Utilities
// Helpers for testing on various device sizes
// ═══════════════════════════════════════════════════════════════════════════

export interface DeviceSize {
  name: string;
  width: number;
  height: number;
  type: 'mobile' | 'tablet' | 'desktop';
}

export const DEVICE_SIZES: DeviceSize[] = [
  // Mobile devices
  { name: 'iPhone SE', width: 375, height: 667, type: 'mobile' },
  { name: 'iPhone 12/13', width: 390, height: 844, type: 'mobile' },
  { name: 'iPhone 14 Pro Max', width: 430, height: 932, type: 'mobile' },
  { name: 'Samsung Galaxy S20', width: 360, height: 800, type: 'mobile' },
  { name: 'Pixel 5', width: 393, height: 851, type: 'mobile' },
  
  // Tablets
  { name: 'iPad Mini', width: 768, height: 1024, type: 'tablet' },
  { name: 'iPad Air', width: 820, height: 1180, type: 'tablet' },
  { name: 'iPad Pro 12.9"', width: 1024, height: 1366, type: 'tablet' },
  
  // Desktop
  { name: 'Desktop Small', width: 1280, height: 720, type: 'desktop' },
  { name: 'Desktop Medium', width: 1920, height: 1080, type: 'desktop' },
  { name: 'Desktop Large', width: 2560, height: 1440, type: 'desktop' },
];

/**
 * Get device size by name
 */
export function getDeviceSize(name: string): DeviceSize | undefined {
  return DEVICE_SIZES.find((device) => device.name === name);
}

/**
 * Check if current viewport matches a device size
 */
export function matchesDeviceSize(device: DeviceSize, tolerance: number = 50): boolean {
  if (typeof window === 'undefined') return false;
  
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  return (
    Math.abs(width - device.width) <= tolerance &&
    Math.abs(height - device.height) <= tolerance
  );
}

/**
 * Get current device category
 */
export function getCurrentDeviceCategory(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

/**
 * Test touch target sizes
 * Returns elements that don't meet minimum touch target size
 */
export function testTouchTargets(): Array<{
  element: HTMLElement;
  width: number;
  height: number;
  minSize: number;
}> {
  if (typeof document === 'undefined') return [];
  
  const interactiveElements = document.querySelectorAll<HTMLElement>(
    'button, a, input[type="button"], input[type="submit"], [role="button"]'
  );
  
  const MIN_SIZE = 44;
  const issues: Array<{
    element: HTMLElement;
    width: number;
    height: number;
    minSize: number;
  }> = [];
  
  interactiveElements.forEach((element) => {
    const rect = element.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    if (width < MIN_SIZE || height < MIN_SIZE) {
      issues.push({
        element,
        width,
        height,
        minSize: MIN_SIZE,
      });
    }
  });
  
  return issues;
}

/**
 * Log mobile testing report
 */
export function logMobileTestingReport(): void {
  if (typeof window === 'undefined') return;
  
  console.group('📱 Mobile Testing Report');
  console.log('Viewport:', `${window.innerWidth}x${window.innerHeight}`);
  console.log('Device Type:', getCurrentDeviceCategory());
  console.log('Touch Device:', 'ontouchstart' in window);
  console.log('PWA Installed:', window.matchMedia('(display-mode: standalone)').matches);
  
  const touchTargetIssues = testTouchTargets();
  if (touchTargetIssues.length > 0) {
    console.warn('Touch Target Issues:', touchTargetIssues.length);
    touchTargetIssues.forEach((issue) => {
      console.warn(`- ${issue.element.tagName}: ${issue.width}x${issue.height}px (min: ${issue.minSize}px)`);
    });
  } else {
    console.log('✅ All touch targets meet minimum size');
  }
  
  console.groupEnd();
}
