'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiDownload, FiExternalLink, FiAlertCircle, FiCheck } from 'react-icons/fi';
import { colors } from '@/lib/design';

interface XiaohongshuQRModalProps {
  qrCodeUrl: string;
  publishUrl?: string;
  noteId?: string;
  warnings?: string[];
  onClose: () => void;
}

export default function XiaohongshuQRModal({
  qrCodeUrl,
  publishUrl,
  noteId,
  warnings,
  onClose,
}: XiaohongshuQRModalProps) {
  const [imageError, setImageError] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // 组件挂载时打印调试信息
  console.log('🎨 XiaohongshuQRModal 渲染');
  console.log('📋 Props:', { qrCodeUrl, publishUrl, noteId, warnings });

  if (!qrCodeUrl) {
    console.error('❌ qrCodeUrl为空或undefined！');
  }

  // 下载二维码
  const handleDownload = async () => {
    try {
      setDownloading(true);
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `xiaohongshu-qr-${noteId || Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('下载二维码失败:', error);
      alert('下载失败，请稍后重试');
    } finally {
      setDownloading(false);
    }
  };

  // 在浏览器中查看
  const handleViewInBrowser = () => {
    if (publishUrl) {
      window.open(publishUrl, '_blank');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
        >
          {/* 标题栏 */}
          <div className={`px-6 py-4 bg-gradient-to-r ${colors.gradients.purple} text-white flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <div className="text-2xl">📕</div>
              <div>
                <h3 className="text-xl font-bold">发布成功</h3>
                <p className="text-sm text-white/80 mt-1">
                  扫描二维码在小红书中查看
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* 内容区域 */}
          <div className="p-6 space-y-6">
            {/* 警告信息 */}
            {warnings && warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FiAlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-800 mb-1">温馨提示</p>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {warnings.map((warning, index) => (
                        <li key={index}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* 成功标志 */}
            <div className="flex items-center justify-center gap-2 text-green-600">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <FiCheck className="w-6 h-6" />
              </div>
            </div>

            {/* 二维码显示区域 */}
            <div className="bg-gray-50 rounded-xl p-6 flex flex-col items-center">
              <div className="text-sm text-gray-600 mb-4 text-center">
                使用小红书APP扫描二维码查看笔记
              </div>

              {imageError ? (
                <div className="w-64 h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <FiAlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">二维码加载失败</p>
                    <p className="text-xs text-gray-400 mt-1">请使用下方链接访问</p>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  {!qrCodeUrl ? (
                    <div className="w-64 h-64 bg-red-100 rounded-lg flex items-center justify-center">
                      <div className="text-center px-4">
                        <FiAlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
                        <p className="text-sm font-medium text-red-700">qrCodeUrl 为空</p>
                        <p className="text-xs text-red-600 mt-1">请检查后端返回数据</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <img
                        src={qrCodeUrl}
                        alt="小红书二维码"
                        className="w-64 h-64 rounded-lg shadow-md"
                        onError={() => {
                          console.error('❌ 二维码图片加载失败:', qrCodeUrl);
                          setImageError(true);
                        }}
                        onLoad={() => console.log('✅ 二维码图片加载成功')}
                      />
                      {/* 中心小红书Logo */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-12 h-12 bg-white rounded-lg shadow-lg flex items-center justify-center text-2xl">
                          📕
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {noteId && (
                <div className="mt-4 text-xs text-gray-500">
                  笔记ID: {noteId}
                </div>
              )}
            </div>

            {/* 操作按钮 */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleDownload}
                disabled={downloading || imageError}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiDownload className="w-4 h-4" />
                {downloading ? '下载中...' : '下载二维码'}
              </button>

              {publishUrl && (
                <button
                  onClick={handleViewInBrowser}
                  className={`flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r ${colors.gradients.purple} text-white rounded-lg hover:shadow-lg transition-all`}
                >
                  <FiExternalLink className="w-4 h-4" />
                  浏览器查看
                </button>
              )}
            </div>

            {/* 使用说明 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-2">📱 如何查看笔记：</p>
                <ol className="space-y-1 text-blue-700 ml-4">
                  <li>1. 打开小红书APP</li>
                  <li>2. 点击首页右上角扫一扫</li>
                  <li>3. 扫描上方二维码即可查看笔记</li>
                </ol>
              </div>
            </div>
          </div>

          {/* 底部按钮 */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
            <button
              onClick={onClose}
              className={`px-6 py-2.5 bg-gradient-to-r ${colors.gradients.purple} text-white rounded-lg hover:shadow-lg transition-all`}
            >
              完成
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
