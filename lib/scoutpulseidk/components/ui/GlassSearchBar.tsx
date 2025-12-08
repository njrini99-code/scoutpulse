'use client';

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  KeyboardEvent,
} from 'react';
import { cn } from '@/lib/utils';
import {
  Search,
  X,
  Clock,
  TrendingUp,
  ArrowRight,
  Loader2,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// CSS ANIMATIONS
// ═══════════════════════════════════════════════════════════════════════════

const searchAnimationStyles = `
/* ═══════════════════════════════════════════════════════════════════
   FOCUS ANIMATIONS
═══════════════════════════════════════════════════════════════════ */

@keyframes search-focus-glow {
  0% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
  }
  50% {
    box-shadow: 0 0 20px 4px rgba(16, 185, 129, 0.15);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
  }
}

@keyframes search-focus-scale {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.01);
  }
  100% {
    transform: scale(1);
  }
}

.search-input-focused {
  animation: search-focus-scale 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* ═══════════════════════════════════════════════════════════════════
   DROPDOWN ANIMATIONS
═══════════════════════════════════════════════════════════════════ */

@keyframes dropdown-slide-in {
  0% {
    opacity: 0;
    transform: translateY(-10px) scale(0.98);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes dropdown-slide-out {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-10px) scale(0.98);
  }
}

.search-dropdown-enter {
  animation: dropdown-slide-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.search-dropdown-exit {
  animation: dropdown-slide-out 0.2s ease-out forwards;
}

/* ═══════════════════════════════════════════════════════════════════
   RESULT ITEM ANIMATIONS
═══════════════════════════════════════════════════════════════════ */

@keyframes result-item-appear {
  0% {
    opacity: 0;
    transform: translateX(-10px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes result-item-highlight {
  0% {
    background-color: transparent;
  }
  50% {
    background-color: rgba(16, 185, 129, 0.15);
  }
  100% {
    background-color: transparent;
  }
}

.result-item-animated {
  animation: result-item-appear 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  opacity: 0;
}

/* ═══════════════════════════════════════════════════════════════════
   CLEAR BUTTON ANIMATIONS
═══════════════════════════════════════════════════════════════════ */

@keyframes clear-button-appear {
  0% {
    opacity: 0;
    transform: scale(0) rotate(-90deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

@keyframes clear-button-disappear {
  0% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
  100% {
    opacity: 0;
    transform: scale(0) rotate(90deg);
  }
}

@keyframes clear-button-hover {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.15);
  }
  100% {
    transform: scale(1.1);
  }
}

.clear-button-enter {
  animation: clear-button-appear 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.clear-button-exit {
  animation: clear-button-disappear 0.15s ease-out forwards;
}

/* ═══════════════════════════════════════════════════════════════════
   TYPING INDICATOR
═══════════════════════════════════════════════════════════════════ */

@keyframes typing-dot {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-4px);
    opacity: 1;
  }
}

.typing-dot {
  animation: typing-dot 1.2s ease-in-out infinite;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.15s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.3s;
}

/* ═══════════════════════════════════════════════════════════════════
   SEARCH ICON ANIMATIONS
═══════════════════════════════════════════════════════════════════ */

@keyframes search-icon-pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.search-icon-searching {
  animation: search-icon-pulse 1s ease-in-out infinite;
}

/* ═══════════════════════════════════════════════════════════════════
   SHIMMER EFFECT FOR LOADING
═══════════════════════════════════════════════════════════════════ */

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.shimmer-loading {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.05) 25%,
    rgba(255, 255, 255, 0.15) 50%,
    rgba(255, 255, 255, 0.05) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}
`;

let stylesInjected = false;
function injectSearchStyles() {
  if (stylesInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.id = 'glass-search-styles';
  style.textContent = searchAnimationStyles;
  document.head.appendChild(style);
  stylesInjected = true;
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface SearchSuggestion {
  id: string;
  label: string;
  description?: string;
  icon?: LucideIcon;
  category?: string;
  metadata?: Record<string, unknown>;
}

export interface GlassSearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  onSelect?: (suggestion: SearchSuggestion) => void;
  suggestions?: SearchSuggestion[];
  isLoading?: boolean;
  showHistory?: boolean;
  historyKey?: string;
  maxHistoryItems?: number;
  debounceMs?: number;
  variant?: 'default' | 'glass' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  autoFocus?: boolean;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  dropdownClassName?: string;
  /** Show typing indicator while user is typing */
  showTypingIndicator?: boolean;
  /** Minimum characters before showing suggestions */
  minCharsForSuggestions?: number;
  /** Enable spring animations */
  enableAnimations?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════════════════════════

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

function useSearchHistory(key: string, maxItems: number = 10) {
  const storageKey = `search_history_${key}`;
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) setHistory(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load search history:', e);
      }
    }
  }, [storageKey]);

  const addToHistory = useCallback(
    (term: string) => {
      if (!term.trim()) return;
      setHistory((prev) => {
        const filtered = prev.filter(
          (item) => item.toLowerCase() !== term.toLowerCase()
        );
        const updated = [term, ...filtered].slice(0, maxItems);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(storageKey, JSON.stringify(updated));
          } catch (e) {
            console.error('Failed to save search history:', e);
          }
        }
        return updated;
      });
    },
    [storageKey, maxItems]
  );

  const removeFromHistory = useCallback(
    (term: string) => {
      setHistory((prev) => {
        const updated = prev.filter(
          (item) => item.toLowerCase() !== term.toLowerCase()
        );
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(storageKey, JSON.stringify(updated));
          } catch (e) {
            console.error('Failed to save search history:', e);
          }
        }
        return updated;
      });
    },
    [storageKey]
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(storageKey);
      } catch (e) {
        console.error('Failed to clear search history:', e);
      }
    }
  }, [storageKey]);

  return { history, addToHistory, removeFromHistory, clearHistory };
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLE CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════════════

