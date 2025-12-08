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
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
  ChevronDown,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

export interface GlassPaginationProps {
  /** Current page (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Total number of items */
  totalItems?: number;
  /** Items per page */
  pageSize?: number;
  /** Callback when page size changes */
  onPageSizeChange?: (pageSize: number) => void;
  /** Available page size options */
  pageSizeOptions?: number[];
  /** Number of sibling pages to show */
  siblingCount?: number;
  /** Show first/last buttons */
  showFirstLast?: boolean;
  /** Show page size selector */
  showPageSizeSelector?: boolean;
  /** Show items count info */
  showItemsInfo?: boolean;
  /** Show quick jump input */
  showQuickJump?: boolean;
  /** Glass variant */
  variant?: 'default' | 'glass' | 'dark';
  /** Size */
  size?: 'sm' | 'md' | 'lg';
  /** Disabled state */
  disabled?: boolean;
  /** Additional className */
  className?: string;
}

// ============================================
// HELPERS
// ============================================

function getPageNumbers(
  currentPage: number,
  totalPages: number,
  siblingCount: number
): (number | 'left-ellipsis' | 'right-ellipsis')[] {
  const totalNumbers = siblingCount * 2 + 3; // siblings + current + first + last
  const totalBlocks = totalNumbers + 2; // + 2 for possible ellipsis

  // If total pages is less than total blocks, show all pages
  if (totalPages <= totalBlocks) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

  const showLeftEllipsis = leftSiblingIndex > 2;
  const showRightEllipsis = rightSiblingIndex < totalPages - 1;

  // Case 1: No left ellipsis, show right ellipsis
  if (!showLeftEllipsis && showRightEllipsis) {
    const leftItemCount = 1 + 2 * siblingCount + 2;
    const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
    return [...leftRange, 'right-ellipsis', totalPages];
  }

  // Case 2: Show left ellipsis, no right ellipsis
  if (showLeftEllipsis && !showRightEllipsis) {
    const rightItemCount = 1 + 2 * siblingCount + 2;
    const rightRange = Array.from(
      { length: rightItemCount },
      (_, i) => totalPages - rightItemCount + i + 1
    );
    return [1, 'left-ellipsis', ...rightRange];
  }

  // Case 3: Show both ellipsis
  const middleRange = Array.from(
    { length: rightSiblingIndex - leftSiblingIndex + 1 },
    (_, i) => leftSiblingIndex + i
  );
  return [1, 'left-ellipsis', ...middleRange, 'right-ellipsis', totalPages];
}

// ============================================
// STYLE CONFIGURATIONS
// ============================================

const variantStyles = {
  default: {
    container: 'bg-white',
    button: 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300',
    buttonActive: 'bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-600',
    buttonDisabled: 'opacity-50 cursor-not-allowed hover:bg-white hover:border-slate-200',
    ellipsis: 'text-slate-400',
    text: 'text-slate-600',
    textMuted: 'text-slate-400',
    select: 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300',
    selectDropdown: 'bg-white border border-slate-200 shadow-lg',
    selectOption: 'hover:bg-slate-50 text-slate-700',
    selectOptionActive: 'bg-slate-100',
    input: 'bg-white border border-slate-200 text-slate-700 focus:border-emerald-500 focus:ring-emerald-500/20',
  },
  glass: {
    container: 'bg-white/5 backdrop-blur-md',
    button: 'bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 hover:border-white/30',
    buttonActive: 'bg-emerald-500/80 backdrop-blur-md border-emerald-400/50 text-white hover:bg-emerald-500',
    buttonDisabled: 'opacity-40 cursor-not-allowed hover:bg-white/10 hover:border-white/20',
    ellipsis: 'text-slate-400',
    text: 'text-white',
    textMuted: 'text-slate-400',
    select: 'bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/15',
    selectDropdown: 'bg-slate-900/90 backdrop-blur-md border border-white/10 shadow-xl',
    selectOption: 'hover:bg-white/10 text-slate-200',
    selectOptionActive: 'bg-white/15',
    input: 'bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-slate-400 focus:border-emerald-400/50 focus:ring-emerald-400/20',
  },
  dark: {
    container: 'bg-slate-900',
    button: 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-slate-600',
    buttonActive: 'bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-600',
    buttonDisabled: 'opacity-50 cursor-not-allowed hover:bg-slate-800 hover:border-slate-700',
    ellipsis: 'text-slate-500',
    text: 'text-slate-200',
    textMuted: 'text-slate-500',
    select: 'bg-slate-800 border border-slate-700 text-slate-200 hover:border-slate-600',
    selectDropdown: 'bg-slate-800 border border-slate-700 shadow-xl',
    selectOption: 'hover:bg-slate-700 text-slate-200',
    selectOptionActive: 'bg-slate-700',
    input: 'bg-slate-800 border border-slate-700 text-slate-200 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20',
  },
};

