'use client';

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  memo,
  useMemo,
  ReactNode,
  forwardRef,
} from 'react';
import { cn } from '@/lib/utils';
import { useSearch, useDebouncedValue, type UseSearchOptions } from '@/lib/hooks/useDebounce';
import {
  Search,
  X,
  Loader2,
  AlertCircle,
  Clock,
  TrendingUp,
  History,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// CSS ANIMATIONS
// ═══════════════════════════════════════════════════════════════════════════

const searchInputStyles = `
/* Spinner animation */
@keyframes search-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.search-spinner {
  animation: search-spin 1s linear infinite;
}

/* Pulse animation for pending */
@keyframes search-pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

.search-pending {
  animation: search-pulse 1s ease-in-out infinite;
}

/* Slide down for dropdown */
@keyframes search-dropdown {
  0% { opacity: 0; transform: translateY(-10px); }
  100% { opacity: 1; transform: translateY(0); }
}

.search-dropdown {
  animation: search-dropdown 0.2s ease-out forwards;
}

/* Result item hover */
@keyframes search-item-hover {
  0% { background-color: transparent; }
  100% { background-color: rgba(255, 255, 255, 0.05); }
}

/* Fade in results */
@keyframes search-fade-in {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

.search-fade-in {
  animation: search-fade-in 0.2s ease-out forwards;
}
`;

let stylesInjected = false;
function injectStyles() {
  if (stylesInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.id = 'search-input-styles';
  style.textContent = searchInputStyles;
  document.head.appendChild(style);
  stylesInjected = true;
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  type?: string;
  data?: unknown;
}

export interface SearchInputProps {
  /** Placeholder text */
  placeholder?: string;
  /** Search function (with AbortController support) */
  onSearch?: (query: string, signal: AbortSignal) => Promise<SearchResult[]>;
  /** Called when a result is selected */
  onResultSelect?: (result: SearchResult) => void;
  /** Called when query changes (debounced) */
  onQueryChange?: (query: string) => void;
  /** Debounce delay in ms (default: 300) */
  debounceDelay?: number;
  /** Minimum characters to trigger search (default: 2) */
  minLength?: number;
  /** Show recent searches */
  showRecentSearches?: boolean;
  /** Recent searches storage key */
  recentSearchesKey?: string;
  /** Maximum recent searches to show */
  maxRecentSearches?: number;
  /** Show trending/suggested searches */
  trendingSearches?: string[];
  /** Custom loading indicator */
  loadingIndicator?: ReactNode;
  /** Custom empty state */
  emptyState?: ReactNode;
  /** Custom error state */
  errorState?: ReactNode;
  /** Auto focus on mount */
  autoFocus?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Disabled state */
  disabled?: boolean;
  /** Additional class names */
  className?: string;
  /** Input class names */
  inputClassName?: string;
  /** Dropdown class names */
  dropdownClassName?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// SIZE STYLES
// ═══════════════════════════════════════════════════════════════════════════

const SIZE_STYLES = {
  sm: {
    container: 'h-9',
    input: 'text-sm pl-8 pr-8',
    icon: 'w-4 h-4 left-2.5',
    clearBtn: 'right-2 w-4 h-4',
    spinner: 'w-4 h-4',
  },
  md: {
    container: 'h-10',
    input: 'text-sm pl-10 pr-10',
    icon: 'w-4 h-4 left-3',
    clearBtn: 'right-3 w-4 h-4',
    spinner: 'w-4 h-4',
  },
  lg: {
    container: 'h-12',
    input: 'text-base pl-12 pr-12',
    icon: 'w-5 h-5 left-4',
    clearBtn: 'right-4 w-5 h-5',
    spinner: 'w-5 h-5',
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// LOADING INDICATOR COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const LoadingIndicator = memo(function LoadingIndicator({
  size,
  isPending,
}: {
  size: 'sm' | 'md' | 'lg';
  isPending: boolean;
}) {
  const styles = SIZE_STYLES[size];
  
  return (
    <div className={cn(
      'absolute top-1/2 -translate-y-1/2 text-slate-400',
      styles.clearBtn,
      isPending ? 'search-pending' : 'search-spinner'
    )}>
      <Loader2 className={styles.spinner} />
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// SEARCH RESULT ITEM COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface ResultItemProps {
  result: SearchResult;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}

const ResultItem = memo(function ResultItem({
  result,
  isSelected,
  onClick,
  onMouseEnter,
}: ResultItemProps) {
  return (
    <button
      type="button"
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors rounded-lg',
        isSelected ? 'bg-white/10' : 'hover:bg-white/5'
      )}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
    >
      {result.icon && (
        <div className="shrink-0 text-slate-400">
          {result.icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{result.title}</p>
        {result.subtitle && (
          <p className="text-xs text-slate-400 truncate">{result.subtitle}</p>
        )}
      </div>
      {result.type && (
        <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-400">
          {result.type}
        </span>
      )}
    </button>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// RECENT SEARCHES SECTION
// ═══════════════════════════════════════════════════════════════════════════

interface RecentSearchesSectionProps {
  searches: string[];
  onSelect: (query: string) => void;
  onClear: () => void;
}

const RecentSearchesSection = memo(function RecentSearchesSection({
  searches,
  onSelect,
  onClear,
}: RecentSearchesSectionProps) {
  if (searches.length === 0) return null;

  return (
    <div className="p-2">
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          Recent Searches
        </span>
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          Clear
        </button>
      </div>
      <div className="mt-1 space-y-0.5">
        {searches.map((query, idx) => (
          <button
            key={idx}
            type="button"
            className="w-full flex items-center gap-2 px-2 py-1.5 text-left hover:bg-white/5 rounded-lg transition-colors"
            onClick={() => onSelect(query)}
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-sm text-slate-300">{query}</span>
          </button>
        ))}
      </div>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// TRENDING SEARCHES SECTION
// ═══════════════════════════════════════════════════════════════════════════

interface TrendingSearchesSectionProps {
  searches: string[];
  onSelect: (query: string) => void;
}

const TrendingSearchesSection = memo(function TrendingSearchesSection({
  searches,
  onSelect,
}: TrendingSearchesSectionProps) {
  if (searches.length === 0) return null;

  return (
    <div className="p-2 border-t border-white/5">
      <div className="px-2 py-1">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          Trending
        </span>
      </div>
      <div className="mt-1 flex flex-wrap gap-1.5 px-2">
        {searches.map((query, idx) => (
          <button
            key={idx}
            type="button"
            className="px-2.5 py-1 text-xs text-slate-300 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
            onClick={() => onSelect(query)}
          >
            {query}
          </button>
        ))}
      </div>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SEARCH INPUT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  function SearchInput(
    {
      placeholder = 'Search...',
      onSearch,
      onResultSelect,
      onQueryChange,
      debounceDelay = 300,
      minLength = 2,
      showRecentSearches = true,
      recentSearchesKey = 'recent_searches',
      maxRecentSearches = 5,
      trendingSearches = [],
      loadingIndicator,
      emptyState,
      errorState,
      autoFocus = false,
      size = 'md',
      disabled = false,
      className,
      inputClassName,
      dropdownClassName,
    },
    ref
  ) {
    // Inject styles
    useEffect(() => {
      injectStyles();
    }, []);

    // Refs
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // State
    const [isFocused, setIsFocused] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);

    // Load recent searches from localStorage
    useEffect(() => {
      if (showRecentSearches && typeof localStorage !== 'undefined') {
        try {
          const stored = localStorage.getItem(recentSearchesKey);
          if (stored) {
            setRecentSearches(JSON.parse(stored));
          }
        } catch {
          // Ignore
        }
      }
    }, [showRecentSearches, recentSearchesKey]);

    // Search hook with debouncing and abort
    const {
      query,
      setQuery,
      debouncedQuery,
      results,
      isLoading,
      error,
      isPending,
      clear,
      cancel,
    } = useSearch<SearchResult[]>({
      searchFn: onSearch || (async () => []),
      delay: debounceDelay,
      minLength,
      initialResults: [],
    });

    // Styles
    const styles = SIZE_STYLES[size];

    // Notify parent of query changes
    useEffect(() => {
      onQueryChange?.(debouncedQuery);
    }, [debouncedQuery, onQueryChange]);

    // Add to recent searches
    const addToRecentSearches = useCallback((searchQuery: string) => {
      if (!showRecentSearches || !searchQuery.trim()) return;

      setRecentSearches((prev) => {
        const filtered = prev.filter((s) => s !== searchQuery);
        const updated = [searchQuery, ...filtered].slice(0, maxRecentSearches);
        
        try {
          localStorage.setItem(recentSearchesKey, JSON.stringify(updated));
        } catch {
          // Ignore
        }
        
        return updated;
      });
    }, [showRecentSearches, maxRecentSearches, recentSearchesKey]);

    // Clear recent searches
    const clearRecentSearches = useCallback(() => {
      setRecentSearches([]);
      try {
        localStorage.removeItem(recentSearchesKey);
      } catch {
        // Ignore
      }
    }, [recentSearchesKey]);

    // Handle result selection
    const handleResultSelect = useCallback((result: SearchResult) => {
      addToRecentSearches(query);
      onResultSelect?.(result);
      setQuery('');
      setIsFocused(false);
    }, [query, addToRecentSearches, onResultSelect, setQuery]);

    // Handle recent search selection
    const handleRecentSearchSelect = useCallback((searchQuery: string) => {
      setQuery(searchQuery);
      inputRef.current?.focus();
    }, [setQuery]);

    // Handle trending search selection
    const handleTrendingSearchSelect = useCallback((searchQuery: string) => {
      setQuery(searchQuery);
      inputRef.current?.focus();
    }, [setQuery]);

    // Handle clear
    const handleClear = useCallback(() => {
      clear();
      inputRef.current?.focus();
    }, [clear]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
      const resultsList = results || [];

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < resultsList.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : resultsList.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && resultsList[selectedIndex]) {
            handleResultSelect(resultsList[selectedIndex]);
          } else if (query.trim()) {
            addToRecentSearches(query);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsFocused(false);
          cancel();
          break;
      }
    }, [results, selectedIndex, query, handleResultSelect, addToRecentSearches, cancel]);

    // Reset selected index when results change
    useEffect(() => {
      setSelectedIndex(-1);
    }, [results]);

    // Click outside to close
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsFocused(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Show dropdown
    const showDropdown = isFocused && (
      query.length >= minLength ||
      (query.length === 0 && (recentSearches.length > 0 || trendingSearches.length > 0))
    );

    // Has results
    const hasResults = results && results.length > 0;

    return (
      <div ref={containerRef} className={cn('relative', className)}>
        {/* Input container */}
        <div className={cn('relative', styles.container)}>
          {/* Search icon */}
          <Search
            className={cn(
              'absolute top-1/2 -translate-y-1/2 text-slate-400 transition-colors',
              styles.icon,
              isFocused && 'text-emerald-400'
            )}
          />

          {/* Input */}
          <input
            ref={(node) => {
              // Handle both refs
              if (typeof ref === 'function') {
                ref(node);
              } else if (ref) {
                ref.current = node;
              }
              (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
            }}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            autoFocus={autoFocus}
            className={cn(
              'w-full h-full rounded-xl bg-white/5 border border-white/10 text-white',
              'placeholder:text-slate-500 transition-all',
              'focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              styles.input,
              inputClassName
            )}
          />

          {/* Loading / Clear button */}
          {isLoading || isPending ? (
            loadingIndicator || <LoadingIndicator size={size} isPending={isPending} />
          ) : query && (
            <button
              type="button"
              onClick={handleClear}
              className={cn(
                'absolute top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors',
                styles.clearBtn
              )}
            >
              <X className={styles.spinner} />
            </button>
          )}
        </div>

        {/* Dropdown */}
        {showDropdown && (
          <div
            className={cn(
              'search-dropdown absolute top-full left-0 right-0 mt-2 rounded-xl',
              'bg-slate-900/95 backdrop-blur-xl border border-white/10 shadow-2xl',
              'max-h-[400px] overflow-y-auto z-50',
              dropdownClassName
            )}
          >
            {/* Error state */}
            {error && (
              <div className="p-4 text-center">
                {errorState || (
                  <div className="flex flex-col items-center gap-2">
                    <AlertCircle className="w-8 h-8 text-red-400" />
                    <p className="text-sm text-red-400">{error.message}</p>
                  </div>
                )}
              </div>
            )}

            {/* Results */}
            {!error && hasResults && (
              <div className="p-2 search-fade-in">
                {results!.map((result, idx) => (
                  <ResultItem
                    key={result.id}
                    result={result}
                    isSelected={idx === selectedIndex}
                    onClick={() => handleResultSelect(result)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  />
                ))}
              </div>
            )}

            {/* Empty state (after search) */}
            {!error && !hasResults && query.length >= minLength && !isLoading && !isPending && (
              <div className="p-6 text-center">
                {emptyState || (
                  <div className="flex flex-col items-center gap-2">
                    <Search className="w-8 h-8 text-slate-600" />
                    <p className="text-sm text-slate-400">
                      No results found for "{query}"
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Recent & Trending (when query is empty) */}
            {query.length === 0 && !isLoading && (
              <>
                <RecentSearchesSection
                  searches={recentSearches}
                  onSelect={handleRecentSearchSelect}
                  onClear={clearRecentSearches}
                />
                <TrendingSearchesSection
                  searches={trendingSearches}
                  onSelect={handleTrendingSearchSelect}
                />
              </>
            )}
          </div>
        )}
      </div>
    );
  }
);

// ═══════════════════════════════════════════════════════════════════════════
// SIMPLE DEBOUNCED SEARCH INPUT (No dropdown)
// ═══════════════════════════════════════════════════════════════════════════

export interface SimpleDebouncedInputProps {
  /** Current value */
  value: string;
  /** Change handler (called after debounce) */
  onChange: (value: string) => void;
  /** Debounce delay in ms */
  delay?: number;
  /** Placeholder */
  placeholder?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Disabled state */
  disabled?: boolean;
  /** Show loading indicator */
  isLoading?: boolean;
  /** Class name */
  className?: string;
}

export const SimpleDebouncedInput = memo(forwardRef<HTMLInputElement, SimpleDebouncedInputProps>(
  function SimpleDebouncedInput(
    {
      value,
      onChange,
      delay = 300,
      placeholder = 'Search...',
      size = 'md',
      disabled = false,
      isLoading = false,
      className,
    },
    ref
  ) {
    const [localValue, setLocalValue] = useState(value);
    const debouncedValue = useDebouncedValue(localValue, delay);
    const isDebouncing = localValue !== debouncedValue;

    // Sync external value
    useEffect(() => {
      setLocalValue(value);
    }, [value]);

    // Call onChange when debounced value changes
    useEffect(() => {
      if (debouncedValue !== value) {
        onChange(debouncedValue);
      }
    }, [debouncedValue, onChange, value]);

    const styles = SIZE_STYLES[size];

    return (
      <div className={cn('relative', styles.container, className)}>
        <Search
          className={cn(
            'absolute top-1/2 -translate-y-1/2 text-slate-400',
            styles.icon
          )}
        />
        <input
          ref={ref}
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'w-full h-full rounded-xl bg-white/5 border border-white/10 text-white',
            'placeholder:text-slate-500 transition-all',
            'focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            styles.input
          )}
        />
        {(isLoading || isDebouncing) && (
          <Loader2
            className={cn(
              'absolute top-1/2 -translate-y-1/2 text-slate-400',
              styles.clearBtn,
              isDebouncing ? 'search-pending' : 'search-spinner'
            )}
          />
        )}
        {!isLoading && !isDebouncing && localValue && (
          <button
            type="button"
            onClick={() => {
              setLocalValue('');
              onChange('');
            }}
            className={cn(
              'absolute top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors',
              styles.clearBtn
            )}
          >
            <X className={styles.spinner} />
          </button>
        )}
      </div>
    );
  }
));

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default SearchInput;
