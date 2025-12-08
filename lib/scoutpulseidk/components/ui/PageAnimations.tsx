'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  Children,
  cloneElement,
  isValidElement,
  CSSProperties,
} from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

// ═══════════════════════════════════════════════════════════════════════════
// CSS ANIMATIONS (injected once)
// ═══════════════════════════════════════════════════════════════════════════

const pageAnimationStyles = `
/* ═══════════════════════════════════════════════════════════════════
   PAGE ENTER ANIMATIONS
═══════════════════════════════════════════════════════════════════ */

@keyframes page-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes page-slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes page-slide-down {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes page-slide-left {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes page-slide-right {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes page-scale-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes page-spring-in {
  0% {
    opacity: 0;
    transform: translateY(30px) scale(0.9);
  }
  60% {
    opacity: 1;
    transform: translateY(-5px) scale(1.02);
  }
  80% {
    transform: translateY(2px) scale(0.99);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* ═══════════════════════════════════════════════════════════════════
   STAGGER CARD ANIMATIONS
═══════════════════════════════════════════════════════════════════ */

@keyframes card-stagger-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes card-spring-in {
  0% {
    opacity: 0;
    transform: translateY(25px) scale(0.95);
  }
  60% {
    opacity: 1;
    transform: translateY(-3px) scale(1.01);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes card-fade-scale {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* ═══════════════════════════════════════════════════════════════════
   LOADING STATE ANIMATIONS
═══════════════════════════════════════════════════════════════════ */

@keyframes loading-pulse {
  0%, 100% {
    opacity: 0.4;
  }
  50% {
    opacity: 0.8;
  }
}

@keyframes loading-shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

@keyframes loading-fade-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

@keyframes content-fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ═══════════════════════════════════════════════════════════════════
   PAGE EXIT ANIMATIONS
═══════════════════════════════════════════════════════════════════ */

@keyframes page-fade-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

@keyframes page-slide-out-left {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(-20px);
  }
}

/* ═══════════════════════════════════════════════════════════════════
   UTILITY CLASSES
═══════════════════════════════════════════════════════════════════ */

.animate-page-enter {
  animation: page-slide-up 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.animate-page-enter-fade {
  animation: page-fade-in 0.4s ease-out forwards;
}

.animate-page-enter-spring {
  animation: page-spring-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.animate-card-stagger {
  animation: card-stagger-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  opacity: 0;
}

.animate-card-spring {
  animation: card-spring-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  opacity: 0;
}

.animate-loading-pulse {
  animation: loading-pulse 1.5s ease-in-out infinite;
}

.animate-loading-shimmer {
  animation: loading-shimmer 1.5s ease-in-out infinite;
}
`;