const sizeStyles = {
  sm: {
    button: 'h-7 w-7 text-xs',
    buttonWide: 'h-7 px-2 text-xs',
    icon: 'h-3.5 w-3.5',
    text: 'text-xs',
    select: 'h-7 text-xs px-2',
    input: 'h-7 w-14 text-xs px-2',
    gap: 'gap-1',
  },
  md: {
    button: 'h-9 w-9 text-sm',
    buttonWide: 'h-9 px-3 text-sm',
    icon: 'h-4 w-4',
    text: 'text-sm',
    select: 'h-9 text-sm px-3',
    input: 'h-9 w-16 text-sm px-2',
    gap: 'gap-1.5',
  },
  lg: {
    button: 'h-11 w-11 text-base',
    buttonWide: 'h-11 px-4 text-base',
    icon: 'h-5 w-5',
    text: 'text-base',
    select: 'h-11 text-base px-4',
    input: 'h-11 w-20 text-base px-3',
    gap: 'gap-2',
  },
};

// ============================================
// PAGE SIZE SELECTOR COMPONENT
// ============================================

interface PageSizeSelectorProps {
  pageSize: number;
  options: number[];
  onChange: (size: number) => void;
  variant: 'default' | 'glass' | 'dark';
  size: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

function PageSizeSelector({
  pageSize,
  options,
  onChange,
  variant,
  size,
  disabled,
}: PageSizeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const styles = variantStyles[variant];
  const sizes = sizeStyles[size];

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setActiveIndex((prev) => (prev < options.length - 1 ? prev + 1 : prev));
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isOpen && activeIndex >= 0) {
          onChange(options[activeIndex]);
          setIsOpen(false);
        } else {
          setIsOpen(true);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative inline-flex items-center gap-2">
      <span className={cn(sizes.text, styles.textMuted)}>Show</span>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-between rounded-lg transition-all',
          sizes.select,
          'min-w-[70px]',
          styles.select,
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span>{pageSize}</span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 ml-1.5 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      <span className={cn(sizes.text, styles.textMuted)}>per page</span>

      {isOpen && (
        <div
          className={cn(
            'absolute bottom-full mb-1 left-1/2 -translate-x-1/2 rounded-lg overflow-hidden z-50 min-w-[70px]',
            styles.selectDropdown
          )}
        >
          {options.map((option, index) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              className={cn(
                'w-full px-3 py-1.5 text-center transition-colors',
                sizes.text,
                styles.selectOption,
                activeIndex === index && styles.selectOptionActive,
                option === pageSize && 'font-medium'
              )}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// QUICK JUMP COMPONENT
// ============================================

interface QuickJumpProps {
  currentPage: number;
  totalPages: number;
  onJump: (page: number) => void;
  variant: 'default' | 'glass' | 'dark';
  size: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

function QuickJump({
  currentPage,
  totalPages,
  onJump,
  variant,
  size,
  disabled,
}: QuickJumpProps) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const styles = variantStyles[variant];
  const sizes = sizeStyles[size];

  const handleSubmit = () => {
    const page = parseInt(inputValue, 10);
    if (!isNaN(page) && page >= 1 && page <= totalPages && page !== currentPage) {
      onJump(page);
      setInputValue('');
      inputRef.current?.blur();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="inline-flex items-center gap-2">
      <span className={cn(sizes.text, styles.textMuted)}>Go to</span>
      <input
        ref={inputRef}
        type="number"
        min={1}
        max={totalPages}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSubmit}
        disabled={disabled}
        placeholder="#"
        className={cn(
          'rounded-lg text-center outline-none transition-all focus:ring-2',
          sizes.input,
          styles.input,
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      />
    </div>
  );
}

// ============================================
// PAGINATION BUTTON COMPONENT
// ============================================

interface PaginationButtonProps {
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  variant: 'default' | 'glass' | 'dark';
  size: 'sm' | 'md' | 'lg';
  ariaLabel: string;
  children: React.ReactNode;
  className?: string;
}

function PaginationButton({
  onClick,
  disabled,
  active,
  variant,
  size,
  ariaLabel,
  children,
  className,
}: PaginationButtonProps) {
  const styles = variantStyles[variant];
  const sizes = sizeStyles[size];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'inline-flex items-center justify-center rounded-lg transition-all duration-200 font-medium',
        sizes.button,
        active ? styles.buttonActive : styles.button,
        disabled && !active && styles.buttonDisabled,
        className
      )}
    >
      {children}
    </button>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function GlassPagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize = 10,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  siblingCount = 1,
  showFirstLast = true,
  showPageSizeSelector = true,
  showItemsInfo = true,
  showQuickJump = false,
  variant = 'glass',
  size = 'md',
  disabled = false,
  className,
}: GlassPaginationProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const styles = variantStyles[variant];
  const sizes = sizeStyles[size];

  // Calculate page numbers to display
  const pageNumbers = useMemo(
    () => getPageNumbers(currentPage, totalPages, siblingCount),
    [currentPage, totalPages, siblingCount]
  );

  // Navigation state
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  // Calculate showing range
  const startItem = totalItems ? (currentPage - 1) * pageSize + 1 : null;
  const endItem = totalItems ? Math.min(currentPage * pageSize, totalItems) : null;

  // Keyboard navigation for the whole component
  const handleKeyDown = useCallback(
    (e: globalThis.KeyboardEvent) => {
      if (disabled) return;

      // Only handle if focus is within the pagination
      if (!containerRef.current?.contains(document.activeElement)) return;

      switch (e.key) {
        case 'ArrowLeft':
          if (canGoPrevious && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            onPageChange(currentPage - 1);
          }
          break;
        case 'ArrowRight':
          if (canGoNext && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            onPageChange(currentPage + 1);
          }
          break;
        case 'Home':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onPageChange(1);
          }
          break;
        case 'End':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onPageChange(totalPages);
          }
          break;
      }
    },
    [disabled, canGoPrevious, canGoNext, currentPage, totalPages, onPageChange]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Handle ellipsis click (jump by siblingCount * 2)
  const handleEllipsisClick = (direction: 'left' | 'right') => {
    const jump = siblingCount * 2 + 1;
    if (direction === 'left') {
      onPageChange(Math.max(1, currentPage - jump));
    } else {
      onPageChange(Math.min(totalPages, currentPage + jump));
    }
  };

  if (totalPages <= 0) return null;

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-4 py-2',
        className
      )}
      role="navigation"
      aria-label="Pagination"
    >
      {/* Left side: Items info & page size */}
      <div className={cn('flex items-center flex-wrap', sizes.gap)}>
        {/* Items count info */}
        {showItemsInfo && totalItems !== undefined && (
          <p className={cn(sizes.text, styles.textMuted)}>
            Showing{' '}
            <span className={cn('font-medium', styles.text)}>{startItem}</span>
            {' '}-{' '}
            <span className={cn('font-medium', styles.text)}>{endItem}</span>
            {' '}of{' '}
            <span className={cn('font-medium', styles.text)}>{totalItems}</span>
          </p>
        )}

        {/* Separator */}
        {showItemsInfo && totalItems !== undefined && showPageSizeSelector && onPageSizeChange && (
          <span className={cn('mx-2 hidden sm:inline', styles.textMuted)}>•</span>
        )}

        {/* Page size selector */}
        {showPageSizeSelector && onPageSizeChange && (
          <PageSizeSelector
            pageSize={pageSize}
            options={pageSizeOptions}
            onChange={onPageSizeChange}
            variant={variant}
            size={size}
            disabled={disabled}
          />
        )}
      </div>

      {/* Right side: Pagination controls */}
      <div className={cn('flex items-center', sizes.gap)}>
        {/* Quick jump */}
        {showQuickJump && totalPages > 10 && (
          <>
            <QuickJump
              currentPage={currentPage}
              totalPages={totalPages}
              onJump={onPageChange}
              variant={variant}
              size={size}
              disabled={disabled}
            />
            <span className={cn('mx-1 hidden sm:inline', styles.textMuted)}>•</span>
          </>
        )}

        {/* First page */}
        {showFirstLast && (
          <PaginationButton
            onClick={() => onPageChange(1)}
            disabled={disabled || !canGoPrevious}
            variant={variant}
            size={size}
            ariaLabel="First page"
          >
            <ChevronsLeft className={sizes.icon} />
          </PaginationButton>
        )}

        {/* Previous page */}
        <PaginationButton
          onClick={() => onPageChange(currentPage - 1)}
          disabled={disabled || !canGoPrevious}
          variant={variant}
          size={size}
          ariaLabel="Previous page"
        >
          <ChevronLeft className={sizes.icon} />
        </PaginationButton>

        {/* Page numbers */}
        <div className={cn('flex items-center', sizes.gap)}>
          {pageNumbers.map((pageNumber, index) => {
            // Ellipsis
            if (pageNumber === 'left-ellipsis' || pageNumber === 'right-ellipsis') {
              return (
                <button
                  key={`${pageNumber}-${index}`}
                  type="button"
                  onClick={() =>
                    handleEllipsisClick(
                      pageNumber === 'left-ellipsis' ? 'left' : 'right'
                    )
                  }
                  disabled={disabled}
                  className={cn(
                    'inline-flex items-center justify-center rounded-lg transition-all duration-200',
                    sizes.button,
                    styles.button,
                    'hover:scale-105'
                  )}
                  aria-label={
                    pageNumber === 'left-ellipsis'
                      ? 'Jump backward'
                      : 'Jump forward'
                  }
                >
                  <MoreHorizontal className={sizes.icon} />
                </button>
              );
            }

            // Page number button
            const isActive = pageNumber === currentPage;
            return (
              <PaginationButton
                key={pageNumber}
                onClick={() => onPageChange(pageNumber)}
                disabled={disabled}
                active={isActive}
                variant={variant}
                size={size}
                ariaLabel={`Page ${pageNumber}`}
              >
                {pageNumber}
              </PaginationButton>
            );
          })}
        </div>

        {/* Next page */}
        <PaginationButton
          onClick={() => onPageChange(currentPage + 1)}
          disabled={disabled || !canGoNext}
          variant={variant}
          size={size}
          ariaLabel="Next page"
        >
          <ChevronRight className={sizes.icon} />
        </PaginationButton>

        {/* Last page */}
        {showFirstLast && (
          <PaginationButton
            onClick={() => onPageChange(totalPages)}
            disabled={disabled || !canGoNext}
            variant={variant}
            size={size}
            ariaLabel="Last page"
          >
            <ChevronsRight className={sizes.icon} />
          </PaginationButton>
        )}
      </div>
    </div>
  );
}

// ============================================
// COMPACT PAGINATION (Minimal)
// ============================================

interface CompactPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  variant?: 'default' | 'glass' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export function CompactPagination({
  currentPage,
  totalPages,
  onPageChange,
  variant = 'glass',
  size = 'md',
  disabled = false,
  className,
}: CompactPaginationProps) {
  const styles = variantStyles[variant];
  const sizes = sizeStyles[size];

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <div className={cn('inline-flex items-center', sizes.gap, className)}>
      <PaginationButton
        onClick={() => onPageChange(currentPage - 1)}
        disabled={disabled || !canGoPrevious}
        variant={variant}
        size={size}
        ariaLabel="Previous page"
      >
        <ChevronLeft className={sizes.icon} />
      </PaginationButton>

      <span className={cn('px-2 tabular-nums', sizes.text, styles.text)}>
        {currentPage} / {totalPages}
      </span>

      <PaginationButton
        onClick={() => onPageChange(currentPage + 1)}
        disabled={disabled || !canGoNext}
        variant={variant}
        size={size}
        ariaLabel="Next page"
      >
        <ChevronRight className={sizes.icon} />
      </PaginationButton>
    </div>
  );
}

