"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiSave, FiRefreshCw, FiMessageSquare, FiImage, FiSearch, FiAlertCircle, FiKey, FiEye, FiEyeOff, FiCheckCircle, FiXCircle, FiExternalLink } from "react-icons/fi";
import { PageContainer, Section } from "@/components/common/Layout";
import { colors, animations } from "@/lib/design";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ApiKeysManager from "@/lib/apiKeysManager";

type TabType = 'api-keys' | 'wechat' | 'xiaohongshu' | 'insight' | 'xhs-rewrite';

interface Settings {
  textPrompt: string;
  wechatTextPrompt: string;
  xiaohongshuTextPrompt: string;
  insightPrompt: string;
  imageAnalysisPrompt: string;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('api-keys');
  const [settings, setSettings] = useState<Settings>({
    textPrompt: '',
    wechatTextPrompt: '',
    xiaohongshuTextPrompt: '',
    insightPrompt: '',
    imageAnalysisPrompt: '',
  });

  // API Keys state
  const [apiKeys, setApiKeys] = useState({
    openrouterKey: '',
    siliconflowKey: '',
    doubaoKey: '',
    xhsCookie: '',
  });
  const [showKeys, setShowKeys] = useState({
    openrouterKey: false,
    siliconflowKey: false,
    doubaoKey: false,
    xhsCookie: false,
  });
  const [apiKeySaved, setApiKeySaved] = useState(false);

  useEffect(() => {
    loadSettings();
    loadApiKeys();
  }, []);

  const loadApiKeys = () => {
    const keys = ApiKeysManager.getKeys();
    if (keys) {
      setApiKeys(keys);
    }
  };

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/prompt-settings');
      const data = await response.json();

