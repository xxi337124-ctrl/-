'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import QuickInput from './QuickInput';
import InsightCards from './InsightCards';
import DraftManager from './DraftManager';
import TemplateGallery from './TemplateGallery';
import CreationModal from './CreationModal';
import { useCreationStore } from '@/lib/stores/creationStore';

export default function SmartCreationHub() {
  const searchParams = useSearchParams();
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const {
    userInput,
    setUserInput,
    selectedInsight,
    setSelectedInsight,
    selectedTemplate,
    setSelectedTemplate,
  } = useCreationStore();

  // 加载洞察数据
  const loadInsightData = useCallback(async (insightId: string) => {
    setIsLoadingData(true);
    console.log('Loading insight data for ID:', insightId);

    try {
      // 从API加载洞察数据
      const response = await fetch(`/api/insights/${insightId}`);
      const data = await response.json();

      if (data.success && data.data) {
        console.log('Insight data loaded:', data.data);

        // 设置洞察数据
        setSelectedInsight(data.data);

        // 预填充用户输入
        const report = data.data.report;
        if (report && report.structuredInsights && report.structuredInsights.length > 0) {
          const firstInsight = report.structuredInsights[0];
          setUserInput(`基于选题洞察: ${data.data.keyword}\n\n${firstInsight.title}\n${firstInsight.description}`);
        }

        // 打开创作模态框
        setActiveModal('creation');
      } else {
        console.error('Failed to load insight:', data.error);
        alert(`无法加载洞察数据: ${data.error || '未知错误'}`);
      }
    } catch (error) {
      console.error('Error loading insight:', error);
      alert('加载洞察数据失败,请稍后重试');
    } finally {
      setIsLoadingData(false);
    }
  }, [setSelectedInsight, setUserInput]);

  // 加载文章数据
  const loadArticleData = useCallback(async (fetchId: string, articleIndex: string) => {
    setIsLoadingData(true);
    console.log('Loading article data:', { fetchId, articleIndex });

    try {
      // 从localStorage加载抓取结果(假设TopicAnalysis存储在这里)
      const cacheKey = `fetch_result_${fetchId}`;
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        const fetchResult = JSON.parse(cached);
        const index = parseInt(articleIndex);
        const article = fetchResult.articles[index];

        if (article) {
          console.log('Article data loaded:', article);

          // 预填充文章内容
          setUserInput(`基于文章: ${article.title}\n\n摘要: ${article.excerpt || article.description || ''}\n\n请基于这篇文章生成新的创作内容。`);

          // 打开创作模态框
          setActiveModal('creation');
        } else {
          alert('无法找到指定的文章');
        }
      } else {
        // 如果localStorage没有,尝试从API获取
        alert('文章数据未找到,请返回选题洞察页面重新选择');
      }
    } catch (error) {
      console.error('Error loading article:', error);
      alert('加载文章数据失败,请稍后重试');
    } finally {
      setIsLoadingData(false);
    }
  }, [setUserInput]);

  // 处理URL参数自动打开创作流程
  useEffect(() => {
    const mode = searchParams.get('mode');
    const insightId = searchParams.get('insight');
    const fetchId = searchParams.get('fetchId');
    const articleIndex = searchParams.get('articleIndex');

    // 暂时禁用自动加载,避免无限循环
    // TODO: 需要优化URL参数处理逻辑
    console.log('URL params detected:', { mode, insightId, fetchId, articleIndex });

    // 从洞察创作模式
    // if (mode === 'creation' && insightId) {
    //   loadInsightData(insightId);
    // }

    // 直接创作模式(从文章)
    // if (mode === 'direct' && fetchId && articleIndex) {
    //   loadArticleData(fetchId, articleIndex);
    // }
  }, [searchParams]);

  // 智能建议系统
  const getSmartSuggestions = useCallback((input: string) => {
    if (!input) return [];

    type SuggestionType = 'insight' | 'style' | 'template' | 'general';
    interface Suggestion {
      type: SuggestionType;
      text: string;
      action: string;
    }

    const suggestions: Suggestion[] = [];

    // 关键词匹配建议
    const keywords: Record<string, Suggestion[]> = {
      '咖啡': [
        { type: 'insight', text: '咖啡相关洞察 (5条)', action: 'coffee_insights' },
        { type: 'style', text: '文艺小清新风格', action: 'literary_style' },
        { type: 'template', text: '探店打卡模板', action: 'visit_template' }
      ],
      '美食': [
        { type: 'insight', text: '美食热点分析', action: 'food_insights' },
        { type: 'style', text: '生活分享风格', action: 'lifestyle_style' },
        { type: 'template', text: '美食推荐模板', action: 'food_template' }
      ],
      '职场': [
        { type: 'insight', text: '职场干货洞察', action: 'workplace_insights' },
        { type: 'style', text: '专业深度风格', action: 'professional_style' },
        { type: 'template', text: '干货分享模板', action: 'knowledge_template' }
      ],
      '旅行': [
        { type: 'insight', text: '旅行攻略数据', action: 'travel_insights' },
        { type: 'style', text: '游记风格', action: 'travel_style' },
        { type: 'template', text: '旅行vlog模板', action: 'travel_template' }
      ]
    };

    // 匹配关键词
    Object.keys(keywords).forEach(key => {
      if (input.includes(key)) {
        suggestions.push(...keywords[key]);
      }
    });

    // 通用建议
    if (suggestions.length === 0) {
      suggestions.push(
        { type: 'general', text: '使用智能分析', action: 'ai_analysis' },
        { type: 'general', text: '选择内容模板', action: 'choose_template' },
        { type: 'general', text: '查看相关洞察', action: 'browse_insights' }
      );
    }

    return suggestions;
  }, []);

  // 处理快速创作
  const handleQuickCreate = useCallback(async (type: string, data?: any) => {
    switch (type) {
      case 'insight':
        setSelectedInsight(data);
        setActiveModal('creation');
        break;
      case 'template':
        setSelectedTemplate(data);
        setActiveModal('creation');
        break;
      case 'draft':
        // 恢复草稿
        setUserInput(data.content);
        setActiveModal('creation');
        break;
      default:
        setActiveModal('creation');
    }
  }, [setSelectedInsight, setSelectedTemplate, setUserInput]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      {/* 加载状态指示器 */}
      {isLoadingData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
          <div className="bg-white rounded-xl p-8 shadow-2xl">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-700 font-medium">正在加载创作数据...</p>
              <p className="text-sm text-gray-500">请稍候</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-8">
        {/* 页面标题 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI 创作中心
          </h1>
          <p className="text-gray-600 text-lg">
            智能创作，一键生成优质内容
          </p>
        </motion.div>

        {/* 快速创作区域 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          <QuickInput
            value={userInput}
            onChange={setUserInput}
            suggestions={getSmartSuggestions(userInput)}
            onSuggestionClick={(suggestion) => {
              // 处理建议点击
              console.log('Suggestion clicked:', suggestion);
              setShowSuggestions(false);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            showSuggestions={showSuggestions}
            setShowSuggestions={setShowSuggestions}
            onQuickCreate={() => handleQuickCreate('input')}
          />
        </motion.div>

        {/* 洞察卡片区域 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-800">
              📊 热门洞察
            </h2>
            <button className="text-blue-600 hover:text-blue-700 font-medium">
              查看全部 →
            </button>
          </div>
          <InsightCards onInsightSelect={(insight) => handleQuickCreate('insight', insight)} />
        </motion.div>

        {/* 草稿和模板区域 */}
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              📝 草稿箱
            </h3>
            <DraftManager onDraftSelect={(draft) => handleQuickCreate('draft', draft)} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              ✨ 热门模板
            </h3>
            <TemplateGallery onTemplateSelect={(template) => handleQuickCreate('template', template)} />
          </motion.div>
        </div>

        {/* 创作模态框 */}
        <AnimatePresence>
          {activeModal && (
            <CreationModal
              isOpen={!!activeModal}
              onClose={() => setActiveModal(null)}
              initialData={{
                insight: selectedInsight,
                template: selectedTemplate,
                userInput: userInput
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}