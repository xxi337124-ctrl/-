import { Variants } from 'framer-motion';

/**
 * 动画工具函数库
 * 提供与智能创作中心一致的动画效果
 */

// 交错动画容器
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// 交错动画子项
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

// 卡片入场动画生成器
export const cardEntrance = (delay = 0) => ({
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  transition: { delay, duration: 0.3 },
});

// 淡入淡出动画
export const fadeInOut: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

// 滑入滑出动画（从下方）
export const slideInUp: Variants = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -30 },
};

// 滑入滑出动画（从右侧）
export const slideInRight: Variants = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
};

// 缩放动画
export const scaleInOut: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
};

// 弹簧动画配置
export const springConfig = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
};

// 悬停效果生成器
export const hoverEffect = (lift = 4) => ({
  scale: 1.02,
  y: -lift,
  transition: { duration: 0.2 },
});

// 点击效果
export const tapEffect = {
  scale: 0.98,
};

// 列表项动画生成器
export const listItemAnimation = (index: number) => ({
  initial: { opacity: 0, x: -20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      delay: index * 0.05,
      duration: 0.3,
    },
  },
});

// 加载动画（旋转）
export const spinAnimation = {
  animate: {
    rotate: 360,
  },
  transition: {
    duration: 1,
    repeat: Infinity,
    ease: 'linear',
  },
};

// 脉动动画
export const pulseAnimation = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
  },
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

// 摇摆动画
export const shakeAnimation = {
  animate: {
    x: [0, -10, 10, -10, 10, 0],
  },
  transition: {
    duration: 0.5,
  },
};

// 进度条动画
export const progressAnimation = (progress: number) => ({
  initial: { width: 0 },
  animate: { width: `${progress}%` },
  transition: { duration: 0.5, ease: 'easeOut' },
});

// 数字增长动画配置
export const counterAnimation = {
  duration: 1,
  ease: 'easeOut',
};
