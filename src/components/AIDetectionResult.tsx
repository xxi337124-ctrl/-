'use client';

import { useState, useEffect } from 'react';
import { BarChart3, RefreshCw, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface Props {
  text: string;
  onResult?: (result: any) => void;
  className?: string;
}

interface DetectionResult {
  results: Array<{
    engine: string;
    displayName: string;
    aiScore: number;
    humanScore: number;
    confidence: number;
    details?: any;
  }>;
  consensus: {
    averageAIScore: number;
    averageHumanScore: number;
    confidence: number;
    agreement: number;
  };
  recommendations: string[];
  bestEngine?: string;
}

export default function AIDetectionResult({ text, onResult, className = '' }: Props) {
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 执行AI检测
  const performDetection = async () => {
    if (!text.trim()) {
      setError('请输入要检测的文本');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai-detection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          engines: ['local'],
          useCache: true
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
        if (onResult) {
          onResult(data.data);
        }
      } else {
        setError(data.error || '检测失败');
      }
    } catch (error) {
      setError('网络请求失败');
      console.error('AI检测失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 自动检测
  useEffect(() => {
    if (text.length > 100) {
      performDetection();
    }
  }, [text]);

  // 获取分数颜色
  const getScoreColor = (score: number, type: 'ai' | 'human' = 'ai') => {
    const threshold = type === 'ai' ? 0.7 : 0.3;
    if (score >= threshold) return type === 'ai' ? 'text-red-600' : 'text-green-600';
    if (score >= 0.4) return 'text-yellow-600';
    return type === 'ai' ? 'text-green-600' : 'text-red-600';
  };

  // 获取分数图标
  const getScoreIcon = (score: number, type: 'ai' | 'human' = 'ai') => {
    const threshold = type === 'ai' ? 0.7 : 0.3;
    if (score >= threshold) {
      return type === 'ai' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />;
    }
    if (score >= 0.4) {
      return <AlertTriangle className="w-4 h-4" />;
    }
    return type === 'ai' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />;
  };

  // 渲染单个引擎的结果
  const renderEngineResult = (engineResult: any) => {
    return (
      <div className="p-4 border rounded-lg border-gray-200 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h4 className="font-medium">{engineResult.displayName}</h4>
            <span className="text-xs px-2 py-1 bg-gray-100 rounded border">
              置信度 {(engineResult.confidence * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            {getScoreIcon(engineResult.aiScore)}
            <span className={`text-sm font-medium ${getScoreColor(engineResult.aiScore)}`}>
              {(engineResult.aiScore * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">AI可能性</span>
              <span className={getScoreColor(engineResult.aiScore)}>
                {(engineResult.aiScore * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-red-500 h-2 rounded-full transition-all"
                style={{ width: `${engineResult.aiScore * 100}%` }}
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">人类可能性</span>
              <span className={getScoreColor(engineResult.humanScore, 'human')}>
                {(engineResult.humanScore * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${engineResult.humanScore * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 渲染共识结果
  const renderConsensus = (consensus: any) => (
    <div className="space-y-4">
      <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
        <div className="text-4xl font-bold mb-2">
          <span className={getScoreColor(consensus.averageAIScore)}>
            {(consensus.averageAIScore * 100).toFixed(1)}
          </span>
        </div>
        <div className="text-lg text-gray-600 mb-4">综合AI检测分数</div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-gray-500">人类概率</div>
            <div className="font-medium">{(consensus.averageHumanScore * 100).toFixed(1)}%</div>
          </div>
          <div>
            <div className="text-gray-500">置信度</div>
            <div className="font-medium">{(consensus.confidence * 100).toFixed(1)}%</div>
          </div>
          <div>
            <div className="text-gray-500">一致性</div>
            <div className="font-medium">{(consensus.agreement * 100).toFixed(1)}%</div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          改进建议
        </h4>
        {consensus.recommendations.map((rec: string, index: number) => (
          <div key={index} className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
            <p className="text-sm">{rec}</p>
          </div>
        ))}
      </div>
    </div>
  );

  if (!text.trim()) {
    return (
      <div className={`p-4 border rounded-lg ${className}`}>
        <div className="text-center py-8">
          <p className="text-gray-500">输入文本后将自动进行AI检测</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 border rounded-lg ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          <h3 className="font-semibold">AI检测分析</h3>
        </div>
        <button
          onClick={performDetection}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              检测中...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              重新检测
            </>
          )}
        </button>
      </div>

      <div className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">正在进行AI检测，请稍候...</p>
          </div>
        )}

        {result && !loading && (
          <>
            {/* 综合结果 */}
            {renderConsensus(result.consensus)}

            {/* 各引擎详细结果 */}
            <div className="space-y-4">
              <h4 className="font-medium">各检测引擎结果</h4>
              {result.results.map(renderEngineResult)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// AI检测API路由（需要创建对应的API文件）
export async function createAIDetectionAPI() {
  // 这个函数的内容应该放在 /src/app/api/ai-detection/route.ts 中
  return `
import { NextRequest, NextResponse } from 'next/server';
import { aiDetector } from '@/lib/ai-detection-engines';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const body = await request.json();
    const { text, engines, useCache = true } = body;

    if (!text) {
      return NextResponse.json({ error: '缺少文本内容' }, { status: 400 });
    }

    // 执行AI检测
    const result = await aiDetector.detect(text, { engines, useCache });

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('AI检测失败:', error);
    return NextResponse.json(
      { error: 'AI检测失败' },
      { status: 500 }
    );
  }
}
  `;
}