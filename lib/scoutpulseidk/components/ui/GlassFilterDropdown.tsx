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
  Filter,
  X,
  Check,
  ChevronDown,
  Loader2,
  Search,
  type LucideIcon,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// CSS ANIMATIONS
// ═══════════════════════════════════════════════════════════════════════════

const filterDropdownStyles = `
/* Dropdown slide animations */
@keyframes filter-dropdown-enter {
  0% {
    opacity: 0;
    transform: translateY(-8px) scale(0.96);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes filter-dropdown-exit {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-8px) scale(0.96);
  }
}

.filter-dropdown-enter {
  animation: filter-dropdown-enter 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.filter-dropdown-exit {
  animation: filter-dropdown-exit 0.15s ease-out forwards;
}

/* Checkbox animations */
@keyframes checkbox-check {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes checkbox-uncheck {
  0% {
    transform: scale(1);
  }
  100% {
    transform: scale(0);
  }
}

.checkbox-check-enter {
  animation: checkbox-check 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.checkbox-check-exit {
  animation: checkbox-uncheck 0.15s ease-out forwards;
}

/* Option highlight animation */
@keyframes option-highlight {
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

.option-highlight-flash {
  animation: option-highlight 0.4s ease-out;
}

/* Clear button animation */
@keyframes clear-button-pop {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.clear-button-enter {
  animation: clear-button-pop 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

/* Option item stagger */
@keyframes option-item-enter {
  0% {
    opacity: 0;
    transform: translateX(-8px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

.option-item-animated {
  animation: option-item-enter 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  opacity: 0;
}

/* Loading shimmer */
@keyframes filter-shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.filter-shimmer {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.05) 25%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(255, 255, 255, 0.05) 75%
  );
  background-size: 200% 100%;
  animation: filter-shimmer 1.5s ease-in-out infinite;
}

/* Badge pulse for new selections */
@keyframes badge-pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.badge-pulse {
  animation: badge-pulse 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
`;

