'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// DEBOUNCE UTILITY FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Creates a debounced version of a function
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function with cancel method
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  delay: number
): T & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  }) as T & { cancel: () => void };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}

// ═══════════════════════════════════════════════════════════════════════════
// USE DEBOUNCED VALUE HOOK
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Returns a debounced version of the value
 * @param value - Value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns Debounced value
 */
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ═══════════════════════════════════════════════════════════════════════════
// USE DEBOUNCED CALLBACK HOOK
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Returns a debounced version of the callback
 * @param callback - Callback to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @param deps - Additional dependencies
 * @returns Debounced callback
 */
export function useDebouncedCallback<T extends (...args: never[]) => unknown>(
  callback: T,
  delay: number = 300,
  deps: React.DependencyList = []
): T & { cancel: () => void; flush: () => void } {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);
  const argsRef = useRef<Parameters<T> | null>(null);

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const flush = useCallback(() => {
    if (timeoutRef.current && argsRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      callbackRef.current(...argsRef.current);
      argsRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  const debouncedCallback = useCallback(
    ((...args: Parameters<T>) => {
      argsRef.current = args;
      cancel();
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
        timeoutRef.current = null;
        argsRef.current = null;
      }, delay);
    }) as T & { cancel: () => void; flush: () => void },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [delay, cancel, ...deps]
  );

  debouncedCallback.cancel = cancel;
  debouncedCallback.flush = flush;

  return debouncedCallback;
}

// ═══════════════════════════════════════════════════════════════════════════
// USE DEBOUNCED SEARCH HOOK (with AbortController)
// ═══════════════════════════════════════════════════════════════════════════

export interface UseSearchOptions<T> {
  /** Search function that returns results */
  searchFn: (query: string, signal: AbortSignal) => Promise<T>;
  /** Debounce delay in milliseconds (default: 300ms) */
  delay?: number;
  /** Minimum query length to trigger search (default: 1) */
  minLength?: number;
  /** Callback when search starts */
  onSearchStart?: () => void;
  /** Callback when search completes */
  onSearchComplete?: (results: T) => void;
  /** Callback when search errors */
  onSearchError?: (error: Error) => void;
  /** Initial results */
  initialResults?: T;
}

export interface UseSearchResult<T> {
  /** Current search query */
  query: string;
  /** Set search query */
  setQuery: (query: string) => void;
  /** Debounced query (what actually triggers search) */
  debouncedQuery: string;
  /** Search results */
  results: T | undefined;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Whether a search is pending (debounce waiting) */
  isPending: boolean;
  /** Clear search */
  clear: () => void;
  /** Cancel current search */
  cancel: () => void;
  /** Trigger search immediately */
  searchNow: (query?: string) => void;
}

/**
 * Comprehensive search hook with debouncing and request cancellation
 */
export function useSearch<T>({
  searchFn,
  delay = 300,
  minLength = 1,
  onSearchStart,
  onSearchComplete,
  onSearchError,
  initialResults,
}: UseSearchOptions<T>): UseSearchResult<T> {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<T | undefined>(initialResults);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isPending, setIsPending] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cancel any ongoing request
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    setIsPending(false);
    setIsLoading(false);
  }, []);

  // Clear search
  const clear = useCallback(() => {
    cancel();
    setQuery('');
    setDebouncedQuery('');
    setResults(initialResults);
    setError(null);
  }, [cancel, initialResults]);

  // Execute search
  const executeSearch = useCallback(async (searchQuery: string) => {
    // Don't search if query is too short
    if (searchQuery.length < minLength) {
      setResults(initialResults);
      setIsLoading(false);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsLoading(true);
    setError(null);
    onSearchStart?.();

    try {
      const searchResults = await searchFn(searchQuery, abortController.signal);
      
      // Only update if this request wasn't aborted
      if (!abortController.signal.aborted) {
        setResults(searchResults);
        setIsLoading(false);
        onSearchComplete?.(searchResults);
      }
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      
      // Only update if this request wasn't aborted
      if (!abortController.signal.aborted) {
        const error = err instanceof Error ? err : new Error('Search failed');
        setError(error);
        setIsLoading(false);
        onSearchError?.(error);
      }
    }
  }, [searchFn, minLength, initialResults, onSearchStart, onSearchComplete, onSearchError]);

  // Debounced search
  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // If query is empty, clear immediately
    if (query === '') {
      setDebouncedQuery('');
      setResults(initialResults);
      setIsPending(false);
      return;
    }

    // Set pending state
    setIsPending(true);

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedQuery(query);
      setIsPending(false);
    }, delay);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, delay, initialResults]);

  // Execute search when debounced query changes
  useEffect(() => {
    if (debouncedQuery) {
      executeSearch(debouncedQuery);
    }
  }, [debouncedQuery, executeSearch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  // Search now (bypass debounce)
  const searchNow = useCallback((searchQuery?: string) => {
    const q = searchQuery ?? query;
    cancel();
    setDebouncedQuery(q);
    executeSearch(q);
  }, [query, cancel, executeSearch]);

  return {
    query,
    setQuery,
    debouncedQuery,
    results,
    isLoading,
    error,
    isPending,
    clear,
    cancel,
    searchNow,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// USE ASYNC DEBOUNCE HOOK
// ═══════════════════════════════════════════════════════════════════════════

export interface UseAsyncDebounceOptions {
  /** Debounce delay in milliseconds */
  delay?: number;
}

export interface UseAsyncDebounceResult<T, Args extends unknown[]> {
  /** Execute the debounced function */
  execute: (...args: Args) => void;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Result data */
  data: T | undefined;
  /** Cancel pending execution */
  cancel: () => void;
  /** Is debounce timer pending */
  isPending: boolean;
}

/**
 * Hook for debouncing async functions with loading/error states
 */
export function useAsyncDebounce<T, Args extends unknown[]>(
  asyncFn: (...args: Args) => Promise<T>,
  options: UseAsyncDebounceOptions = {}
): UseAsyncDebounceResult<T, Args> {
  const { delay = 300 } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | undefined>(undefined);
  const [isPending, setIsPending] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const asyncFnRef = useRef(asyncFn);

  // Keep fn ref updated
  useEffect(() => {
    asyncFnRef.current = asyncFn;
  }, [asyncFn]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsPending(false);
    setIsLoading(false);
  }, []);

  const execute = useCallback((...args: Args) => {
    // Clear previous timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setIsPending(true);

    timerRef.current = setTimeout(async () => {
      setIsPending(false);

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setIsLoading(true);
      setError(null);

      try {
        const result = await asyncFnRef.current(...args);
        
        if (!abortController.signal.aborted) {
          setData(result);
          setIsLoading(false);
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        
        if (!abortController.signal.aborted) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
          setIsLoading(false);
        }
      }
    }, delay);
  }, [delay]);

  // Cleanup
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return {
    execute,
    isLoading,
    error,
    data,
    cancel,
    isPending,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  debounce,
  useDebouncedValue,
  useDebouncedCallback,
  useSearch,
  useAsyncDebounce,
};
