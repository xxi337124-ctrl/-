'use client';

import { useState, useEffect } from 'react';
import PromptDebugWorkbench from '@/components/PromptDebugWorkbench';
import AIDetectionResult from '@/components/AIDetectionResult';
import { BarChart3, Settings, TestTube, History, Plus, Play, Star, Trash2 } from 'lucide-react';

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
  isActive: boolean;
  isSystem: boolean;
  createdAt: string;
}

interface ABTest {
  id: string;
  name: string;
  description?: string;
  versionA: PromptVersion;
  versionB: PromptVersion;
  status: string;
  results?: any;
  createdAt: string;
}

export default function PromptsManagementPage() {
  const [promptVersions, setPromptVersions] = useState<PromptVersion[]>([]);
  const [abTests, setAbTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptVersion | null>(null);
  const [testContent, setTestContent] = useState<string>('');
  const [activeTab, setActiveTab] = useState('debug');

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 加载提示词版本
      const versionsResponse = await fetch('/api/prompts?includeSystem=true');
      const versionsData = await versionsResponse.json();
      if (versionsData.success) {
        setPromptVersions(versionsData.data);
      }

      // 加载A/B测试
      const testsResponse = await fetch('/api/prompts/ab-test');
      const testsData = await testsResponse.json();
      if (testsData.success) {
        setAbTests(testsData.data);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      setError('加载数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 激活提示词版本
  const activateVersion = async (versionId: string) => {
    try {
      const response = await fetch('/api/prompts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: versionId,
          isActive: true
        }),
      });

      const data = await response.json();
      if (data.success) {
        // 更新本地状态
        setPromptVersions(prev => prev.map(v => ({
          ...v,
          isActive: v.id === versionId
        })));
      }
    } catch (error) {
      console.error('激活版本失败:', error);
    }
  };

  // 删除提示词版本
  const deleteVersion = async (versionId: string) => {
    if (!confirm('确定要删除这个提示词版本吗？')) return;

    try {
      const response = await fetch(`/api/prompts?id=${versionId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        setPromptVersions(prev => prev.filter(v => v.id !== versionId));
        if (selectedPrompt?.id === versionId) {
          setSelectedPrompt(null);
        }
      }
    } catch (error) {
      console.error('删除版本失败:', error);
    }
  };

  // 运行A/B测试
  const runABTest = async (testId: string) => {
    try {
      const response = await fetch('/api/prompts/ab-test', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testId,
          testParams: {
            keyword: '测试主题',
            insights: ['测试洞察1', '测试洞察2'],
            wordCount: '800-1000'
          }
        }),
      });

      const data = await response.json();
      if (data.success) {
        // 更新测试状态
        setAbTests(prev => prev.map(test =>
          test.id === testId ? { ...test, ...data.data } : test
        ));
      }
    } catch (error) {
      console.error('运行A/B测试失败:', error);
    }
  };

  // 渲染提示词版本列表
  const renderVersionList = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">提示词版本管理</h3>
        <button
          onClick={() => {
            const name = prompt('请输入新版本名称:');
            if (name) {
              // 创建新版本的逻辑
              console.log('创建新版本:', name);
            }
          }}
          className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <Plus className="w-4 h-4" />
          新建版本
        </button>
      </div>

      <div className="grid gap-4">
        {promptVersions.map((version) => (
          <div key={version.id} className={`p-4 border rounded-lg ${version.isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">{version.name}</h4>
                  {version.isActive && (
                    <span className="text-xs px-2 py-1 bg-blue-500 text-white rounded">活跃</span>
                  )}
                  {version.isSystem && (
                    <span className="text-xs px-2 py-1 bg-gray-500 text-white rounded">系统</span>
                  )}
                </div>
                <p className="text-sm text-gray-600">{version.platform} • {version.style}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 bg-gray-100 rounded border">
                  {version.version}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setSelectedPrompt(version)}
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => activateVersion(version.id)}
                    disabled={version.isActive}
                    className="p-2 text-yellow-500 hover:bg-yellow-50 rounded disabled:opacity-50"
                  >
                    <Star className="w-4 h-4" />
                  </button>
                  {!version.isSystem && (
                    <button
                      onClick={() => deleteVersion(version.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-3 mt-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{(version.performance.aiDetectionScore * 100).toFixed(0)}%</div>
                <div className="text-xs text-gray-500">AI检测分数</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{version.performance.userRating.toFixed(1)}</div>
                <div className="text-xs text-gray-500">用户评分</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{version.performance.usageCount}</div>
                <div className="text-xs text-gray-500">使用次数</div>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              创建于 {new Date(version.createdAt).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // 渲染A/B测试列表
  const renderABTestList = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">A/B测试管理</h3>
        <button
          onClick={() => {
            const name = prompt('请输入测试名称:');
            if (name) {
              // 创建新测试的逻辑
              console.log('创建新测试:', name);
            }
          }}
          className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <Plus className="w-4 h-4" />
          新建测试
        </button>
      </div>

      <div className="grid gap-4">
        {abTests.map((test) => (
          <div key={test.id} className="p-4 border rounded-lg">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h4 className="font-semibold">{test.name}</h4>
                {test.description && (
                  <p className="text-sm text-gray-600">{test.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded ${
                  test.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                  test.status === 'RUNNING' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {test.status}
                </span>
                <button
                  onClick={() => runABTest(test.id)}
                  disabled={test.status === 'RUNNING'}
                  className="p-2 text-blue-500 hover:bg-blue-50 rounded disabled:opacity-50"
                >
                  <Play className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4 mt-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium mb-2">版本 A</div>
                <div className="text-xs text-gray-600">{test.versionA.name}</div>
                <div className="text-xs text-gray-500">{test.versionA.version}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium mb-2">版本 B</div>
                <div className="text-xs text-gray-600">{test.versionB.name}</div>
                <div className="text-xs text-gray-500">{test.versionB.version}</div>
              </div>
            </div>
            {test.results && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-sm font-medium mb-2">测试结果</div>
                <pre className="text-xs text-gray-600 overflow-x-auto">
                  {JSON.stringify(test.results, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">提示词管理系统</h1>
        <p className="text-gray-600">管理和优化您的AI写作提示词，提升内容质量</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* 标签页导航 */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'debug', label: '调试工作台', icon: TestTube },
            { id: 'versions', label: '版本管理', icon: Settings },
            { id: 'ab-test', label: 'A/B测试', icon: BarChart3 },
            { id: 'history', label: '历史记录', icon: History }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 font-medium border-b-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 标签页内容 */}
      <div className="tab-content">
        {activeTab === 'debug' && (
          <div className="space-y-6">
            <PromptDebugWorkbench
              onSave={(version) => {
                // 重新加载版本列表
                loadData();
              }}
            />
          </div>
        )}

        {activeTab === 'versions' && (
          <div className="space-y-6">
            {renderVersionList()}
          </div>
        )}

        {activeTab === 'ab-test' && (
          <div className="space-y-6">
            {renderABTestList()}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="p-6 border rounded-lg bg-white shadow-sm">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <History className="w-5 h-5" />
                检测历史
              </h2>
              <p className="text-gray-600 mb-4">查看之前的AI检测记录和效果分析</p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">测试文本</label>
                  <textarea
                    value={testContent}
                    onChange={(e) => setTestContent(e.target.value)}
                    placeholder="输入要测试的文本，查看AI检测效果..."
                    className="w-full min-h-[200px] p-3 border rounded-lg resize-none"
                  />
                </div>
                <AIDetectionResult
                  text={testContent}
                  onResult={(result) => {
                    console.log('检测结果:', result);
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}