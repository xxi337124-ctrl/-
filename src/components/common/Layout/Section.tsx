'use client';

import { ReactNode } from 'react';

export interface SectionProps {
  children: ReactNode;
  title?: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export default function Section({
  children,
  title,
  description,
  actions,
  className = '',
}: SectionProps) {
  return (
    <div className={`mb-8 ${className}`}>
      {/* Section Header */}
      {(title || description || actions) && (
        <div className="flex items-start justify-between mb-6">
          <div>
            {title && (
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{title}</h2>
            )}
            {description && (
              <p className="text-gray-600">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-3">
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Section Content */}
      <div>{children}</div>
    </div>
  );
}
