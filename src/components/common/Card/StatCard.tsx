'use client';

import { ReactNode } from 'react';
import BaseCard, { BaseCardProps } from './BaseCard';
import { motion } from 'framer-motion';

export interface StatCardProps extends Omit<BaseCardProps, 'children'> {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
  color?: string;
}

export default function StatCard({
  title,
  value,
  icon,
  trend,
  description,
  color = 'blue',
  ...cardProps
}: StatCardProps) {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'bg-gradient-to-br from-blue-500 to-blue-600',
      text: 'text-blue-600',
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'bg-gradient-to-br from-purple-500 to-pink-500',
      text: 'text-purple-600',
    },
    green: {
      bg: 'bg-green-50',
      icon: 'bg-gradient-to-br from-green-500 to-emerald-500',
      text: 'text-green-600',
    },
    orange: {
      bg: 'bg-orange-50',
      icon: 'bg-gradient-to-br from-orange-500 to-amber-500',
      text: 'text-orange-600',
    },
    pink: {
      bg: 'bg-pink-50',
      icon: 'bg-gradient-to-br from-pink-500 to-rose-500',
      text: 'text-pink-600',
    },
  };

  const colors = colorClasses[color as keyof typeof colorClasses] || colorClasses.blue;

  return (
    <BaseCard variant="elevated" {...cardProps}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          {icon && (
            <div className={`w-12 h-12 rounded-lg ${colors.icon} flex items-center justify-center text-white`}>
              {icon}
            </div>
          )}
          {trend && (
            <div className={`flex items-center gap-1 text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>

        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <motion.p
            className={`text-3xl font-bold ${colors.text}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {value}
          </motion.p>
          {description && (
            <p className="text-xs text-gray-500 mt-2">{description}</p>
          )}
        </div>
      </div>
    </BaseCard>
  );
}
