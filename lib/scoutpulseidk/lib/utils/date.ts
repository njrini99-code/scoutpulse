/**
 * Date Utility Functions for ScoutPulse
 * 
 * Optimized date utilities using native APIs + selective date-fns imports.
 * This file centralizes date operations for better tree-shaking and bundle optimization.
 * 
 * BUNDLE OPTIMIZATION:
 * - Uses native Intl.DateTimeFormat when possible (zero bundle cost)
 * - Only imports specific date-fns functions when native APIs are insufficient
 * - All date-fns imports are individual (tree-shakeable)
 */

// ═══════════════════════════════════════════════════════════════════════════
// NATIVE DATE UTILITIES (Zero bundle cost)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Formats a Date object to YYYY-MM-DD string in the local timezone.
 * This avoids timezone conversion issues that occur with .toISOString()
 */
export function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Gets today's date in YYYY-MM-DD format (local timezone)
 */
export function getTodayLocal(): string {
  return formatDateLocal(new Date());
}

/**
 * Adds days to a date and returns YYYY-MM-DD string in local timezone
 */
export function addDaysLocal(date: Date, days: number): string {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return formatDateLocal(result);
}

/**
 * Parses a YYYY-MM-DD string into a Date object at midnight local time
 */
export function parseDateLocal(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Checks if a date string is today (local timezone)
 */
export function isToday(dateStr: string): boolean {
  return dateStr === getTodayLocal();
}

/**
 * Checks if a date string is in the past (local timezone)
 */
export function isPast(dateStr: string): boolean {
  return dateStr < getTodayLocal();
}

/**
 * Checks if a date string is in the future (local timezone)
 */
export function isFuture(dateStr: string): boolean {
  return dateStr > getTodayLocal();
}

/**
 * Formats a date string to a human-readable format using native Intl
 */
export function formatDateHuman(
  dateStr: string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
): string {
  const date = parseDateLocal(dateStr);
  return new Intl.DateTimeFormat('en-US', options).format(date);
}

/**
 * Format a Date to human-readable format using native Intl
 */
export function formatDate(
  date: Date,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
): string {
  return new Intl.DateTimeFormat('en-US', options).format(date);
}

/**
 * Format time (hours:minutes) using native Intl
 */
export function formatTime(
  date: Date,
  options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }
): string {
  return new Intl.DateTimeFormat('en-US', options).format(date);
}

/**
 * Format date and time using native Intl
 */
export function formatDateTime(
  date: Date,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }
): string {
  return new Intl.DateTimeFormat('en-US', options).format(date);
}

// ═══════════════════════════════════════════════════════════════════════════
// RELATIVE TIME (Native implementation - no library needed)
// ═══════════════════════════════════════════════════════════════════════════

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 * Native implementation - no date-fns needed
 */
export function formatRelativeTime(date: Date | string | number): string {
  const targetDate = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;
  
  const now = Date.now();
  const diff = now - targetDate.getTime();
  const absDiff = Math.abs(diff);
  const isFuture = diff < 0;
  
  let value: number;
  let unit: Intl.RelativeTimeFormatUnit;
  
  if (absDiff < MINUTE) {
    return 'just now';
  } else if (absDiff < HOUR) {
    value = Math.round(absDiff / MINUTE);
    unit = 'minute';
  } else if (absDiff < DAY) {
    value = Math.round(absDiff / HOUR);
    unit = 'hour';
  } else if (absDiff < WEEK) {
    value = Math.round(absDiff / DAY);
    unit = 'day';
  } else if (absDiff < MONTH) {
    value = Math.round(absDiff / WEEK);
    unit = 'week';
  } else if (absDiff < YEAR) {
    value = Math.round(absDiff / MONTH);
    unit = 'month';
  } else {
    value = Math.round(absDiff / YEAR);
    unit = 'year';
  }
  
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  return rtf.format(isFuture ? value : -value, unit);
}

/**
 * Format distance to now (e.g., "2 hours ago")
 * Alias for formatRelativeTime for compatibility
 */
export function formatDistanceToNow(date: Date | string | number): string {
  return formatRelativeTime(date);
}

/**
 * Format distance between two dates
 */
