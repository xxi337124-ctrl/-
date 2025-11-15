"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings,
  TestTube,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Zap,
  Star
} from "lucide-react";

interface PromptConfig {
  id: string;
  name: string;
  description: string;
  version: string;
  category: string;
  style: string;
  isActive: boolean;
  stats?: {
    totalUses: number;
    avgRating: number;
    successRate: number;
  };
}

interface QualityTest {
  content: string;
  result?: {
    overallScore: number;
    aiRiskLevel: string;
    summary: string;
    recommendations: string[];
  };
  loading: boolean;
}

export default function PromptManager() {
  const [prompts, setPrompts] = useState<PromptConfig[]>([]);
  const [activeConfigId, setActiveConfigId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [testContent, setTestContent] = useState<QualityTest>({
    content: "",
    loading: false
  });
  const [abTest, setAbTest] = useState({
    running: false,
    results: null
  });

  // 加载提示词配置
  useEffect(() => {
    loadPromptConfigs();
  }, []);

  const loadPromptConfigs = async () => {
    try {
      const response = await fetch("/api/prompt-config");
      const data = await response.json();

      if (data.success) {
        setPrompts(data.data.configs);
        setActiveConfigId(data.data.activeConfigId);
      }
    } catch (error) {
      console.error("加载提示词配置失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const activatePrompt = async (configId: string) => {
    setActivatingId(configId);
    try {
      const response = await fetch("/api/prompt-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          configId,
          action: "activate"
        })
      });

      const data = await response.json();
      if (data.success) {
        setActiveConfigId(configId);
        // 重新加载配置列表
        await loadPromptConfigs();
      }
    } catch (error) {
      console.error("激活提示词配置失败:", error);
    } finally {
      setActivatingId(null);
    }
  };

  const testContentQuality = async () => {
    if (!testContent.content.trim()) return;

    setTestContent(prev => ({ ...prev, loading: true }));

    try {
      const response = await fetch("/api/content-quality", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: testContent.content,
          evaluationType: "comprehensive"
        })
      });

      const data = await response.json();
      if (data.success) {
        setTestContent(prev => ({
          ...prev,
          result: data.data,
          loading: false
        }));
      }
    } catch (error) {
      console.error("内容质量测试失败:", error);
      setTestContent(prev => ({ ...prev, loading: false }));
    }
  };

  const startABTest = async () => {
    setAbTest({ running: true, results: null });

    try {
      const response = await fetch("/api/prompt-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test"
        })
      });

      const data = await response.json();
      if (data.success) {
        // 模拟A/B测试结果
        setTimeout(() => {
          setAbTest({
            running: false,
            results: {
              configA: {
                name: "自然化版本 v2.0",
                totalTests: 50,
                avgScore: 7.8,
                aiDetectionRate: 15,
                winner: false
              },
              configB: {
                name: "增强版本 v3.0",
                totalTests: 50,
                avgScore: 8.5,
                aiDetectionRate: 8,
                winner: true
              },
              conclusion: "增强版本在内容质量和AI检测方面表现更优"
            }
          });
        }, 3000);
      }
    } catch (error) {
      console.error("A/B测试失败:", error);
      setAbTest({ running: false, results: null });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 7) return "text-yellow-600";
    return "text-red-600";
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "极低风险": return "text-green-600";
      case "低风险": return "text-blue-600";
      case "中风险": return "text-yellow-600";
      case "高风险": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-indigo-600" />
            <div>
              <CardTitle className="text-lg">提示词配置管理</CardTitle>
              <CardDescription>选择和配置最适合的AI提示词</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {prompts.map((prompt) => (
              <div
                key={prompt.id}
                className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  prompt.isActive
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => !prompt.isActive && activatePrompt(prompt.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{prompt.name}</h3>
                      <Badge variant={prompt.isActive ? "default" : "secondary"}>
                        {prompt.version}
                      </Badge>
                      {prompt.isActive && (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          使用中
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{prompt.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        使用 {prompt.stats?.totalUses || 0} 次
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        评分 {prompt.stats?.avgRating || "N/A"}
                      </span>
                      <span className="flex items-center gap-1">
                        <BarChart3 className="w-3 h-3" />
                        成功率 {prompt.stats?.successRate || 0}%
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    {!prompt.isActive && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={activatingId === prompt.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          activatePrompt(prompt.id);
                        }}
                      >
                        {activatingId === prompt.id ? (
                          <>
                            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
                            激活中...
                          </>
                        ) : (
                          "激活使用"
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="test" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="test" className="flex items-center gap-2">
            <TestTube className="w-4 h-4" />
            内容测试
          </TabsTrigger>
          <TabsTrigger value="abtest" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            A/B测试
          </TabsTrigger>
          <TabsTrigger value="compare" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            对比分析
          </TabsTrigger>
        </TabsList>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>内容质量测试</CardTitle>
              <CardDescription>测试内容的质量和AI检测风险</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <textarea
                className="w-full h-32 p-3 border rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="请输入要测试的内容..."
                value={testContent.content}
                onChange={(e) => setTestContent(prev => ({ ...prev, content: e.target.value }))}
              />
              <div className="flex justify-end">
                <Button
                  onClick={testContentQuality}
                  disabled={testContent.loading || !testContent.content.trim()}
                >
                  {testContent.loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      测试中...
                    </>
                  ) : (
                    <>
                      <TestTube className="w-4 h-4 mr-2" />
                      开始测试
                    </>
                  )}
                </Button>
              </div>

              {testContent.result && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">综合评分</label>
                      <div className={`text-2xl font-bold ${getScoreColor(testContent.result.overallScore)}`}>
                        {testContent.result.overallScore}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">AI风险</label>
                      <div className={`text-lg font-semibold ${getRiskColor(testContent.result.aiRiskLevel)}`}>
                        {testContent.result.aiRiskLevel}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">评估总结</label>
                    <p className="text-sm text-gray-600 mt-1">{testContent.result.summary}</p>
                  </div>

                  {testContent.result.recommendations.length > 0 && (
                    <div>
                      <label className="text-sm font-medium">改进建议</label>
                      <ul className="text-sm text-gray-600 mt-1 space-y-1">
                        {testContent.result.recommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="abtest" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>A/B测试</CardTitle>
              <CardDescription>对比测试不同提示词版本的效果</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">同时测试自然化版本和增强版本的效果</p>
                </div>
                <Button
                  onClick={startABTest}
                  disabled={abTest.running}
                >
                  {abTest.running ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      测试中...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="w-4 h-4 mr-2" />
                      开始A/B测试
                    </>
                  )}
                </Button>
              </div>

              {abTest.results && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(abTest.results).filter(([key]) => key !== 'conclusion').map(([key, data]: [string, any]) => (
                      <Card key={key} className={`p-4 ${data.winner ? 'border-green-500 bg-green-50' : ''}`}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{data.name}</h4>
                          {data.winner && (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              优胜
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>测试次数</span>
                            <span className="font-medium">{data.totalTests}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>平均评分</span>
                            <span className={`font-medium ${getScoreColor(data.avgScore)}`}>
                              {data.avgScore}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>AI检测率</span>
                            <span className="font-medium">{data.aiDetectionRate}%</span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                  <Alert>
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>{abTest.results.conclusion}</AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}