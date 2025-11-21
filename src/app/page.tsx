"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import DashboardContent from "@/components/pages/Dashboard";
import TopicAnalysisContent from "@/components/pages/TopicAnalysis";
import PublishManagementContent from "@/components/pages/PublishManagement";
import MaterialLibraryContent from "@/components/pages/MaterialLibrary";
import SettingsContent from "@/components/pages/Settings";
import SmartCreationHub from "@/components/pages/SmartCreationHub";
import XiaohongshuRewriteWrapper from "@/components/pages/XiaohongshuRewrite/Wrapper";
import { GlobalToast } from "@/components/GlobalToast";
import { useGlobalStore } from "@/lib/stores/globalStore";

type ActiveTab = "dashboard" | "smart-creation" | "topic-analysis" | "publish-management" | "materials" | "settings" | "xiaohongshu-rewrite";

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">加载中...</p>
      </div>
    </div>
  );
}

// 提取使用 useSearchParams 的组件，需要用 Suspense 包裹
function TabHandler({ onTabChange }: { onTabChange: (tab: ActiveTab) => void }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get("tab") as ActiveTab;
    console.log('TabHandler - 检测到tab参数:', tab, 'URL:', window.location.href);

    // 向后兼容: 重定向旧的content-creation路由到smart-creation
    if (tab === "content-creation" as string) {
      console.log('TabHandler - 重定向到smart-creation');
      onTabChange("smart-creation");
      return;
    }

    if (tab && ["dashboard", "smart-creation", "topic-analysis", "publish-management", "materials", "settings", "xiaohongshu-rewrite"].includes(tab)) {
      console.log('TabHandler - 切换到标签页:', tab);
      onTabChange(tab);
    } else if (tab === "history") {
      // 向后兼容：重定向旧的history路由到materials
      console.log('TabHandler - 重定向history到materials');
      onTabChange("materials");
    }
  }, [searchParams, onTabChange]);

  return null;
}