let stylesInjected = false;
function injectPageAnimationStyles() {
  if (stylesInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.id = 'page-animation-styles';
  style.textContent = pageAnimationStyles;
  document.head.appendChild(style);
  stylesInjected = true;
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type PageAnimationType = 
  | 'fade' 
  | 'slide-up' 
  | 'slide-down' 
  | 'slide-left' 
  | 'slide-right' 
  | 'scale' 
  | 'spring'
  | 'none';

export type CardAnimationType = 'stagger' | 'spring' | 'fade-scale' | 'none';

export interface AnimationConfig {
  /** Animation type */
  type?: PageAnimationType;
  /** Duration in ms */
  duration?: number;
  /** Delay before animation starts */
  delay?: number;
  /** Stagger delay between items */
  staggerDelay?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// SPRING PHYSICS CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

// CSS cubic-bezier approximations of spring physics
const SPRING_EASINGS = {
  // Bouncy spring (high tension, low friction)
  bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  // Smooth spring (balanced)
  smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  // Snappy spring (high tension, high friction)
  snappy: 'cubic-bezier(0.22, 1, 0.36, 1)',
  // Gentle spring (low tension)
  gentle: 'cubic-bezier(0.4, 0, 0.2, 1)',
};

// ═══════════════════════════════════════════════════════════════════════════
// PAGE ANIMATION CONTEXT
// ═══════════════════════════════════════════════════════════════════════════

interface PageAnimationContextType {
  isNavigating: boolean;
  startNavigation: () => void;
  completeNavigation: () => void;
  animationConfig: AnimationConfig;
}

const PageAnimationContext = createContext<PageAnimationContextType>({
  isNavigating: false,
  startNavigation: () => {},
  completeNavigation: () => {},
  animationConfig: { type: 'spring', duration: 500 },
});

export function usePageAnimation() {
  return useContext(PageAnimationContext);
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE ANIMATION PROVIDER
// ═══════════════════════════════════════════════════════════════════════════

export interface PageAnimationProviderProps {
  children: ReactNode;
  defaultAnimation?: PageAnimationType;
  defaultDuration?: number;
}

export function PageAnimationProvider({
  children,
  defaultAnimation = 'spring',
  defaultDuration = 500,
}: PageAnimationProviderProps) {
  const [isNavigating, setIsNavigating] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    injectPageAnimationStyles();
  }, []);

  // Reset navigation state on route change
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  const startNavigation = useCallback(() => {
    setIsNavigating(true);
  }, []);

  const completeNavigation = useCallback(() => {
    setIsNavigating(false);
  }, []);

  return (
    <PageAnimationContext.Provider
      value={{
        isNavigating,
        startNavigation,
        completeNavigation,
        animationConfig: {
          type: defaultAnimation,
          duration: defaultDuration,
        },
      }}
    >
      {children}
    </PageAnimationContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATED PAGE WRAPPER
// ═══════════════════════════════════════════════════════════════════════════

export interface AnimatedPageProps {
  children: ReactNode;
  /** Animation type */
  animation?: PageAnimationType;
  /** Duration in ms */
  duration?: number;
  /** Delay before animation */
  delay?: number;
  /** Additional class names */
  className?: string;
}

export function AnimatedPage({
  children,
  animation = 'spring',
  duration = 500,
  delay = 0,
  className,
}: AnimatedPageProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    injectPageAnimationStyles();
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const getAnimationKeyframes = () => {
    switch (animation) {
      case 'fade': return 'page-fade-in';
      case 'slide-up': return 'page-slide-up';
      case 'slide-down': return 'page-slide-down';
      case 'slide-left': return 'page-slide-left';
      case 'slide-right': return 'page-slide-right';
      case 'scale': return 'page-scale-in';
      case 'spring': return 'page-spring-in';
      default: return 'none';
    }
  };

  const animationStyle: CSSProperties = animation !== 'none' && isVisible
    ? {
        animation: `${getAnimationKeyframes()} ${duration}ms ${SPRING_EASINGS.bounce} forwards`,
      }
    : {
        opacity: animation === 'none' ? 1 : 0,
      };

  return (
    <div className={cn('w-full', className)} style={animationStyle}>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STAGGERED CHILDREN WRAPPER
// ═══════════════════════════════════════════════════════════════════════════

export interface StaggeredContainerProps {
  children: ReactNode;
  /** Animation type for children */
  animation?: CardAnimationType;
  /** Delay between each child animation */
  staggerDelay?: number;
  /** Initial delay before first animation */
  initialDelay?: number;
  /** Duration of each animation */
  duration?: number;
  /** Additional class names */
  className?: string;
  /** Element type */
  as?: 'div' | 'ul' | 'section' | 'article';
}

export function StaggeredContainer({
  children,
  animation = 'spring',
  staggerDelay = 50,
  initialDelay = 0,
  duration = 400,
  className,
  as: Element = 'div',
}: StaggeredContainerProps) {
  useEffect(() => {
    injectPageAnimationStyles();
  }, []);

  const getAnimationKeyframes = () => {
    switch (animation) {
      case 'stagger': return 'card-stagger-in';
      case 'spring': return 'card-spring-in';
      case 'fade-scale': return 'card-fade-scale';
      default: return 'none';
    }
  };

  const childArray = Children.toArray(children);

  return (
    <Element className={className}>
      {childArray.map((child, index) => {
        if (!isValidElement(child)) return child;

        const delay = initialDelay + index * staggerDelay;
        const animationStyle: CSSProperties = animation !== 'none'
          ? {
              opacity: 0,
              animation: `${getAnimationKeyframes()} ${duration}ms ${SPRING_EASINGS.bounce} forwards`,
              animationDelay: `${delay}ms`,
            }
          : {};

        return cloneElement(child, {
          ...child.props,
          style: {
            ...child.props.style,
            ...animationStyle,
          },
        });
      })}
    </Element>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATED CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export interface AnimatedCardProps {
  children: ReactNode;
  /** Animation index for stagger effect */
  index?: number;
  /** Stagger delay in ms */
  staggerDelay?: number;
  /** Initial delay before animation */
  initialDelay?: number;
  /** Animation duration */
  duration?: number;
  /** Animation type */
  animation?: CardAnimationType;
  /** Disable animation */
  disableAnimation?: boolean;
  /** Additional class names */
  className?: string;
}

export function AnimatedCard({
  children,
  index = 0,
  staggerDelay = 50,
  initialDelay = 0,
  duration = 400,
  animation = 'spring',
  disableAnimation = false,
  className,
}: AnimatedCardProps) {
  const [isVisible, setIsVisible] = useState(disableAnimation);

  useEffect(() => {
    if (disableAnimation) return;
    injectPageAnimationStyles();
    const delay = initialDelay + index * staggerDelay;
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [index, staggerDelay, initialDelay, disableAnimation]);

  const getAnimationKeyframes = () => {
    switch (animation) {
      case 'stagger': return 'card-stagger-in';
      case 'spring': return 'card-spring-in';
      case 'fade-scale': return 'card-fade-scale';
      default: return 'none';
    }
  };

  const style: CSSProperties = !disableAnimation && animation !== 'none'
    ? isVisible
      ? {
          animation: `${getAnimationKeyframes()} ${duration}ms ${SPRING_EASINGS.bounce} forwards`,
        }
      : { opacity: 0 }
    : {};

  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LOADING TRANSITION COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export interface LoadingTransitionProps {
  loading: boolean;
  /** Loading content (skeleton, spinner, etc.) */
  loadingContent: ReactNode;
  /** Actual content */
  children: ReactNode;
  /** Duration of transition */
  duration?: number;
  /** Additional class names */
  className?: string;
}

export function LoadingTransition({
  loading,
  loadingContent,
  children,
  duration = 300,
  className,
}: LoadingTransitionProps) {
  const [showLoading, setShowLoading] = useState(loading);
  const [showContent, setShowContent] = useState(!loading);

  useEffect(() => {
    injectPageAnimationStyles();
  }, []);

  useEffect(() => {
    if (loading) {
      setShowContent(false);
      setShowLoading(true);
    } else {
      // Fade out loading, then show content
      const timer = setTimeout(() => {
        setShowLoading(false);
        setShowContent(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  return (
    <div className={cn('relative', className)}>
      {/* Loading State */}
      {showLoading && (
        <div
          style={{
            animation: loading
              ? 'page-fade-in 200ms ease-out forwards'
              : 'loading-fade-out 200ms ease-out forwards',
          }}
        >
          {loadingContent}
        </div>
      )}

      {/* Content */}
      {showContent && (
        <div
          style={{
            animation: `content-fade-in ${duration}ms ${SPRING_EASINGS.gentle} forwards`,
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATED LIST COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export interface AnimatedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T, index: number) => string | number;
  /** Animation type */
  animation?: CardAnimationType;
  /** Stagger delay between items */
  staggerDelay?: number;
  /** Initial delay */
  initialDelay?: number;
  /** Animation duration */
  duration?: number;
  /** Loading state */
  loading?: boolean;
  /** Loading skeleton count */
  loadingCount?: number;
  /** Render loading skeleton */
  renderSkeleton?: (index: number) => ReactNode;
  /** Empty state content */
  emptyContent?: ReactNode;
  /** Container class name */
  className?: string;
  /** Item wrapper class name */
  itemClassName?: string;
}

export function AnimatedList<T>({
  items,
  renderItem,
  keyExtractor,
  animation = 'spring',
  staggerDelay = 50,
  initialDelay = 0,
  duration = 400,
  loading = false,
  loadingCount = 3,
  renderSkeleton,
  emptyContent,
  className,
  itemClassName,
}: AnimatedListProps<T>) {
  useEffect(() => {
    injectPageAnimationStyles();
  }, []);

  // Loading state
  if (loading && renderSkeleton) {
    return (
      <div className={className}>
        {Array.from({ length: loadingCount }).map((_, index) => (
          <div key={`skeleton-${index}`} className={itemClassName}>
            {renderSkeleton(index)}
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (items.length === 0 && emptyContent) {
    return (
      <div
        className={className}
        style={{
          animation: `page-fade-in 300ms ease-out forwards`,
        }}
      >
        {emptyContent}
      </div>
    );
  }

  // Animated list
  return (
    <div className={className}>
      {items.map((item, index) => (
        <AnimatedCard
          key={keyExtractor(item, index)}
          index={index}
          staggerDelay={staggerDelay}
          initialDelay={initialDelay}
          duration={duration}
          animation={animation}
          className={itemClassName}
        >
          {renderItem(item, index)}
        </AnimatedCard>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Hook for triggering enter animation on mount
 */
export function useEnterAnimation(
  delay: number = 0,
  duration: number = 500
): { isVisible: boolean; animationStyle: CSSProperties } {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    injectPageAnimationStyles();
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const animationStyle: CSSProperties = isVisible
    ? {
        animation: `page-spring-in ${duration}ms ${SPRING_EASINGS.bounce} forwards`,
      }
    : { opacity: 0 };

  return { isVisible, animationStyle };
}

/**
 * Hook for staggered animations
 */
export function useStaggerAnimation(
  count: number,
  staggerDelay: number = 50,
  initialDelay: number = 0
): { getItemStyle: (index: number) => CSSProperties; isReady: boolean } {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    injectPageAnimationStyles();
    const timer = setTimeout(() => setIsReady(true), initialDelay);
    return () => clearTimeout(timer);
  }, [initialDelay]);

  const getItemStyle = useCallback(
    (index: number): CSSProperties => {
      if (!isReady) return { opacity: 0 };
      return {
        opacity: 0,
        animation: `card-spring-in 400ms ${SPRING_EASINGS.bounce} forwards`,
        animationDelay: `${index * staggerDelay}ms`,
      };
    },
    [isReady, staggerDelay]
  );

  return { getItemStyle, isReady };
}

/**
 * Hook for loading transitions
 */
export function useLoadingTransition(
  loading: boolean,
  delay: number = 100
): { showSkeleton: boolean; showContent: boolean; contentStyle: CSSProperties } {
  const [showSkeleton, setShowSkeleton] = useState(loading);
  const [showContent, setShowContent] = useState(!loading);

  useEffect(() => {
    if (loading) {
      setShowContent(false);
      setShowSkeleton(true);
    } else {
      const timer = setTimeout(() => {
        setShowSkeleton(false);
        setShowContent(true);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [loading, delay]);

  const contentStyle: CSSProperties = showContent
    ? {
        animation: `content-fade-in 300ms ${SPRING_EASINGS.gentle} forwards`,
      }
    : { opacity: 0 };

  return { showSkeleton, showContent, contentStyle };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export { SPRING_EASINGS };
export default AnimatedPage;