const variantStyles = {
  default: {
    container: 'bg-white border border-slate-200 shadow-sm',
    containerFocused: 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-lg shadow-emerald-500/10',
    input: 'text-slate-900 placeholder:text-slate-400',
    icon: 'text-slate-400',
    iconFocused: 'text-emerald-500',
    dropdown: 'bg-white border border-slate-200 shadow-2xl',
    dropdownItem: 'hover:bg-slate-50',
    dropdownItemActive: 'bg-emerald-50 border-l-2 border-l-emerald-500',
    dropdownText: 'text-slate-700',
    dropdownSubtext: 'text-slate-500',
    clearButton: 'text-slate-400 hover:text-slate-600 hover:bg-slate-100',
    historyIcon: 'text-slate-400',
    badge: 'bg-slate-100 text-slate-600',
    typing: 'bg-slate-200',
  },
  glass: {
    container: 'bg-white/[0.08] backdrop-blur-xl border border-white/20',
    containerFocused: 'border-emerald-400/50 ring-2 ring-emerald-400/30 bg-white/[0.12] shadow-lg shadow-emerald-500/10',
    input: 'text-white placeholder:text-white/50',
    icon: 'text-white/50',
    iconFocused: 'text-emerald-400',
    dropdown: 'bg-slate-900/95 backdrop-blur-xl border border-white/15 shadow-2xl shadow-black/40',
    dropdownItem: 'hover:bg-white/[0.08]',
    dropdownItemActive: 'bg-emerald-500/20 border-l-2 border-l-emerald-400',
    dropdownText: 'text-white',
    dropdownSubtext: 'text-white/50',
    clearButton: 'text-white/50 hover:text-white hover:bg-white/10',
    historyIcon: 'text-white/40',
    badge: 'bg-white/10 text-white/70',
    typing: 'bg-white/30',
  },
  dark: {
    container: 'bg-slate-800/90 backdrop-blur-md border border-slate-700',
    containerFocused: 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-lg shadow-emerald-500/5',
    input: 'text-slate-100 placeholder:text-slate-500',
    icon: 'text-slate-500',
    iconFocused: 'text-emerald-400',
    dropdown: 'bg-slate-800/95 backdrop-blur-xl border border-slate-700 shadow-2xl',
    dropdownItem: 'hover:bg-slate-700/50',
    dropdownItemActive: 'bg-emerald-500/20 border-l-2 border-l-emerald-500',
    dropdownText: 'text-slate-200',
    dropdownSubtext: 'text-slate-500',
    clearButton: 'text-slate-500 hover:text-slate-300 hover:bg-slate-700',
    historyIcon: 'text-slate-500',
    badge: 'bg-slate-700 text-slate-400',
    typing: 'bg-slate-600',
  },
};