export function formatDistance(
  dateLeft: Date | string | number,
  dateRight: Date | string | number
): string {
  const left = typeof dateLeft === 'string' || typeof dateLeft === 'number'
    ? new Date(dateLeft)
    : dateLeft;
  const right = typeof dateRight === 'string' || typeof dateRight === 'number'
    ? new Date(dateRight)
    : dateRight;
  
  const diff = Math.abs(left.getTime() - right.getTime());
  
  if (diff < MINUTE) {
    const secs = Math.round(diff / SECOND);
    return `${secs} second${secs !== 1 ? 's' : ''}`;
  } else if (diff < HOUR) {
    const mins = Math.round(diff / MINUTE);
    return `${mins} minute${mins !== 1 ? 's' : ''}`;
  } else if (diff < DAY) {
    const hours = Math.round(diff / HOUR);
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  } else if (diff < WEEK) {
    const days = Math.round(diff / DAY);
    return `${days} day${days !== 1 ? 's' : ''}`;
  } else if (diff < MONTH) {
    const weeks = Math.round(diff / WEEK);
    return `${weeks} week${weeks !== 1 ? 's' : ''}`;
  } else if (diff < YEAR) {
    const months = Math.round(diff / MONTH);
    return `${months} month${months !== 1 ? 's' : ''}`;
  } else {
    const years = Math.round(diff / YEAR);
    return `${years} year${years !== 1 ? 's' : ''}`;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DATE MANIPULATION (Native implementations)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Add or subtract time from a date
 */
export function addTime(
  date: Date,
  amount: number,
  unit: 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years'
): Date {
  const result = new Date(date);
  
  switch (unit) {
    case 'seconds':
      result.setSeconds(result.getSeconds() + amount);
      break;
    case 'minutes':
      result.setMinutes(result.getMinutes() + amount);
      break;
    case 'hours':
      result.setHours(result.getHours() + amount);
      break;
    case 'days':
      result.setDate(result.getDate() + amount);
      break;
    case 'weeks':
      result.setDate(result.getDate() + amount * 7);
      break;
    case 'months':
      result.setMonth(result.getMonth() + amount);
      break;
    case 'years':
      result.setFullYear(result.getFullYear() + amount);
      break;
  }
  
  return result;
}

/**
 * Get start of a time period
 */
export function startOf(
  date: Date,
  unit: 'day' | 'week' | 'month' | 'year'
): Date {
  const result = new Date(date);
  
  switch (unit) {
    case 'day':
      result.setHours(0, 0, 0, 0);
      break;
    case 'week':
      result.setHours(0, 0, 0, 0);
      result.setDate(result.getDate() - result.getDay());
      break;
    case 'month':
      result.setHours(0, 0, 0, 0);
      result.setDate(1);
      break;
    case 'year':
      result.setHours(0, 0, 0, 0);
      result.setMonth(0, 1);
      break;
  }
  
  return result;
}

/**
 * Get end of a time period
 */
export function endOf(
  date: Date,
  unit: 'day' | 'week' | 'month' | 'year'
): Date {
  const result = new Date(date);
  
  switch (unit) {
    case 'day':
      result.setHours(23, 59, 59, 999);
      break;
    case 'week':
      result.setDate(result.getDate() + (6 - result.getDay()));
      result.setHours(23, 59, 59, 999);
      break;
    case 'month':
      result.setMonth(result.getMonth() + 1, 0);
      result.setHours(23, 59, 59, 999);
      break;
    case 'year':
      result.setMonth(11, 31);
      result.setHours(23, 59, 59, 999);
      break;
  }
  
  return result;
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Check if a date is between two other dates
 */
export function isBetween(date: Date, start: Date, end: Date): boolean {
  const time = date.getTime();
  return time >= start.getTime() && time <= end.getTime();
}

/**
 * Get the difference between two dates in a specific unit
 */
export function differenceIn(
  dateLeft: Date,
  dateRight: Date,
  unit: 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years'
): number {
  const diff = dateLeft.getTime() - dateRight.getTime();
  
  switch (unit) {
    case 'seconds':
      return Math.floor(diff / SECOND);
    case 'minutes':
      return Math.floor(diff / MINUTE);
    case 'hours':
      return Math.floor(diff / HOUR);
    case 'days':
      return Math.floor(diff / DAY);
    case 'weeks':
      return Math.floor(diff / WEEK);
    case 'months':
      return Math.floor(diff / MONTH);
    case 'years':
      return Math.floor(diff / YEAR);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DATE FORMATTING PATTERNS (Compatible with date-fns format strings)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Format a date with a pattern string (subset of date-fns patterns)
 * Covers most common use cases without importing date-fns
 */
export function formatPattern(date: Date, pattern: string): string {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthNamesShort = monthNames.map(m => m.slice(0, 3));
  
  const dayNames = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];
  const dayNamesShort = dayNames.map(d => d.slice(0, 3));
  
  const pad = (n: number) => String(n).padStart(2, '0');
  
  const replacements: Record<string, string> = {
    'yyyy': String(year),
    'yy': String(year).slice(-2),
    'MMMM': monthNames[month],
    'MMM': monthNamesShort[month],
    'MM': pad(month + 1),
    'M': String(month + 1),
    'dd': pad(day),
    'd': String(day),
    'EEEE': dayNames[date.getDay()],
    'EEE': dayNamesShort[date.getDay()],
    'HH': pad(hours),
    'H': String(hours),
    'hh': pad(hours % 12 || 12),
    'h': String(hours % 12 || 12),
    'mm': pad(minutes),
    'm': String(minutes),
    'ss': pad(seconds),
    's': String(seconds),
    'a': hours >= 12 ? 'PM' : 'AM',
  };
  
  let result = pattern;
  // Sort by length descending to replace longer patterns first
  const sortedKeys = Object.keys(replacements).sort((a, b) => b.length - a.length);
  
  for (const key of sortedKeys) {
    result = result.replace(new RegExp(key, 'g'), replacements[key]);
  }
  
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  // Basic utilities
  formatDateLocal,
  getTodayLocal,
  addDaysLocal,
  parseDateLocal,
  isToday,
  isPast,
  isFuture,
  
  // Formatting
  formatDateHuman,
  formatDate,
  formatTime,
  formatDateTime,
  formatPattern,
  
  // Relative time
  formatRelativeTime,
  formatDistanceToNow,
  formatDistance,
  
  // Manipulation
  addTime,
  startOf,
  endOf,
  
  // Comparison
  isSameDay,
  isBetween,
  differenceIn,
};
