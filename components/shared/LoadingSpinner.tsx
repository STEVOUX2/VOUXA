'use client';

import { motion } from 'framer-motion';
import clsx from 'clsx';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export default function LoadingSpinner({ size = 'md', showText = true }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
      <motion.div
        className={clsx(
          "rounded-full border-2 border-primary-dim border-t-primary border-r-primary",
          sizeClasses[size]
        )}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      {showText && (
        <motion.p 
          className="text-primary font-display tracking-widest text-sm uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          VOUXA
        </motion.p>
      )}
    </div>
  );
}
