/**
 * Utility Functions
 * 
 * Common utility functions used throughout the application.
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge class names with Tailwind CSS conflict resolution
 * 
 * Combines clsx for conditional classes and tailwind-merge to resolve
 * Tailwind class conflicts (e.g., "p-2 p-4" becomes "p-4")
 * 
 * @example
 * cn('p-2', isActive && 'bg-blue-500', 'p-4') // Returns 'bg-blue-500 p-4'
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
