'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiArrowRight, FiArrowLeft, FiLoader, FiCheck, FiAlertCircle, FiUpload } from 'react-icons/fi';
import { colors } from '@/lib/design';
import { WechatAccount } from '@/types';
import { extractFirstImage, validateNewspicContent } from '@/lib/utils/wechatFormatter';

interface WechatPublishModalProps {
  article: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function WechatPublishModal({ article, onClose, onSuccess }: WechatPublishModalProps) {
  const [step, setStep] = useState<'config' | 'preview'>('config');
  const [accounts, setAccounts] = useState<WechatAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [publishing, setPublishing] = useState(false);

  // 配置表单状态
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [articleType, setArticleType] = useState<'news' | 'newspic'>('news');
  const [author, setAuthor] = useState('');
  const [coverImageSource, setCoverImageSource] = useState<'auto' | 'custom' | 'none'>('auto');
  const [customCoverImage, setCustomCoverImage] = useState('');
  const [error, setError] = useState<string | null>(null);

  // 加载公众号列表
  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoadingAccounts(true);
      setError(null);
      const response = await fetch('/api/wechat/accounts');
      const data = await response.json();

      console.log('📋 公众号列表响应:', data);

      if (data.success && data.data?.accounts) {
        setAccounts(data.data.accounts);
        if (data.data.accounts.length > 0) {
          setSelectedAccount(data.data.accounts[0].wechatAppid);
        }
      } else {
        const errorMsg = data.error || '获取公众号列表失败';
        console.error('❌ 获取公众号失败:', errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      console.error('❌ 加载公众号列表失败:', err);
      setError('加载公众号列表失败，请检查网络连接');
    } finally {
      setLoadingAccounts(false);
    }
  };

  // 验证并进入预览
  const handleNextToPreview = () => {
    if (!selectedAccount) {
      setError('请选择公众号');
      return;
    }

    // 如果是小绿书模式，验证内容
    if (articleType === 'newspic') {
      const validation = validateNewspicContent(article.content);
      if (!validation.valid) {
        setError(validation.error || '内容不符合小绿书要求');
        return;
      }
    }

    setError(null);
    setStep('preview');
  };

  // 执行发布
  const handlePublish = async () => {
    try {
      setPublishing(true);
      setError(null);

      const coverImage = coverImageSource === 'custom' ? customCoverImage : undefined;

      const response = await fetch('/api/wechat/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId: article.id,
          wechatAppid: selectedAccount,
          articleType,
          author: author || undefined,
          coverImage,
          coverImageSource,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ 发布成功！文章已添加到公众号草稿箱');
        onSuccess();
      } else {
        setError(data.error || '发布失败');
      }
    } catch (err) {
      console.error('发布失败:', err);
      setError('发布失败，请稍后重试');
    } finally {
      setPublishing(false);
    }
  };

  // 获取预览封面图
  const getPreviewCoverImage = () => {
    if (coverImageSource === 'none') return null;
    if (coverImageSource === 'custom') return customCoverImage;
    return extractFirstImage(article.content);
  };

  const selectedAccountData = accounts.find(acc => acc.wechatAppid === selectedAccount);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* 标题栏 */}
          <div className={`px-6 py-4 bg-gradient-to-r ${colors.gradients.purple} text-white flex items-center justify-between`}>
            <div>
              <h3 className="text-xl font-bold">发布到公众号</h3>
              <p className="text-sm text-white/80 mt-1">
                {step === 'config' ? '第1步: 配置发布参数' : '第2步: 预览并确认'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              disabled={publishing}
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* 内容区域 */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {step === 'config' ? (
              // 第一步：配置
              <div className="space-y-6">
                {/* 错误提示 */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-red-700 font-medium">{error}</p>
                      {error.includes('API') && (
                        <p className="text-xs text-red-600 mt-1">
                          提示: 请检查.env文件中的WECHAT_PUBLISH_API_KEY是否正确配置
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* 选择公众号 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    选择公众号 <span className="text-red-500">*</span>
                  </label>
                  {loadingAccounts ? (
                    <div className="flex items-center justify-center py-8">
                      <FiLoader className="w-6 h-6 animate-spin text-purple-500" />
                      <span className="ml-2 text-gray-600">加载中...</span>
                    </div>
                  ) : accounts.length === 0 ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                      <p className="text-yellow-700 font-medium">暂无授权的公众号</p>
                      <p className="text-sm text-yellow-600 mt-1 mb-3">请先授权公众号后再进行发布</p>
                      <a
                        href="https://wx.limyai.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        前往授权公众号
                      </a>
                      <p className="text-xs text-gray-500 mt-3">
                        授权步骤: 登录微信公众号后台 → 扫码授权 → 返回本页面刷新
                      </p>
                    </div>
                  ) : (
                    <select
                      value={selectedAccount}
                      onChange={(e) => setSelectedAccount(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
                    >
                      {accounts.map((account) => (
                        <option key={account.wechatAppid} value={account.wechatAppid}>
                          {account.name} ({account.type === 'subscription' ? '订阅号' : '服务号'}
                          {account.verified ? ' · 已认证' : ''})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* 发布类型 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    发布类型 <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setArticleType('news')}
                      className={`p-4 border-2 rounded-xl transition-all ${
                        articleType === 'news'
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-2">📝</div>
                      <div className="font-semibold text-gray-900">普通文章</div>
                      <div className="text-xs text-gray-500 mt-1">支持长文、富文本</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setArticleType('newspic')}
                      className={`p-4 border-2 rounded-xl transition-all ${
                        articleType === 'newspic'
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-2">🖼️</div>
                      <div className="font-semibold text-gray-900">小绿书</div>
                      <div className="text-xs text-gray-500 mt-1">图文消息，最多20张</div>
                    </button>
                  </div>
                </div>

                {/* 作者名称 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    作者名称 <span className="text-gray-400">(可选)</span>
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="请输入作者名称"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
                  />
                </div>
              </div>
            ) : (
              // 第二步：预览
              <div className="space-y-6">
                {/* 封面图选项 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    封面图设置
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="coverSource"
                        value="auto"
                        checked={coverImageSource === 'auto'}
                        onChange={() => setCoverImageSource('auto')}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-700">自动提取第一张图片</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="coverSource"
                        value="custom"
                        checked={coverImageSource === 'custom'}
                        onChange={() => setCoverImageSource('custom')}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-700">自定义封面图URL</span>
                    </label>
                    {coverImageSource === 'custom' && (
                      <input
                        type="text"
                        value={customCoverImage}
                        onChange={(e) => setCustomCoverImage(e.target.value)}
                        placeholder="请输入图片URL"
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none ml-7"
                      />
                    )}
                    <label className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="coverSource"
                        value="none"
                        checked={coverImageSource === 'none'}
                        onChange={() => setCoverImageSource('none')}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-700">不使用封面图</span>
                    </label>
                  </div>
                </div>

                {/* 预览区域 */}
                <div className="border-2 border-gray-200 rounded-xl p-6 bg-gray-50">
                  <div className="text-sm text-gray-500 mb-4">📱 公众号预览效果</div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{article.title}</h3>
                    {author && (
                      <div className="text-sm text-gray-500 mb-3">作者: {author}</div>
                    )}
                    <div className="text-xs text-gray-400 mb-4">
                      {selectedAccountData?.name}
                    </div>
                    {getPreviewCoverImage() && (
                      <img
                        src={getPreviewCoverImage()!}
                        alt="封面"
                        className="w-full rounded-lg mb-4 max-h-48 object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="200"%3E%3Crect fill="%23f3f4f6" width="400" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af"%3E图片加载失败%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    )}
                    <div className="text-sm text-gray-600 line-clamp-3">
                      {article.content?.substring(0, 150)}...
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 底部按钮 */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={step === 'config' ? onClose : () => setStep('config')}
              className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
              disabled={publishing}
            >
              {step === 'preview' && <FiArrowLeft className="w-4 h-4" />}
              {step === 'config' ? '取消' : '返回'}
            </button>
            <button
              onClick={step === 'config' ? handleNextToPreview : handlePublish}
              disabled={publishing || loadingAccounts || (!selectedAccount && step === 'config')}
              className={`px-6 py-2.5 bg-gradient-to-r ${colors.gradients.purple} text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {publishing ? (
                <>
                  <FiLoader className="w-4 h-4 animate-spin" />
                  发布中...
                </>
              ) : step === 'config' ? (
                <>
                  下一步
                  <FiArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <FiCheck className="w-4 h-4" />
                  确认发布
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