function HomeContent({ activeTab, setActiveTab }: { activeTab: ActiveTab; setActiveTab: (tab: ActiveTab) => void }) {
  const { activeTask, taskProgress, updateTask } = useGlobalStore();

  // 全局检查是否有正在进行的创作任务（支持两种任务类型）
  useEffect(() => {
    const checkActiveTask = () => {
      // 如果全局store中没有任务，检查localStorage
      if (!activeTask) {
        const oldTaskId = localStorage.getItem('contentCreation_taskId');
        const newTaskId = localStorage.getItem('smartCreation_taskId');
        const taskId = newTaskId || oldTaskId;

        if (taskId && activeTab !== 'smart-creation') {
          // 从localStorage恢复任务到store
          const platform = localStorage.getItem('smartCreation_platform') || localStorage.getItem('contentCreation_platform');
          useGlobalStore.getState().startTask(taskId, 'content-creation', platform || undefined);
        }
      }

      // 如果有活动任务，轮询任务状态（仅限content-creation类型，小红书二创由组件内部管理）
      if (activeTask && activeTask.status !== 'COMPLETED' && activeTask.status !== 'FAILED' && activeTask.type === 'content-creation') {
        fetch(`/api/content-creation/${activeTask.id}`)
          .then(res => res.json())
          .then(data => {
            if (data.success && data.data.task) {
              const task = data.data.task;
              updateTask({
                status: task.status,
                progress: task.progress || 0,
                result: task.result,
              });

              if (task.status === 'COMPLETED') {
                useGlobalStore.getState().completeTask(task.result);
              } else if (task.status === 'FAILED') {
                useGlobalStore.getState().failTask(task.error || '创作失败');
              }
            }
          })
          .catch((err) => {
            console.error('轮询任务失败:', err);
          });
      }
    };

    checkActiveTask();
    const interval = setInterval(checkActiveTask, 3000);
    return () => clearInterval(interval);
  }, [activeTab, activeTask, updateTask]);

  const navigation = [
    {
      id: "dashboard" as ActiveTab,
      name: "数据概览",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: "blue",
      description: "实时统计与分析",
    },
    {
      id: "smart-creation" as ActiveTab,
      name: "🚀 智能创作中心",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      color: "gradient-purple",
      description: "6天冲刺 + AI创作 + 项目管理",
      isNew: true,
    },
    {
      id: "topic-analysis" as ActiveTab,
      name: "公众号爆文",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: "indigo",
      description: "智能分析热门公众号文章",
    },
    {
      id: "xiaohongshu-rewrite" as ActiveTab,
      name: "小红书二创",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: "pink",
      description: "AI智能二创小红书内容",
      isNew: true,
    },
    {
      id: "publish-management" as ActiveTab,
      name: "发布管理",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      ),
      color: "emerald",
      description: "多平台统一管理",
    },
    {
      id: "materials" as ActiveTab,
      name: "素材库",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      ),
      color: "amber",
      description: "收集的优质创作素材",
    },
    {
      id: "settings" as ActiveTab,
      name: "创作设置",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: "orange",
      description: "配置提示词和风格",
    },
  ];

  const getColorClasses = (color: string, isActive: boolean) => {
    const colors = {
      "gradient-purple": {
        bg: isActive ? "bg-gradient-to-br from-purple-50 to-pink-50" : "hover:bg-gradient-to-br hover:from-purple-50/50 hover:to-pink-50/50",
        border: isActive ? "border-purple-500" : "border-transparent hover:border-purple-200",
        icon: isActive ? "bg-gradient-to-br from-purple-500 via-purple-600 to-pink-500" : "bg-gray-100",
        iconText: isActive ? "text-white" : "text-gray-400",
        text: isActive ? "text-purple-600" : "text-gray-600 group-hover:text-purple-600",
      },
      blue: {
        bg: isActive ? "bg-blue-50" : "hover:bg-blue-50/50",
        border: isActive ? "border-blue-500" : "border-transparent hover:border-blue-200",
        icon: isActive ? "bg-gradient-to-br from-blue-500 to-blue-600" : "bg-gray-100",
        iconText: isActive ? "text-white" : "text-gray-400",
        text: isActive ? "text-blue-600" : "text-gray-600 group-hover:text-blue-600",
      },
      indigo: {
        bg: isActive ? "bg-indigo-50" : "hover:bg-indigo-50/50",
        border: isActive ? "border-indigo-500" : "border-transparent hover:border-indigo-200",
        icon: isActive ? "bg-gradient-to-br from-indigo-500 to-indigo-600" : "bg-gray-100",
        iconText: isActive ? "text-white" : "text-gray-400",
        text: isActive ? "text-indigo-600" : "text-gray-600 group-hover:text-indigo-600",
      },
      pink: {
        bg: isActive ? "bg-pink-50" : "hover:bg-pink-50/50",
        border: isActive ? "border-pink-500" : "border-transparent hover:border-pink-200",
        icon: isActive ? "bg-gradient-to-br from-purple-500 to-pink-500" : "bg-gray-100",
        iconText: isActive ? "text-white" : "text-gray-400",
        text: isActive ? "text-pink-600" : "text-gray-600 group-hover:text-pink-600",
      },
      purple: {
        bg: isActive ? "bg-purple-50" : "hover:bg-purple-50/50",
        border: isActive ? "border-purple-500" : "border-transparent hover:border-purple-200",
        icon: isActive ? "bg-gradient-to-br from-purple-500 to-pink-500" : "bg-gray-100",
        iconText: isActive ? "text-white" : "text-gray-400",
        text: isActive ? "text-purple-600" : "text-gray-600 group-hover:text-purple-600",
      },
      emerald: {
        bg: isActive ? "bg-emerald-50" : "hover:bg-emerald-50/50",
        border: isActive ? "border-emerald-500" : "border-transparent hover:border-emerald-200",
        icon: isActive ? "bg-gradient-to-br from-emerald-500 to-teal-500" : "bg-gray-100",
        iconText: isActive ? "text-white" : "text-gray-400",
        text: isActive ? "text-emerald-600" : "text-gray-600 group-hover:text-emerald-600",
      },
      orange: {
        bg: isActive ? "bg-orange-50" : "hover:bg-orange-50/50",
        border: isActive ? "border-orange-500" : "border-transparent hover:border-orange-200",
        icon: isActive ? "bg-gradient-to-br from-orange-500 to-amber-500" : "bg-gray-100",
        iconText: isActive ? "text-white" : "text-gray-400",
        text: isActive ? "text-orange-600" : "text-gray-600 group-hover:text-orange-600",
      },
      amber: {
        bg: isActive ? "bg-amber-50" : "hover:bg-amber-50/50",
        border: isActive ? "border-amber-500" : "border-transparent hover:border-amber-200",
        icon: isActive ? "bg-gradient-to-br from-amber-500 to-orange-500" : "bg-gray-100",
        iconText: isActive ? "text-white" : "text-gray-400",
        text: isActive ? "text-amber-600" : "text-gray-600 group-hover:text-amber-600",
      },
    };

    // 返回指定颜色或默认灰色
    return colors[color as keyof typeof colors] || {
      bg: isActive ? "bg-gray-50" : "hover:bg-gray-50/50",
      border: isActive ? "border-gray-500" : "border-transparent hover:border-gray-200",
      icon: isActive ? "bg-gradient-to-br from-gray-500 to-gray-600" : "bg-gray-100",
      iconText: isActive ? "text-white" : "text-gray-400",
      text: isActive ? "text-gray-600" : "text-gray-600 group-hover:text-gray-600",
    };
  };

  const renderContent = () => {
    console.log('renderContent - 当前activeTab:', activeTab);
    switch (activeTab) {
      case "dashboard":
        return <DashboardContent />;
      case "smart-creation":
        return <SmartCreationHub />;
      case "topic-analysis":
        return <TopicAnalysisContent />;
      case "materials":
        return <MaterialLibraryContent />;
      case "publish-management":
        return <PublishManagementContent />;
      case "xiaohongshu-rewrite":
        console.log('renderContent - 渲染XiaohongshuRewrite组件');
        return <XiaohongshuRewriteWrapper />;
      case "settings":
        return <SettingsContent />;
      default:
        return <DashboardContent />;
    }
  };

  return (
    <div className="flex h-screen bg-white">
      {/* 全局Toast提示 */}
      <GlobalToast />

      {/* 全局任务进度条 */}
      {activeTask && activeTask.status !== 'COMPLETED' && activeTask.status !== 'FAILED' && activeTab !== 'smart-creation' && activeTab !== 'xiaohongshu-rewrite' && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="font-medium">{activeTask.progressMessage || 'AI创作生成中...'}</span>
                <span className="text-sm opacity-90">{taskProgress}%</span>
              </div>
              <button
                onClick={() => {
                  // 根据任务类型跳转
                  if (activeTask.type === 'xiaohongshu-rewrite') {
                    setActiveTab('xiaohongshu-rewrite');
                  } else {
                    setActiveTab('smart-creation');
                  }
                }}
                className="px-4 py-1.5 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-sm font-medium transition-all"
              >
                查看进度 →
              </button>
            </div>
            {/* 进度条 */}
            <div className="mt-2 h-1 bg-white bg-opacity-30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-500"
                style={{ width: `${taskProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Left Sidebar */}
      <div
        className="w-80 border-r border-gray-200 bg-gray-50/50 flex flex-col relative z-50"
        style={{ marginTop: (activeTask && activeTask.status !== 'COMPLETED' && activeTask.status !== 'FAILED' && activeTab !== 'smart-creation' && activeTab !== 'xiaohongshu-rewrite') ? '80px' : '0' }}
      >
        {/* Header */}
        <div className="p-8 border-b border-gray-200">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-indigo-900 to-indigo-600 bg-clip-text text-transparent">
              内容工厂
            </h1>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            从选题洞察到内容创作,再到多平台发布的全流程自动化
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = activeTab === item.id;
            const colorClasses = getColorClasses(item.color, isActive);

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`group w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-200 ${colorClasses.bg} ${colorClasses.border}`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${colorClasses.icon} ${isActive ? "scale-110" : "group-hover:scale-105"}`}>
                  <div className={colorClasses.iconText}>{item.icon}</div>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-semibold transition-colors ${colorClasses.text}`}>
                      {item.name}
                    </h3>
                    {item.isNew && (
                      <span className="px-1.5 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold rounded uppercase animate-pulse">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                </div>
                {isActive && (
                  <svg className="w-5 h-5 text-current flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Stats */}
        <div className="p-6 border-t border-gray-200 bg-white/50">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-indigo-600">10x</div>
              <div className="text-xs text-gray-500">效率提升</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-indigo-600">3步</div>
              <div className="text-xs text-gray-500">完成创作</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-indigo-600">∞</div>
              <div className="text-xs text-gray-500">创作可能</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Content Area */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ marginTop: (activeTask && activeTask.status !== 'COMPLETED' && activeTask.status !== 'FAILED' && activeTab !== 'smart-creation' && activeTab !== 'xiaohongshu-rewrite') ? '80px' : '0' }}
      >
        <div className="transition-opacity duration-300">{renderContent()}</div>
      </div>
    </div>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");

  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    }>
      <TabHandler onTabChange={setActiveTab} />
      <HomeContent activeTab={activeTab} setActiveTab={setActiveTab} />
    </Suspense>
  );
}
