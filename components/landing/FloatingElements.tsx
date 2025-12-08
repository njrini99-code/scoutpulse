'use client';

import { motion } from 'framer-motion';

const floatingElements = [
  { delay: 0, duration: 6, x: '10%', y: '20%' },
  { delay: 1, duration: 8, x: '80%', y: '30%' },
  { delay: 2, duration: 7, x: '20%', y: '70%' },
  { delay: 1.5, duration: 9, x: '70%', y: '80%' },
];

export function FloatingElements() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {floatingElements.map((element, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-emerald-400/20 blur-sm"
          style={{
            left: element.x,
            top: element.y,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 15, 0],
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: element.duration,
            delay: element.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
