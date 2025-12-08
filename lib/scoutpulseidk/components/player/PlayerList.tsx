'use client';

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { cn } from '@/lib/utils';
import {
  PlayerListItem,
  type PlayerListItemData,
} from '@/components/shared/player-list-item';
import {
  RefreshCw,
  AlertCircle,
  WifiOff,
  Users,
  Search,
  Filter,
  Loader2,
  ChevronDown,
  X,
  Inbox,
  UserPlus,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// CSS ANIMATIONS
// ═══════════════════════════════════════════════════════════════════════════

const playerListStyles = `
/* Skeleton shimmer */
@keyframes skeleton-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton-shimmer {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.05) 25%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(255, 255, 255, 0.05) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
}

/* Fade in animation */
@keyframes player-list-fade-in {
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
}

.player-item-animated {
  animation: player-list-fade-in 0.3s ease-out forwards;
}

/* Error shake */
@keyframes error-shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-5px); }
  40%, 80% { transform: translateX(5px); }
}

.error-shake {
  animation: error-shake 0.4s ease-in-out;
}

/* Retry spin */
@keyframes retry-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.retry-spinning {
  animation: retry-spin 1s linear infinite;
}

/* Pulse for network error */
@keyframes network-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.network-pulse {
  animation: network-pulse 2s ease-in-out infinite;
}

/* Stagger animation for list items */
.player-list-stagger > * {
  opacity: 0;
  animation: player-list-fade-in 0.3s ease-out forwards;
}

.player-list-stagger > *:nth-child(1) { animation-delay: 0ms; }
.player-list-stagger > *:nth-child(2) { animation-delay: 50ms; }
.player-list-stagger > *:nth-child(3) { animation-delay: 100ms; }
.player-list-stagger > *:nth-child(4) { animation-delay: 150ms; }
.player-list-stagger > *:nth-child(5) { animation-delay: 200ms; }
.player-list-stagger > *:nth-child(6) { animation-delay: 250ms; }
.player-list-stagger > *:nth-child(7) { animation-delay: 300ms; }
.player-list-stagger > *:nth-child(8) { animation-delay: 350ms; }
.player-list-stagger > *:nth-child(9) { animation-delay: 400ms; }
.player-list-stagger > *:nth-child(10) { animation-delay: 450ms; }
`;

let stylesInjected = false;
function injectPlayerListStyles() {
  if (stylesInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.id = 'player-list-styles';
  style.textContent = playerListStyles;
  document.head.appendChild(style);
  stylesInjected = true;
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export type ErrorType = 'network' | 'server' | 'timeout' | 'validation' | 'unknown';

export interface PlayerListError {
  type: ErrorType;
  message: string;
  code?: string;
  retryable: boolean;
  originalError?: Error;
}

export interface FetchPlayersOptions {
  page?: number;
  limit?: number;
  search?: string;
  filters?: Record<string, unknown>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FetchPlayersResult {
  players: PlayerListItemData[];
  total: number;
  page: number;
  hasMore: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// ERROR UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

function classifyError(error: unknown): PlayerListError {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      type: 'network',
      message: 'Unable to connect. Please check your internet connection.',
      retryable: true,
      originalError: error,
    };
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('offline') || message.includes('failed to fetch')) {
      return {
        type: 'network',
        message: 'Network error. Please check your connection and try again.',
        retryable: true,
        originalError: error,
      };
    }

    if (message.includes('timeout') || message.includes('timed out')) {
      return {
        type: 'timeout',
        message: 'Request timed out. Please try again.',
        retryable: true,
        originalError: error,
      };
    }

    if (message.includes('500') || message.includes('server')) {
      return {
        type: 'server',
        message: 'Server error. Please try again later.',
        retryable: true,
        originalError: error,
      };
    }

    if (message.includes('validation') || message.includes('invalid')) {
      return {
        type: 'validation',
        message: 'Invalid request. Please check your filters.',
        retryable: false,
        originalError: error,
      };
    }

    return {
      type: 'unknown',
      message: error.message || 'An unexpected error occurred.',
      retryable: true,
      originalError: error,
    };
  }

  return {
    type: 'unknown',
    message: 'An unexpected error occurred.',
    retryable: true,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SKELETON COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function PlayerListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5"
        >
          {/* Avatar skeleton */}
          <div className="w-12 h-12 rounded-full skeleton-shimmer" />
          
          {/* Content skeleton */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-4 w-32 rounded skeleton-shimmer" />
              <div className="h-5 w-12 rounded-full skeleton-shimmer" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-5 w-16 rounded-full skeleton-shimmer" />
              <div className="h-4 w-20 rounded skeleton-shimmer" />
            </div>
          </div>
          
          {/* Action skeleton */}
          <div className="h-8 w-20 rounded-lg skeleton-shimmer" />
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EMPTY STATE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface EmptyStateProps {
  type: 'no-data' | 'no-results' | 'filtered';
  searchQuery?: string;
  onClearSearch?: () => void;
  onClearFilters?: () => void;
  onAddPlayer?: () => void;
  className?: string;
}

function EmptyState({
  type,
  searchQuery,
  onClearSearch,
  onClearFilters,
  onAddPlayer,
  className,
}: EmptyStateProps) {
  const config = {
    'no-data': {
      icon: Users,
      title: 'No players yet',
      description: 'Start building your roster by adding players.',
      action: onAddPlayer && {
        label: 'Add Player',
        icon: UserPlus,
        onClick: onAddPlayer,
      },
    },
    'no-results': {
      icon: Search,
      title: searchQuery ? `No results for "${searchQuery}"` : 'No results found',
      description: 'Try adjusting your search terms.',
      action: onClearSearch && {
        label: 'Clear Search',
        icon: X,
        onClick: onClearSearch,
      },
    },
    'filtered': {
      icon: Filter,
      title: 'No matching players',
      description: 'No players match your current filters.',
      action: onClearFilters && {
        label: 'Clear Filters',
        icon: X,
        onClick: onClearFilters,
      },
    },
  };

  const { icon: Icon, title, description, action } = config[type];

  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-6 text-center player-item-animated',
      className
    )}>
      <div className="p-4 rounded-2xl bg-white/5 mb-6">
        <Icon className="w-10 h-10 text-white/40" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400 max-w-sm mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-all hover:scale-105"
        >
          <action.icon className="w-4 h-4" />
          {action.label}
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ERROR STATE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface ErrorStateProps {
  error: PlayerListError;
  onRetry?: () => void;
  isRetrying?: boolean;
  retryCount?: number;
  maxRetries?: number;
  className?: string;
}

function ErrorState({
  error,
  onRetry,
  isRetrying,
  retryCount = 0,
  maxRetries = 3,
  className,
}: ErrorStateProps) {
  const isNetworkError = error.type === 'network';
  const canRetry = error.retryable && retryCount < maxRetries;

  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-6 text-center error-shake',
      className
    )}>
      <div className={cn(
        'p-4 rounded-2xl mb-6',
        isNetworkError ? 'bg-amber-500/20 network-pulse' : 'bg-red-500/20'
      )}>
        {isNetworkError ? (
          <WifiOff className="w-10 h-10 text-amber-400" />
        ) : (
          <AlertCircle className="w-10 h-10 text-red-400" />
        )}
      </div>
      
      <h3 className="text-xl font-semibold text-white mb-2">
        {isNetworkError ? 'Connection Lost' : 'Failed to Load Players'}
      </h3>
      
      <p className="text-slate-400 max-w-sm mb-2">{error.message}</p>
      
      {error.code && (
        <p className="text-xs text-slate-500 mb-4 font-mono">
          Error code: {error.code}
        </p>
      )}

      {canRetry && onRetry && (
        <div className="space-y-3">
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className={cn(
              'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all',
              isNetworkError
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-red-500 hover:bg-red-600 text-white',
              isRetrying && 'opacity-70 cursor-not-allowed'
            )}
          >
            <RefreshCw className={cn('w-4 h-4', isRetrying && 'retry-spinning')} />
            {isRetrying ? 'Retrying...' : 'Try Again'}
          </button>
          
          {retryCount > 0 && (
            <p className="text-xs text-slate-500">
              Attempt {retryCount} of {maxRetries}
            </p>
          )}
        </div>
      )}

      {!canRetry && retryCount >= maxRetries && (
        <p className="text-sm text-red-400">
          Maximum retry attempts reached. Please try again later.
        </p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// FALLBACK CONTENT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface FallbackContentProps {
  cachedPlayers?: PlayerListItemData[];
  lastUpdated?: Date;
  onRefresh?: () => void;
  className?: string;
}

function FallbackContent({
  cachedPlayers = [],
  lastUpdated,
  onRefresh,
  className,
}: FallbackContentProps) {
  if (cachedPlayers.length === 0) {
    return (
      <div className={cn(
        'flex flex-col items-center justify-center py-12 px-6 text-center',
        className
      )}>
        <div className="p-4 rounded-2xl bg-amber-500/20 mb-6">
          <Inbox className="w-10 h-10 text-amber-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">No Cached Data</h3>
        <p className="text-slate-400 max-w-sm mb-6">
          Unable to load players and no cached data is available.
        </p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        )}
      </div>
    );
  }

  const formatTime = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Warning banner */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <WifiOff className="w-5 h-5 text-amber-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-amber-200">
            Showing cached data from {lastUpdated ? formatTime(lastUpdated) : 'earlier'}
          </p>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="shrink-0 px-3 py-1 text-sm rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 transition-colors"
          >
            Refresh
          </button>
        )}
      </div>

      {/* Cached players list */}
      <div className="space-y-3 opacity-80">
        {cachedPlayers.map((player) => (
          <PlayerListItem key={player.id} player={player} />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PLAYER LIST COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export interface PlayerListProps {
  // Data source
  fetchPlayers?: (options: FetchPlayersOptions) => Promise<FetchPlayersResult>;
  players?: PlayerListItemData[];
  
  // Loading & pagination
  initialPage?: number;
  pageSize?: number;
  enablePagination?: boolean;
  enableInfiniteScroll?: boolean;
  
  // Search & filter
  searchQuery?: string;
  filters?: Record<string, unknown>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  
  // Error handling
  maxRetries?: number;
  retryDelay?: number;
  enableCache?: boolean;
  cacheKey?: string;
  
  // Callbacks
  onPlayerClick?: (player: PlayerListItemData) => void;
  onError?: (error: PlayerListError) => void;
  onLoadSuccess?: (result: FetchPlayersResult) => void;
  
  // Customization
  emptyStateAction?: () => void;
  renderItem?: (player: PlayerListItemData, index: number) => ReactNode;
  renderEmpty?: () => ReactNode;
  renderError?: (error: PlayerListError, retry: () => void) => ReactNode;
  renderLoading?: () => ReactNode;
  
  // Styling
  className?: string;
  itemClassName?: string;
}

export function PlayerList({
  fetchPlayers,
  players: propPlayers,
  initialPage = 1,
  pageSize = 10,
  enablePagination = false,
  enableInfiniteScroll = false,
  searchQuery = '',
  filters = {},
  sortBy,
  sortOrder = 'desc',
  maxRetries = 3,
  retryDelay = 1000,
  enableCache = true,
  cacheKey = 'player_list_cache',
  onPlayerClick,
  onError,
  onLoadSuccess,
  emptyStateAction,
  renderItem,
  renderEmpty,
  renderError,
  renderLoading,
  className,
  itemClassName,
}: PlayerListProps) {
  // State
  const [players, setPlayers] = useState<PlayerListItemData[]>(propPlayers || []);
  const [loadingState, setLoadingState] = useState<LoadingState>(propPlayers ? 'success' : 'idle');
  const [error, setError] = useState<PlayerListError | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [cachedPlayers, setCachedPlayers] = useState<PlayerListItemData[]>([]);
  const [cacheTimestamp, setCacheTimestamp] = useState<Date | null>(null);

  // Inject styles
  useEffect(() => {
    injectPlayerListStyles();
  }, []);

  // Load from cache on mount
  useEffect(() => {
    if (enableCache && typeof localStorage !== 'undefined') {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { players: cachedData, timestamp } = JSON.parse(cached);
          setCachedPlayers(cachedData);
          setCacheTimestamp(new Date(timestamp));
        }
      } catch {
        // Ignore cache read errors
      }
    }
  }, [enableCache, cacheKey]);

  // Save to cache
  const saveToCache = useCallback((playersToCache: PlayerListItemData[]) => {
    if (enableCache && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          players: playersToCache,
          timestamp: Date.now(),
        }));
        setCachedPlayers(playersToCache);
        setCacheTimestamp(new Date());
      } catch {
        // Ignore cache write errors
      }
    }
  }, [enableCache, cacheKey]);

  // Fetch data
  const loadPlayers = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (!fetchPlayers) return;

    setLoadingState(append ? 'loading' : 'loading');
    setError(null);

    try {
      const result = await fetchPlayers({
        page: pageNum,
        limit: pageSize,
        search: searchQuery,
        filters,
        sortBy,
        sortOrder,
      });

      const newPlayers = append ? [...players, ...result.players] : result.players;
      setPlayers(newPlayers);
      setTotal(result.total);
      setHasMore(result.hasMore);
      setPage(pageNum);
      setLoadingState('success');
      setRetryCount(0);

      // Cache successful result
      saveToCache(newPlayers);

      onLoadSuccess?.(result);
    } catch (err) {
      const classifiedError = classifyError(err);
      setError(classifiedError);
      setLoadingState('error');
      onError?.(classifiedError);
    }
  }, [fetchPlayers, pageSize, searchQuery, filters, sortBy, sortOrder, players, saveToCache, onLoadSuccess, onError]);

  // Initial load
  useEffect(() => {
    if (fetchPlayers && loadingState === 'idle') {
      loadPlayers(initialPage);
    }
  }, [fetchPlayers, loadingState, loadPlayers, initialPage]);

  // Reload on search/filter change
  useEffect(() => {
    if (fetchPlayers && loadingState !== 'idle') {
      setPage(1);
      loadPlayers(1);
    }
  }, [searchQuery, filters, sortBy, sortOrder]);

  // Retry with delay
  const handleRetry = useCallback(async () => {
    if (retryCount >= maxRetries) return;

    setIsRetrying(true);
    setRetryCount((c) => c + 1);

    // Exponential backoff
    const delay = retryDelay * Math.pow(2, retryCount);
    await new Promise((resolve) => setTimeout(resolve, delay));

    await loadPlayers(page);
    setIsRetrying(false);
  }, [retryCount, maxRetries, retryDelay, loadPlayers, page]);

  // Load more for infinite scroll
  const loadMore = useCallback(() => {
    if (hasMore && loadingState !== 'loading') {
      loadPlayers(page + 1, true);
    }
  }, [hasMore, loadingState, loadPlayers, page]);

  // Clear search/filters
  const handleClearSearch = useCallback(() => {
    // This should be handled by parent, but we can trigger a reload
    loadPlayers(1);
  }, [loadPlayers]);

  // Determine empty state type
  const emptyStateType = useMemo((): EmptyStateProps['type'] => {
    if (searchQuery) return 'no-results';
    if (Object.keys(filters).length > 0) return 'filtered';
    return 'no-data';
  }, [searchQuery, filters]);

  // Update from props
  useEffect(() => {
    if (propPlayers) {
      setPlayers(propPlayers);
      setLoadingState('success');
    }
  }, [propPlayers]);

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  // Loading state
  if (loadingState === 'loading' && players.length === 0) {
    if (renderLoading) {
      return <>{renderLoading()}</>;
    }
    return (
      <div className={className}>
        <PlayerListSkeleton count={pageSize} />
      </div>
    );
  }

  // Error state
  if (loadingState === 'error' && error) {
    // Show fallback content if we have cached data
    if (enableCache && cachedPlayers.length > 0) {
      return (
        <div className={className}>
          <FallbackContent
            cachedPlayers={cachedPlayers}
            lastUpdated={cacheTimestamp || undefined}
            onRefresh={handleRetry}
          />
        </div>
      );
    }

    // Custom error renderer
    if (renderError) {
      return <>{renderError(error, handleRetry)}</>;
    }

    return (
      <div className={className}>
        <ErrorState
          error={error}
          onRetry={handleRetry}
          isRetrying={isRetrying}
          retryCount={retryCount}
          maxRetries={maxRetries}
        />
      </div>
    );
  }

  // Empty state
  if (loadingState === 'success' && players.length === 0) {
    if (renderEmpty) {
      return <>{renderEmpty()}</>;
    }
    return (
      <div className={className}>
        <EmptyState
          type={emptyStateType}
          searchQuery={searchQuery}
          onClearSearch={handleClearSearch}
          onClearFilters={handleClearSearch}
          onAddPlayer={emptyStateAction}
        />
      </div>
    );
  }

  // Player list
  return (
    <div className={cn('space-y-3', className)}>
      {/* Player items */}
      <div className="space-y-3 player-list-stagger">
        {players.map((player, index) => (
          renderItem ? (
            <div key={player.id}>{renderItem(player, index)}</div>
          ) : (
            <PlayerListItem
              key={player.id}
              player={player}
              onClick={() => onPlayerClick?.(player)}
              className={itemClassName}
            />
          )
        ))}
      </div>

      {/* Loading more indicator */}
      {loadingState === 'loading' && players.length > 0 && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
          <span className="ml-2 text-sm text-slate-400">Loading more...</span>
        </div>
      )}

      {/* Load more button */}
      {enablePagination && hasMore && loadingState !== 'loading' && (
        <div className="flex justify-center pt-4">
          <button
            onClick={loadMore}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium transition-all"
          >
            <ChevronDown className="w-4 h-4" />
            Load More
          </button>
        </div>
      )}

      {/* Total count */}
      {total > 0 && (
        <p className="text-center text-sm text-slate-500 pt-2">
          Showing {players.length} of {total} players
        </p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOK FOR PLAYER LIST DATA
// ═══════════════════════════════════════════════════════════════════════════

export interface UsePlayerListOptions {
  fetchFn: (options: FetchPlayersOptions) => Promise<FetchPlayersResult>;
  initialOptions?: FetchPlayersOptions;
  maxRetries?: number;
  retryDelay?: number;
  enableCache?: boolean;
  cacheKey?: string;
}

export function usePlayerList({
  fetchFn,
  initialOptions = {},
  maxRetries = 3,
  retryDelay = 1000,
  enableCache = true,
  cacheKey = 'player_list_hook_cache',
}: UsePlayerListOptions) {
  const [players, setPlayers] = useState<PlayerListItemData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PlayerListError | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const fetch = useCallback(async (options: FetchPlayersOptions = {}, append = false) => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn({ ...initialOptions, ...options });
      setPlayers(append ? (prev) => [...prev, ...result.players] : result.players);
      setTotal(result.total);
      setHasMore(result.hasMore);
      setRetryCount(0);

      // Cache
      if (enableCache && typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(cacheKey, JSON.stringify({
            players: result.players,
            timestamp: Date.now(),
          }));
        } catch {
          // Ignore
        }
      }
    } catch (err) {
      setError(classifyError(err));
    } finally {
      setLoading(false);
    }
  }, [fetchFn, initialOptions, enableCache, cacheKey]);

  const retry = useCallback(async () => {
    if (retryCount >= maxRetries) return;
    setRetryCount((c) => c + 1);
    const delay = retryDelay * Math.pow(2, retryCount);
    await new Promise((resolve) => setTimeout(resolve, delay));
    await fetch();
  }, [retryCount, maxRetries, retryDelay, fetch]);

  const loadMore = useCallback(async (page: number) => {
    if (!hasMore || loading) return;
    await fetch({ page }, true);
  }, [hasMore, loading, fetch]);

  const reset = useCallback(() => {
    setPlayers([]);
    setError(null);
    setRetryCount(0);
    setHasMore(true);
  }, []);

  return {
    players,
    loading,
    error,
    retryCount,
    hasMore,
    total,
    fetch,
    retry,
    loadMore,
    reset,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export type { PlayerListItemData };
export default PlayerList;
