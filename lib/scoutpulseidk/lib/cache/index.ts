'use client';

/**
 * API Response Caching System
 * 
 * Features:
 * - In-memory (Map) and persistent (localStorage) storage
 * - TTL (Time-To-Live) support
 * - Cache size limits with LRU eviction
 * - Cache invalidation strategies
 * - Namespace support for organizing cache entries
 * - Automatic cleanup of expired entries
 */

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
  lastAccessed: number;
  tags?: string[];
}

export interface CacheOptions {
  /** Time-to-live in milliseconds (default: 5 minutes) */
  ttl?: number;
  /** Storage type: 'memory' | 'localStorage' | 'both' (default: 'memory') */
  storage?: 'memory' | 'localStorage' | 'both';
  /** Cache namespace/prefix */
  namespace?: string;
  /** Tags for grouping related cache entries */
  tags?: string[];
  /** Maximum cache size in entries */
  maxSize?: number;
  /** Whether to extend TTL on access (default: false) */
  refreshOnAccess?: boolean;
}

export interface CacheConfig {
  /** Default TTL in milliseconds */
  defaultTTL: number;
  /** Maximum entries in memory cache */
  maxMemorySize: number;
  /** Maximum entries in localStorage */
  maxLocalStorageSize: number;
  /** Namespace prefix for all cache keys */
  namespace: string;
  /** Enable automatic cleanup interval */
  enableAutoCleanup: boolean;
  /** Cleanup interval in milliseconds */
  cleanupInterval: number;
  /** Enable debug logging */
  debug: boolean;
}

export type CacheInvalidationStrategy = 
  | 'all'           // Clear all cache
  | 'expired'       // Clear only expired entries
  | 'namespace'     // Clear by namespace
  | 'tags'          // Clear by tags
  | 'pattern'       // Clear by key pattern
  | 'lru';          // Clear least recently used

