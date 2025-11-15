'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

export interface PageContainerProps {
  children: ReactNode;
  title?: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export default function PageContainer({
  children,
  title,
  description,
  actions,
  className = '',
}: PageContainerProps) {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/20 to-pink-50/20 ${className}`}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        {(title || description || actions) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-start justify-between">
              <div>
                {title && (
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-pink-600 bg-clip-text text-transparent mb-2">
                    {title}
                  </h1>
                )}
                {description && (
                  <p className="text-gray-600 text-lg">{description}</p>
                )}
              </div>
              {actions && (
                <div className="flex items-center gap-3">
                  {actions}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Page Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
