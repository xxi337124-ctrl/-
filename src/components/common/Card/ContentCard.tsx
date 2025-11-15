'use client';

import { ReactNode } from 'react';
import BaseCard, { BaseCardProps } from './BaseCard';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export interface ContentCardProps extends Omit<BaseCardProps, 'children'> {
  title: string;
  description?: string;
  icon?: ReactNode;
  badge?: string;
  badgeColor?: string;
  footer?: ReactNode;
  timestamp?: Date;
  tags?: string[];
  actions?: ReactNode;
  children?: ReactNode;
}

export default function ContentCard({
  title,
  description,
  icon,
  badge,
  badgeColor = 'bg-blue-100 text-blue-600',
  footer,
  timestamp,
  tags,
  actions,
  children,
  ...cardProps
}: ContentCardProps) {
  return (
    <BaseCard {...cardProps}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
            {icon && (
              <div className="text-3xl flex-shrink-0">
                {icon}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg line-clamp-1">{title}</h3>
              {description && (
                <p className="text-sm opacity-90 mt-1 line-clamp-2">{description}</p>
              )}
            </div>
          </div>

          {badge && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeColor} whitespace-nowrap ml-2`}>
              {badge}
            </span>
          )}
        </div>

        {/* Content */}
        {children && (
          <div className="mb-4">
            {children}
          </div>
        )}

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        {(footer || timestamp || actions) && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 border-opacity-20">
            <div className="flex items-center gap-4 text-sm opacity-75">
              {timestamp && (
                <span>{format(timestamp, 'PPp', { locale: zhCN })}</span>
              )}
              {footer}
            </div>
            {actions && (
              <div className="flex items-center gap-2">
                {actions}
              </div>
            )}
          </div>
        )}
      </div>
    </BaseCard>
  );
}
