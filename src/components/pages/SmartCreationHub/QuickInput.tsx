'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiZap, FiSearch, FiTrendingUp, FiEdit3, FiImage } from 'react-icons/fi';

interface Suggestion {
  type: 'insight' | 'style' | 'template' | 'general';
  text: string;
  action: string;
}

interface QuickInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: Suggestion[];
  onSuggestionClick: (suggestion: Suggestion) => void;
  onFocus: () => void;
  onBlur: () => void;
  showSuggestions: boolean;
  onQuickCreate: () => void;
}

export default function QuickInput({
  value,
  onChange,
  suggestions,
  onSuggestionClick,
  onFocus,
  onBlur,
  showSuggestions,
  onQuickCreate
}: QuickInputProps) {
  const [isComposing, setIsComposing] = useState(false);
  const [showExamples, setShowExamples] = useState(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 示例输入
  const examples = [
    '咖啡探店：分享一家隐藏在小巷里的精品咖啡店',
    '职场干货：如何在新工作中快速建立人脉',
    '美食推荐：市中心性价比超高的日料店',
    '生活分享：周末一个人的治愈时光',
    '旅行攻略：三天两夜成都深度游'
  ];

  // 自动调整输入框高度
  const adjustHeight = () => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  };

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    adjustHeight();

    // 隐藏示例，当用户开始输入时
    if (newValue.trim() && showExamples) {
      setShowExamples(false);
    }
    if (!newValue.trim() && !showExamples) {
      setShowExamples(true);
    }
  };

  // 处理快捷键
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl/Cmd + Enter 快速生成
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && value.trim()) {
      e.preventDefault();
      onQuickCreate();
    }

    // Tab 键选择第一个建议
    if (e.key === 'Tab' && suggestions.length > 0 && showSuggestions) {
      e.preventDefault();
      onSuggestionClick(suggestions[0]);
    }
  };

  // 获取建议图标
  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'insight':
        return <FiTrendingUp className="w-4 h-4" />;
      case 'style':
        return <FiEdit3 className="w-4 h-4" />;
      case 'template':
        return <FiImage className="w-4 h-4" />;
      default:
        return <FiZap className="w-4 h-4" />;
    }
  };

  // 获取建议颜色
  const getSuggestionColor = (type: string) => {
    switch (type) {
      case 'insight':
        return 'bg-blue-100 text-blue-700 hover:bg-blue-200';
      case 'style':
        return 'bg-purple-100 text-purple-700 hover:bg-purple-200';
      case 'template':
        return 'bg-green-100 text-green-700 hover:bg-green-200';
      default:
        return 'bg-gray-100 text-gray-700 hover:bg-gray-200';
    }
  };

  // 随机选择示例
  const getRandomExample = () => {
    const randomIndex = Math.floor(Math.random() * examples.length);
    return examples[randomIndex];
  };

  // 填充示例
  const fillExample = () => {
    const example = getRandomExample();
    onChange(example);
    setShowExamples(false);
    adjustHeight();
  };

  useEffect(() => {
    adjustHeight();
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {/* 输入区域 */}
      <div className="relative">
        <textarea
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          placeholder="告诉我你想写什么..."
          className="w-full p-4 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none overflow-hidden min-h-[100px] transition-colors duration-200"
          rows={3}
        />

        {/* 输入提示和操作按钮 */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          {/* 字符计数 */}
          {value && (
            <span className="text-sm text-gray-500">
              {value.length}/500
            </span>
          )}

          {/* 示例填充按钮 */}
          {!value && (
            <button
              onClick={fillExample}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors duration-200 flex items-center gap-1"
            >
              <FiZap className="w-3 h-3" />
              试试示例
            </button>
          )}

          {/* 快速生成按钮 */}
          {value.trim() && (
            <button
              onClick={onQuickCreate}
              disabled={!value.trim() || isComposing}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiZap className="w-4 h-4" />
              立即生成
              <span className="text-xs opacity-75">Ctrl+Enter</span>
            </button>
          )}
        </div>
      </div>

      {/* 示例提示 */}
      <AnimatePresence>
        {showExamples && !value && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 p-3 bg-blue-50 rounded-lg"
          >
            <p className="text-sm text-blue-700 mb-2">💡 你可以这样开始：</p>
            <div className="flex flex-wrap gap-2">
              {examples.slice(0, 3).map((example, index) => (
                <button
                  key={index}
                  onClick={() => {
                    onChange(example);
                    setShowExamples(false);
                    adjustHeight();
                  }}
                  className="px-3 py-1 text-xs bg-white border border-blue-200 text-blue-600 rounded-full hover:bg-blue-100 transition-colors duration-200"
                >
                  {example.split('：')[0]}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 智能建议面板 */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto"
          >
            <div className="p-3 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-700">
                💡 智能建议
              </p>
              <p className="text-xs text-gray-500 mt-1">
                基于你的输入，我们为你推荐：
              </p>
            </div>

            <div className="p-2 space-y-1">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => onSuggestionClick(suggestion)}
                  className={`w-full p-3 rounded-lg flex items-center gap-3 transition-all duration-200 ${getSuggestionColor(suggestion.type)}`}
                >
                  <div className="flex-shrink-0">
                    {getSuggestionIcon(suggestion.type)}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">{suggestion.text}</p>
                    <p className="text-xs opacity-75 mt-0.5">
                      {suggestion.type === 'insight' && '基于数据分析的建议'}
                      {suggestion.type === 'style' && '适合的写作风格'}
                      {suggestion.type === 'template' && '快速开始模板'}
                      {suggestion.type === 'general' && '智能推荐'}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-xs opacity-50">
                      {index === 0 && 'Tab'}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* 底部操作 */}
            <div className="p-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>按 Tab 键选择第一个建议</span>
                <button
                  onClick={() => setShowSuggestions(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  收起
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}