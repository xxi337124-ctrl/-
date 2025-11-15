'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

export interface GridLayoutProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: 4 | 6 | 8;
  className?: string;
}

export default function GridLayout({
  children,
  columns = 3,
  gap = 6,
  className = '',
}: GridLayoutProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  const gridGap = {
    4: 'gap-4',
    6: 'gap-6',
    8: 'gap-8',
  };

  return (
    <div className={`grid ${gridCols[columns]} ${gridGap[gap]} ${className}`}>
      {children}
    </div>
  );
}