const sizeStyles = {
  sm: {
    container: 'h-9',
    input: 'text-sm px-3',
    icon: 'h-4 w-4',
    iconLeft: 'left-2.5',
    iconRight: 'right-2',
    paddingLeft: 'pl-8',
    paddingRight: 'pr-8',
    dropdown: 'text-sm',
    dropdownPadding: 'p-1.5',
    itemPadding: 'px-2.5 py-1.5',
  },
  md: {
    container: 'h-11',
    input: 'text-base px-4',
    icon: 'h-5 w-5',
    iconLeft: 'left-3',
    iconRight: 'right-3',
    paddingLeft: 'pl-10',
    paddingRight: 'pr-10',
    dropdown: 'text-base',
    dropdownPadding: 'p-2',
    itemPadding: 'px-3 py-2',
  },
  lg: {
    container: 'h-14',
    input: 'text-lg px-5',
    icon: 'h-6 w-6',
    iconLeft: 'left-4',
    iconRight: 'right-4',
    paddingLeft: 'pl-12',
    paddingRight: 'pr-12',
    dropdown: 'text-lg',
    dropdownPadding: 'p-2.5',
    itemPadding: 'px-4 py-2.5',
  },
};

// Spring easing
const SPRING_EASING = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

// ═══════════════════════════════════════════════════════════════════════════
// TYPING INDICATOR COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface TypingIndicatorProps {
  variant: 'default' | 'glass' | 'dark';
}

function TypingIndicator({ variant }: TypingIndicatorProps) {
  const styles = variantStyles[variant];
  return (
    <div className="flex items-center gap-1.5 px-3 py-2">
      <div className={cn('w-1.5 h-1.5 rounded-full typing-dot', styles.typing)} />
      <div className={cn('w-1.5 h-1.5 rounded-full typing-dot', styles.typing)} />
      <div className={cn('w-1.5 h-1.5 rounded-full typing-dot', styles.typing)} />
      <span className={cn('text-xs ml-1', styles.dropdownSubtext)}>Searching...</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUGGESTION ITEM COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface SuggestionItemProps {
  suggestion: SearchSuggestion;
  isActive: boolean;
  variant: 'default' | 'glass' | 'dark';
  size: 'sm' | 'md' | 'lg';
  index: number;
  enableAnimations: boolean;
  onClick: () => void;
}

function SuggestionItem({
  suggestion,
  isActive,
  variant,
  size,
  index,
  enableAnimations,
  onClick,
}: SuggestionItemProps) {
  const styles = variantStyles[variant];
  const sizes = sizeStyles[size];
  const Icon = suggestion.icon || Search;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 rounded-xl transition-all duration-200',
        sizes.itemPadding,
        styles.dropdownItem,
        isActive && styles.dropdownItemActive,
        enableAnimations && 'result-item-animated'
      )}
      style={{
        animationDelay: enableAnimations ? `${index * 50}ms` : '0ms',
        transitionTimingFunction: SPRING_EASING,
      }}
    >
      <div
        className={cn(
          'shrink-0 p-1.5 rounded-lg transition-all duration-200',
          isActive ? 'bg-emerald-500/20' : 'bg-white/5'
        )}
      >
        <Icon
          className={cn(
            'h-4 w-4 transition-colors duration-200',
            isActive ? 'text-emerald-400' : styles.dropdownSubtext
          )}
        />
      </div>
      <div className="flex-1 text-left min-w-0">
        <div className={cn('truncate font-medium', styles.dropdownText)}>
          {suggestion.label}
        </div>
        {suggestion.description && (
          <div className={cn('truncate text-sm', styles.dropdownSubtext)}>
            {suggestion.description}
          </div>
        )}
      </div>
      {suggestion.category && (
        <span
          className={cn(
            'text-xs px-2 py-0.5 rounded-full shrink-0 transition-all duration-200',
            styles.badge,
            isActive && 'bg-emerald-500/20 text-emerald-400'
          )}
        >
          {suggestion.category}
        </span>
      )}
      <ArrowRight
        className={cn(
          'h-4 w-4 shrink-0 transition-all duration-200',
          isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2',
          styles.dropdownSubtext
        )}
      />
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HISTORY ITEM COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface HistoryItemProps {
  term: string;
  isActive: boolean;
  variant: 'default' | 'glass' | 'dark';
  size: 'sm' | 'md' | 'lg';
  index: number;
  enableAnimations: boolean;
  onClick: () => void;
  onRemove: () => void;
}

function HistoryItem({
  term,
  isActive,
  variant,
  size,
  index,
  enableAnimations,
  onClick,
  onRemove,
}: HistoryItemProps) {
  const styles = variantStyles[variant];
  const sizes = sizeStyles[size];
  const [showRemove, setShowRemove] = useState(false);

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl transition-all duration-200 group',
        sizes.itemPadding,
        styles.dropdownItem,
        isActive && styles.dropdownItemActive,
        enableAnimations && 'result-item-animated'
      )}
      style={{
        animationDelay: enableAnimations ? `${index * 50}ms` : '0ms',
        transitionTimingFunction: SPRING_EASING,
      }}
      onMouseEnter={() => setShowRemove(true)}
      onMouseLeave={() => setShowRemove(false)}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex-1 flex items-center gap-3 text-left min-w-0"
      >
        <div className={cn('shrink-0 p-1.5 rounded-lg', isActive ? 'bg-emerald-500/20' : 'bg-white/5')}>
          <Clock
            className={cn(
              'h-4 w-4 transition-colors duration-200',
              isActive ? 'text-emerald-400' : styles.historyIcon
            )}
          />
        </div>
        <span className={cn('truncate', styles.dropdownText)}>{term}</span>
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className={cn(
          'p-1.5 rounded-lg transition-all duration-200',
          showRemove ? 'opacity-100 scale-100' : 'opacity-0 scale-75',
          styles.clearButton
        )}
        style={{ transitionTimingFunction: SPRING_EASING }}
        aria-label="Remove from history"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LOADING SKELETON
