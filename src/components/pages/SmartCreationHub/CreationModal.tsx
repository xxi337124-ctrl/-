'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX, FiArrowLeft, FiArrowRight, FiZap,
  FiSettings, FiImage, FiFileText, FiCheck,
  FiRefreshCw, FiSave, FiUpload
} from 'react-icons/fi';
import { useCreationStore } from '@/lib/stores/creationStore';
import { useGlobalStore } from '@/lib/stores/globalStore';
import { Insight, Template } from '@/lib/stores/creationStore';

interface CreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    insight?: Insight | null;
    template?: Template | null;
    userInput?: string;
  };
}

export default function CreationModal({ isOpen, onClose, initialData }: CreationModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 使用全局store管理任务状态
  const { activeTask, updateTask } = useGlobalStore();
  const currentTaskId = activeTask?.id || null;
  const taskProgress = activeTask?.progress || 0;
  const taskProgressMessage = (activeTask as any)?.progressMessage || '';

  const {
    userInput,
    setUserInput,
    selectedInsight,
    setSelectedInsight,
    selectedTemplate,
    setSelectedTemplate,
    settings,
    updateSettings,
    generateContent,
    isGenerating,
    setIsGenerating,
    generatedContent,
    setGeneratedContent,
    generatedImages,
    setGeneratedImages,
    saveDraft,
    error,
    setError
  } = useCreationStore();

  // 步骤定义
  const steps = [
    {
      id: 'input',
      title: '输入内容',
      description: '描述你想创作的内容',
      icon: FiFileText
    },
    {
      id: 'enhance',
      title: '增强设置',
      description: '选择平台和风格',
      icon: FiSettings,
      optional: true
    },
    {
      id: 'preview',
      title: '预览确认',
      description: '确认生成配置',
      icon: FiImage
    },
    {
      id: 'generate',
      title: '生成内容',
      description: 'AI正在创作中...',
      icon: FiZap
    }
  ];

  // 初始化数据 - 只在模态框打开时执行一次
  useEffect(() => {
    if (isOpen && initialData) {
      if (initialData.userInput && initialData.userInput !== userInput) {
        setUserInput(initialData.userInput);
      }
      if (initialData.insight && initialData.insight !== selectedInsight) {
        setSelectedInsight(initialData.insight);
      }
      if (initialData.template && initialData.template !== selectedTemplate) {
        setSelectedTemplate(initialData.template);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]); // 只依赖isOpen,避免initialData对象引用变化导致的无限循环

  // 页面加载时检查是否有未完成的任务
  useEffect(() => {
    if (!isOpen) return;

    // 如果全局store中有活动任务,恢复状态
    if (activeTask && activeTask.type === 'content-creation') {
      console.log('🔄 检测到未完成的创作任务:', activeTask.id);
      setCurrentStep(3); // 跳转到生成步骤
      setIsGenerating(true);
    }
  }, [isOpen, activeTask, setIsGenerating]);

  // 轮询任务状态（简化版，主要逻辑由全局store处理）
  const pollTaskStatus = async (taskId: string) => {
    let shouldContinue = true;

    const poll = async () => {
      if (!shouldContinue) return;

      try {
        const response = await fetch(`/api/content-creation/${taskId}`);
        const data = await response.json();

        if (data.success && data.data.task) {
          const task = data.data.task;

          // 更新全局store中的任务状态
          updateTask({
            progress: task.progress || 0,
            status: task.status,
            result: task.result,
          });

          if (task.status === 'COMPLETED' && data.data.article) {
            // 任务完成 - 由全局store处理
            shouldContinue = false;
            const article = data.data.article;
            setGeneratedContent(article.content);
            setGeneratedImages(JSON.parse(article.images || '[]'));
            setIsGenerating(false);
            console.log('✅ 创作任务完成');

            // 全局store会自动处理清理和通知
            useGlobalStore.getState().completeTask(article);
          } else if (task.status === 'FAILED') {
            // 任务失败 - 由全局store处理
            shouldContinue = false;
            setError(task.error || '创作失败');
            setIsGenerating(false);
            console.error('❌ 创作任务失败:', task.error);

            useGlobalStore.getState().failTask(task.error || '创作失败');
          } else if (task.status === 'PROCESSING' || task.status === 'PENDING') {
            // 任务进行中，继续轮询
            if (shouldContinue) {
              setTimeout(poll, 2000);
            }
          }
        }
      } catch (error) {
        console.error('轮询任务状态失败:', error);
        shouldContinue = false;
        setError('网络错误，请检查连接');
        setIsGenerating(false);
      }
    };

    poll();
  };

  // 下一步
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  // 上一步
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // 跳转到指定步骤
  const handleStepClick = (stepIndex: number) => {
    // 只允许跳转到已完成的步骤或下一步
    if (stepIndex <= currentStep + 1 || (stepIndex < currentStep)) {
      setCurrentStep(stepIndex);
    }
  };

  // 开始生成
  const handleGenerate = async () => {
    setCurrentStep(3); // 跳转到生成步骤
    setIsGenerating(true);
    setError(null);

    try {
      const taskId = await generateContent();
      if (taskId) {
        // 注册任务到全局store
        useGlobalStore.getState().startTask(
          taskId,
          'content-creation',
          settings.platform,
          userInput.substring(0, 50) // 使用前50个字符作为标题
        );
        // 开始轮询
        pollTaskStatus(taskId);
      }
    } catch (error) {
      console.error('生成失败:', error);
      setIsGenerating(false);
      setError(error instanceof Error ? error.message : '生成失败，请重试');
    }
  };

  // 保存草稿
  const handleSaveDraft = async () => {
    try {
      await saveDraft();
      alert('草稿已保存！');
    } catch (error) {
      alert('保存失败，请重试');
    }
  };

  // 渲染当前步骤内容
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // 输入内容
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">你想创作什么内容？</h3>
              <p className="text-sm text-gray-600 mb-4">详细描述你的创作需求，AI会更好地理解你的意图</p>

              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="例如：我想写一篇关于成都咖啡店探店的文章，需要包含店铺环境、咖啡口味、价格等信息..."
                className="w-full h-40 p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />

              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-gray-500">{userInput.length} 字</span>
                {selectedInsight && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                    <span>📊</span>
                    <span>已选择洞察: {selectedInsight.title}</span>
                  </div>
                )}
                {selectedTemplate && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm">
                    <span>✨</span>
                    <span>已选择模板: {selectedTemplate.name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 快速增强选项 */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700">快速增强</h4>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <FiSettings className="w-4 h-4" />
                    <span className="font-medium text-sm">高级设置</span>
                  </div>
                  <p className="text-xs text-gray-500">平台、风格、字数等</p>
                </button>

                <button
                  onClick={handleSaveDraft}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <FiSave className="w-4 h-4" />
                    <span className="font-medium text-sm">保存草稿</span>
                  </div>
                  <p className="text-xs text-gray-500">稍后继续创作</p>
                </button>
              </div>

              {/* 高级设置展开区域 */}
              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">发布平台</label>
                        <select
                          value={settings.platform}
                          onChange={(e) => updateSettings({ platform: e.target.value })}
                          className="w-full p-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="xiaohongshu">小红书</option>
                          <option value="wechat">公众号</option>
                          <option value="douyin">抖音</option>
                          <option value="zhihu">知乎</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">写作风格</label>
                        <select
                          value={settings.style}
                          onChange={(e) => updateSettings({ style: e.target.value })}
                          className="w-full p-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="轻松活泼">轻松活泼</option>
                          <option value="专业深度">专业深度</option>
                          <option value="温馨治愈">温馨治愈</option>
                          <option value="幽默风趣">幽默风趣</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        字数范围: {settings.wordCount} 字
                      </label>
                      <input
                        type="range"
                        min="200"
                        max="2000"
                        step="100"
                        value={settings.wordCount}
                        onChange={(e) => updateSettings({ wordCount: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="includeImages"
                        checked={settings.includeImages}
                        onChange={(e) => updateSettings({ includeImages: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="includeImages" className="text-sm text-gray-700">
                        生成配图 ({settings.imageCount} 张)
                      </label>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        );

      case 1: // 增强设置
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">选择发布平台</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'xiaohongshu', label: '小红书', desc: '适合生活方式分享' },
                  { value: 'wechat', label: '公众号', desc: '适合深度文章' },
                  { value: 'douyin', label: '抖音', desc: '适合短视频文案' },
                  { value: 'zhihu', label: '知乎', desc: '适合知识分享' }
                ].map((platform) => (
                  <button
                    key={platform.value}
                    onClick={() => updateSettings({ platform: platform.value })}
                    className={`p-4 border rounded-lg text-left transition-all ${
                      settings.platform === platform.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-sm">{platform.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{platform.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-3">写作风格</h4>
              <div className="grid grid-cols-3 gap-3">
                {['轻松活泼', '专业深度', '温馨治愈', '幽默风趣', '简洁明了', '文艺清新'].map((style) => (
                  <button
                    key={style}
                    onClick={() => updateSettings({ style })}
                    className={`p-2 border rounded-md text-sm transition-all ${
                      settings.style === style
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-3">其他设置</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">字数范围</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="200"
                      max="2000"
                      step="100"
                      value={settings.wordCount}
                      onChange={(e) => updateSettings({ wordCount: parseInt(e.target.value) })}
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-600 min-w-[80px]">{settings.wordCount} 字</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="includeImages"
                    checked={settings.includeImages}
                    onChange={(e) => updateSettings({ includeImages: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="includeImages" className="text-sm text-gray-700">
                    生成配图
                  </label>
                  {settings.includeImages && (
                    <select
                      value={settings.imageCount}
                      onChange={(e) => updateSettings({ imageCount: parseInt(e.target.value) })}
                      className="ml-2 text-sm border border-gray-200 rounded px-2 py-1"
                    >
                      {[1, 2, 3, 4, 5, 6].map(num => (
                        <option key={num} value={num}>{num} 张</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 2: // 预览确认
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">确认生成配置</h3>
              <p className="text-sm text-gray-600">检查以下设置，确认后AI将开始创作</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">发布平台</label>
                  <div className="mt-1 font-medium text-gray-900">{settings.platform}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">写作风格</label>
                  <div className="mt-1 font-medium text-gray-900">{settings.style}</div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">字数范围</label>
                <div className="mt-1 font-medium text-gray-900">{settings.wordCount} 字</div>
              </div>

              {settings.includeImages && (
                <div>
                  <label className="text-sm font-medium text-gray-700">配图数量</label>
                  <div className="mt-1 font-medium text-gray-900">{settings.imageCount} 张</div>
                </div>
              )}

              {selectedInsight && (
                <div>
                  <label className="text-sm font-medium text-gray-700">参考洞察</label>
                  <div className="mt-1 p-3 bg-white rounded border text-sm">
                    <div className="font-medium">{selectedInsight.title}</div>
                    <div className="text-gray-600 mt-1">{selectedInsight.description}</div>
                  </div>
                </div>
              )}

              {selectedTemplate && (
                <div>
                  <label className="text-sm font-medium text-gray-700">使用模板</label>
                  <div className="mt-1 p-3 bg-white rounded border text-sm">
                    <div className="font-medium">{selectedTemplate.name}</div>
                    <div className="text-gray-600 mt-1">{selectedTemplate.description}</div>
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700">创作内容</label>
                <div className="mt-1 p-3 bg-white rounded border text-sm max-h-32 overflow-y-auto">
                  {userInput}
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-red-700 text-sm">{error}</div>
              </div>
            )}
          </div>
        );

      case 3: // 生成内容
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">AI正在创作中...</h3>
              <p className="text-sm text-gray-600">{taskProgressMessage || '请稍等，正在为你生成优质内容'}</p>
            </div>

            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <FiZap className="w-6 h-6 text-blue-600" />
                </div>
              </div>

              {/* 进度条 */}
              <div className="w-full max-w-md space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>创作进度</span>
                  <span>{taskProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${taskProgress}%` }}
                  />
                </div>
              </div>

              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">{taskProgressMessage || '正在分析内容需求...'}</p>
                <p className="text-xs text-gray-500">预计需要 30-60 秒</p>
                {currentTaskId && (
                  <p className="text-xs text-gray-400 mt-2">
                    任务ID: {currentTaskId.slice(0, 8)}... (切换页面不会中断)
                  </p>
                )}
              </div>
            </div>

            {/* 生成结果显示 */}
            {generatedContent && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700 mb-2">
                    <FiCheck className="w-5 h-5" />
                    <span className="font-medium">内容生成完成！</span>
                  </div>
                  <div className="text-sm text-green-600">
                    成功生成 {generatedContent.length} 字内容
                    {generatedImages.length > 0 && `，${generatedImages.length} 张配图`}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-800">生成的内容</h4>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedContent);
                        alert('内容已复制到剪贴板');
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      复制内容
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto bg-white p-4 rounded border text-sm">
                    {generatedContent}
                  </div>
                </div>

                {generatedImages.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-3">生成的配图</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {generatedImages.map((image, index) => (
                        <div key={index} className="aspect-square bg-white rounded border overflow-hidden">
                          <img src={image} alt={`配图 ${index + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // 检查是否可以继续到下一步
  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return userInput.trim().length > 0;
      case 1:
        return true; // 增强设置总是可以跳过
      case 2:
        return true; // 预览步骤总是可以继续
      default:
        return true;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4"
        style={{ left: '320px' }} // 不覆盖左侧导航栏（导航栏宽度320px = 80 * 4）
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden relative z-50"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 头部 */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">智能创作</h2>
              <p className="text-sm text-gray-600 mt-1">{steps[currentStep]?.description}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* 步骤指示器 */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => handleStepClick(index)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                      index === currentStep
                        ? 'bg-blue-600 text-white'
                        : index < currentStep
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                    }`}
                    disabled={index > currentStep + 1}
                  >
                    <step.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{step.title}</span>
                  </button>
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-0.5 mx-2 ${
                      index < currentStep ? 'bg-green-300' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 内容区域 */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* 底部操作 */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                currentStep === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FiArrowLeft className="w-4 h-4" />
              上一步
            </button>

            <div className="flex items-center gap-3">
              {currentStep < 2 && (
                <button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    !canProceed()
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  下一步
                  <FiArrowRight className="w-4 h-4" />
                </button>
              )}

              {currentStep === 2 && (
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors ${
                    isGenerating
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <FiZap className="w-4 h-4" />
                      开始生成
                    </>
                  )}
                </button>
              )}

              {currentStep === 3 && generatedContent && (
                <button
                  onClick={() => {
                    // TODO: 打开编辑页面或发布流程
                    console.log('打开编辑页面');
                    onClose();
                  }}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <FiCheck className="w-4 h-4" />
                  完成创作
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}