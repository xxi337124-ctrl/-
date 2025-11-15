'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiImage, FiFileText, FiCamera, FiVideo, FiMoreHorizontal, FiStar } from 'react-icons/fi';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  platform: string[];
  style: string;
  tags: string[];
  icon: string;
  preview: string;
  usage: number;
  rating: number;
}

interface TemplateGalleryProps {
  onTemplateSelect: (template: Template) => void;
  maxDisplay?: number;
}

export default function TemplateGallery({ onTemplateSelect, maxDisplay = 6 }: TemplateGalleryProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // 模拟模板数据
  const mockTemplates: Template[] = [
    {
      id: '1',
      name: '探店打卡',
      description: '适合分享餐厅、咖啡店等探店体验',
      category: '探店',
      platform: ['xiaohongshu', 'douyin'],
      style: '轻松活泼',
      tags: ['美食', '探店', '打卡'],
      icon: '📍',
      preview: '🏠 发现了一家超棒的咖啡店！\n\n☕ 环境：温馨舒适，很适合办公\n🍰 口味：拿铁香醇，甜点精致\n💰 价格：人均50元左右\n\n📍 地址：在老街深处，需要仔细找\n\n#咖啡探店 #城市发现 #美食推荐',
      usage: 1234,
      rating: 4.8
    },
    {
      id: '2',
      name: '好物推荐',
      description: '分享实用好物，种草神器',
      category: '种草',
      platform: ['xiaohongshu', 'weibo'],
      style: '真诚分享',
      tags: ['好物', '推荐', '种草'],
      icon: '🎁',
      preview: '✨ 近期爱用好物分享 ✨\n\n🌟 物品1：多功能收纳盒\n💡 亮点：节省空间，分类清晰\n💰 价格：29.9元\n\n🌟 物品2：便携式充电宝\n💡 亮点：轻薄小巧，快充给力\n💰 价格：89元\n\n#好物推荐 #生活好物 #种草',
      usage: 2345,
      rating: 4.6
    },
    {
      id: '3',
      name: '干货分享',
      description: '知识类内容，实用技巧分享',
      category: '知识',
      platform: ['wechat', 'zhihu'],
      style: '专业深度',
      tags: ['干货', '知识', '技巧'],
      icon: '📚',
      preview: '💼 职场效率提升的5个技巧\n\n1️⃣ 时间管理：使用番茄工作法\n2️⃣ 任务优先级：重要紧急矩阵\n3️⃣ 工具应用：善用效率软件\n4️⃣ 沟通技巧：结构化表达\n5️⃣ 学习成长：建立知识体系\n\n#职场干货 #效率提升 #个人成长',
      usage: 3456,
      rating: 4.9
    },
    {
      id: '4',
      name: '生活vlog',
      description: '记录日常生活，分享美好时光',
      category: '生活',
      platform: ['douyin', 'xiaohongshu'],
      style: '温馨治愈',
      tags: ['生活', 'vlog', '日常'],
      icon: '📹',
      preview: '🌅 周末治愈时光 vlog\n\n8:00 起床，做一杯手冲咖啡\n9:30 阳台瑜伽，享受阳光\n11:00 做一顿brunch\n14:00 看书，听轻音乐\n16:00 手工时间\n19:00 准备晚餐\n\n#生活vlog #治愈时光 #周末日常',
      usage: 1876,
      rating: 4.7
    },
    {
      id: '5',
      name: '旅行攻略',
      description: '详细旅行攻略，实用信息分享',
      category: '旅行',
      platform: ['xiaohongshu', 'mafengwo'],
      style: '详细实用',
      tags: ['旅行', '攻略', '游记'],
      icon: '✈️',
      preview: '🗺️ 成都三天两夜深度游攻略\n\n📍 Day1: 市区文化游\n• 上午：武侯祠 → 锦里\n• 下午：宽窄巷子\n• 晚上：九眼桥夜景\n\n📍 Day2: 熊猫基地+文殊院\n• 上午：大熊猫繁育基地\n• 下午：文殊院 → 太古里\n\n#成都旅行 #旅行攻略 #三天两夜',
      usage: 2789,
      rating: 4.8
    },
    {
      id: '6',
      name: '美妆教程',
      description: '化妆技巧，产品使用心得',
      category: '美妆',
      platform: ['xiaohongshu', 'douyin'],
      style: '详细教学',
      tags: ['美妆', '教程', '化妆'],
      icon: '💄',
      preview: '💋 日常通勤妆教程\n\n🌟 底妆：轻薄自然\n• 粉底液：选择与肤色相近的色号\n• 遮瑕：重点遮盖黑眼圈和痘印\n\n🌟 眼妆：干净清爽\n• 眼影：大地色系\n• 眼线：自然内眼线\n• 睫毛：根根分明\n\n#美妆教程 #通勤妆 #化妆技巧',
      usage: 1567,
      rating: 4.5
    }
  ];

  // 分类筛选
  const categories = [
    { id: 'all', name: '全部', count: mockTemplates.length },
    { id: '探店', name: '探店', count: mockTemplates.filter(t => t.category === '探店').length },
    { id: '种草', name: '种草', count: mockTemplates.filter(t => t.category === '种草').length },
    { id: '知识', name: '知识', count: mockTemplates.filter(t => t.category === '知识').length },
    { id: '生活', name: '生活', count: mockTemplates.filter(t => t.category === '生活').length },
    { id: '旅行', name: '旅行', count: mockTemplates.filter(t => t.category === '旅行').length },
    { id: '美妆', name: '美妆', count: mockTemplates.filter(t => t.category === '美妆').length }
  ];

  useEffect(() => {
    // 模拟加载模板数据
    setTimeout(() => {
      setTemplates(mockTemplates);
      setLoading(false);
    }, 600);
  }, []);

  // 筛选模板
  const filteredTemplates = selectedCategory === 'all'
    ? templates
    : templates.filter(template => template.category === selectedCategory);

  // 显示模板数量限制
  const displayTemplates = filteredTemplates.slice(0, maxDisplay);

  // 获取图标组件
  const getIconComponent = (icon: string) => {
    if (icon.startsWith('📍')) return () => <span>📍</span>;
    if (icon.startsWith('🎁')) return () => <span>🎁</span>;
    if (icon.startsWith('📚')) return () => <span>📚</span>;
    if (icon.startsWith('📹')) return () => <span>📹</span>;
    if (icon.startsWith('✈️')) return () => <span>✈️</span>;
    if (icon.startsWith('💄')) return () => <span>💄</span>;
    return FiFileText;
  };

  // 获取平台名称
  const getPlatformName = (platform: string) => {
    const platformMap: { [key: string]: string } = {
      'xiaohongshu': '小红书',
      'douyin': '抖音',
      'weibo': '微博',
      'wechat': '公众号',
      'zhihu': '知乎',
      'mafengwo': '马蜂窝'
    };
    return platformMap[platform] || platform;
  };

  // 渲染星级评分
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <FiStar
        key={index}
        className={`w-3 h-3 ${index < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 分类筛选 */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
              selectedCategory === category.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {category.name}
            <span className="ml-1 text-xs opacity-75">({category.count})</span>
          </button>
        ))}
      </div>

      {/* 模板网格 */}
      <div className="grid grid-cols-2 gap-3">
        <AnimatePresence mode="popLayout">
          {displayTemplates.map((template, index) => (
            <motion.div
              key={template.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-all duration-200 group"
              onClick={() => onTemplateSelect(template)}
            >
              {/* 模板头部 */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="text-xl">{template.icon}</div>
                  <h4 className="font-medium text-gray-800 text-sm">{template.name}</h4>
                </div>

                <div className="flex items-center gap-1">
                  {renderStars(template.rating)}
                  <span className="text-xs text-gray-500 ml-1">{template.rating}</span>
                </div>
              </div>

              {/* 描述 */}
              <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                {template.description}
              </p>

              {/* 平台标签 */}
              <div className="flex flex-wrap gap-1 mb-3">
                {template.platform.slice(0, 2).map((platform, index) => (
                  <span
                    key={index}
                    className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs"
                  >
                    {getPlatformName(platform)}
                  </span>
                ))}
                {template.platform.length > 2 && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">
                    +{template.platform.length - 2}
                  </span>
                )}
              </div>

              {/* 底部信息 */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-3">
                  <span>{template.style}</span>
                  <span>{template.usage} 次使用</span>
                </div>

                <div className="flex items-center gap-1 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>使用模板</span>
                  <FiMoreHorizontal className="w-3 h-3" />
                </div>
              </div>

              {/* 悬停效果 */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 opacity-0 group-hover:opacity-10 rounded-lg transition-opacity duration-200 pointer-events-none" />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* 查看更多 */}
        {filteredTemplates.length > maxDisplay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-2"
          >
            <button
              onClick={() => {
                // TODO: 打开模板库完整界面
                console.log('打开模板库');
              }}
              className="w-full py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-600 hover:text-gray-800 transition-colors flex items-center justify-center gap-2"
            >
              查看全部模板 ({filteredTemplates.length - maxDisplay}+)
            </button>
          </motion.div>
        )}
      </div>

      {/* 空状态 */}
      {displayTemplates.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <FiImage className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">该分类下暂无模板</p>
        </div>
      )}
    </div>
  );
}