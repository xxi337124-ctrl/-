'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';

export interface BaseCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  variant?: 'default' | 'gradient' | 'bordered' | 'elevated';
  hoverEffect?: boolean;
  clickable?: boolean;
  gradientFrom?: string;
  gradientTo?: string;
  className?: string;
}

export default function BaseCard({
  children,
  variant = 'default',
  hoverEffect = true,
  clickable = false,
  gradientFrom,
  gradientTo,
  className = '',
  ...motionProps
}: BaseCardProps) {
  const baseClasses = 'rounded-xl transition-all duration-300';

  const variantClasses = {
    default: 'bg-white border border-gray-200',
    gradient: `bg-gradient-to-br ${gradientFrom || 'from-purple-400'} ${gradientTo || 'to-pink-500'} text-white`,
    bordered: 'bg-white border-2 border-gray-300',
    elevated: 'bg-white shadow-lg border border-gray-100',
  };

  const hoverClasses = hoverEffect
    ? 'hover:shadow-xl hover:-translate-y-1'
    : '';

  const clickableClasses = clickable
    ? 'cursor-pointer active:scale-98'
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={hoverEffect ? { scale: 1.02, y: -4 } : undefined}
      whileTap={clickable ? { scale: 0.98 } : undefined}
      className={`${baseClasses} ${variantClasses[variant]} ${hoverClasses} ${clickableClasses} ${className}`}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
}
