'use client';

import { useSpring, animated } from 'react-spring';

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  formatThousands?: boolean;
}

export const AnimatedNumberReactSpring = ({ 
  value, 
  decimals = 0, 
  duration = 1000,
  className = '',
  prefix = '',
  suffix = '',
  formatThousands = false,
}: AnimatedNumberProps) => {
  const { number } = useSpring({
    from: { number: 0 },
    to: { number: value },
    delay: 200,
    config: { 
      mass: 1, 
      tension: 20, 
      friction: 10,
      duration: duration 
    },
  });

  const formatNumber = (num: number): string => {
    const fixed = num.toFixed(decimals);
    if (formatThousands) {
      const parts = fixed.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return parts.join('.');
    }
    return fixed;
  };

  return (
    <animated.span className={className}>
      {number.to(n => `${prefix}${formatNumber(n)}${suffix}`)}
    </animated.span>
  );
};

export default AnimatedNumberReactSpring;

