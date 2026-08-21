import React from 'react';
import { motion } from 'motion/react';

interface MotionWrapperProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export const MotionWrapper: React.FC<MotionWrapperProps> = ({ children, className = "", delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
