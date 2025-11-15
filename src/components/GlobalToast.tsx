"use client";

import { useEffect } from 'react';
import { useGlobalStore } from '@/lib/stores/globalStore';

export function GlobalToast() {
  const { showCompletionToast, completionMessage, setCompletionToast } = useGlobalStore();

  useEffect(() => {
    if (showCompletionToast) {
      // 自动隐藏toast
      const timer = setTimeout(() => {
        setCompletionToast(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [showCompletionToast, setCompletionToast]);

  if (!showCompletionToast) return null;

  const isSuccess = completionMessage.includes('完成');
  const isError = completionMessage.includes('失败');

  return (
    <div className="fixed top-20 right-6 z-[60] animate-slide-in-right">
      <div
        className={`
          flex items-center gap-3 px-6 py-4 rounded-lg shadow-2xl border-2
          backdrop-blur-sm transition-all duration-300
          ${
            isSuccess
              ? 'bg-green-50/95 border-green-500 text-green-800'
              : isError
              ? 'bg-red-50/95 border-red-500 text-red-800'
              : 'bg-blue-50/95 border-blue-500 text-blue-800'
          }
        `}
      >
        {/* Icon */}
        <div className="flex-shrink-0">
          {isSuccess && (
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
          {isError && (
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
          {!isSuccess && !isError && (
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
        </div>

        {/* Message */}
        <div className="flex-1">
          <p className="font-semibold">{completionMessage}</p>
        </div>

        {/* Close button */}
        <button
          onClick={() => setCompletionToast(false)}
          className={`
            flex-shrink-0 hover:bg-black/10 rounded-lg p-1 transition-colors
            ${isSuccess ? 'text-green-600' : isError ? 'text-red-600' : 'text-blue-600'}
          `}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
