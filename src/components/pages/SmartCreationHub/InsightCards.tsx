'use client';

// 优化后的热门洞察卡片组件
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiTrendingUp, FiClock, FiBarChart2, FiArrowRight } from 'react-icons/fi';
import { useInView } from 'react-intersection-observer';

interface Insight {
  id: string;
  category: string;
  title: string;
  description: string;
  trend: 'up' | 'down' | 'stable';
  count: number;
  lastUpdated: string;
  tags: string[];
  icon: string;
  color: string;
}

interface InsightCardsProps {
  onInsightSelect: (insight: Insight) => void;
}

export default function InsightCards({ onInsightSelect }: InsightCardsProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

  // 模拟洞察数据 - 实际项目中从API获取
  const mockInsights: Insight[] = [
    {
      id: '1',
      category: '咖啡',
      title: '精品咖啡趋势',
      description: '手冲咖啡和冷萃咖啡在年轻人中越来越受欢迎，相关话题增长45%',
      trend: 'up',
      count: 5,
      lastUpdated: '2小时前',
      tags: ['手冲', '冷萃', '精品咖啡'],
      icon: '☕',
      color: 'from-amber-400 to-orange-500'
    },
    {
      id: '2',
      category: '美食',
      title: '日料探店热潮',
      description: '日料店探店内容在小红书平台表现优异，平均互动率提升32%',
      trend: 'up',
      count: 8,
      lastUpdated: '1小时前',
      tags: ['日料', '探店', '小红书'],
      icon: '🍜',
      color: 'from-red-400 to-pink-500'
    },
    {
      id: '3',
      category: '职场',
      title: '职场效率工具',
      description: '效率工具推荐类内容需求量大，搜索量增长28%',
      trend: 'up',
      count: 3,
      lastUpdated: '3小时前',
      tags: ['效率', '工具', '职场'],
      icon: '💼',
      color: 'from-blue-400 to-cyan-500'
    },
    {
      id: '4',
      category: '旅行',
      title: '城市微旅行',
      description: '周末城市周边游成为新趋势，短途旅行内容受欢迎',
      trend: 'stable',
      count: 12,
      lastUpdated: '4小时前',
      tags: ['周末游', '城市周边', '短途旅行'],
      icon: '✈️',
      color: 'from-green-400 to-teal-500'
    },
    {
      id: '5',
      category: '美妆',
      title: '国货美妆崛起',
      description: '国货美妆品牌相关内容热度持续上升，用户关注度增加',
      trend: 'up',
      count: 15,
      lastUpdated: '30分钟前',
      tags: ['国货', '美妆', '护肤'],
      icon: '💄',
      color: 'from-purple-400 to-pink-500'
    },
    {
      id: '6',
      category: '健身',
      title: '居家健身',
      description: '居家健身和瑜伽相关内容需求稳定，适合长期创作',
      trend: 'stable',
      count: 7,
      lastUpdated: '1小时前',
      tags: ['居家健身', '瑜伽', '运动'],
      icon: '🏃‍♀️',
      color: 'from-yellow-400 to-orange-500'
    }
  ];

  useEffect(() => {
    // 模拟加载数据
    setTimeout(() => {
      setInsights(mockInsights);
      setLoading(false);
    }, 1000);
  }, []);

  // 获取趋势图标和颜色
  const getTrendInfo = (trend: string) => {
    switch (trend) {
      case 'up':
        return { icon: '📈', color: 'text-green-600', bgColor: 'bg-green-100' };
      case 'down':
        return { icon: '📉', color: 'text-red-600', bgColor: 'bg-red-100' };
      case 'stable':
        return { icon: '➡️', color: 'text-gray-600', bgColor: 'bg-gray-100' };
      default:
        return { icon: '➡️', color: 'text-gray-600', bgColor: 'bg-gray-100' };
    }
  };

  // 处理卡片点击
  const handleCardClick = (insight: Insight) => {
    setSelectedCategory(insight.category);
    onInsightSelect(insight);
  };

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-shrink-0 w-80 h-48 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        <AnimatePresence>
          {insights.map((insight, index) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              className={`flex-shrink-0 w-80 bg-gradient-to-br ${insight.color} rounded-xl p-6 text-white cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300`}
              onClick={() => handleCardClick(insight)}
            >
              {/* 卡片头部 */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{insight.icon}</div>
                  <div>
                    <h3 className="font-semibold text-lg">{insight.title}</h3>
                    <p className="text-sm opacity-90">{insight.category}</p>
                  </div>
                </div>

                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getTrendInfo(insight.trend).bgColor} ${getTrendInfo(insight.trend).color}`}>
                  <span className="flex items-center gap-1">
                    {getTrendInfo(insight.trend).icon}
                    {insight.trend === 'up' ? '上升' : insight.trend === 'down' ? '下降' : '稳定'}
                  </span>
                </div>
              </div>

              {/* 描述 */}
              <p className="text-sm opacity-95 mb-4 line-clamp-2">
                {insight.description}
              </p>

              {/* 标签 */}
              <div className="flex flex-wrap gap-2 mb-4">
                {insight.tags.slice(0, 3).map((tag, tagIndex) => (
                  <span
                    key={tagIndex}
                    className="px-3 py-1.5 bg-black bg-opacity-20 backdrop-blur-sm rounded-full text-xs font-semibold shadow-md border border-white border-opacity-50 hover:bg-opacity-30 hover:scale-105 transition-all duration-200"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* 底部信息 */}
              <div className="flex items-center justify-between pt-4 border-t border-white border-opacity-20">
                <div className="flex items-center gap-4 text-sm opacity-90">
                  <div className="flex items-center gap-1">
                    <FiBarChart2 className="w-4 h-4" />
                    <span>{insight.count} 条洞察</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FiClock className="w-4 h-4" />
                    <span>{insight.lastUpdated}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-90 hover:opacity-100 transition-opacity">
                  <span className="text-sm font-medium">立即使用</span>
                  <FiArrowRight className="w-4 h-4" />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* 查看更多卡片 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: insights.length * 0.1 }}
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          className="flex-shrink-0 w-80 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl p-6 cursor-pointer border-2 border-dashed border-gray-300 hover:border-gray-400 transition-all duration-300 flex flex-col items-center justify-center text-gray-600 min-h-[192px]"
        >
          <div className="text-4xl mb-3">🔍</div>
          <h3 className="font-semibold text-lg mb-2">查看更多洞察</h3>
          <p className="text-sm text-center opacity-90 mb-4">
            发现更多热门话题和创作灵感
          </p>
          <div className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
            <span className="text-sm font-medium">浏览全部</span>
            <FiArrowRight className="w-4 h-4" />
          </div>
        </motion.div>
      </div>

      {/* 指示器 */}
      <div className="absolute right-0 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <div className="w-8 h-16 bg-gradient-to-l from-white to-transparent opacity-60" />
      </div>
    </div>
  );
}

// 添加CSS隐藏滚动条
const scrollbarHideStyles = `
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`;

// 在组件加载时添加样式
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = scrollbarHideStyles;
  document.head.appendChild(style);
}