export interface CacheStats {
  memorySize: number;
  localStorageSize: number;
  hits: number;
  misses: number;
  hitRate: number;
  oldestEntry: number | null;
  newestEntry: number | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: CacheConfig = {
  defaultTTL: 5 * 60 * 1000,      // 5 minutes
  maxMemorySize: 500,             // 500 entries
  maxLocalStorageSize: 100,       // 100 entries (localStorage is limited)
  namespace: 'sp_cache',
  enableAutoCleanup: true,
  cleanupInterval: 60 * 1000,     // 1 minute
  debug: process.env.NODE_ENV === 'development',
};

// Pre-defined TTLs for common use cases
export const CacheTTL = {
  /** 30 seconds - for real-time data */
  REALTIME: 30 * 1000,
  /** 1 minute - for frequently changing data */
  SHORT: 60 * 1000,
  /** 5 minutes - default for API responses */
  MEDIUM: 5 * 60 * 1000,
  /** 15 minutes - for semi-static data */
  LONG: 15 * 60 * 1000,
  /** 1 hour - for static data */
  HOUR: 60 * 60 * 1000,
  /** 24 hours - for rarely changing data */
  DAY: 24 * 60 * 60 * 1000,
  /** 7 days - for static resources */
  WEEK: 7 * 24 * 60 * 60 * 1000,
};

// ═══════════════════════════════════════════════════════════════════════════
// CACHE MANAGER CLASS
// ═══════════════════════════════════════════════════════════════════════════

class CacheManager {
  private memoryCache: Map<string, CacheEntry<unknown>> = new Map();
  private config: CacheConfig;
  private stats = { hits: 0, misses: 0 };
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    if (this.config.enableAutoCleanup && typeof window !== 'undefined') {
      this.startAutoCleanup();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CORE METHODS
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Get a value from cache
   */
  get<T>(key: string, options: CacheOptions = {}): T | null {
    const fullKey = this.getFullKey(key, options.namespace);
    const storage = options.storage || 'memory';

    // Try memory first
    if (storage === 'memory' || storage === 'both') {
      const memoryEntry = this.memoryCache.get(fullKey) as CacheEntry<T> | undefined;
      if (memoryEntry && !this.isExpired(memoryEntry)) {
        this.stats.hits++;
        memoryEntry.hits++;
        memoryEntry.lastAccessed = Date.now();
        
        if (options.refreshOnAccess) {
          memoryEntry.timestamp = Date.now();
        }
        
        this.log('Cache HIT (memory):', fullKey);
        return memoryEntry.data;
      }
    }

    // Try localStorage
    if (storage === 'localStorage' || storage === 'both') {
      const localEntry = this.getFromLocalStorage<T>(fullKey);
      if (localEntry && !this.isExpired(localEntry)) {
        this.stats.hits++;
        localEntry.hits++;
        localEntry.lastAccessed = Date.now();
        
        // Also store in memory for faster subsequent access
        if (storage === 'both') {
          this.memoryCache.set(fullKey, localEntry as CacheEntry<unknown>);
        }
        
        this.log('Cache HIT (localStorage):', fullKey);
        return localEntry.data;
      }
    }

    this.stats.misses++;
    this.log('Cache MISS:', fullKey);
    return null;
  }

  /**
   * Set a value in cache
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const fullKey = this.getFullKey(key, options.namespace);
    const storage = options.storage || 'memory';
    const ttl = options.ttl ?? this.config.defaultTTL;

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      hits: 0,
      lastAccessed: Date.now(),
      tags: options.tags,
    };

    // Store in memory
    if (storage === 'memory' || storage === 'both') {
      this.enforceMemorySizeLimit();
      this.memoryCache.set(fullKey, entry as CacheEntry<unknown>);
      this.log('Cache SET (memory):', fullKey, `TTL: ${ttl}ms`);
    }

    // Store in localStorage
    if (storage === 'localStorage' || storage === 'both') {
      this.enforceLocalStorageSizeLimit();
      this.setToLocalStorage(fullKey, entry);
      this.log('Cache SET (localStorage):', fullKey, `TTL: ${ttl}ms`);
    }
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string, options: CacheOptions = {}): boolean {
    const fullKey = this.getFullKey(key, options.namespace);
    const storage = options.storage || 'memory';

    if (storage === 'memory' || storage === 'both') {
      const entry = this.memoryCache.get(fullKey);
      if (entry && !this.isExpired(entry)) return true;
    }

    if (storage === 'localStorage' || storage === 'both') {
      const entry = this.getFromLocalStorage(fullKey);
      if (entry && !this.isExpired(entry)) return true;
    }

    return false;
  }

  /**
   * Delete a specific cache entry
   */
  delete(key: string, options: CacheOptions = {}): boolean {
    const fullKey = this.getFullKey(key, options.namespace);
    const storage = options.storage || 'memory';
    let deleted = false;

    if (storage === 'memory' || storage === 'both') {
      deleted = this.memoryCache.delete(fullKey) || deleted;
    }

    if (storage === 'localStorage' || storage === 'both') {
      deleted = this.deleteFromLocalStorage(fullKey) || deleted;
    }

    this.log('Cache DELETE:', fullKey, deleted ? 'success' : 'not found');
    return deleted;
  }

  /**
   * Get or set with callback (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Try to get from cache first
    const cached = this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    const data = await fetchFn();
    
    // Store in cache
    this.set(key, data, options);
    
    return data;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // INVALIDATION METHODS
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Invalidate cache based on strategy
   */
  invalidate(
    strategy: CacheInvalidationStrategy,
    options: {
      namespace?: string;
      tags?: string[];
      pattern?: string | RegExp;
      count?: number;
    } = {}
  ): number {
    let invalidatedCount = 0;

    switch (strategy) {
      case 'all':
        invalidatedCount = this.clearAll();
        break;

      case 'expired':
        invalidatedCount = this.clearExpired();
        break;

      case 'namespace':
        if (options.namespace) {
          invalidatedCount = this.clearByNamespace(options.namespace);
        }
        break;

      case 'tags':
        if (options.tags && options.tags.length > 0) {
          invalidatedCount = this.clearByTags(options.tags);
        }
        break;

      case 'pattern':
        if (options.pattern) {
          invalidatedCount = this.clearByPattern(options.pattern);
        }
        break;

      case 'lru':
        invalidatedCount = this.clearLRU(options.count || 10);
        break;
    }

    this.log(`Cache INVALIDATE (${strategy}):`, invalidatedCount, 'entries');
    return invalidatedCount;
  }

  /**
   * Clear all cache entries
   */
  clearAll(): number {
    const memoryCount = this.memoryCache.size;
    this.memoryCache.clear();

    let localCount = 0;
    if (typeof localStorage !== 'undefined') {
      const prefix = this.config.namespace;
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(prefix)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        localCount++;
      });
    }

