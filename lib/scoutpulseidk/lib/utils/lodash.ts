/**
 * Lodash-like Utility Functions (Native Implementations)
 * 
 * BUNDLE OPTIMIZATION:
 * Instead of importing lodash (~70KB) or even lodash-es, use these native
 * implementations for common operations. Zero additional bundle size.
 * 
 * If you need lodash, import individual functions:
 * ❌ import _ from 'lodash'
 * ❌ import { debounce, throttle } from 'lodash'
 * ✅ import debounce from 'lodash/debounce'
 * ✅ Use native implementations below
 */

// ═══════════════════════════════════════════════════════════════════════════
// ARRAY UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Chunk an array into smaller arrays
 * Lodash equivalent: _.chunk
 */
export function chunk<T>(array: T[], size: number): T[][] {
  if (size <= 0) return [];
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

/**
 * Get unique values from array
 * Lodash equivalent: _.uniq
 */
export function uniq<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

/**
 * Get unique values by key
 * Lodash equivalent: _.uniqBy
 */
export function uniqBy<T, K>(array: T[], iteratee: (item: T) => K): T[] {
  const seen = new Map<K, boolean>();
  return array.filter(item => {
    const key = iteratee(item);
    if (seen.has(key)) return false;
    seen.set(key, true);
    return true;
  });
}

/**
 * Flatten array one level
 * Lodash equivalent: _.flatten
 */
export function flatten<T>(array: (T | T[])[]): T[] {
  return array.flat() as T[];
}

/**
 * Flatten array deeply
 * Lodash equivalent: _.flattenDeep
 */
export function flattenDeep<T>(array: unknown[]): T[] {
  return array.flat(Infinity) as T[];
}

/**
 * Group array items by key
 * Lodash equivalent: _.groupBy
 */
export function groupBy<T, K extends string | number | symbol>(
  array: T[],
  iteratee: (item: T) => K
): Record<K, T[]> {
  return array.reduce((acc, item) => {
    const key = iteratee(item);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<K, T[]>);
}

/**
 * Create object from array
 * Lodash equivalent: _.keyBy
 */
export function keyBy<T, K extends string | number | symbol>(
  array: T[],
  iteratee: (item: T) => K
): Record<K, T> {
  return array.reduce((acc, item) => {
    acc[iteratee(item)] = item;
    return acc;
  }, {} as Record<K, T>);
}

/**
 * Sort by property
 * Lodash equivalent: _.sortBy
 */
export function sortBy<T>(
  array: T[],
  iteratee: ((item: T) => string | number) | keyof T
): T[] {
  const fn = typeof iteratee === 'function' 
    ? iteratee 
    : (item: T) => item[iteratee] as string | number;
  
  return [...array].sort((a, b) => {
    const valA = fn(a);
    const valB = fn(b);
    if (valA < valB) return -1;
    if (valA > valB) return 1;
    return 0;
  });
}

/**
 * Order by multiple properties
 * Lodash equivalent: _.orderBy
 */
export function orderBy<T>(
  array: T[],
  iteratees: (((item: T) => string | number | boolean | null | undefined) | keyof T)[],
  orders: ('asc' | 'desc')[] = []
): T[] {
  return [...array].sort((a, b) => {
    for (let i = 0; i < iteratees.length; i++) {
      const iteratee = iteratees[i];
      const order = orders[i] || 'asc';
      
      const fn = typeof iteratee === 'function'
        ? iteratee
        : (item: T) => item[iteratee] as string | number | boolean | null | undefined;
      
      const valA = fn(a);
      const valB = fn(b);
      
      if (valA === null || valA === undefined) return order === 'asc' ? 1 : -1;
      if (valB === null || valB === undefined) return order === 'asc' ? -1 : 1;
      if (valA < valB) return order === 'asc' ? -1 : 1;
      if (valA > valB) return order === 'asc' ? 1 : -1;
    }
    return 0;
  });
}

/**
 * Get first n elements
 * Lodash equivalent: _.take
 */
export function take<T>(array: T[], n: number = 1): T[] {
  return array.slice(0, n);
}

/**
 * Get last n elements
 * Lodash equivalent: _.takeRight
 */
export function takeRight<T>(array: T[], n: number = 1): T[] {
  return array.slice(-n);
}

/**
 * Drop first n elements
 * Lodash equivalent: _.drop
 */
export function drop<T>(array: T[], n: number = 1): T[] {
  return array.slice(n);
}

/**
 * Get difference between arrays
 * Lodash equivalent: _.difference
 */
export function difference<T>(array: T[], ...others: T[][]): T[] {
  const otherSet = new Set(others.flat());
  return array.filter(item => !otherSet.has(item));
}

/**
 * Get intersection of arrays
 * Lodash equivalent: _.intersection
 */
export function intersection<T>(...arrays: T[][]): T[] {
  if (arrays.length === 0) return [];
  if (arrays.length === 1) return [...arrays[0]];
  
  const sets = arrays.slice(1).map(arr => new Set(arr));
  return arrays[0].filter(item => sets.every(set => set.has(item)));
}

/**
 * Compact array (remove falsy values)
 * Lodash equivalent: _.compact
 */
export function compact<T>(array: (T | null | undefined | false | 0 | '')[]): T[] {
  return array.filter(Boolean) as T[];
}

/**
 * Sample random element
 * Lodash equivalent: _.sample
 */
export function sample<T>(array: T[]): T | undefined {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Shuffle array
 * Lodash equivalent: _.shuffle
 */
export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// OBJECT UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Pick specific keys from object
 * Lodash equivalent: _.pick
 */
export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * Omit specific keys from object
 * Lodash equivalent: _.omit
 */
export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const keysSet = new Set(keys);
  const result = {} as Omit<T, K>;
  for (const key of Object.keys(obj) as (keyof T)[]) {
    if (!keysSet.has(key as K)) {
      (result as T)[key] = obj[key];
    }
  }
  return result;
}

/**
 * Deep clone object
 * Lodash equivalent: _.cloneDeep
 */
export function cloneDeep<T>(obj: T): T {
  // Use structuredClone if available (modern browsers)
  if (typeof structuredClone === 'function') {
    return structuredClone(obj);
  }
  
  // Fallback for older browsers
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => cloneDeep(item)) as T;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }
  
  if (obj instanceof Map) {
    return new Map(Array.from(obj.entries()).map(([k, v]) => [k, cloneDeep(v)])) as T;
  }
  
  if (obj instanceof Set) {
    return new Set(Array.from(obj).map(item => cloneDeep(item))) as T;
  }
  
  const result = {} as T;
  for (const key of Object.keys(obj)) {
    (result as Record<string, unknown>)[key] = cloneDeep((obj as Record<string, unknown>)[key]);
  }
  return result;
}

