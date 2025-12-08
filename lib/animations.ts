// ScoutPulse Animation Utilities
// Consistent 300ms timing and easing functions throughout the app
// ═══════════════════════════════════════════════════════════════════════════

export const ANIMATION_DURATION = 300; // 300ms for consistency
export const EASING = 'cubic-bezier(0.4, 0, 0.2, 1)'; // Material Design easing

// ═══════════════════════════════════════════════════════════════════════════
// TRANSITION PRESETS
// ═══════════════════════════════════════════════════════════════════════════

export const transitions = {
  fast: `${ANIMATION_DURATION / 2}ms ${EASING}`,
  default: `${ANIMATION_DURATION}ms ${EASING}`,
  slow: `${ANIMATION_DURATION * 2}ms ${EASING}`,
};

// ═══════════════════════════════════════════════════════════════════════════
// PAGE TRANSITION VARIANTS
// ═══════════════════════════════════════════════════════════════════════════

export const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: ANIMATION_DURATION / 1000, ease: [0.4, 0, 0.2, 1] },
};

export const pageTransitionFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: ANIMATION_DURATION / 1000, ease: [0.4, 0, 0.2, 1] },
};

export const pageTransitionSlide = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: ANIMATION_DURATION / 1000, ease: [0.4, 0, 0.2, 1] },
};

export const pageTransitionScale = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: ANIMATION_DURATION / 1000, ease: [0.4, 0, 0.2, 1] },
};

// ═══════════════════════════════════════════════════════════════════════════
// BUTTON INTERACTION VARIANTS
// ═══════════════════════════════════════════════════════════════════════════

export const buttonHover = {
  scale: 1.05,
  transition: { duration: ANIMATION_DURATION / 1000, ease: [0.4, 0, 0.2, 1] },
};

export const buttonActive = {
  scale: 0.95,
  transition: { duration: ANIMATION_DURATION / 1000, ease: [0.4, 0, 0.2, 1] },
};

// ═══════════════════════════════════════════════════════════════════════════
// CARD INTERACTION VARIANTS
// ═══════════════════════════════════════════════════════════════════════════

export const cardHover = {
  scale: 1.02,
  y: -4,
  transition: { duration: ANIMATION_DURATION / 1000, ease: [0.4, 0, 0.2, 1] },
};

// ═══════════════════════════════════════════════════════════════════════════
// STAGGER ANIMATION VARIANTS (for Framer Motion)
// ═══════════════════════════════════════════════════════════════════════════

export const staggerContainer = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: ANIMATION_DURATION / 1000,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// STAGGER ANIMATION DELAYS
// ═══════════════════════════════════════════════════════════════════════════

export const getStaggerDelay = (index: number, baseDelay: number = 50) => {
  return index * baseDelay;
};

// ═══════════════════════════════════════════════════════════════════════════
// CSS TRANSITION HELPERS
// ═══════════════════════════════════════════════════════════════════════════

export const getTransitionStyle = (properties: string[] = ['all']) => {
  return {
    transitionProperty: properties.join(', '),
    transitionDuration: `${ANIMATION_DURATION}ms`,
    transitionTimingFunction: EASING,
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATION KEYFRAMES (for CSS-in-JS)
// ═══════════════════════════════════════════════════════════════════════════

export const keyframes = {
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  slideUp: {
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
  slideDown: {
    from: { opacity: 0, transform: 'translateY(-20px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
  scaleIn: {
    from: { opacity: 0, transform: 'scale(0.95)' },
    to: { opacity: 1, transform: 'scale(1)' },
  },
};
