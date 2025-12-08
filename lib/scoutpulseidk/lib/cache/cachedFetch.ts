'use client';

/**
 * Cached Fetch Utilities
 * 
 * Provides fetch wrappers with automatic caching for:
 * - Player data
 * - Search results
 * - API responses
 */

import {
  cache,
  CacheTTL,
  CacheOptions,
  cachePlayer,
  getCachedPlayer,
  cacheSearchResults,
  getCachedSearchResults,
  cacheApiResponse,
  getCachedApiResponse,
} from './index';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface CachedFetchOptions extends RequestInit {
  /** Cache TTL in milliseconds */
  cacheTTL?: number;
  /** Cache namespace */
  cacheNamespace?: string;
  /** Cache tags */
  cacheTags?: string[];
  /** Skip cache and fetch fresh */
  skipCache?: boolean;
  /** Force refresh cache with fresh data */
  forceRefresh?: boolean;
  /** Storage type */
  cacheStorage?: 'memory' | 'localStorage' | 'both';
}

export interface PlayerData {
  id: string;
  full_name: string;
  primary_position: string;
  grad_year: number;
  [key: string]: unknown;
}

export interface SearchResponse<T> {
  results: T[];
  total: number;
  page: number;
  hasMore: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// CACHED FETCH
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch with automatic caching
 */
export async function cachedFetch<T>(
  url: string,
  options: CachedFetchOptions = {}
): Promise<T> {
  const {
    cacheTTL = CacheTTL.MEDIUM,
    cacheNamespace = 'api',
    cacheTags = [],
    skipCache = false,
    forceRefresh = false,
    cacheStorage = 'memory',
    ...fetchOptions
  } = options;

  // Generate cache key from URL and relevant options
  const cacheKey = generateCacheKey(url, fetchOptions);

  // Try to get from cache (unless skipping or forcing refresh)
  if (!skipCache && !forceRefresh) {
    const cached = cache.get<T>(cacheKey, {
      namespace: cacheNamespace,
      storage: cacheStorage,
    });

    if (cached !== null) {
      return cached;
    }
  }

  // Fetch fresh data
  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json() as T;

  // Cache the response
  cache.set(cacheKey, data, {
    ttl: cacheTTL,
    namespace: cacheNamespace,
    tags: ['api', ...cacheTags],
    storage: cacheStorage,
  });

  return data;
}

/**
 * Generate a cache key from URL and options
 */
function generateCacheKey(url: string, options: RequestInit): string {
  const method = options.method || 'GET';
  const body = options.body ? JSON.stringify(options.body) : '';
  
  // Only cache GET requests by default
  if (method !== 'GET') {
    return `${method}:${url}:${hashString(body)}`;
  }
  
  return url;
}

/**
 * Simple string hash for cache keys
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}

// ═══════════════════════════════════════════════════════════════════════════
// PLAYER DATA FETCHING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch player data with caching
 */
export async function fetchPlayer<T extends PlayerData>(
  playerId: string,
  options: CachedFetchOptions = {}
): Promise<T> {
  const {
    skipCache = false,
    forceRefresh = false,
    ...fetchOptions
  } = options;

  // Try cache first
  if (!skipCache && !forceRefresh) {
    const cached = getCachedPlayer<T>(playerId);
    if (cached !== null) {
      return cached;
    }
  }

  // Fetch fresh data
  const response = await fetch(`/api/players/${playerId}`, fetchOptions);

  if (!response.ok) {
    throw new Error(`Failed to fetch player: ${response.statusText}`);
  }

  const data = await response.json() as T;

  // Cache the player
  cachePlayer(playerId, data, options.cacheTTL || CacheTTL.MEDIUM);

  return data;
}

/**
 * Fetch multiple players with caching
 */
export async function fetchPlayers<T extends PlayerData>(
  playerIds: string[],
  options: CachedFetchOptions = {}
): Promise<T[]> {
  const results: T[] = [];
  const uncachedIds: string[] = [];

  // Check cache for each player
  for (const id of playerIds) {
    const cached = getCachedPlayer<T>(id);
    if (cached !== null && !options.skipCache && !options.forceRefresh) {
      results.push(cached);
    } else {
      uncachedIds.push(id);
    }
  }

  // Fetch uncached players
  if (uncachedIds.length > 0) {
    const response = await fetch('/api/players/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: uncachedIds }),
      ...options,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch players: ${response.statusText}`);
    }

    const data = await response.json() as { players: T[] };

    // Cache each player individually
    for (const player of data.players) {
      cachePlayer(player.id, player, options.cacheTTL || CacheTTL.MEDIUM);
      results.push(player);
    }
  }

  // Sort results to match original order
  const idOrder = new Map(playerIds.map((id, idx) => [id, idx]));
  results.sort((a, b) => (idOrder.get(a.id) || 0) - (idOrder.get(b.id) || 0));

  return results;
}

// ═══════════════════════════════════════════════════════════════════════════
// SEARCH WITH CACHING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Search with caching
 */
export async function cachedSearch<T>(
  query: string,
  searchFn: (query: string, signal?: AbortSignal) => Promise<SearchResponse<T>>,
  options: {
    signal?: AbortSignal;
    skipCache?: boolean;
    cacheTTL?: number;
  } = {}
): Promise<SearchResponse<T>> {
  const { signal, skipCache = false, cacheTTL = CacheTTL.SHORT } = options;

  // Try cache first
  if (!skipCache) {
    const cached = getCachedSearchResults<SearchResponse<T>>(query);
    if (cached !== null) {
      return cached;
    }
  }

  // Perform search
  const results = await searchFn(query, signal);

  // Cache results
  cacheSearchResults(query, results, cacheTTL);

  return results;
}

/**
 * Player search with caching
 */
export async function searchPlayers<T extends PlayerData>(
  query: string,
  options: CachedFetchOptions & { signal?: AbortSignal } = {}
): Promise<SearchResponse<T>> {
  const { signal, skipCache = false, forceRefresh = false, ...fetchOptions } = options;

  // Try cache first
  if (!skipCache && !forceRefresh) {
    const cached = getCachedSearchResults<SearchResponse<T>>(query);
    if (cached !== null) {
      return cached;
    }
  }

  // Perform search
  const params = new URLSearchParams({ q: query });
  const response = await fetch(`/api/players/search?${params}`, {
    signal,
    ...fetchOptions,
  });

  if (!response.ok) {
    throw new Error(`Search failed: ${response.statusText}`);
  }

  const data = await response.json() as SearchResponse<T>;

  // Cache results
  cacheSearchResults(query, data, options.cacheTTL || CacheTTL.SHORT);

  // Also cache individual players from results
  for (const player of data.results) {
    cachePlayer(player.id, player, CacheTTL.MEDIUM);
  }

  return data;
}

// ═══════════════════════════════════════════════════════════════════════════
// API CLIENT WITH CACHING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a cached API client
 */
export function createCachedApiClient(baseUrl: string = '') {
  return {
    /**
     * GET request with caching
     */
    async get<T>(
      endpoint: string,
      options: CachedFetchOptions = {}
    ): Promise<T> {
      const url = `${baseUrl}${endpoint}`;
      return cachedFetch<T>(url, { ...options, method: 'GET' });
    },

    /**
     * POST request (not cached by default)
     */
    async post<T, B = unknown>(
      endpoint: string,
      body: B,
      options: Omit<CachedFetchOptions, 'body'> = {}
    ): Promise<T> {
      const url = `${baseUrl}${endpoint}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...options.headers },
        body: JSON.stringify(body),
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    },

    /**
     * PUT request (not cached)
     */
    async put<T, B = unknown>(
      endpoint: string,
      body: B,
      options: Omit<CachedFetchOptions, 'body'> = {}
    ): Promise<T> {
      const url = `${baseUrl}${endpoint}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...options.headers },
        body: JSON.stringify(body),
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    },

    /**
     * DELETE request (not cached)
     */
    async delete<T>(
      endpoint: string,
      options: CachedFetchOptions = {}
    ): Promise<T> {
      const url = `${baseUrl}${endpoint}`;
      const response = await fetch(url, {
        method: 'DELETE',
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    },

    /**
     * Invalidate cache for endpoint
     */
    invalidate(endpoint: string): void {
      const url = `${baseUrl}${endpoint}`;
      cache.delete(url, { namespace: 'api' });
    },

    /**
     * Invalidate all cached data
     */
    invalidateAll(): void {
      cache.invalidate('namespace', { namespace: 'api' });
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// PRE-CONFIGURED CLIENTS
// ═══════════════════════════════════════════════════════════════════════════

/** API client for player endpoints */
export const playerApi = {
  async getById<T extends PlayerData>(id: string, options?: CachedFetchOptions): Promise<T> {
    return fetchPlayer<T>(id, options);
  },

  async getMultiple<T extends PlayerData>(ids: string[], options?: CachedFetchOptions): Promise<T[]> {
    return fetchPlayers<T>(ids, options);
  },

  async search<T extends PlayerData>(
    query: string,
    options?: CachedFetchOptions & { signal?: AbortSignal }
  ): Promise<SearchResponse<T>> {
    return searchPlayers<T>(query, options);
  },

  invalidatePlayer(playerId: string): void {
    cache.invalidate('tags', { tags: [`player:${playerId}`] });
  },

  invalidateAll(): void {
    cache.invalidate('namespace', { namespace: 'players' });
  },
};

/** Generic API client */
export const api = createCachedApiClient('/api');

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  cachedFetch,
  fetchPlayer,
  fetchPlayers,
  cachedSearch,
  searchPlayers,
  createCachedApiClient,
  playerApi,
  api,
};