let stylesInjected = false;
function injectFilterStyles() {
  if (stylesInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.id = 'glass-filter-dropdown-styles';
  style.textContent = filterDropdownStyles;
  document.head.appendChild(style);
  stylesInjected = true;
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface FilterOption {
  id: string;
  label: string;
  description?: string;
  icon?: LucideIcon;
  count?: number;
  disabled?: boolean;
  group?: string;
}

export interface FilterGroup {
  id: string;
  label: string;
  options: FilterOption[];
}

export interface GlassFilterDropdownProps {
  label?: string;
  icon?: LucideIcon;
  options: FilterOption[] | FilterGroup[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  showSearch?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  emptyText?: string;
  variant?: 'default' | 'glass' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  maxHeight?: number;
  showCounts?: boolean;
  showSelectAll?: boolean;
  disabled?: boolean;
  className?: string;
  dropdownClassName?: string;
  badgeVariant?: 'count' | 'dot' | 'none';
  align?: 'left' | 'right';
  /** Enable animations */
  enableAnimations?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function isGroupedOptions(
  options: FilterOption[] | FilterGroup[]
): options is FilterGroup[] {
  return options.length > 0 && 'options' in options[0];
}

function flattenOptions(options: FilterOption[] | FilterGroup[]): FilterOption[] {
  if (isGroupedOptions(options)) {
    return options.flatMap((group) => group.options);
  }
  return options;
}

// Spring easing
const SPRING_EASING = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

// ═══════════════════════════════════════════════════════════════════════════
// STYLE CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════════════

const variantStyles = {
  default: {
    trigger: 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:shadow-sm',
    triggerActive: 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md',
    dropdown: 'bg-white border border-slate-200 shadow-2xl',
    option: 'hover:bg-slate-50 text-slate-700',
    optionActive: 'bg-emerald-50 border-l-2 border-l-emerald-500',
    optionSelected: 'bg-emerald-50/50',
    checkbox: 'border-slate-300 group-hover:border-emerald-400',
    checkboxChecked: 'bg-emerald-500 border-emerald-500',
    groupLabel: 'text-slate-500 bg-slate-50',
    search: 'bg-slate-50 border-slate-200 text-slate-700 placeholder:text-slate-400',
    badge: 'bg-emerald-500 text-white',
    badgeDot: 'bg-emerald-500',
    count: 'text-slate-400 bg-slate-100',
    clearButton: 'text-slate-500 hover:text-slate-700 hover:bg-slate-100',
    selectAll: 'text-emerald-600 hover:text-emerald-700',
    divider: 'border-slate-200',
    description: 'text-slate-500',
    kbd: 'bg-slate-100 text-slate-600',
  },
  glass: {
    trigger: 'bg-white/[0.08] backdrop-blur-xl border border-white/20 text-white hover:bg-white/[0.12] hover:border-white/30',
    triggerActive: 'border-emerald-400/50 ring-2 ring-emerald-400/30 bg-white/[0.15]',
    dropdown: 'bg-slate-900/95 backdrop-blur-xl border border-white/15 shadow-2xl shadow-black/40',
    option: 'hover:bg-white/[0.08] text-slate-200',
    optionActive: 'bg-emerald-500/20 border-l-2 border-l-emerald-400',
    optionSelected: 'bg-emerald-500/10',
    checkbox: 'border-white/30 group-hover:border-emerald-400',
    checkboxChecked: 'bg-emerald-500 border-emerald-500',
    groupLabel: 'text-slate-400 bg-white/5',
    search: 'bg-white/5 border-white/10 text-white placeholder:text-white/40',
    badge: 'bg-emerald-500 text-white',
    badgeDot: 'bg-emerald-400',
    count: 'text-slate-500 bg-white/5',
    clearButton: 'text-slate-400 hover:text-white hover:bg-white/10',
    selectAll: 'text-emerald-400 hover:text-emerald-300',
    divider: 'border-white/10',
    description: 'text-slate-400',
    kbd: 'bg-white/10 text-white/60',
  },
  dark: {
    trigger: 'bg-slate-800/90 backdrop-blur-md border border-slate-700 text-slate-200 hover:border-slate-600 hover:bg-slate-800',
    triggerActive: 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-lg shadow-emerald-500/5',
    dropdown: 'bg-slate-800/95 backdrop-blur-xl border border-slate-700 shadow-2xl',
    option: 'hover:bg-slate-700/50 text-slate-200',
    optionActive: 'bg-emerald-500/20 border-l-2 border-l-emerald-500',
    optionSelected: 'bg-emerald-500/10',
    checkbox: 'border-slate-600 group-hover:border-emerald-500',
    checkboxChecked: 'bg-emerald-500 border-emerald-500',
    groupLabel: 'text-slate-500 bg-slate-700/50',
    search: 'bg-slate-700 border-slate-600 text-slate-200 placeholder:text-slate-500',
    badge: 'bg-emerald-500 text-white',
    badgeDot: 'bg-emerald-500',
    count: 'text-slate-500 bg-slate-700',
    clearButton: 'text-slate-500 hover:text-slate-300 hover:bg-slate-700',
    selectAll: 'text-emerald-400 hover:text-emerald-300',
    divider: 'border-slate-700',
    description: 'text-slate-500',
    kbd: 'bg-slate-700 text-slate-400',
  },
};

const sizeStyles = {
  sm: {
    trigger: 'h-8 px-2.5 text-sm gap-1.5',
    dropdown: 'min-w-[200px]',
    option: 'px-2.5 py-1.5 text-sm',
    checkbox: 'h-3.5 w-3.5',
    checkIcon: 'h-2.5 w-2.5',
    badge: 'h-4 min-w-4 text-xs',
    badgeDot: 'h-2 w-2',
    search: 'h-8 text-sm px-2.5',
    groupLabel: 'px-2.5 py-1 text-xs',
    icon: 'h-3.5 w-3.5',
  },
  md: {
    trigger: 'h-10 px-3 text-sm gap-2',
    dropdown: 'min-w-[240px]',
    option: 'px-3 py-2 text-sm',
    checkbox: 'h-4 w-4',
    checkIcon: 'h-3 w-3',
    badge: 'h-5 min-w-5 text-xs',
    badgeDot: 'h-2.5 w-2.5',
    search: 'h-9 text-sm px-3',
    groupLabel: 'px-3 py-1.5 text-xs',
    icon: 'h-4 w-4',
  },
  lg: {
    trigger: 'h-12 px-4 text-base gap-2.5',
    dropdown: 'min-w-[280px]',
    option: 'px-4 py-2.5 text-base',
    checkbox: 'h-5 w-5',
    checkIcon: 'h-3.5 w-3.5',
    badge: 'h-6 min-w-6 text-sm',
    badgeDot: 'h-3 w-3',
    search: 'h-10 text-base px-4',
    groupLabel: 'px-4 py-2 text-sm',
    icon: 'h-5 w-5',
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// CHECKBOX COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface CheckboxProps {
  checked: boolean;
  variant: 'default' | 'glass' | 'dark';
  size: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  enableAnimations?: boolean;
}

function Checkbox({ checked, variant, size, disabled, enableAnimations = true }: CheckboxProps) {
  const styles = variantStyles[variant];
  const sizes = sizeStyles[size];
  const [wasChecked, setWasChecked] = useState(checked);

  useEffect(() => {
    setWasChecked(checked);
  }, [checked]);

  const shouldAnimate = enableAnimations && checked !== wasChecked;

  return (
    <div
      className={cn(
        'rounded border-2 flex items-center justify-center transition-all duration-200 shrink-0',
        sizes.checkbox,
        checked ? styles.checkboxChecked : styles.checkbox,
        disabled && 'opacity-50'
      )}
      style={{ transitionTimingFunction: SPRING_EASING }}
    >
      {checked && (
        <Check 
          className={cn(
            sizes.checkIcon, 
            'text-white stroke-[3]',
            shouldAnimate && 'checkbox-check-enter'
          )} 
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// OPTION ITEM COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface OptionItemProps {
  option: FilterOption;
  isSelected: boolean;
  isActive: boolean;
  variant: 'default' | 'glass' | 'dark';
  size: 'sm' | 'md' | 'lg';
  showCounts: boolean;
  index: number;
  enableAnimations: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}

function OptionItem({
  option,
  isSelected,
  isActive,
  variant,
  size,
  showCounts,
  index,
  enableAnimations,
  onClick,
  onMouseEnter,
}: OptionItemProps) {
  const styles = variantStyles[variant];
  const sizes = sizeStyles[size];
  const Icon = option.icon;
  const [justSelected, setJustSelected] = useState(false);

  const handleClick = () => {
    if (!isSelected) {
      setJustSelected(true);
      setTimeout(() => setJustSelected(false), 400);
    }
    onClick();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseEnter={onMouseEnter}
      disabled={option.disabled}
      className={cn(
        'w-full flex items-center gap-3 rounded-xl transition-all duration-200 group',
        sizes.option,
        styles.option,
        isActive && styles.optionActive,
        isSelected && styles.optionSelected,
        justSelected && 'option-highlight-flash',
        option.disabled && 'opacity-50 cursor-not-allowed',
        enableAnimations && 'option-item-animated'
      )}
      style={{ 
        animationDelay: enableAnimations ? `${index * 30}ms` : '0ms',
        transitionTimingFunction: SPRING_EASING 
      }}
    >
      <Checkbox
        checked={isSelected}
        variant={variant}
        size={size}
        disabled={option.disabled}
        enableAnimations={enableAnimations}
      />
      {Icon && (
        <Icon className={cn(sizes.icon, 'shrink-0 transition-colors duration-200', 
          isActive ? 'text-emerald-400' : styles.description
        )} />
      )}
      <div className="flex-1 text-left min-w-0">
        <div className="truncate">{option.label}</div>
        {option.description && (
          <div className={cn('text-xs truncate', styles.description)}>
            {option.description}
          </div>
        )}
      </div>
      {showCounts && option.count !== undefined && (
        <span className={cn(
          'text-xs tabular-nums shrink-0 px-1.5 py-0.5 rounded-md transition-colors duration-200',
          styles.count
        )}>
          {option.count}
        </span>
      )}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LOADING SKELETON
// ═══════════════════════════════════════════════════════════════════════════

function LoadingSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-1 p-1.5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-3 py-2 rounded-xl filter-shimmer"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="w-4 h-4 rounded bg-white/10" />
          <div className="flex-1 space-y-1">
            <div className="h-4 bg-white/10 rounded w-3/4" />
          </div>
          <div className="w-8 h-4 bg-white/10 rounded" />
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function GlassFilterDropdown({
  label = 'Filter',
  icon: CustomIcon,
  options,
  selectedValues,
  onChange,
  placeholder,
  searchPlaceholder = 'Search filters...',
  showSearch = false,
  isLoading = false,
  loadingText = 'Loading filters...',
  emptyText = 'No filters available',
  variant = 'glass',
  size = 'md',
  maxHeight = 300,
  showCounts = true,
  showSelectAll = true,
  disabled = false,
  className,
  dropdownClassName,
  badgeVariant = 'count',
  align = 'left',
  enableAnimations = true,
}: GlassFilterDropdownProps) {
  // State
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [badgePulse, setBadgePulse] = useState(false);
  const prevSelectedCount = useRef(selectedValues.length);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  // Inject styles
  useEffect(() => {
    injectFilterStyles();
  }, []);

  // Badge pulse on selection change
  useEffect(() => {
    if (selectedValues.length > prevSelectedCount.current) {
      setBadgePulse(true);
      setTimeout(() => setBadgePulse(false), 300);
    }
    prevSelectedCount.current = selectedValues.length;
  }, [selectedValues.length]);

  // Styles
  const styles = variantStyles[variant];
  const sizes = sizeStyles[size];

  // Flatten and filter options
  const allOptions = useMemo(() => flattenOptions(options), [options]);

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;

    const query = searchQuery.toLowerCase();

    if (isGroupedOptions(options)) {
      return options
        .map((group) => ({
          ...group,
          options: group.options.filter(
            (opt) =>
              opt.label.toLowerCase().includes(query) ||
              opt.description?.toLowerCase().includes(query)
          ),
        }))
        .filter((group) => group.options.length > 0);
    }

    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(query) ||
        opt.description?.toLowerCase().includes(query)
    );
  }, [options, searchQuery]);

  const flatFilteredOptions = useMemo(
    () => flattenOptions(filteredOptions),
    [filteredOptions]
  );

  // Computed values
  const selectedCount = selectedValues.length;
  const allSelected =
    allOptions.length > 0 &&
    allOptions.every(
      (opt) => opt.disabled || selectedValues.includes(opt.id)
    );

  const Icon = CustomIcon || Filter;

  // Handlers
  const handleToggle = () => {
    if (disabled) return;
    if (isOpen) {
      handleClose();
    } else {
      setIsOpen(true);
      setIsClosing(false);
      setSearchQuery('');
      setActiveIndex(-1);
    }
  };

  const handleClose = useCallback(() => {
    if (enableAnimations) {
      setIsClosing(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsClosing(false);
        setSearchQuery('');
        setActiveIndex(-1);
      }, 150);
    } else {
      setIsOpen(false);
      setSearchQuery('');
      setActiveIndex(-1);
    }
    triggerRef.current?.focus();
  }, [enableAnimations]);

  const handleOptionToggle = useCallback(
    (optionId: string) => {
      const option = allOptions.find((opt) => opt.id === optionId);
      if (option?.disabled) return;

      const newValues = selectedValues.includes(optionId)
        ? selectedValues.filter((v) => v !== optionId)
        : [...selectedValues, optionId];

      onChange(newValues);
    },
    [selectedValues, onChange, allOptions]
  );

  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      onChange([]);
    } else {
      const enabledOptions = allOptions
        .filter((opt) => !opt.disabled)
        .map((opt) => opt.id);
      onChange(enabledOptions);
    }
  }, [allSelected, allOptions, onChange]);

  const handleClearAll = useCallback(() => {
    onChange([]);
  }, [onChange]);

  // Keyboard navigation
  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < flatFilteredOptions.length - 1 ? prev + 1 : prev
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;

      case 'Enter':
      case ' ':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < flatFilteredOptions.length) {
          handleOptionToggle(flatFilteredOptions[activeIndex].id);
        }
        break;

      case 'Escape':
        e.preventDefault();
        handleClose();
        break;

      case 'Tab':
        handleClose();
        break;
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && optionsRef.current) {
      const activeElement = optionsRef.current.querySelector(
        `[data-index="${activeIndex}"]`
      );
      activeElement?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && showSearch) {
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }
  }, [isOpen, showSearch]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, handleClose]);

  // Track option index for keyboard nav
  let optionIndex = -1;

  const showDropdown = isOpen || isClosing;

  return (
    <div ref={containerRef} className={cn('relative inline-block', className)}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && !isOpen) {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center rounded-xl transition-all duration-200',
          sizes.trigger,
          styles.trigger,
          isOpen && styles.triggerActive,
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        style={{ transitionTimingFunction: SPRING_EASING }}
      >
        <Icon className={cn(sizes.icon, 'transition-transform duration-200', isOpen && 'scale-110')} />
        <span className="truncate">{placeholder || label}</span>

        {/* Badge */}
        {badgeVariant === 'count' && selectedCount > 0 && (
          <span
            className={cn(
              'inline-flex items-center justify-center rounded-full font-medium transition-transform duration-200',
              sizes.badge,
              styles.badge,
              badgePulse && 'badge-pulse'
            )}
          >
            {selectedCount}
          </span>
        )}
        {badgeVariant === 'dot' && selectedCount > 0 && (
          <span className={cn('rounded-full', sizes.badgeDot, styles.badgeDot, badgePulse && 'badge-pulse')} />
        )}

        <ChevronDown
          className={cn(
            sizes.icon,
            'transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div
          className={cn(
            'absolute top-full mt-2 rounded-xl overflow-hidden z-50',
            sizes.dropdown,
            styles.dropdown,
            align === 'right' ? 'right-0' : 'left-0',
            enableAnimations && (isClosing ? 'filter-dropdown-exit' : 'filter-dropdown-enter'),
            dropdownClassName
          )}
          onKeyDown={handleKeyDown}
        >
          {/* Search */}
          {showSearch && (
            <div className="p-2">
              <div className="relative">
                <Search
                  className={cn(
                    'absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200',
                    sizes.icon,
                    searchQuery ? 'text-emerald-400' : styles.description
                  )}
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setActiveIndex(-1);
                  }}
                  placeholder={searchPlaceholder}
                  className={cn(
                    'w-full rounded-xl border pl-9 pr-8 outline-none transition-all duration-200',
                    'focus:ring-2 focus:ring-emerald-500/30',
                    sizes.search,
                    styles.search
                  )}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className={cn(
                      'absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-all duration-200',
                      'hover:scale-110',
                      styles.clearButton
                    )}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Header Actions */}
          {(showSelectAll || selectedCount > 0) && !isLoading && (
            <div
              className={cn(
                'flex items-center justify-between px-3 py-2 border-b',
                styles.divider
              )}
            >
              {showSelectAll && flatFilteredOptions.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className={cn('text-sm font-medium transition-colors duration-200', styles.selectAll)}
                >
                  {allSelected ? 'Deselect all' : 'Select all'}
                </button>
              )}
              {selectedCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className={cn(
                    'text-sm flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all duration-200',
                    'hover:scale-105',
                    styles.clearButton,
                    enableAnimations && 'clear-button-enter'
                  )}
                >
                  <X className="h-3.5 w-3.5" />
                  Clear ({selectedCount})
                </button>
              )}
            </div>
          )}

          {/* Options */}
          <div
            ref={optionsRef}
            className="overflow-y-auto p-1.5"
            style={{ maxHeight }}
          >
            {/* Loading State */}
            {isLoading && <LoadingSkeleton count={5} />}

            {/* Empty State */}
            {!isLoading && flatFilteredOptions.length === 0 && (
              <div
                className={cn(
                  'flex flex-col items-center justify-center py-8 text-center',
                  styles.description
                )}
              >
                <div className="p-3 rounded-xl bg-white/5 mb-3">
                  <Filter className="h-6 w-6 opacity-50" />
                </div>
                <p className="font-medium">{searchQuery ? `No results for "${searchQuery}"` : emptyText}</p>
                {searchQuery && (
                  <p className="text-sm opacity-75 mt-1">Try a different search term</p>
                )}
              </div>
            )}

            {/* Grouped Options */}
            {!isLoading &&
              isGroupedOptions(filteredOptions) &&
              filteredOptions.map((group) => (
                <div key={group.id} className="mb-2 last:mb-0">
                  <div
                    className={cn(
                      'font-medium uppercase tracking-wider rounded-lg mb-1',
                      sizes.groupLabel,
                      styles.groupLabel
                    )}
                  >
                    {group.label}
                  </div>
                  <div className="space-y-0.5">
                    {group.options.map((option) => {
                      optionIndex++;
                      const currentIndex = optionIndex;
                      return (
                        <div key={option.id} data-index={currentIndex}>
                          <OptionItem
                            option={option}
                            isSelected={selectedValues.includes(option.id)}
                            isActive={activeIndex === currentIndex}
                            variant={variant}
                            size={size}
                            showCounts={showCounts}
                            index={currentIndex}
                            enableAnimations={enableAnimations}
                            onClick={() => handleOptionToggle(option.id)}
                            onMouseEnter={() => setActiveIndex(currentIndex)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

            {/* Flat Options */}
            {!isLoading &&
              !isGroupedOptions(filteredOptions) &&
              filteredOptions.map((option) => {
                optionIndex++;
                const currentIndex = optionIndex;
                return (
                  <div key={option.id} data-index={currentIndex}>
                    <OptionItem
                      option={option}
                      isSelected={selectedValues.includes(option.id)}
                      isActive={activeIndex === currentIndex}
                      variant={variant}
                      size={size}
                      showCounts={showCounts}
                      index={currentIndex}
                      enableAnimations={enableAnimations}
                      onClick={() => handleOptionToggle(option.id)}
                      onMouseEnter={() => setActiveIndex(currentIndex)}
                    />
                  </div>
                );
              })}
          </div>

          {/* Keyboard Hint */}
          {flatFilteredOptions.length > 0 && !isLoading && (
            <div
              className={cn(
                'flex items-center justify-center gap-4 px-3 py-2 border-t text-xs',
                styles.divider,
                styles.description
              )}
            >
              <span className="flex items-center gap-1.5">
                <kbd className={cn('px-1.5 py-0.5 rounded font-mono text-[10px]', styles.kbd)}>
                  ↑↓
                </kbd>
                <span className="opacity-75">navigate</span>
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className={cn('px-1.5 py-0.5 rounded font-mono text-[10px]', styles.kbd)}>
                  Space
                </kbd>
                <span className="opacity-75">toggle</span>
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className={cn('px-1.5 py-0.5 rounded font-mono text-[10px]', styles.kbd)}>
                  esc
                </kbd>
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
// MULTI-FILTER BAR
// ═══════════════════════════════════════════════════════════════════════════

export interface FilterConfig {
  id: string;
  label: string;
  icon?: LucideIcon;
  options: FilterOption[] | FilterGroup[];
  showSearch?: boolean;
}

interface MultiFilterBarProps {
  filters: FilterConfig[];
  values: Record<string, string[]>;
  onChange: (filterId: string, values: string[]) => void;
  onClearAll?: () => void;
  variant?: 'default' | 'glass' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function MultiFilterBar({
  filters,
  values,
  onChange,
  onClearAll,
  variant = 'glass',
  size = 'md',
  className,
}: MultiFilterBarProps) {
  const styles = variantStyles[variant];
  const totalSelected = Object.values(values).flat().length;

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      {filters.map((filter) => (
        <GlassFilterDropdown
          key={filter.id}
          label={filter.label}
          icon={filter.icon}
          options={filter.options}
          selectedValues={values[filter.id] || []}
          onChange={(newValues) => onChange(filter.id, newValues)}
          showSearch={filter.showSearch}
          variant={variant}
          size={size}
        />
      ))}

      {totalSelected > 0 && onClearAll && (
        <button
          type="button"
          onClick={onClearAll}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm transition-all duration-200',
            'hover:scale-105',
            styles.clearButton
          )}
        >
          <X className="h-3.5 w-3.5" />
          Clear all ({totalSelected})
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ACTIVE FILTERS DISPLAY
// ═══════════════════════════════════════════════════════════════════════════

interface ActiveFiltersProps {
  filters: FilterConfig[];
  values: Record<string, string[]>;
  onRemove: (filterId: string, optionId: string) => void;
  onClearAll?: () => void;
  variant?: 'default' | 'glass' | 'dark';
  className?: string;
}

export function ActiveFilters({
  filters,
  values,
  onRemove,
  onClearAll,
  variant = 'glass',
  className,
}: ActiveFiltersProps) {
  const styles = variantStyles[variant];

  const activeFilters = useMemo(() => {
    const result: Array<{
      filterId: string;
      filterLabel: string;
      optionId: string;
      optionLabel: string;
    }> = [];

    filters.forEach((filter) => {
      const selectedValues = values[filter.id] || [];
      const allOptions = flattenOptions(filter.options);

      selectedValues.forEach((optionId) => {
        const option = allOptions.find((opt) => opt.id === optionId);
        if (option) {
          result.push({
            filterId: filter.id,
            filterLabel: filter.label,
            optionId: option.id,
            optionLabel: option.label,
          });
        }
      });
    });

    return result;
  }, [filters, values]);

  if (activeFilters.length === 0) return null;

  const badgeStyles = {
    default: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200',
    glass: 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 backdrop-blur-sm',
    dark: 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30',
  };

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      <span className={cn('text-sm', styles.description)}>Active filters:</span>
      {activeFilters.map((filter) => (
        <button
          key={`${filter.filterId}-${filter.optionId}`}
          type="button"
          onClick={() => onRemove(filter.filterId, filter.optionId)}
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm transition-all duration-200 group',
            'hover:scale-105',
            badgeStyles[variant]
          )}
        >
          <span className="opacity-75">{filter.filterLabel}:</span>
          <span className="font-medium">{filter.optionLabel}</span>
          <X className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
        </button>
      ))}
      {onClearAll && activeFilters.length > 1 && (
        <button
          type="button"
          onClick={onClearAll}
          className={cn(
            'text-sm px-2.5 py-1 rounded-lg transition-all duration-200',
            'hover:scale-105',
            styles.clearButton
          )}
        >
          Clear all
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLE-SELECT FILTER
// ═══════════════════════════════════════════════════════════════════════════

interface SingleSelectFilterProps {
  label?: string;
  icon?: LucideIcon;
  options: FilterOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  variant?: 'default' | 'glass' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  enableAnimations?: boolean;
}

export function SingleSelectFilter({
  label = 'Filter',
  icon: CustomIcon,
  options,
  value,
  onChange,
  placeholder,
  variant = 'glass',
  size = 'md',
  disabled = false,
  className,
  enableAnimations = true,
}: SingleSelectFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    injectFilterStyles();
  }, []);

  const styles = variantStyles[variant];
  const sizes = sizeStyles[size];

  const Icon = CustomIcon || Filter;
  const selectedOption = options.find((opt) => opt.id === value);

  const handleClose = useCallback(() => {
    if (enableAnimations) {
      setIsClosing(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsClosing(false);
      }, 150);
    } else {
      setIsOpen(false);
    }
    triggerRef.current?.focus();
  }, [enableAnimations]);

  const handleSelect = (optionId: string) => {
    onChange(optionId === value ? null : optionId);
    handleClose();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => (prev < options.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < options.length) {
          handleSelect(options[activeIndex].id);
        }
        break;
      case 'Escape':
        e.preventDefault();
        handleClose();
        break;
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, handleClose]);

  const showDropdown = isOpen || isClosing;

  return (
    <div ref={containerRef} className={cn('relative inline-block', className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (disabled) return;
          if (isOpen) {
            handleClose();
          } else {
            setIsOpen(true);
            setIsClosing(false);
          }
        }}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center rounded-xl transition-all duration-200',
          sizes.trigger,
          styles.trigger,
          isOpen && styles.triggerActive,
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        style={{ transitionTimingFunction: SPRING_EASING }}
      >
        <Icon className={cn(sizes.icon, 'transition-transform duration-200', isOpen && 'scale-110')} />
        <span className="truncate">
          {selectedOption?.label || placeholder || label}
        </span>
        {value && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
            className={cn('p-1 rounded-lg transition-all duration-200 hover:scale-110', styles.clearButton)}
          >
            <X className="h-3 w-3" />
          </button>
        )}
        <ChevronDown
          className={cn(
            sizes.icon,
            'transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {showDropdown && (
        <div
          className={cn(
            'absolute top-full mt-2 left-0 rounded-xl overflow-hidden z-50 p-1.5',
            sizes.dropdown,
            styles.dropdown,
            enableAnimations && (isClosing ? 'filter-dropdown-exit' : 'filter-dropdown-enter')
          )}
          onKeyDown={handleKeyDown}
        >
          {options.map((option, index) => {
            const isSelected = option.id === value;
            const OptionIcon = option.icon;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelect(option.id)}
                onMouseEnter={() => setActiveIndex(index)}
                disabled={option.disabled}
                className={cn(
                  'w-full flex items-center gap-3 rounded-xl transition-all duration-200',
                  sizes.option,
                  styles.option,
                  activeIndex === index && styles.optionActive,
                  isSelected && styles.optionSelected,
                  option.disabled && 'opacity-50 cursor-not-allowed',
                  enableAnimations && 'option-item-animated'
                )}
                style={{ 
                  animationDelay: enableAnimations ? `${index * 30}ms` : '0ms',
                  transitionTimingFunction: SPRING_EASING 
                }}
              >
                {OptionIcon && (
                  <OptionIcon
                    className={cn(sizes.icon, 'shrink-0 transition-colors duration-200', 
                      activeIndex === index ? 'text-emerald-400' : styles.description
                    )}
                  />
                )}
                <span className="flex-1 text-left truncate">{option.label}</span>
                {isSelected && (
                  <Check className={cn(sizes.icon, 'text-emerald-500 shrink-0 checkbox-check-enter')} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default GlassFilterDropdown;
