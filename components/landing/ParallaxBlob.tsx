'use client';

import { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface ParallaxBlobProps {
  className?: string;
  speed?: number;
  delay?: number;
}

export function ParallaxBlob({ className = '', speed = 0.5, delay = 0 }: ParallaxBlobProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, -100 * speed]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.7, 1, 0.7]);

  return (
    <motion.div
      ref={ref}
      style={{ y, opacity }}
      className={className}
      transition={{ delay }}
    />
  );
}