/**
 * Deep merge objects
 * Lodash equivalent: _.merge
 */
export function merge<T extends object>(...objects: Partial<T>[]): T {
  const result = {} as T;
  
  for (const obj of objects) {
    for (const key of Object.keys(obj)) {
      const targetVal = (result as Record<string, unknown>)[key];
      const sourceVal = (obj as Record<string, unknown>)[key];
      
      if (
        targetVal !== null &&
        sourceVal !== null &&
        typeof targetVal === 'object' &&
        typeof sourceVal === 'object' &&
        !Array.isArray(targetVal) &&
        !Array.isArray(sourceVal)
      ) {
        (result as Record<string, unknown>)[key] = merge(
          targetVal as object,
          sourceVal as object
        );
      } else {
        (result as Record<string, unknown>)[key] = sourceVal;
      }
    }
  }
  
  return result;
}

/**
 * Get nested value from object
 * Lodash equivalent: _.get
 */
export function get<T = unknown>(
  obj: unknown,
  path: string | (string | number)[],
  defaultValue?: T
): T {
  const keys = Array.isArray(path) ? path : path.split('.');
  let result: unknown = obj;
  
  for (const key of keys) {
    if (result === null || result === undefined) {
      return defaultValue as T;
    }
    result = (result as Record<string | number, unknown>)[key];
  }
  
  return (result === undefined ? defaultValue : result) as T;
}

/**
 * Set nested value in object
 * Lodash equivalent: _.set
 */
export function set<T extends object>(
  obj: T,
  path: string | (string | number)[],
  value: unknown
): T {
  const keys = Array.isArray(path) ? path : path.split('.');
  const result = cloneDeep(obj);
  let current: unknown = result;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if ((current as Record<string | number, unknown>)[key] === undefined) {
      (current as Record<string | number, unknown>)[key] = 
        typeof keys[i + 1] === 'number' ? [] : {};
    }
    current = (current as Record<string | number, unknown>)[key];
  }
  
  (current as Record<string | number, unknown>)[keys[keys.length - 1]] = value;
  return result;
}

/**
 * Check if object is empty
 * Lodash equivalent: _.isEmpty
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' || Array.isArray(value)) return value.length === 0;
  if (value instanceof Map || value instanceof Set) return value.size === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Check if value is plain object
 * Lodash equivalent: _.isPlainObject
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
}

// ═══════════════════════════════════════════════════════════════════════════
// STRING UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Convert string to camelCase
 * Lodash equivalent: _.camelCase
 */
export function camelCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '')
    .replace(/^(.)/, char => char.toLowerCase());
}

/**
 * Convert string to kebab-case
 * Lodash equivalent: _.kebabCase
 */
export function kebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * Convert string to snake_case
 * Lodash equivalent: _.snakeCase
 */
export function snakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase();
}

/**
 * Capitalize first letter
 * Lodash equivalent: _.capitalize
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Truncate string
 * Lodash equivalent: _.truncate
 */
