'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ConfettiProps {
  show: boolean;
  onComplete?: () => void;
}

export const Confetti = ({ show, onComplete }: ConfettiProps) => {
  const [pieces, setPieces] = useState<Array<{ id: number; x: number; color: string }>>([]);

  useEffect(() => {
    if (show) {
      // Generate confetti pieces
      const newPieces = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: ['#10b981', '#059669', '#34d399', '#6ee7b7'][Math.floor(Math.random() * 4)]
      }));
      
      setPieces(newPieces);

      // Auto cleanup
      const timeout = setTimeout(() => {
        setPieces([]);
        onComplete?.();
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [show, onComplete]);

  if (!show || pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {pieces.map((piece) => (
        <motion.div
          key={piece.id}
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: piece.color,
            left: `${piece.x}%`,
            top: '-10px',
          }}
          initial={{ y: -10, opacity: 1, rotate: 0 }}
          animate={{
            y: typeof window !== 'undefined' ? window.innerHeight + 10 : 1000,
            opacity: [1, 1, 0],
            rotate: Math.random() * 720 - 360,
            x: (Math.random() - 0.5) * 200,
          }}
          transition={{
            duration: 2 + Math.random(),
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
};

export default Confetti;

