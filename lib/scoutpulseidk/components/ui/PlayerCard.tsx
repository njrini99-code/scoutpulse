'use client';

import { useState, useEffect, ReactNode, memo, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { GlassCard } from './GlassCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Sparkles,
  TrendingUp,
  MapPin,
  Calendar,
  Ruler,
  Weight,
  Star,
  Eye,
  Plus,
  ChevronRight,
  CheckCircle2,
  Zap,
  Target,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface PlayerData {
  id: string;
  name: string;
  avatarUrl?: string | null;
  gradYear?: number;
  state?: string;
  city?: string;
  primaryPosition: string;
  secondaryPosition?: string;
  height?: string;
  weight?: number;
  bats?: 'L' | 'R' | 'S';
  throws?: 'L' | 'R';
  gpa?: number;
  metrics?: string[];
  verified?: boolean;
  trending?: boolean;
  topSchool?: string;
  rating?: number;
  committed?: boolean;
  committedTo?: string;
  // Extended metrics for calculations
  pitchVelo?: number;
  exitVelo?: number;
  sixtyTime?: number;
  popTime?: number;
  armStrength?: number;
  sprintSpeed?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// PERFORMANCE CALCULATION UTILITIES (Expensive operations)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate a player's overall performance score (0-100)
 * This is an expensive calculation that should be memoized
 */
function calculatePerformanceScore(player: PlayerData): number {
  const weights = {
    pitchVelo: 0.20,
    exitVelo: 0.18,
    sixtyTime: 0.15,
    popTime: 0.12,
    armStrength: 0.10,
    sprintSpeed: 0.10,
    gpa: 0.08,
    rating: 0.07,
  };

  let score = 0;
  let totalWeight = 0;

  // Pitch velocity (scale: 60-100 mph → 0-100 score)
  if (player.pitchVelo) {
    const pitchScore = Math.min(100, Math.max(0, ((player.pitchVelo - 60) / 40) * 100));
    score += pitchScore * weights.pitchVelo;
    totalWeight += weights.pitchVelo;
  }

  // Exit velocity (scale: 70-110 mph → 0-100 score)
  if (player.exitVelo) {
    const exitScore = Math.min(100, Math.max(0, ((player.exitVelo - 70) / 40) * 100));
    score += exitScore * weights.exitVelo;
    totalWeight += weights.exitVelo;
  }

  // 60-yard dash (scale: 6.0-8.0 seconds → 100-0 score, lower is better)
  if (player.sixtyTime) {
    const sixtyScore = Math.min(100, Math.max(0, ((8.0 - player.sixtyTime) / 2.0) * 100));
    score += sixtyScore * weights.sixtyTime;
    totalWeight += weights.sixtyTime;
  }

  // Pop time (scale: 1.7-2.3 seconds → 100-0 score, lower is better)
  if (player.popTime) {
    const popScore = Math.min(100, Math.max(0, ((2.3 - player.popTime) / 0.6) * 100));
    score += popScore * weights.popTime;
    totalWeight += weights.popTime;
  }

  // Arm strength (scale: 60-95 mph → 0-100 score)
  if (player.armStrength) {
    const armScore = Math.min(100, Math.max(0, ((player.armStrength - 60) / 35) * 100));
    score += armScore * weights.armStrength;
    totalWeight += weights.armStrength;
  }

  // Sprint speed (scale: 25-35 ft/s → 0-100 score)
  if (player.sprintSpeed) {
    const sprintScore = Math.min(100, Math.max(0, ((player.sprintSpeed - 25) / 10) * 100));
    score += sprintScore * weights.sprintSpeed;
    totalWeight += weights.sprintSpeed;
  }

  // GPA (scale: 2.0-4.0 → 0-100 score)
  if (player.gpa) {
    const gpaScore = Math.min(100, Math.max(0, ((player.gpa - 2.0) / 2.0) * 100));
    score += gpaScore * weights.gpa;
    totalWeight += weights.gpa;
  }

  // Direct rating if provided (1-5 → 20-100)
  if (player.rating) {
    const ratingScore = (player.rating / 5) * 100;
    score += ratingScore * weights.rating;
    totalWeight += weights.rating;
  }

  // Normalize score based on available metrics
  if (totalWeight > 0) {
    score = score / totalWeight;
  }

  // Bonus for verified and trending players
  if (player.verified) score = Math.min(100, score + 5);
  if (player.trending) score = Math.min(100, score + 3);
  if (player.committed) score = Math.min(100, score + 2);

  return Math.round(score);
}

/**
 * Calculate projected recruiting value (scholarship potential)
 * This is an expensive calculation that should be memoized
 */
function calculateProjectedValue(player: PlayerData): {
  tier: 'Elite' | 'High' | 'Mid' | 'Developing';
  confidence: number;
  projection: string;
} {
  const performanceScore = calculatePerformanceScore(player);
  const currentYear = new Date().getFullYear();
  const yearsToGrad = (player.gradYear || currentYear + 2) - currentYear;
  
  // Factor in development potential based on years remaining
  const developmentBonus = Math.max(0, yearsToGrad * 3);
  const adjustedScore = Math.min(100, performanceScore + developmentBonus);
  
  // Position-specific value adjustments
  const positionMultiplier: Record<string, number> = {
    'RHP': 1.15,
    'LHP': 1.20,
    'C': 1.10,
    'SS': 1.08,
    'CF': 1.05,
    '1B': 0.95,
    'DH': 0.90,
  };
  
  const posMultiplier = positionMultiplier[player.primaryPosition] || 1.0;
  const finalScore = adjustedScore * posMultiplier;
  
  // Determine tier and confidence
  let tier: 'Elite' | 'High' | 'Mid' | 'Developing';
  let projection: string;
  let confidence: number;
  
  if (finalScore >= 85) {
    tier = 'Elite';
    projection = 'D1 Power 5 / MLB Draft';
    confidence = Math.min(95, 70 + (finalScore - 85));
  } else if (finalScore >= 70) {
    tier = 'High';
    projection = 'D1 Mid-Major / D2 Top';
    confidence = Math.min(85, 60 + (finalScore - 70));
  } else if (finalScore >= 55) {
    tier = 'Mid';
    projection = 'D2 / D3 / NAIA';
    confidence = Math.min(75, 50 + (finalScore - 55));
  } else {
    tier = 'Developing';
    projection = 'JUCO / Development';
    confidence = Math.min(65, 40 + finalScore * 0.5);
  }
  
  return { tier, confidence: Math.round(confidence), projection };
}

export type PlayerCardSize = 'sm' | 'md' | 'lg';
export type PlayerCardVariant = 'default' | 'compact' | 'detailed' | 'minimal';

export interface PlayerCardProps {
  player: PlayerData;
  /** Card size variant */
  size?: PlayerCardSize;
  /** Card style variant */
  variant?: PlayerCardVariant;
  /** Loading state */
  loading?: boolean;
  /** Animation index for stagger effect */
  index?: number;
  /** Disable hover animations */
  disableHover?: boolean;
  /** Disable entry animation */
  disableAnimation?: boolean;
  /** Custom stagger delay in ms */
  staggerDelay?: number;
  /** Show action buttons */
  showActions?: boolean;
  /** Add to watchlist callback */
  onAddToWatchlist?: (id: string) => void;
  /** View player callback */
  onView?: (id: string) => void;
  /** Custom action element */
  customAction?: ReactNode;
  /** Additional class names */
  className?: string;
  /** Already on watchlist */
  isOnWatchlist?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLE CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const SIZE_STYLES: Record<PlayerCardSize, {
  padding: string;
  avatar: string;
  title: string;
  badge: string;
}> = {
  sm: {
    padding: 'p-3',
    avatar: 'h-10 w-10',
    title: 'text-sm',
    badge: 'text-[10px] px-1.5 py-0',
  },
  md: {
    padding: 'p-4',
    avatar: 'h-12 w-12',
    title: 'text-base',
    badge: 'text-xs px-2 py-0.5',
  },
  lg: {
    padding: 'p-5',
    avatar: 'h-14 w-14',
    title: 'text-lg',
    badge: 'text-sm px-2.5 py-1',
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// SKELETON COMPONENT (Memoized)
// ═══════════════════════════════════════════════════════════════════════════

const PlayerCardSkeleton = memo(function PlayerCardSkeleton({ size = 'md' }: { size?: PlayerCardSize }) {
  const styles = SIZE_STYLES[size];

  return (
    <GlassCard className={cn(styles.padding, 'animate-pulse')} disableHover>
      <div className="flex items-start gap-3">
        {/* Avatar skeleton */}
        <div className={cn(styles.avatar, 'rounded-xl bg-white/10')} />

        {/* Content skeleton */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-4 bg-white/10 rounded w-24" />
            <div className="h-4 bg-white/10 rounded w-12" />
          </div>
          <div className="flex gap-2">
            <div className="h-3 bg-white/10 rounded w-16" />
            <div className="h-3 bg-white/10 rounded w-20" />
          </div>
          <div className="flex gap-1.5 pt-1">
            <div className="h-5 bg-white/10 rounded w-14" />
            <div className="h-5 bg-white/10 rounded w-16" />
            <div className="h-5 bg-white/10 rounded w-12" />
          </div>
        </div>

        {/* Action skeleton */}
        <div className="flex flex-col gap-1.5">
          <div className="h-7 bg-white/10 rounded w-20" />
          <div className="h-7 bg-white/10 rounded w-20" />
        </div>
      </div>
    </GlassCard>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATED STAT ITEM (Memoized)
// ═══════════════════════════════════════════════════════════════════════════

interface AnimatedStatBadgeProps {
  children: ReactNode;
  index: number;
  staggerDelay?: number;
  disableAnimation?: boolean;
}

const AnimatedStatBadge = memo(function AnimatedStatBadge({
  children,
  index,
  staggerDelay = 50,
  disableAnimation = false,
}: AnimatedStatBadgeProps) {
  const [isVisible, setIsVisible] = useState(disableAnimation);

  useEffect(() => {
    if (disableAnimation) return;
    const timer = setTimeout(() => setIsVisible(true), index * staggerDelay);
    return () => clearTimeout(timer);
  }, [index, staggerDelay, disableAnimation]);

  const style = useMemo(() => ({
    transitionDelay: disableAnimation ? '0ms' : `${index * staggerDelay}ms`,
  }), [index, staggerDelay, disableAnimation]);

  return (
    <div
      className={cn(
        'transition-all duration-300',
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-2'
      )}
      style={style}
    >
      {children}
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// PLAYER CARD COMPONENT (Optimized with React.memo, useMemo, useCallback)
// ═══════════════════════════════════════════════════════════════════════════

export const PlayerCard = memo(function PlayerCard({
  player,
  size = 'md',
  variant = 'default',
  loading = false,
  index = 0,
  disableHover = false,
  disableAnimation = false,
  staggerDelay = 50,
  showActions = true,
  onAddToWatchlist,
  onView,
  customAction,
  className,
  isOnWatchlist = false,
}: PlayerCardProps) {
  const [isVisible, setIsVisible] = useState(disableAnimation);
  const [isAvatarHovered, setIsAvatarHovered] = useState(false);

  const styles = SIZE_STYLES[size];

  // ═══════════════════════════════════════════════════════════════════════
  // MEMOIZED EXPENSIVE CALCULATIONS
  // ═══════════════════════════════════════════════════════════════════════

  // Memoize performance score calculation (expensive)
  const performanceScore = useMemo(() => {
    return calculatePerformanceScore(player);
  }, [player]);

  // Memoize projected value calculation (expensive)
  const projectedValue = useMemo(() => {
    return calculateProjectedValue(player);
  }, [player]);

  // Memoize initials generation
  const initials = useMemo(() => {
    return player.name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [player.name]);

  // Memoize location formatting
  const location = useMemo(() => {
    return [player.city, player.state].filter(Boolean).join(', ');
  }, [player.city, player.state]);

  // Memoize metrics collection (expensive with many fields)
  const allMetrics = useMemo(() => {
    const metrics: string[] = [];
    if (player.height) metrics.push(player.height);
    if (player.weight) metrics.push(`${player.weight} lbs`);
    if (player.bats && player.throws) metrics.push(`B/T: ${player.bats}/${player.throws}`);
    if (player.gpa) metrics.push(`GPA: ${player.gpa.toFixed(2)}`);
    if (player.pitchVelo) metrics.push(`${player.pitchVelo} mph`);
    if (player.exitVelo) metrics.push(`EV: ${player.exitVelo}`);
    if (player.sixtyTime) metrics.push(`60: ${player.sixtyTime}s`);
    if (player.metrics) metrics.push(...player.metrics);
    return metrics;
  }, [
    player.height,
    player.weight,
    player.bats,
    player.throws,
    player.gpa,
    player.pitchVelo,
    player.exitVelo,
    player.sixtyTime,
    player.metrics,
  ]);

  // Memoize displayed metrics (limited to 4)
  const displayedMetrics = useMemo(() => {
    return allMetrics.slice(0, 4);
  }, [allMetrics]);

  // Memoize remaining metrics count
  const remainingMetricsCount = useMemo(() => {
    return Math.max(0, allMetrics.length - 4);
  }, [allMetrics.length]);

  // Memoize style object to prevent re-renders
  const containerStyle = useMemo(() => ({
    transitionDelay: disableAnimation ? '0ms' : `${index * 100}ms`,
  }), [index, disableAnimation]);

  // ═══════════════════════════════════════════════════════════════════════
  // MEMOIZED CALLBACKS (prevent re-renders of child components)
  // ═══════════════════════════════════════════════════════════════════════

  const handleAddToWatchlist = useCallback(() => {
    onAddToWatchlist?.(player.id);
  }, [onAddToWatchlist, player.id]);

  const handleView = useCallback(() => {
    onView?.(player.id);
  }, [onView, player.id]);

  const handleAvatarMouseEnter = useCallback(() => {
    setIsAvatarHovered(true);
  }, []);

  const handleAvatarMouseLeave = useCallback(() => {
    setIsAvatarHovered(false);
  }, []);

  // ═══════════════════════════════════════════════════════════════════════
  // EFFECTS
  // ═══════════════════════════════════════════════════════════════════════

  // Entry animation
  useEffect(() => {
    if (disableAnimation) return;
    const timer = setTimeout(() => setIsVisible(true), index * 100);
    return () => clearTimeout(timer);
  }, [index, disableAnimation]);

  // ═══════════════════════════════════════════════════════════════════════
  // EARLY RETURNS
  // ═══════════════════════════════════════════════════════════════════════

  // Show skeleton when loading
  if (loading) {
    return <PlayerCardSkeleton size={size} />;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div
      className={cn(
        'transition-all duration-500',
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-5',
        className
      )}
      style={containerStyle}
    >
      <GlassCard
        size="full"
        className={styles.padding}
        disableHover={disableHover}
        hoverScale={1.02}
        hoverY={-4}
      >
        <div className="flex items-start gap-3">
          {/* Avatar with hover scale */}
          <div
            className="relative shrink-0"
            onMouseEnter={handleAvatarMouseEnter}
            onMouseLeave={handleAvatarMouseLeave}
          >
            <Avatar
              className={cn(
                styles.avatar,
                'rounded-xl transition-transform duration-300 ease-out',
                isAvatarHovered && 'scale-110'
              )}
            >
              {player.avatarUrl ? (
                <AvatarImage
                  src={player.avatarUrl}
                  alt={player.name}
                  className="object-cover"
                />
              ) : null}
              <AvatarFallback
                className={cn(
                  'rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20',
                  'text-emerald-400 font-medium',
                  size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'
                )}
              >
                {initials}
              </AvatarFallback>
            </Avatar>

            {/* Rating badge */}
            {player.rating && (
              <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-slate-900">
                {player.rating}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Name & badges row */}
            <div className="flex flex-wrap items-center gap-1.5">
              <p className={cn('font-semibold text-white truncate', styles.title)}>
                {player.name}
              </p>
              {player.gradYear && (
                <Badge
                  variant="outline"
                  className={cn(styles.badge, 'bg-white/5 border-white/20 text-slate-300')}
                >
                  {player.gradYear}
                </Badge>
              )}
              <Badge
                variant="outline"
                className={cn(styles.badge, 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400')}
              >
                {player.primaryPosition}
              </Badge>
              {player.secondaryPosition && variant !== 'minimal' && (
                <Badge
                  variant="outline"
                  className={cn(styles.badge, 'bg-white/5 border-white/20 text-slate-400')}
                >
                  {player.secondaryPosition}
                </Badge>
              )}
            </div>

            {/* Status badges */}
            {(player.verified || player.trending || player.committed) && (
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                {player.verified && (
                  <AnimatedStatBadge index={0} staggerDelay={staggerDelay} disableAnimation={disableAnimation}>
                    <Badge className={cn(styles.badge, 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 gap-0.5')}>
                      <Sparkles className="w-2.5 h-2.5" /> Verified
                    </Badge>
                  </AnimatedStatBadge>
                )}
                {player.trending && (
                  <AnimatedStatBadge index={1} staggerDelay={staggerDelay} disableAnimation={disableAnimation}>
                    <Badge className={cn(styles.badge, 'bg-blue-500/20 text-blue-400 border-blue-500/40 gap-0.5')}>
                      <TrendingUp className="w-2.5 h-2.5" /> Trending
                    </Badge>
                  </AnimatedStatBadge>
                )}
                {player.committed && player.committedTo && (
                  <AnimatedStatBadge index={2} staggerDelay={staggerDelay} disableAnimation={disableAnimation}>
                    <Badge className={cn(styles.badge, 'bg-purple-500/20 text-purple-400 border-purple-500/40 gap-0.5')}>
                      <CheckCircle2 className="w-2.5 h-2.5" /> {player.committedTo}
                    </Badge>
                  </AnimatedStatBadge>
                )}
              </div>
            )}

            {/* Location */}
            {location && variant !== 'minimal' && (
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3" /> {location}
              </p>
            )}

            {/* Performance Score & Projected Value (detailed variant) */}
            {variant === 'detailed' && (
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1 text-xs">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span className="text-slate-400">Score:</span>
                  <span className={cn(
                    'font-semibold',
                    performanceScore >= 80 ? 'text-emerald-400' :
                    performanceScore >= 60 ? 'text-amber-400' :
                    'text-slate-400'
                  )}>
                    {performanceScore}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <Target className="w-3 h-3 text-blue-400" />
                  <span className={cn(
                    'font-medium',
                    projectedValue.tier === 'Elite' ? 'text-emerald-400' :
                    projectedValue.tier === 'High' ? 'text-blue-400' :
                    projectedValue.tier === 'Mid' ? 'text-amber-400' :
                    'text-slate-400'
                  )}>
                    {projectedValue.tier}
                  </span>
                  <span className="text-slate-500">({projectedValue.confidence}%)</span>
                </div>
              </div>
            )}

            {/* Metrics with stagger animation */}
            {displayedMetrics.length > 0 && variant !== 'minimal' && variant !== 'compact' && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {displayedMetrics.map((metric, idx) => (
                  <AnimatedStatBadge
                    key={idx}
                    index={idx + 3}
                    staggerDelay={staggerDelay}
                    disableAnimation={disableAnimation}
                  >
                    <Badge
                      variant="outline"
                      className={cn(styles.badge, 'bg-slate-800/50 border-slate-700/50 text-slate-300')}
                    >
                      {metric}
                    </Badge>
                  </AnimatedStatBadge>
                ))}
                {remainingMetricsCount > 0 && (
                  <AnimatedStatBadge index={7} staggerDelay={staggerDelay} disableAnimation={disableAnimation}>
                    <Badge
                      variant="outline"
                      className={cn(styles.badge, 'bg-slate-800/50 border-slate-700/50 text-slate-500')}
                    >
                      +{remainingMetricsCount} more
                    </Badge>
                  </AnimatedStatBadge>
                )}
              </div>
            )}

            {/* Top school interest */}
            {player.topSchool && variant === 'detailed' && (
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <Star className="w-3 h-3 text-amber-400" />
                Top: {player.topSchool}
              </p>
            )}
          </div>

          {/* Actions */}
          {showActions && (customAction || onAddToWatchlist || onView) && (
            <div className="flex flex-col gap-1.5 shrink-0">
              {customAction}
              {!customAction && onAddToWatchlist && (
                <Button
                  size="sm"
                  className={cn(
                    'text-[10px] h-7 px-2 gap-1',
                    isOnWatchlist
                      ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  )}
                  onClick={handleAddToWatchlist}
                >
                  {isOnWatchlist ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" /> Added
                    </>
                  ) : (
                    <>
                      <Plus className="w-3 h-3" /> Watchlist
                    </>
                  )}
                </Button>
              )}
              {!customAction && onView && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-[10px] h-7 px-2 bg-white/5 border-white/20 text-white hover:bg-white/10 gap-1"
                  onClick={handleView}
                >
                  <Eye className="w-3 h-3" /> View
                </Button>
              )}
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// PLAYER CARD LIST WITH STAGGER (Optimized)
// ═══════════════════════════════════════════════════════════════════════════

export interface PlayerCardListProps {
  players: PlayerData[];
  loading?: boolean;
  loadingCount?: number;
  size?: PlayerCardSize;
  variant?: PlayerCardVariant;
  showActions?: boolean;
  onAddToWatchlist?: (id: string) => void;
  onView?: (id: string) => void;
  watchlistIds?: string[];
  className?: string;
  emptyMessage?: string;
  gap?: 'sm' | 'md' | 'lg';
}

const GAP_STYLES = {
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
};

export const PlayerCardList = memo(function PlayerCardList({
  players,
  loading = false,
  loadingCount = 3,
  size = 'md',
  variant = 'default',
  showActions = true,
  onAddToWatchlist,
  onView,
  watchlistIds = [],
  className,
  emptyMessage = 'No players found',
  gap = 'md',
}: PlayerCardListProps) {
  // Memoize watchlist Set for O(1) lookup instead of O(n) includes()
  const watchlistSet = useMemo(() => {
    return new Set(watchlistIds);
  }, [watchlistIds]);

  // Memoize skeleton array to prevent re-creation
  const skeletons = useMemo(() => {
    return Array.from({ length: loadingCount });
  }, [loadingCount]);

  // Memoize container className
  const containerClassName = useMemo(() => {
    return cn('flex flex-col', GAP_STYLES[gap], className);
  }, [gap, className]);

  if (loading) {
    return (
      <div className={containerClassName}>
        {skeletons.map((_, i) => (
          <PlayerCardSkeleton key={i} size={size} />
        ))}
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-400 text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={containerClassName}>
      {players.map((player, index) => (
        <PlayerCard
          key={player.id}
          player={player}
          index={index}
          size={size}
          variant={variant}
          showActions={showActions}
          onAddToWatchlist={onAddToWatchlist}
          onView={onView}
          isOnWatchlist={watchlistSet.has(player.id)}
        />
      ))}
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export { PlayerCardSkeleton };
export default PlayerCard;