export function truncate(
  str: string,
  options: { length?: number; omission?: string } = {}
): string {
  const { length = 30, omission = '...' } = options;
  if (str.length <= length) return str;
  return str.slice(0, length - omission.length) + omission;
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNCTION UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Debounce function
 * Lodash equivalent: _.debounce
 */
export function debounce<T extends (...args: never[]) => unknown>(
  fn: T,
  wait: number = 300
): ((...args: Parameters<T>) => void) & { cancel: () => void; flush: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  const debounced = ((...args: Parameters<T>) => {
    lastArgs = args;
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn(...(args as Parameters<T>));
      timeoutId = null;
      lastArgs = null;
    }, wait);
  }) as ((...args: Parameters<T>) => void) & { cancel: () => void; flush: () => void };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
      lastArgs = null;
    }
  };

  debounced.flush = () => {
    if (timeoutId && lastArgs) {
      clearTimeout(timeoutId);
      fn(...(lastArgs as Parameters<T>));
      timeoutId = null;
      lastArgs = null;
    }
  };

  return debounced;
}

/**
 * Throttle function
 * Lodash equivalent: _.throttle
 */
export function throttle<T extends (...args: never[]) => unknown>(
  fn: T,
  wait: number = 300
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  const throttled = ((...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = wait - (now - lastCall);
    lastArgs = args;

    if (remaining <= 0) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastCall = now;
      fn(...(args as Parameters<T>));
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        timeoutId = null;
        if (lastArgs) {
          fn(...(lastArgs as Parameters<T>));
        }
      }, remaining);
    }
  }) as ((...args: Parameters<T>) => void) & { cancel: () => void };

  throttled.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastCall = 0;
    lastArgs = null;
  };

  return throttled;
}

/**
 * Memoize function
 * Lodash equivalent: _.memoize
 */
export function memoize<Args extends unknown[], R>(
  fn: (...args: Args) => R,
  resolver?: (...args: Args) => string
): ((...args: Args) => R) & { cache: Map<string, R>; clear: () => void } {
  const cache = new Map<string, R>();

  const memoized = ((...args: Args): R => {
    const key = resolver ? resolver(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as ((...args: Args) => R) & { cache: Map<string, R>; clear: () => void };

  memoized.cache = cache;
  memoized.clear = () => cache.clear();

  return memoized;
}

/**
 * Only execute function once
 * Lodash equivalent: _.once
 */
export function once<Args extends unknown[], R>(
  fn: (...args: Args) => R
): (...args: Args) => R {
  let called = false;
  let result: R;

  return (...args: Args): R => {
    if (!called) {
      called = true;
      result = fn(...args);
    }
    return result;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// NUMBER UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Clamp number between min and max
 * Lodash equivalent: _.clamp
 */
export function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max);
}

/**
 * Check if number is in range
 * Lodash equivalent: _.inRange
 */
export function inRange(num: number, start: number, end?: number): boolean {
  if (end === undefined) {
    end = start;
    start = 0;
  }
  return num >= Math.min(start, end) && num < Math.max(start, end);
}

/**
 * Generate random number in range
 * Lodash equivalent: _.random
 */
export function random(lower: number = 0, upper: number = 1, floating: boolean = false): number {
  if (floating || lower % 1 !== 0 || upper % 1 !== 0) {
    return lower + Math.random() * (upper - lower);
  }
  return Math.floor(Math.random() * (upper - lower + 1)) + lower;
}

/**
 * Sum array of numbers
 * Lodash equivalent: _.sum
 */
export function sum(array: number[]): number {
  return array.reduce((acc, val) => acc + val, 0);
}

/**
 * Sum by property
 * Lodash equivalent: _.sumBy
 */
export function sumBy<T>(array: T[], iteratee: (item: T) => number): number {
  return array.reduce((acc, item) => acc + iteratee(item), 0);
}

/**
 * Get min value
 * Lodash equivalent: _.min / _.minBy
 */
export function minBy<T>(array: T[], iteratee: (item: T) => number): T | undefined {
  if (array.length === 0) return undefined;
  return array.reduce((min, item) => 
    iteratee(item) < iteratee(min) ? item : min
  );
}

/**
 * Get max value
 * Lodash equivalent: _.max / _.maxBy
 */
export function maxBy<T>(array: T[], iteratee: (item: T) => number): T | undefined {
  if (array.length === 0) return undefined;
  return array.reduce((max, item) => 
    iteratee(item) > iteratee(max) ? item : max
  );
}

/**
 * Calculate mean/average
 * Lodash equivalent: _.mean
 */
export function mean(array: number[]): number {
  if (array.length === 0) return NaN;
  return sum(array) / array.length;
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  // Array
  chunk,
  uniq,
  uniqBy,
  flatten,
  flattenDeep,
  groupBy,
  keyBy,
  sortBy,
  orderBy,
  take,
  takeRight,
  drop,
  difference,
  intersection,
  compact,
  sample,
  shuffle,
  
  // Object
  pick,
  omit,
  cloneDeep,
  merge,
  get,
  set,
  isEmpty,
  isPlainObject,
  
  // String
  camelCase,
  kebabCase,
  snakeCase,
  capitalize,
  truncate,
  
  // Function
  debounce,
  throttle,
  memoize,
  once,
  
  // Number
  clamp,
  inRange,
  random,
  sum,
  sumBy,
  minBy,
  maxBy,
  mean,
};