// ============================================
// LOAD MORE BUTTON
// ============================================

interface LoadMoreButtonProps {
  onClick: () => void;
  hasMore: boolean;
  isLoading?: boolean;
  loadingText?: string;
  variant?: 'default' | 'glass' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadMoreButton({
  onClick,
  hasMore,
  isLoading = false,
  loadingText = 'Loading...',
  variant = 'glass',
  size = 'md',
  className,
}: LoadMoreButtonProps) {
  const styles = variantStyles[variant];
  const sizes = sizeStyles[size];

  if (!hasMore && !isLoading) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading || !hasMore}
      className={cn(
        'inline-flex items-center justify-center rounded-xl transition-all duration-200 font-medium',
        sizes.buttonWide,
        styles.button,
        (isLoading || !hasMore) && styles.buttonDisabled,
        className
      )}
    >
      {isLoading ? (
        <>
          <svg
            className={cn('animate-spin mr-2', sizes.icon)}
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {loadingText}
        </>
      ) : (
        'Load more'
      )}
    </button>
  );
}

// ============================================
// INFINITE SCROLL TRIGGER
// ============================================

interface InfiniteScrollTriggerProps {
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading?: boolean;
  threshold?: number;
  className?: string;
}

export function InfiniteScrollTrigger({
  onLoadMore,
  hasMore,
  isLoading = false,
  threshold = 100,
  className,
}: InfiniteScrollTriggerProps) {
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      {
        rootMargin: `${threshold}px`,
      }
    );

    if (triggerRef.current) {
      observer.observe(triggerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore, threshold]);

  return <div ref={triggerRef} className={cn('h-1', className)} />;
}

export default GlassPagination;
