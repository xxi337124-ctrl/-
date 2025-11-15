'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFileText, FiClock, FiMoreVertical, FiEdit3, FiTrash2, FiArchive } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface Draft {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  wordCount: number;
  status: 'active' | 'archived';
}

interface DraftManagerProps {
  onDraftSelect: (draft: Draft) => void;
  maxDisplay?: number;
}

export default function DraftManager({ onDraftSelect, maxDisplay = 3 }: DraftManagerProps) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);

  // 模拟草稿数据
  const mockDrafts: Draft[] = [
    {
      id: '1',
      title: '咖啡探店笔记',
      content: '今天发现了一家隐藏在老街深处的咖啡店，装修很有特色...',
      excerpt: '今天发现了一家隐藏在老街深处的咖啡店...',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2小时前
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      tags: ['咖啡', '探店', '生活'],
      wordCount: 156,
      status: 'active'
    },
    {
      id: '2',
      title: '职场效率提升技巧',
      content: '分享几个在工作中非常实用的效率工具和方法...',
      excerpt: '分享几个在工作中非常实用的效率工具和方法...',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 昨天
      updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12小时前
      tags: ['职场', '效率', '工具'],
      wordCount: 234,
      status: 'active'
    },
    {
      id: '3',
      title: '周末美食推荐',
      content: '周末和朋友一起去尝试了一家新开的日料店，味道很不错...',
      excerpt: '周末和朋友一起去尝试了一家新开的日料店...',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3天前
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2天前
      tags: ['美食', '日料', '周末'],
      wordCount: 189,
      status: 'active'
    },
    {
      id: '4',
      title: '旅行攻略草稿',
      content: '成都三天两夜深度游攻略，包含美食、景点、住宿推荐...',
      excerpt: '成都三天两夜深度游攻略...',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 一周前
      updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4天前
      tags: ['旅行', '成都', '攻略'],
      wordCount: 456,
      status: 'archived'
    }
  ];

  useEffect(() => {
    // 模拟加载草稿数据
    setTimeout(() => {
      setDrafts(mockDrafts);
      setLoading(false);
    }, 800);
  }, []);

  // 过滤草稿
  const filteredDrafts = drafts.filter(draft =>
    showArchived ? draft.status === 'archived' : draft.status === 'active'
  );

  // 显示草稿数量限制
  const displayDrafts = filteredDrafts.slice(0, maxDisplay);

  // 处理草稿操作
  const handleDraftAction = (draftId: string, action: 'edit' | 'delete' | 'archive' | 'unarchive') => {
    switch (action) {
      case 'edit':
        const draft = drafts.find(d => d.id === draftId);
        if (draft) {
          onDraftSelect(draft);
        }
        break;
      case 'delete':
        setDrafts(prev => prev.filter(d => d.id !== draftId));
        break;
      case 'archive':
        setDrafts(prev => prev.map(d =>
          d.id === draftId ? { ...d, status: 'archived' } : d
        ));
        break;
      case 'unarchive':
        setDrafts(prev => prev.map(d =>
          d.id === draftId ? { ...d, status: 'active' } : d
        ));
        break;
    }
    setSelectedDraftId(null);
  };

  // 格式化时间
  const formatTimeAgo = (date: Date) => {
    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: zhCN
    });
  };

  // 获取草稿状态颜色
  const getDraftStatusColor = (draft: Draft) => {
    const hoursSinceUpdate = (Date.now() - draft.updatedAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceUpdate < 24) return 'border-blue-200 bg-blue-50';
    if (hoursSinceUpdate < 72) return 'border-green-200 bg-green-50';
    return 'border-gray-200 bg-gray-50';
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* 草稿列表 */}
      <AnimatePresence mode="popLayout">
        {displayDrafts.map((draft) => (
          <motion.div
            key={draft.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${getDraftStatusColor(draft)}`}
            onClick={() => handleDraftAction(draft.id, 'edit')}
          >
              {/* 草稿内容 */}
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <FiFileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <h4 className="font-medium text-gray-800 truncate">{draft.title || '无标题'}</h4>
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                    {draft.excerpt}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <FiClock className="w-3 h-3" />
                        <span>{formatTimeAgo(draft.updatedAt)}</span>
                      </div>
                      <div>
                        {draft.wordCount} 字
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {draft.tags.slice(0, 2).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-0.5 bg-white bg-opacity-60 rounded-full text-xs"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 更多操作按钮 */}
                <div className="relative ml-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDraftId(selectedDraftId === draft.id ? null : draft.id);
                    }}
                    className="p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
                  >
                    <FiMoreVertical className="w-4 h-4" />
                  </button>

                  <AnimatePresence>
                    {selectedDraftId === draft.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute right-0 top-8 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-10"
                      >
                        <div className="p-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDraftAction(draft.id, 'edit');
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                          >
                            <FiEdit3 className="w-4 h-4" />
                            继续编辑
                          </button>

                          {draft.status === 'active' ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDraftAction(draft.id, 'archive');
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                            >
                              <FiArchive className="w-4 h-4" />
                              归档
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDraftAction(draft.id, 'unarchive');
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                            >
                              <FiArchive className="w-4 h-4" />
                              恢复
                            </button>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDraftAction(draft.id, 'delete');
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded"
                          >
                            <FiTrash2 className="w-4 h-4" />
                            删除
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
        ))}
      </AnimatePresence>

      {/* 空状态 */}
      {displayDrafts.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <FiFileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">
            {showArchived ? '暂无归档草稿' : '暂无草稿'}
          </p>
        </div>
      )}

      {/* 底部操作 */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <button
          onClick={() => setShowArchived(!showArchived)}
          className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          {showArchived ? '查看活跃草稿' : `查看归档草稿 (${drafts.filter(d => d.status === 'archived').length})`}
        </button>

        <button
          onClick={() => {
            // TODO: 打开草稿管理完整界面
            console.log('打开草稿管理');
          }}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          管理全部草稿 →
        </button>
      </div>
    </div>
  );
}