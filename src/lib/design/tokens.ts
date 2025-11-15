/**
 * Design Tokens - 设计令牌
 * 统一的颜色、间距、动画配置，与智能创作中心保持一致
 */

export const colors = {
  // 渐变色配置
  gradients: {
    purple: 'from-purple-400 to-pink-500',
    purpleDark: 'from-purple-500 via-purple-600 to-pink-500',
    blue: 'from-blue-400 to-cyan-500',
    green: 'from-green-400 to-emerald-500',
    orange: 'from-orange-400 to-amber-500',
    pink: 'from-pink-400 to-rose-500',
    indigo: 'from-indigo-400 to-purple-500',
  },

  // 背景渐变
  backgrounds: {
    page: 'from-gray-50 via-purple-50/20 to-pink-50/20',
    card: 'from-white to-gray-50',
  },

  // 状态颜色
  status: {
    success: 'text-green-600 bg-green-50',
    warning: 'text-orange-600 bg-orange-50',
    error: 'text-red-600 bg-red-50',
    info: 'text-blue-600 bg-blue-50',
  },

  // 趋势颜色
  trend: {
    up: {
      icon: '📈',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    down: {
      icon: '📉',
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    stable: {
      icon: '➡️',
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
    },
  },
};

export const spacing = {
  section: 'mb-8',
  card: 'p-6',
  gap: {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  },
};

export const borderRadius = {
  sm: 'rounded-lg',
  md: 'rounded-xl',
  lg: 'rounded-2xl',
  full: 'rounded-full',
};

export const shadows = {
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  card: 'shadow-lg hover:shadow-xl',
};

export const transitions = {
  fast: 'transition-all duration-150',
  normal: 'transition-all duration-300',
  slow: 'transition-all duration-500',
};

// Framer Motion 动画配置
export const animations = {
  // 卡片入场动画
  cardEntrance: {
    initial: { opacity: 0, scale: 0.95, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    transition: { duration: 0.3 },
  },

  // 卡片悬停动画
  cardHover: {
    scale: 1.02,
    y: -4,
    transition: { duration: 0.2 },
  },

  // 卡片点击动画
  cardTap: {
    scale: 0.98,
  },

  // 列表项入场动画
  listItemEntrance: (index: number) => ({
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    transition: { delay: index * 0.05, duration: 0.3 },
  }),

  // 淡入动画
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3 },
  },

  // 滑入动画
  slideIn: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3 },
  },

  // 页面过渡动画
  pageTransition: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.4 },
  },
};

// 响应式断点
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// 字体配置
export const typography = {
  pageTitle: 'text-3xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-pink-600 bg-clip-text text-transparent',
  sectionTitle: 'text-2xl font-bold text-gray-900',
  cardTitle: 'text-lg font-semibold',
  body: 'text-gray-600',
  caption: 'text-sm text-gray-500',
};

// 图标尺寸
export const iconSizes = {
  xs: 'w-4 h-4',
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-10 h-10',
};
