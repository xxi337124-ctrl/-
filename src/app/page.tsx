"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import DashboardContent from "@/components/pages/Dashboard";
import TopicAnalysisContent from "@/components/pages/TopicAnalysis";
import ContentCreationContent from "@/components/pages/ContentCreation";
import PublishManagementContent from "@/components/pages/PublishManagement";
import HistoryContent from "@/components/pages/History";

type ActiveTab = "dashboard" | "topic-analysis" | "content-creation" | "publish-management" | "history";

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const searchParams = useSearchParams();

  // 监听URL参数,自动切换标签
  useEffect(() => {
    const tab = searchParams.get("tab") as ActiveTab;
    if (tab && ["dashboard", "topic-analysis", "content-creation", "publish-management", "history"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

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
      id: "topic-analysis" as ActiveTab,
      name: "选题洞察",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      color: "indigo",
      description: "智能分析热门内容",
    },
    {
      id: "content-creation" as ActiveTab,
      name: "AI创作",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      color: "purple",
      description: "一键生成高质量文章",
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
      id: "history" as ActiveTab,
      name: "历史记录",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "pink",
      description: "查看历史分析记录",
    },
  ];

  const getColorClasses = (color: string, isActive: boolean) => {
    const colors = {
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
    };
    return colors[color as keyof typeof colors];
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardContent />;
      case "topic-analysis":
        return <TopicAnalysisContent />;
      case "history":
        return <HistoryContent />;
      case "content-creation":
        return <ContentCreationContent />;
      case "publish-management":
        return <PublishManagementContent />;
      default:
        return <DashboardContent />;
    }
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Left Sidebar */}
      <div className="w-80 border-r border-gray-200 bg-gray-50/50 flex flex-col">
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
                  <h3 className={`font-semibold transition-colors ${colorClasses.text}`}>
                    {item.name}
                  </h3>
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
      <div className="flex-1 overflow-y-auto">
        <div className="transition-opacity duration-300">{renderContent()}</div>
      </div>
    </div>
  );
}