      if (data.success) {
        setSettings(data.data);
      }
    } catch (error) {
      console.error('加载设置失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/prompt-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      if (data.success) {
        alert('设置保存成功! ✅');
      } else {
        throw new Error(data.error || '未知错误');
      }
    } catch (error: any) {
      console.error('保存设置失败:', error);
      alert(`保存失败: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveApiKeys = () => {
    try {
      ApiKeysManager.saveKeys(apiKeys);
      setApiKeySaved(true);
      setTimeout(() => setApiKeySaved(false), 3000);
      alert('API Keys 保存成功! ✅');
    } catch (error: any) {
      console.error('保存 API Keys 失败:', error);
      alert(`保存失败: ${error.message}`);
    }
  };

  const handleClearApiKeys = () => {
    if (confirm('确定要清除所有 API Keys 吗？')) {
      ApiKeysManager.clearKeys();
      setApiKeys({
        openrouterKey: '',
        siliconflowKey: '',
        doubaoKey: '',
        xhsCookie: '',
      });
      alert('API Keys 已清除');
    }
  };

  const toggleShowKey = (key: keyof typeof showKeys) => {
    setShowKeys(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const tabs = [
    { id: 'api-keys' as const, label: 'API 密钥', icon: '🔑', color: 'blue' },
    { id: 'wechat' as const, label: '公众号文案', icon: '📱', color: 'green' },
    { id: 'xiaohongshu' as const, label: '小红书文案', icon: '📕', color: 'red' },
    { id: 'xhs-rewrite' as const, label: '小红书二创', icon: '✨', color: 'pink' },
    { id: 'insight' as const, label: '洞察分析', icon: '🔍', color: 'indigo' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">加载设置中...</p>
        </div>
      </div>
    );
  }

  return (
    <PageContainer
      title="创作设置"
      description="配置AI文字创作和图片生成的提示词参数"
      actions={
        <div className="flex items-center gap-3">
          <button
            onClick={loadSettings}
            disabled={loading || saving}
            className="px-4 py-2 bg-white border-2 border-gray-200 rounded-xl hover:border-purple-500 transition-all flex items-center gap-2 text-gray-600 hover:text-purple-600"
          >
            <FiRefreshCw className="w-4 h-4" />
            <span className="text-sm">重新加载</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-6 py-3 bg-gradient-to-r ${colors.gradients.purple} text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2`}
          >
            <FiSave className="w-5 h-5" />
            {saving ? '保存中...' : '保存设置'}
          </button>
        </div>
      }
    >
      {/* 标签导航 */}
      <Section>
        <motion.div
          {...animations.fadeIn}
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
        >
          <div className="flex gap-2 flex-wrap mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${
                  activeTab === tab.id
                    ? `bg-gradient-to-r ${colors.gradients.purple} text-white shadow-md scale-105`
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="text-xl">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* API 密钥配置 */}
            {activeTab === 'api-keys' && (
              <motion.div
                key="api-keys"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-6 rounded-xl">
                  <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2 text-lg">
                    <FiKey className="w-6 h-6" />
                    API 密钥配置
                  </h3>
                  <p className="text-sm text-blue-800 leading-relaxed mb-3">
                    配置你的 API 密钥以使用内容工厂的各项功能。密钥将安全存储在浏览器本地，不会上传到服务器。
                  </p>
                  <div className="bg-white bg-opacity-60 p-4 rounded-lg">
                    <div className="flex items-start gap-2">
                      <FiAlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-900">
                        <strong>隐私保护：</strong>所有 API 密钥仅存储在你的浏览器本地（localStorage），不会发送到任何服务器。每次使用功能时，密钥会从本地读取并直接调用相应的 API 服务。
                      </p>
                    </div>
                  </div>
                </div>

                {/* OpenRouter API Key */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold text-gray-900 flex items-center gap-2">
                      <span className="text-xl">🤖</span>
                      OpenRouter API Key
                      <span className="text-red-500">*</span>
                    </Label>
                    <a
                      href="https://openrouter.ai/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
                    >
                      获取密钥 <FiExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="relative">
                    <Input
                      type={showKeys.openrouterKey ? "text" : "password"}
                      value={apiKeys.openrouterKey}
                      onChange={(e) => setApiKeys({...apiKeys, openrouterKey: e.target.value})}
                      placeholder="sk-or-v1-xxxxxxxxxxxxx"
                      className="pr-10 font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowKey('openrouterKey')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showKeys.openrouterKey ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-600">
                    用于：文案生成（Gemini 3 Pro）、内容分析、图片提示词生成
                  </p>
                </div>

                {/* SiliconFlow API Key */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold text-gray-900 flex items-center gap-2">
                      <span className="text-xl">🎨</span>
                      SiliconFlow API Key
                      <span className="text-red-500">*</span>
                    </Label>
                    <a
                      href="https://cloud.siliconflow.cn/account/ak"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
                    >
                      获取密钥 <FiExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="relative">
                    <Input
                      type={showKeys.siliconflowKey ? "text" : "password"}
                      value={apiKeys.siliconflowKey}
                      onChange={(e) => setApiKeys({...apiKeys, siliconflowKey: e.target.value})}
                      placeholder="sk-xxxxxxxxxxxxx"
                      className="pr-10 font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowKey('siliconflowKey')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showKeys.siliconflowKey ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-600">
                    用于：智能创作的文生图功能
                  </p>
                </div>

                {/* Doubao API Key */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold text-gray-900 flex items-center gap-2">
                      <span className="text-xl">✨</span>
                      Doubao API Key
                      <span className="text-red-500">*</span>
                    </Label>
                    <a
                      href="https://console.volcengine.com/ark"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
                    >
                      获取密钥 <FiExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="relative">
                    <Input
                      type={showKeys.doubaoKey ? "text" : "password"}
                      value={apiKeys.doubaoKey}
                      onChange={(e) => setApiKeys({...apiKeys, doubaoKey: e.target.value})}
                      placeholder="xxxxxxxxxxxxx"
                      className="pr-10 font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowKey('doubaoKey')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showKeys.doubaoKey ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-600">
                    用于：小红书二创的图生图优化（SeeDream 4.0）
                  </p>
                </div>

                {/* XHS Cookie (Optional) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold text-gray-900 flex items-center gap-2">
                      <span className="text-xl">🍪</span>
                      小红书 Cookie
                      <span className="text-gray-400 text-xs ml-2">（可选）</span>
                    </Label>
                  </div>
                  <div className="relative">
                    <Input
                      type={showKeys.xhsCookie ? "text" : "password"}
                      value={apiKeys.xhsCookie}
                      onChange={(e) => setApiKeys({...apiKeys, xhsCookie: e.target.value})}
                      placeholder="web_session=xxxxx; xsecappid=xhs-pc-web"
                      className="pr-10 font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowKey('xhsCookie')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showKeys.xhsCookie ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-xs text-gray-700 mb-2"><strong>获取方式：</strong></p>
                    <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
                      <li>浏览器打开 <a href="https://www.xiaohongshu.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">xiaohongshu.com</a></li>
                      <li>登录你的小红书账号</li>
                      <li>按 F12 打开开发者工具</li>
                      <li>切换到 Application → Cookies → xiaohongshu.com</li>
                      <li>复制 web_session 的值，格式：web_session=xxxxx; xsecappid=xhs-pc-web</li>
                    </ol>
                  </div>
                  <p className="text-xs text-gray-600">
                    用于：小红书搜索功能（不配置则无法使用小红书搜索）
                  </p>
                </div>

                {/* 配置状态 */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-5">
                  <h4 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                    <FiCheckCircle className="w-5 h-5" />
                    配置状态
                  </h4>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className={`flex items-center gap-2 p-3 rounded-lg ${apiKeys.openrouterKey ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {apiKeys.openrouterKey ? <FiCheckCircle className="w-4 h-4" /> : <FiXCircle className="w-4 h-4" />}
                      <span className="text-sm">OpenRouter</span>
                    </div>
                    <div className={`flex items-center gap-2 p-3 rounded-lg ${apiKeys.siliconflowKey ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {apiKeys.siliconflowKey ? <FiCheckCircle className="w-4 h-4" /> : <FiXCircle className="w-4 h-4" />}
                      <span className="text-sm">SiliconFlow</span>
                    </div>
                    <div className={`flex items-center gap-2 p-3 rounded-lg ${apiKeys.doubaoKey ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {apiKeys.doubaoKey ? <FiCheckCircle className="w-4 h-4" /> : <FiXCircle className="w-4 h-4" />}
                      <span className="text-sm">Doubao</span>
                    </div>
                    <div className={`flex items-center gap-2 p-3 rounded-lg ${apiKeys.xhsCookie ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {apiKeys.xhsCookie ? <FiCheckCircle className="w-4 h-4" /> : <FiXCircle className="w-4 h-4" />}
                      <span className="text-sm">小红书 Cookie（可选）</span>
                    </div>
                  </div>
                </div>

                {/* 保存和清除按钮 */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSaveApiKeys}
                    className={`flex-1 px-6 py-4 bg-gradient-to-r ${colors.gradients.purple} text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2 font-semibold`}
                  >
                    <FiSave className="w-5 h-5" />
                    保存 API 密钥
                  </button>
                  <button
                    onClick={handleClearApiKeys}
                    className="px-6 py-4 bg-white border-2 border-red-300 text-red-600 rounded-xl hover:bg-red-50 transition-all flex items-center gap-2 font-semibold"
                  >
                    <FiXCircle className="w-5 h-5" />
                    清除所有密钥
                  </button>
                </div>
              </motion.div>
            )}

            {/* 公众号文案 */}
            {activeTab === 'wechat' && (
              <motion.div
                key="wechat"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-xl">
                  <h3 className="font-bold text-green-900 mb-2 flex items-center gap-2">
                    <FiMessageSquare className="w-5 h-5" />
                    公众号文案创作提示词
                  </h3>
                  <p className="text-sm text-green-800">
                    用于生成公众号文章内容。公众号适合深度阅读,内容专业严谨,结构清晰。
                  </p>
                </div>
                <Textarea
                  value={settings.wechatTextPrompt}
                  onChange={(e) => setSettings({...settings, wechatTextPrompt: e.target.value})}
                  rows={8}
                  className="font-mono text-sm"
                  placeholder="例如: 以专业正式的方式撰写，结构清晰，段落分明，适合深度阅读..."
                />
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h4 className="font-bold text-blue-900 text-sm mb-2">💡 公众号文案特点建议:</h4>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>• 语言专业正式,适合职场和知识分享</li>
                    <li>• 结构清晰,分段明确,利于长文阅读</li>
                    <li>• 使用数据和案例支撑观点</li>
                    <li>• 适当使用小标题划分层次</li>
                    <li>• 语言严谨但不失亲和力</li>
                  </ul>
                </div>
              </motion.div>
            )}

            {/* 小红书文案 */}
            {activeTab === 'xiaohongshu' && (
              <motion.div
                key="xiaohongshu"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl">
                  <h3 className="font-bold text-red-900 mb-2 flex items-center gap-2">
                    <FiMessageSquare className="w-5 h-5" />
                    小红书文案创作提示词
                  </h3>
                  <p className="text-sm text-red-800">
                    用于生成小红书笔记内容。小红书适合快速浏览,语言轻松活泼,强调实用性。
                  </p>
                </div>
                <Textarea
                  value={settings.xiaohongshuTextPrompt}
                  onChange={(e) => setSettings({...settings, xiaohongshuTextPrompt: e.target.value})}
                  rows={8}
                  className="font-mono text-sm"
                  placeholder="例如: 以轻松活泼的方式撰写，多用表情符号和网络用语..."
                />
                <div className="bg-pink-50 border border-pink-200 rounded-xl p-4">
                  <h4 className="font-bold text-pink-900 text-sm mb-2">💡 小红书文案特点建议:</h4>
                  <ul className="text-xs text-pink-800 space-y-1">
                    <li>• 语言轻松活泼,多用表情符号</li>
                    <li>• 句子简短有力,适合快速浏览</li>
                    <li>• 强调实用性和分享价值</li>
                    <li>• 使用网络热词,贴近年轻群体</li>
                    <li>• 多用"！"和emoji增加感染力</li>
                  </ul>
                </div>
              </motion.div>
            )}

            {/* 小红书二创 */}
            {activeTab === 'xhs-rewrite' && (
              <motion.div
                key="xhs-rewrite"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="bg-pink-50 border-l-4 border-pink-500 p-4 rounded-xl">
                  <h3 className="font-bold text-pink-900 mb-2 flex items-center gap-2">
                    <FiImage className="w-5 h-5" />
                    小红书二创 - 图片分析提示词
                  </h3>
                  <p className="text-sm text-pink-800">
                    用于 Gemini 3 Pro 分析原图并生成适合图片生成模型的英文提示词，实现图生图二创。
                  </p>
                </div>
                <Textarea
                  value={settings.imageAnalysisPrompt}
                  onChange={(e) => setSettings({...settings, imageAnalysisPrompt: e.target.value})}
                  rows={10}
                  className="font-mono text-sm"
                  placeholder='例如: 请仔细分析这张图片，并提供详细的描述和适合图片生成的英文提示词。请以 JSON 格式返回：{ "description": "图片描述", "suggestedPrompt": "英文提示词", "keyElements": ["元素列表"], "style": "风格", "mood": "氛围" }'
                />
                <div className="bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-200 rounded-xl p-4">
                  <h4 className="font-bold text-pink-900 text-sm mb-3">💡 小红书二创流程说明:</h4>
                  <div className="space-y-3 text-xs text-pink-800">
                    <div className="flex items-start gap-2 bg-white bg-opacity-60 p-3 rounded-lg">
                      <span className="font-bold text-pink-600 flex-shrink-0">步骤1️⃣</span>
                      <div>
                        <strong className="block mb-1">文案二创</strong>
                        <p className="text-gray-700">使用 Gemini 3 Pro 根据"小红书文案"提示词改写原文案，保持轻松活泼风格</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 bg-white bg-opacity-60 p-3 rounded-lg">
                      <span className="font-bold text-purple-600 flex-shrink-0">步骤2️⃣</span>
                      <div>
                        <strong className="block mb-1">图片分析</strong>
                        <p className="text-gray-700">使用 Gemini 3 Pro 分析原图，根据本提示词生成适合图片生成模型的英文提示词</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 bg-white bg-opacity-60 p-3 rounded-lg">
                      <span className="font-bold text-indigo-600 flex-shrink-0">步骤3️⃣</span>
                      <div>
                        <strong className="block mb-1">图生图重绘</strong>
                        <p className="text-gray-700">使用豆包 SeeDream 4.0 根据分析的提示词和"图片生成"设置参数生成新图片</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
                  <h4 className="font-bold text-amber-900 text-sm mb-2 flex items-center gap-2">
                    <FiAlertCircle className="w-5 h-5" />
                    提示词编写要点:
                  </h4>
                  <ul className="text-xs text-amber-900 space-y-1.5">
                    <li>• <strong>JSON 格式</strong>: 要求 Gemini 返回结构化 JSON，便于程序解析</li>
                    <li>• <strong>英文提示词</strong>: 图片生成模型对英文提示词理解更好，生成质量更高</li>
                    <li>• <strong>关键元素</strong>: 提取图片的主体、颜色、风格、氛围等关键信息</li>
                    <li>• <strong>适配生成模型</strong>: 提示词应符合图片生成模型的最佳实践和格式要求</li>
                    <li>• <strong>保持一致性</strong>: 确保提示词能生成与原图风格相近但内容不同的新图</li>
                  </ul>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h4 className="font-bold text-blue-900 text-sm mb-2">📝 默认提示词示例:</h4>
                  <pre className="text-xs text-blue-800 bg-white p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">
{`请仔细分析这张图片，并提供详细的描述和适合图片生成的英文提示词。

请以 JSON 格式返回：
{
  "description": "图片的详细中文描述",
  "suggestedPrompt": "适合图片生成模型的英文提示词",
  "keyElements": ["元素1", "元素2", "元素3"],
  "style": "图片风格",
  "mood": "图片氛围"
}`}
                  </pre>
                </div>
              </motion.div>
            )}

            {/* 洞察分析 */}
            {activeTab === 'insight' && (
              <motion.div
                key="insight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-xl">
                  <h3 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                    <FiSearch className="w-5 h-5" />
                    洞察分析提示词
                  </h3>
                  <p className="text-sm text-indigo-800">
                    用于分析抓取的文章,提炼核心观点和趋势,生成选题建议。
                  </p>
                </div>
                <Textarea
                  value={settings.insightPrompt}
                  onChange={(e) => setSettings({...settings, insightPrompt: e.target.value})}
                  rows={8}
                  className="font-mono text-sm"
                  placeholder="例如: 深入分析文章主题和趋势，提炼核心观点，识别用户痛点..."
                />
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                  <h4 className="font-bold text-purple-900 text-sm mb-2">💡 洞察分析要点建议:</h4>
                  <ul className="text-xs text-purple-800 space-y-1">
                    <li>• 深入分析文章主题和热点趋势</li>
                    <li>• 提炼核心观点和用户关注点</li>
                    <li>• 识别用户痛点和真实需求</li>
                    <li>• 提供3-5个具有实操价值的选题建议</li>
                    <li>• 每个建议包含目标受众、内容角度和推荐标题</li>
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </Section>

      {/* 快速指南 */}
      <Section>
        <div className="bg-purple-600 p-8 rounded-xl shadow-lg">
          <h3 className="font-bold text-2xl mb-6 text-white flex items-center gap-3">
            <FiAlertCircle className="w-7 h-7" />
            快速指南
          </h3>

          {/* 功能模块介绍 */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="bg-purple-700 p-5 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">📱</span>
                <strong className="text-xl text-white">公众号文案</strong>
              </div>
              <p className="text-sm text-white leading-relaxed">专业正式、逻辑严谨、适合深度阅读的长文内容</p>
            </div>
            <div className="bg-purple-700 p-5 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">📕</span>
                <strong className="text-xl text-white">小红书文案</strong>
              </div>
              <p className="text-sm text-white leading-relaxed">轻松活泼、多用emoji、适合快速浏览的短文笔记</p>
            </div>
            <div className="bg-purple-700 p-5 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">🔍</span>
                <strong className="text-xl text-white">洞察分析</strong>
              </div>
              <p className="text-sm text-white leading-relaxed">深度分析热点趋势、提炼核心观点、生成选题建议</p>
            </div>
            <div className="bg-purple-700 p-5 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">✨</span>
                <strong className="text-xl text-white">小红书二创</strong>
              </div>
              <p className="text-sm text-white leading-relaxed">AI智能改写文案 + 图片分析生成新配图</p>
            </div>
          </div>

          {/* 小红书二创流程 */}
          <div className="bg-purple-700 rounded-xl p-5 mb-6">
            <h4 className="font-bold text-xl mb-4 flex items-center gap-2 text-white">
              <span className="text-2xl">🚀</span>
              小红书二创完整流程
            </h4>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-purple-800 p-4 rounded-lg">
                <div className="font-bold mb-2 text-lg text-white">1️⃣ 文案改写</div>
                <p className="text-xs text-white leading-relaxed">使用小红书文案提示词，将原文改写成轻松活泼的风格</p>
              </div>
              <div className="bg-purple-800 p-4 rounded-lg">
                <div className="font-bold mb-2 text-lg text-white">2️⃣ 图片分析</div>
                <p className="text-xs text-white leading-relaxed">Gemini 3 Pro 深度分析原图，生成英文提示词</p>
              </div>
              <div className="bg-purple-800 p-4 rounded-lg">
                <div className="font-bold mb-2 text-lg text-white">3️⃣ 图片生成</div>
                <p className="text-xs text-white leading-relaxed">豆包 SeeDream 4.0 根据分析结果和AI优化参数生成新图</p>
              </div>
            </div>
          </div>

          {/* 重要提示 */}
          <div className="bg-purple-700 rounded-xl p-5">
            <h4 className="font-bold text-lg mb-4 text-white">💡 重要提示</h4>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div className="text-white">
                  <strong className="block mb-1">保存设置</strong>
                  <p className="text-sm">修改任何提示词或参数后，务必点击右上角"保存设置"按钮</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">🤖</span>
                <div className="text-white">
                  <strong className="block mb-1">自动识别</strong>
                  <p className="text-sm">系统会根据你选择的平台（公众号/小红书）自动使用对应的提示词配置</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">✨</span>
                <div className="text-white">
                  <strong className="block mb-1">智能优化</strong>
                  <p className="text-sm">图片生成采用AI智能参数优化，Gemini会自动调整最佳生成策略</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </PageContainer>
  );
}