    return memoryCount + localCount;
  }

  /**
   * Clear expired entries
   */
  clearExpired(): number {
    let count = 0;

    // Memory cache
    const memoryEntries = Array.from(this.memoryCache.entries());
    for (const [key, entry] of memoryEntries) {
      if (this.isExpired(entry)) {
        this.memoryCache.delete(key);
        count++;
      }
    }

    // localStorage
    if (typeof localStorage !== 'undefined') {
      const prefix = this.config.namespace;
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(prefix)) {
          const entry = this.getFromLocalStorage(key);
          if (entry && this.isExpired(entry)) {
            keysToRemove.push(key);
          }
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        count++;
      });
    }

    return count;
  }

  /**
   * Clear by namespace
   */
  clearByNamespace(namespace: string): number {
    const prefix = `${this.config.namespace}:${namespace}`;
    let count = 0;

    // Memory cache
    const memoryKeys = Array.from(this.memoryCache.keys());
    for (const key of memoryKeys) {
      if (key.startsWith(prefix)) {
        this.memoryCache.delete(key);
        count++;
      }
    }

    // localStorage
    if (typeof localStorage !== 'undefined') {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(prefix)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        count++;
      });
    }

    return count;
  }

  /**
   * Clear by tags
   */
  clearByTags(tags: string[]): number {
    let count = 0;
    const tagSet = new Set(tags);

    // Memory cache
    const memoryEntries = Array.from(this.memoryCache.entries());
    for (const [key, entry] of memoryEntries) {
      if (entry.tags?.some((t: string) => tagSet.has(t))) {
        this.memoryCache.delete(key);
        count++;
      }
    }

    // localStorage
    if (typeof localStorage !== 'undefined') {
      const prefix = this.config.namespace;
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(prefix)) {
          const entry = this.getFromLocalStorage(key);
          if (entry?.tags?.some(t => tagSet.has(t))) {
            keysToRemove.push(key);
          }
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        count++;
      });
    }

    return count;
  }

  /**
   * Clear by pattern
   */
  clearByPattern(pattern: string | RegExp): number {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    let count = 0;

    // Memory cache
    const memoryKeys = Array.from(this.memoryCache.keys());
    for (const key of memoryKeys) {
      if (regex.test(key)) {
        this.memoryCache.delete(key);
        count++;
      }
    }

    // localStorage
    if (typeof localStorage !== 'undefined') {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && regex.test(key)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        count++;
      });
    }

    return count;
  }

  /**
   * Clear least recently used entries
   */
  clearLRU(count: number): number {
    // Sort by last accessed time
    const entries = Array.from(this.memoryCache.entries())
      .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

    let cleared = 0;
    for (let i = 0; i < Math.min(count, entries.length); i++) {
      this.memoryCache.delete(entries[i][0]);
      cleared++;
    }

    return cleared;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STATS & DEBUGGING
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    let localStorageSize = 0;
    let oldestTimestamp: number | null = null;
    let newestTimestamp: number | null = null;

    // Count memory entries and find oldest/newest
    const memoryValues = Array.from(this.memoryCache.values());
    for (const entry of memoryValues) {
      if (oldestTimestamp === null || entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
      }
      if (newestTimestamp === null || entry.timestamp > newestTimestamp) {
        newestTimestamp = entry.timestamp;
      }
    }

    // Count localStorage entries
    if (typeof localStorage !== 'undefined') {
      const prefix = this.config.namespace;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(prefix)) {
          localStorageSize++;
        }
      }
    }

    const totalHits = this.stats.hits + this.stats.misses;
    
    return {
      memorySize: this.memoryCache.size,
      localStorageSize,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: totalHits > 0 ? this.stats.hits / totalHits : 0,
      oldestEntry: oldestTimestamp,
      newestEntry: newestTimestamp,
    };
  }

  /**
   * Get all cache keys
   */
  keys(namespace?: string): string[] {
    const prefix = namespace 
      ? `${this.config.namespace}:${namespace}`
      : this.config.namespace;

    const keys: string[] = [];

    // Memory keys
    const memoryKeys = Array.from(this.memoryCache.keys());
    for (const key of memoryKeys) {
      if (key.startsWith(prefix)) {
        keys.push(key.replace(`${this.config.namespace}:`, ''));
      }
    }

    return keys;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PRIVATE METHODS
  // ═══════════════════════════════════════════════════════════════════════

  private getFullKey(key: string, namespace?: string): string {
    if (namespace) {
      return `${this.config.namespace}:${namespace}:${key}`;
    }
    return `${this.config.namespace}:${key}`;
  }

  private isExpired(entry: CacheEntry<unknown>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private getFromLocalStorage<T>(key: string): CacheEntry<T> | null {
    if (typeof localStorage === 'undefined') return null;
    
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw) as CacheEntry<T>;
    } catch {
      return null;
    }
  }

  private setToLocalStorage<T>(key: string, entry: CacheEntry<T>): void {
    if (typeof localStorage === 'undefined') return;
    
    try {
      localStorage.setItem(key, JSON.stringify(entry));
    } catch (e) {
      // localStorage might be full
      this.log('localStorage full, clearing LRU entries');
      this.clearLRU(10);
      try {
        localStorage.setItem(key, JSON.stringify(entry));
      } catch {
        // Still failed, give up
      }
    }
  }

  private deleteFromLocalStorage(key: string): boolean {
    if (typeof localStorage === 'undefined') return false;
    
    const existed = localStorage.getItem(key) !== null;
    localStorage.removeItem(key);
    return existed;
  }

  private enforceMemorySizeLimit(): void {
    if (this.memoryCache.size >= this.config.maxMemorySize) {
      // Clear 10% of entries using LRU
      const toRemove = Math.ceil(this.config.maxMemorySize * 0.1);
      this.clearLRU(toRemove);
      this.log('Memory cache size limit reached, cleared', toRemove, 'LRU entries');
    }
  }

  private enforceLocalStorageSizeLimit(): void {
    if (typeof localStorage === 'undefined') return;

    const prefix = this.config.namespace;
    let count = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix)) {
        count++;
      }
    }

    if (count >= this.config.maxLocalStorageSize) {
      // Remove oldest entries
      const entries: { key: string; timestamp: number }[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(prefix)) {
          const entry = this.getFromLocalStorage(key);
          if (entry) {
            entries.push({ key, timestamp: entry.lastAccessed });
          }
        }
      }

      entries.sort((a, b) => a.timestamp - b.timestamp);
      const toRemove = Math.ceil(this.config.maxLocalStorageSize * 0.1);
      
      for (let i = 0; i < toRemove && i < entries.length; i++) {
        localStorage.removeItem(entries[i].key);
      }

      this.log('localStorage size limit reached, cleared', toRemove, 'entries');
    }
  }

  private startAutoCleanup(): void {
    if (this.cleanupTimer) return;
    
    this.cleanupTimer = setInterval(() => {
      const cleared = this.clearExpired();
      if (cleared > 0) {
        this.log('Auto cleanup cleared', cleared, 'expired entries');
      }
    }, this.config.cleanupInterval);
  }

  private stopAutoCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  private log(...args: unknown[]): void {
    if (this.config.debug) {
      console.log('[Cache]', ...args);
    }
  }

  /**
   * Cleanup when done (call in useEffect cleanup)
   */
  destroy(): void {
    this.stopAutoCleanup();
    this.clearAll();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════════════════

export const cache = new CacheManager();

// ═══════════════════════════════════════════════════════════════════════════
// CONVENIENCE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Cache player data
 */
export function cachePlayer<T>(playerId: string, data: T, ttl = CacheTTL.MEDIUM): void {
  cache.set(`player:${playerId}`, data, {
    ttl,
    namespace: 'players',
    tags: ['player', `player:${playerId}`],
    storage: 'both',
  });
}

/**
 * Get cached player data
 */
export function getCachedPlayer<T>(playerId: string): T | null {
  return cache.get<T>(`player:${playerId}`, { namespace: 'players', storage: 'both' });
}

/**
 * Cache search results
 */
export function cacheSearchResults<T>(query: string, results: T, ttl = CacheTTL.SHORT): void {
  const cacheKey = `search:${query.toLowerCase().trim()}`;
  cache.set(cacheKey, results, {
    ttl,
    namespace: 'search',
    tags: ['search'],
    storage: 'memory', // Search results only in memory (change quickly)
  });
}

/**
 * Get cached search results
 */
export function getCachedSearchResults<T>(query: string): T | null {
  const cacheKey = `search:${query.toLowerCase().trim()}`;
  return cache.get<T>(cacheKey, { namespace: 'search', storage: 'memory' });
}

/**
 * Cache API response
 */
export function cacheApiResponse<T>(
  endpoint: string,
  data: T,
  options: { ttl?: number; tags?: string[] } = {}
): void {
  cache.set(`api:${endpoint}`, data, {
    ttl: options.ttl ?? CacheTTL.MEDIUM,
    namespace: 'api',
    tags: ['api', ...(options.tags || [])],
    storage: 'both',
  });
}

/**
 * Get cached API response
 */
export function getCachedApiResponse<T>(endpoint: string): T | null {
  return cache.get<T>(`api:${endpoint}`, { namespace: 'api', storage: 'both' });
}

/**
 * Invalidate player cache
 */
export function invalidatePlayerCache(playerId?: string): number {
  if (playerId) {
    return cache.invalidate('tags', { tags: [`player:${playerId}`] });
  }
  return cache.invalidate('namespace', { namespace: 'players' });
}

/**
 * Invalidate search cache
 */
export function invalidateSearchCache(): number {
  return cache.invalidate('namespace', { namespace: 'search' });
}

/**
 * Invalidate all API cache
 */
export function invalidateApiCache(): number {
  return cache.invalidate('namespace', { namespace: 'api' });
}

// ═══════════════════════════════════════════════════════════════════════════
// REACT HOOK
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseCacheOptions<T> extends CacheOptions {
  /** Key for the cache entry */
  key: string;
  /** Function to fetch data when cache miss */
  fetcher?: () => Promise<T>;
  /** Whether to fetch on mount */
  fetchOnMount?: boolean;
  /** Stale-while-revalidate: return stale data while fetching fresh */
  staleWhileRevalidate?: boolean;
  /** Callback when data is fetched */
  onSuccess?: (data: T) => void;
  /** Callback when fetch fails */
  onError?: (error: Error) => void;
}

export interface UseCacheResult<T> {
  data: T | null;
  isLoading: boolean;
  isStale: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => void;
  set: (data: T) => void;
}

/**
 * React hook for using cache with automatic fetching
 */
export function useCache<T>({
  key,
  fetcher,
  fetchOnMount = true,
  staleWhileRevalidate = true,
  ttl,
  storage,
  namespace,
  tags,
  onSuccess,
  onError,
}: UseCacheOptions<T>): UseCacheResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const fetcherRef = useRef(fetcher);
  
  // Keep fetcher ref updated
  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const cacheOptions = { ttl, storage, namespace, tags };

  // Try to get from cache on mount
  useEffect(() => {
    const cached = cache.get<T>(key, cacheOptions);
    if (cached !== null) {
      setData(cached);
      
      // Check if stale (past 80% of TTL)
      // This is a simplification - in reality we'd need to check the entry timestamp
      setIsStale(false);
    }
  }, [key]);

  // Fetch function
  const refetch = useCallback(async () => {
    if (!fetcherRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      const freshData = await fetcherRef.current();
      cache.set(key, freshData, cacheOptions);
      setData(freshData);
      setIsStale(false);
      onSuccess?.(freshData);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Fetch failed');
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [key, onSuccess, onError]);

  // Fetch on mount if no cached data
  useEffect(() => {
    if (fetchOnMount && fetcherRef.current) {
      const cached = cache.get<T>(key, cacheOptions);
      
      if (cached === null) {
        // No cache, fetch
        refetch();
      } else if (staleWhileRevalidate) {
        // Have cache, but might be stale - refetch in background
        setIsStale(true);
        refetch();
      }
    }
  }, [key, fetchOnMount, staleWhileRevalidate, refetch]);

  // Invalidate function
  const invalidate = useCallback(() => {
    cache.delete(key, cacheOptions);
    setData(null);
    setIsStale(false);
  }, [key]);

  // Set function (manual cache update)
  const set = useCallback((newData: T) => {
    cache.set(key, newData, cacheOptions);
    setData(newData);
    setIsStale(false);
  }, [key]);

  return {
    data,
    isLoading,
    isStale,
    error,
    refetch,
    invalidate,
    set,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export { CacheManager };
export default cache;