// ═══════════════════════════════════════════════════════════════════════════

function LoadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2 p-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-3 py-2 rounded-xl shimmer-loading"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="w-8 h-8 rounded-lg bg-white/10" />
          <div className="flex-1 space-y-1.5">
            <div className="h-4 bg-white/10 rounded w-3/4" />
            <div className="h-3 bg-white/10 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function GlassSearchBar({
  placeholder = 'Search...',
  value: controlledValue,
  onChange,
  onSearch,
  onSelect,
  suggestions = [],
  isLoading = false,
  showHistory = true,
  historyKey = 'default',
  maxHistoryItems = 5,
  debounceMs = 300,
  variant = 'glass',
  size = 'md',
  autoFocus = false,
  disabled = false,
  className,
  inputClassName,
  dropdownClassName,
  showTypingIndicator = true,
  minCharsForSuggestions = 1,
  enableAnimations = true,
}: GlassSearchBarProps) {
  // State
  const [internalValue, setInternalValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isTyping, setIsTyping] = useState(false);
  const [showClear, setShowClear] = useState(false);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Inject styles
  useEffect(() => {
    injectSearchStyles();
  }, []);

  // Controlled vs uncontrolled value
  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const setValue = (newValue: string) => {
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };

  // Debounced value
  const debouncedValue = useDebounce(value, debounceMs);

  // Search history
  const { history, addToHistory, removeFromHistory, clearHistory } =
    useSearchHistory(historyKey, maxHistoryItems);

  // Styles
  const styles = variantStyles[variant];
  const sizes = sizeStyles[size];

  // Clear button animation
  useEffect(() => {
    if (value) {
      setShowClear(true);
    } else {
      const timer = setTimeout(() => setShowClear(false), 150);
      return () => clearTimeout(timer);
    }
  }, [value]);

  // Typing indicator
  useEffect(() => {
    if (value && value.length >= minCharsForSuggestions) {
      setIsTyping(true);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, debounceMs + 100);
    } else {
      setIsTyping(false);
    }
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [value, debounceMs, minCharsForSuggestions]);

  // Compute dropdown items
  const dropdownItems = useMemo(() => {
    const items: Array<{
      type: 'suggestion' | 'history';
      data: SearchSuggestion | string;
    }> = [];

    if (value.trim().length >= minCharsForSuggestions && suggestions.length > 0) {
      suggestions.forEach((suggestion) => {
        items.push({ type: 'suggestion', data: suggestion });
      });
    } else if (showHistory && history.length > 0) {
      const filteredHistory = value.trim()
        ? history.filter((term) =>
            term.toLowerCase().includes(value.toLowerCase())
          )
        : history;

      filteredHistory.slice(0, maxHistoryItems).forEach((term) => {
        items.push({ type: 'history', data: term });
      });
    }

    return items;
  }, [value, suggestions, showHistory, history, maxHistoryItems, minCharsForSuggestions]);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    setActiveIndex(-1);
    setIsOpen(true);
    setIsClosing(false);
  };

  // Handle clear with animation
  const handleClear = () => {
    setValue('');
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  // Handle dropdown close with animation
  const handleCloseDropdown = useCallback(() => {
    if (enableAnimations) {
      setIsClosing(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsClosing(false);
      }, 200);
    } else {
      setIsOpen(false);
    }
  }, [enableAnimations]);

  // Handle search submission
  const handleSubmit = useCallback(
    (searchTerm: string) => {
      if (!searchTerm.trim()) return;
      addToHistory(searchTerm);
      onSearch?.(searchTerm);
      handleCloseDropdown();
      inputRef.current?.blur();
    },
    [addToHistory, onSearch, handleCloseDropdown]
  );

  // Handle suggestion selection
  const handleSelectSuggestion = useCallback(
    (suggestion: SearchSuggestion) => {
      setValue(suggestion.label);
      addToHistory(suggestion.label);
      onSelect?.(suggestion);
      handleCloseDropdown();
      inputRef.current?.blur();
    },
    [addToHistory, onSelect, setValue, handleCloseDropdown]
  );

  // Handle history item selection
  const handleSelectHistory = useCallback(
    (term: string) => {
      setValue(term);
      handleSubmit(term);
    },
    [setValue, handleSubmit]
  );

  // Keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setIsOpen(true);
        setIsClosing(false);
        setActiveIndex((prev) =>
          prev < dropdownItems.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < dropdownItems.length) {
          const item = dropdownItems[activeIndex];
          if (item.type === 'suggestion') {
            handleSelectSuggestion(item.data as SearchSuggestion);
          } else if (item.type === 'history') {
            handleSelectHistory(item.data as string);
          }
        } else {
          handleSubmit(value);
        }
        break;
      case 'Escape':
        e.preventDefault();
        handleCloseDropdown();
        setActiveIndex(-1);
        inputRef.current?.blur();
        break;
      case 'Tab':
        handleCloseDropdown();
        setActiveIndex(-1);
        break;
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && dropdownRef.current) {
      const activeElement = dropdownRef.current.querySelector(
        `[data-index="${activeIndex}"]`
      );
      activeElement?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        handleCloseDropdown();
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleCloseDropdown]);

  const showDropdown = (isOpen || isClosing) && (dropdownItems.length > 0 || isLoading || isTyping);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Search Input Container */}
      <div
        className={cn(
          'relative rounded-xl transition-all duration-300',
          sizes.container,
          styles.container,
          isFocused && [styles.containerFocused, enableAnimations && 'search-input-focused'],
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        style={{ transitionTimingFunction: SPRING_EASING }}
      >
        {/* Search Icon */}
        <div
          className={cn(
            'absolute top-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300',
            sizes.iconLeft,
            isFocused ? styles.iconFocused : styles.icon,
            isLoading && 'search-icon-searching'
          )}
          style={{ transitionTimingFunction: SPRING_EASING }}
        >
          {isLoading ? (
            <Loader2 className={cn(sizes.icon, 'animate-spin')} />
          ) : (
            <Search className={sizes.icon} />
          )}
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={() => {
            setIsFocused(true);
            setIsOpen(true);
            setIsClosing(false);
          }}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          className={cn(
            'w-full h-full bg-transparent outline-none transition-all duration-200',
            sizes.input,
            sizes.paddingLeft,
            value && sizes.paddingRight,
            styles.input,
            inputClassName
          )}
        />

        {/* Clear Button */}
        {showClear && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className={cn(
              'absolute top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all duration-200',
              sizes.iconRight,
              styles.clearButton,
              value ? 'clear-button-enter' : 'clear-button-exit',
              'hover:scale-110'
            )}
            style={{ transitionTimingFunction: SPRING_EASING }}
            aria-label="Clear search"
          >
            <X className={sizes.icon} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className={cn(
            'absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden z-50',
            'max-h-80 overflow-y-auto',
            sizes.dropdown,
            sizes.dropdownPadding,
            styles.dropdown,
            enableAnimations && (isClosing ? 'search-dropdown-exit' : 'search-dropdown-enter'),
            dropdownClassName
          )}
        >
          {/* Typing Indicator */}
          {showTypingIndicator && isTyping && !isLoading && (
            <TypingIndicator variant={variant} />
          )}

          {/* Loading State */}
          {isLoading && <LoadingSkeleton count={3} />}

          {/* Suggestions */}
          {!isLoading && !isTyping && value.trim().length >= minCharsForSuggestions && suggestions.length > 0 && (
            <div className="space-y-1">
              <div
                className={cn(
                  'flex items-center gap-2 text-xs font-medium uppercase tracking-wider px-3 py-1.5',
                  styles.dropdownSubtext
                )}
              >
                <Sparkles className="w-3 h-3" />
                Suggestions
              </div>
              {dropdownItems
                .filter((item) => item.type === 'suggestion')
                .map((item, index) => (
                  <div key={(item.data as SearchSuggestion).id} data-index={index}>
                    <SuggestionItem
                      suggestion={item.data as SearchSuggestion}
                      isActive={activeIndex === index}
                      variant={variant}
                      size={size}
                      index={index}
                      enableAnimations={enableAnimations}
                      onClick={() =>
                        handleSelectSuggestion(item.data as SearchSuggestion)
                      }
                    />
                  </div>
                ))}
            </div>
          )}

          {/* History */}
          {!isLoading &&
            !isTyping &&
            showHistory &&
            dropdownItems.some((item) => item.type === 'history') && (
              <div className="space-y-1">
                <div className="flex items-center justify-between px-3 py-1.5">
                  <span
                    className={cn(
                      'flex items-center gap-2 text-xs font-medium uppercase tracking-wider',
                      styles.dropdownSubtext
                    )}
                  >
                    <Clock className="w-3 h-3" />
                    Recent
                  </span>
                  <button
                    type="button"
                    onClick={clearHistory}
                    className={cn(
                      'text-xs hover:underline transition-opacity duration-200',
                      styles.dropdownSubtext,
                      'opacity-50 hover:opacity-100'
                    )}
                  >
                    Clear all
                  </button>
                </div>
                {dropdownItems
                  .filter((item) => item.type === 'history')
                  .map((item, idx) => {
                    const index = dropdownItems.findIndex(
                      (i) => i.type === 'history' && i.data === item.data
                    );
                    return (
                      <div key={item.data as string} data-index={index}>
                        <HistoryItem
                          term={item.data as string}
                          isActive={activeIndex === index}
                          variant={variant}
                          size={size}
                          index={idx}
                          enableAnimations={enableAnimations}
                          onClick={() => handleSelectHistory(item.data as string)}
                          onRemove={() => removeFromHistory(item.data as string)}
                        />
                      </div>
                    );
                  })}
              </div>
            )}

          {/* No Results */}
          {!isLoading &&
            !isTyping &&
            value.trim().length >= minCharsForSuggestions &&
            suggestions.length === 0 &&
            !dropdownItems.some((item) => item.type === 'history') && (
              <div
                className={cn(
                  'flex flex-col items-center justify-center py-8 text-center',
                  styles.dropdownSubtext
                )}
              >
                <div className="p-3 rounded-xl bg-white/5 mb-3">
                  <Search className="h-6 w-6 opacity-50" />
                </div>
                <p className="font-medium">No results found</p>
                <p className="text-sm opacity-75">Try a different search term</p>
              </div>
            )}

          {/* Keyboard Hints */}
          {dropdownItems.length > 0 && (
            <div
              className={cn(
                'flex items-center justify-center gap-4 pt-3 mt-2 border-t text-xs',
                variant === 'default' ? 'border-slate-200' : 'border-white/10',
                styles.dropdownSubtext
              )}
            >
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px]">↑↓</kbd>
                <span className="opacity-75">navigate</span>
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px]">↵</kbd>
                <span className="opacity-75">select</span>
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px]">esc</kbd>
                <span className="opacity-75">close</span>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SIMPLE SEARCH INPUT
// ═══════════════════════════════════════════════════════════════════════════

interface SimpleSearchInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  variant?: 'default' | 'glass' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  enableAnimations?: boolean;
}

export function SimpleSearchInput({
  placeholder = 'Search...',
  value: controlledValue,
  onChange,
  onSearch,
  variant = 'glass',
  size = 'md',
  disabled = false,
  className,
  enableAnimations = true,
}: SimpleSearchInputProps) {
  const [internalValue, setInternalValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showClear, setShowClear] = useState(false);

  useEffect(() => {
    injectSearchStyles();
  }, []);

  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const setValue = (newValue: string) => {
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };

  useEffect(() => {
    if (value) {
      setShowClear(true);
    } else {
      const timer = setTimeout(() => setShowClear(false), 150);
      return () => clearTimeout(timer);
    }
  }, [value]);

  const styles = variantStyles[variant];
  const sizes = sizeStyles[size];

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim()) {
      onSearch?.(value);
    }
  };

  return (
    <div
      className={cn(
        'relative rounded-xl transition-all duration-300',
        sizes.container,
        styles.container,
        isFocused && [styles.containerFocused, enableAnimations && 'search-input-focused'],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      style={{ transitionTimingFunction: SPRING_EASING }}
    >
      <Search
        className={cn(
          'absolute top-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300',
          sizes.iconLeft,
          sizes.icon,
          isFocused ? styles.iconFocused : styles.icon
        )}
        style={{ transitionTimingFunction: SPRING_EASING }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'w-full h-full bg-transparent outline-none transition-all duration-200',
          sizes.input,
          sizes.paddingLeft,
          value && sizes.paddingRight,
          styles.input
        )}
      />
      {showClear && !disabled && (
        <button
          type="button"
          onClick={() => setValue('')}
          className={cn(
            'absolute top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all duration-200',
            sizes.iconRight,
            styles.clearButton,
            value ? 'clear-button-enter' : 'clear-button-exit',
            'hover:scale-110'
          )}
          style={{ transitionTimingFunction: SPRING_EASING }}
        >
          <X className={sizes.icon} />
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SEARCH WITH BUTTON
// ═══════════════════════════════════════════════════════════════════════════

interface SearchWithButtonProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  buttonLabel?: string;
  variant?: 'default' | 'glass' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
}

export function SearchWithButton({
  placeholder = 'Search...',
  value: controlledValue,
  onChange,
  onSearch,
  buttonLabel = 'Search',
  variant = 'glass',
  size = 'md',
  disabled = false,
  isLoading = false,
  className,
}: SearchWithButtonProps) {
  const [internalValue, setInternalValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    injectSearchStyles();
  }, []);

  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const setValue = (newValue: string) => {
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };

  const styles = variantStyles[variant];
  const sizes = sizeStyles[size];

  const handleSubmit = () => {
    if (value.trim() && !disabled && !isLoading) {
      onSearch?.(value);
    }
  };

  const buttonSizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };

  return (
    <div className={cn('flex gap-2', className)}>
      <div
        className={cn(
          'relative flex-1 rounded-xl transition-all duration-300',
          sizes.container,
          styles.container,
          isFocused && styles.containerFocused,
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        style={{ transitionTimingFunction: SPRING_EASING }}
      >
        <Search
          className={cn(
            'absolute top-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300',
            sizes.iconLeft,
            sizes.icon,
            isFocused ? styles.iconFocused : styles.icon
          )}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'w-full h-full bg-transparent outline-none transition-all duration-200',
            sizes.input,
            sizes.paddingLeft,
            styles.input
          )}
        />
      </div>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={disabled || isLoading || !value.trim()}
        className={cn(
          'rounded-xl font-medium transition-all duration-300',
          'bg-emerald-500 hover:bg-emerald-600 text-white',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'flex items-center gap-2',
          'hover:scale-[1.02] active:scale-[0.98]',
          buttonSizes[size]
        )}
        style={{ transitionTimingFunction: SPRING_EASING }}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Search className="h-4 w-4" />
        )}
        {buttonLabel}
      </button>
    </div>
  );
}

export default GlassSearchBar;
