'use client';

import { useState, useEffect } from 'react';
import { Play, Save, RefreshCw, TrendingUp, Target, Clock } from 'lucide-react';

interface DebugResult {
  id: string;
  generatedContent: string;
  aiDetection: {
    naturalnessScore: number;
    humanProbability: number;
    keyCharacteristics: {
      personalExpression: number;
      concreteDetails: number;
      emotionalAuthenticity: number;
      naturalFlow: number;
      sentenceVariety: number;
    };
    improvementSuggestions: string[];
  };
  generationTime: number;
  tokenUsage: number;
}

interface PromptVersion {
  id: string;
  name: string;
  version: string;
  content: string;
  platform: string;
  style: string;
  performance: {
    aiDetectionScore: number;
    userRating: number;
    usageCount: number;
  };
}

interface Props {
  initialPrompt?: string;
  initialPlatform?: string;
  initialStyle?: string;
  onSave?: (version: PromptVersion) => void;
}

export default function PromptDebugWorkbench({
  initialPrompt = '',
  initialPlatform = 'WECHAT',
  initialStyle = 'natural',
  onSave
}: Props) {
  // 状态管理
  const [promptContent, setPromptContent] = useState(initialPrompt);
  const [platform, setPlatform] = useState(initialPlatform);
  const [style, setStyle] = useState(initialStyle);
  const [isGenerating, setIsGenerating] = useState(false);
  const [debugResult, setDebugResult] = useState<DebugResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [promptVersions, setPromptVersions] = useState<PromptVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [userRating, setUserRating] = useState<number>(0);
  const [userFeedback, setUserFeedback] = useState<string>('');

  // 平台选项
  const platformOptions = [
    { value: 'XIAOHONGSHU', label: '小红书', icon: '📱' },
    { value: 'WECHAT', label: '微信公众号', icon: '💬' },
    { value: 'ZHIBO', label: '直播文案', icon: '📺' },
    { value: 'DOUYIN', label: '抖音', icon: '🎵' }
  ];

  // 风格选项
  const styleOptions = [
    { value: 'natural', label: '自然化', description: '贴近真实表达' },
    { value: 'professional', label: '专业化', description: '深度专业内容' },
    { value: 'casual', label: '轻松化', description: '轻松随意风格' },
    { value: 'story', label: '故事化', description: '故事叙述方式' }
  ];

  // 加载提示词版本
  useEffect(() => {
    loadPromptVersions();
  }, [platform, style]);

  const loadPromptVersions = async () => {
    try {
      const response = await fetch(`/api/prompts?platform=${platform}&style=${style}&includeSystem=true`);
      const data = await response.json();
      if (data.success) {
        setPromptVersions(data.data);
        // 选择最佳版本
        const bestVersion = data.data.find((v: PromptVersion) => v.isActive) || data.data[0];
        if (bestVersion) {
          setSelectedVersion(bestVersion.id);
          setPromptContent(bestVersion.content);
        }
      }
    } catch (error) {
      console.error('加载提示词版本失败:', error);
    }
  };

  // 执行调试
  const handleDebug = async () => {
    if (!promptContent.trim()) {
      setError('请输入提示词内容');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setDebugResult(null);

    try {
      const response = await fetch('/api/prompts/debug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          promptContent,
          platform,
          style,
          testParams: {
            keyword: '测试主题',
            insights: ['测试洞察1', '测试洞察2'],
            wordCount: '800-1000'
          }
        }),
      });

      const data = await response.json();

      if (data.success) {
        setDebugResult(data.data);
      } else {
        setError(data.error || '调试失败');
      }
    } catch (error) {
      setError('网络请求失败');
      console.error('调试失败:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // 保存用户反馈
  const handleSaveFeedback = async () => {
    if (!debugResult || userRating === 0) {
      setError('请先进行调试并给出评分');
      return;
    }

    try {
      const response = await fetch('/api/prompts/debug', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: debugResult.id,
          userRating,
          userFeedback
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('反馈保存成功！');
        setUserRating(0);
        setUserFeedback('');
      }
    } catch (error) {
      setError('保存反馈失败');
      console.error('保存反馈失败:', error);
    }
  };

  // 保存为新版本
  const handleSaveVersion = async () => {
    if (!promptContent.trim()) {
      setError('请输入提示词内容');
      return;
    }

    const versionName = prompt('请输入新版本名称:');
    if (!versionName) return;

    try {
      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: versionName,
          description: `基于调试结果创建的新版本`,
          platform,
          style,
          content: promptContent,
          baseOnVersionId: selectedVersion
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('新版本保存成功！');
        if (onSave) {
          onSave(data.data);
        }
        loadPromptVersions();
      }
    } catch (error) {
      setError('保存版本失败');
      console.error('保存版本失败:', error);
    }
  };

  // AI检测分数颜色
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // 渲染特征雷达图
  const renderCharacteristics = (characteristics: any) => {
    const chars = [
      { key: 'personalExpression', label: '个人表达', icon: '👤' },
      { key: 'concreteDetails', label: '具体细节', icon: '📍' },
      { key: 'emotionalAuthenticity', label: '情感真实', icon: '❤️' },
      { key: 'naturalFlow', label: '自然流畅', icon: '🌊' },
      { key: 'sentenceVariety', label: '句式变化', icon: '📝' }
    ];

    return (
      <div className="grid grid-cols-1 gap-4">
        {chars.map((char) => (
          <div key={char.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <span>{char.icon}</span>
              <span className="text-sm font-medium">{char.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-20 h-2 bg-gray-200 rounded-full">
                <div
                  className="h-2 bg-blue-500 rounded-full transition-all"
                  style={{ width: `${characteristics[char.key]}%` }}
                />
              </div>
              <span className="text-sm text-gray-600 w-10">
                {Math.round(characteristics[char.key])}%
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      {/* 头部标题 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          提示词调试工作台
        </h1>
        <p className="text-gray-600">
          实时调试和优化您的AI写作提示词，获得最佳的创作效果
        </p>
      </div>

      {/* 配置面板 */}
      <div className="p-6 border rounded-lg bg-white shadow-sm">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5" />
          提示词配置
        </h2>
        <p className="text-gray-600 mb-4">选择平台和风格，编写或选择提示词版本</p>

        <div className="space-y-4">
          {/* 平台和风格选择 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">发布平台</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                {platformOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.icon} {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">写作风格</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                {styleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 提示词版本选择 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">选择提示词版本</label>
            <select
              value={selectedVersion}
              onChange={(e) => {
                setSelectedVersion(e.target.value);
                const version = promptVersions.find(v => v.id === e.target.value);
                if (version) {
                  setPromptContent(version.content);
                }
              }}
              className="w-full p-2 border rounded-md"
            >
              <option value="">选择或创建提示词版本</option>
              {promptVersions.map((version) => (
                <option key={version.id} value={version.id}>
                  {version.name} {version.isActive ? '(活跃)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 提示词内容 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">提示词内容</label>
            <textarea
              value={promptContent}
              onChange={(e) => setPromptContent(e.target.value)}
              placeholder="在这里输入或编辑您的提示词..."
              className="w-full min-h-[200px] p-3 border rounded-lg font-mono text-sm"
            />
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2">
            <button
              onClick={handleDebug}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  生成中...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  开始调试
                </>
              )}
            </button>

            <button
              onClick={handleSaveVersion}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              <Save className="w-4 h-4" />
              保存为新版本
            </button>

            <button
              onClick={() => {
                // 重置到默认提示词
                setPromptContent('');
                setDebugResult(null);
              }}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4" />
              重置
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-red-600">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* 调试结果 */}
      {debugResult && (
        <div className="p-6 border rounded-lg bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            调试结果
          </h2>
          <p className="text-gray-600 mb-4">生成效果和AI检测分析</p>

          <div className="space-y-6">
            {/* 生成内容 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">生成内容</span>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {debugResult.generationTime}ms
                  </span>
                  <span>Token: {debugResult.tokenUsage}</span>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm">
                  {debugResult.generatedContent}
                </pre>
              </div>
            </div>

            {/* AI检测分析 */}
            <div className="space-y-4">
              <h3 className="font-medium">AI检测分析</h3>
              <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <div className="text-4xl font-bold mb-2">
                  <span className={getScoreColor(debugResult.aiDetection.naturalnessScore)}>
                    {debugResult.aiDetection.naturalnessScore}
                  </span>
                </div>
                <div className="text-lg text-gray-600 mb-2">自然度评分</div>
                <div className="text-sm text-gray-500">
                  人类写作概率: {(debugResult.aiDetection.humanProbability * 100).toFixed(1)}%
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">写作特征分析</h4>
                {renderCharacteristics(debugResult.aiDetection.keyCharacteristics)}
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">改进建议</h4>
                <div className="space-y-2">
                  {debugResult.aiDetection.improvementSuggestions.map((suggestion, index) => (
                    <div key={index} className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                      <p className="text-sm">{suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 用户反馈 */}
            <div className="space-y-4">
              <h3 className="font-medium">您的反馈</h3>
              <div className="space-y-2">
                <label className="text-sm font-medium">您的评分</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setUserRating(rating)}
                      className={`w-10 h-10 rounded border ${
                        userRating >= rating
                          ? 'bg-blue-500 text-white'
                          : 'bg-white text-gray-700'
                      }`}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">您的反馈（可选）</label>
                <textarea
                  value={userFeedback}
                  onChange={(e) => setUserFeedback(e.target.value)}
                  placeholder="对这个提示词版本的看法、建议等..."
                  className="w-full min-h-[100px] p-3 border rounded-lg"
                />
              </div>

              <button
                onClick={handleSaveFeedback}
                disabled={userRating === 0}
                className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              >
                保存反馈
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}