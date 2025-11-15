import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Task {
  id: string;
  type: 'content-creation' | 'xiaohongshu-rewrite' | 'topic-analysis';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  platform?: string;
  title?: string;
  createdAt: string;
  updatedAt: string;
  result?: any;
  error?: string;
  // 小红书二创专用字段
  progressMessage?: string;
  currentStep?: 'rewrite' | 'analyze' | 'generate' | 'complete';
  rewrittenContent?: string;
  imagePrompts?: string[];
  generatedImages?: string[];
}

interface GlobalState {
  // 当前活动任务
  activeTask: Task | null;
  setActiveTask: (task: Task | null) => void;

  // 任务进度
  taskProgress: number;
  setTaskProgress: (progress: number) => void;

  // 任务完成通知
  showCompletionToast: boolean;
  completionMessage: string;
  setCompletionToast: (show: boolean, message?: string) => void;

  // 页面刷新标记（用于触发页面间数据同步）
  refreshTrigger: {
    dashboard: number;
    history: number;
    publishManagement: number;
  };
  triggerRefresh: (page: 'dashboard' | 'history' | 'publishManagement') => void;

  // 启动任务
  startTask: (taskId: string, type: Task['type'], platform?: string, title?: string) => void;

  // 更新任务状态
  updateTask: (updates: Partial<Task>) => void;

  // 完成任务
  completeTask: (result?: any) => void;

  // 失败任务
  failTask: (error: string) => void;

  // 清除任务
  clearTask: () => void;
}

export const useGlobalStore = create<GlobalState>()(
  persist(
    (set, get) => ({
      activeTask: null,
      taskProgress: 0,
      showCompletionToast: false,
      completionMessage: '',
      refreshTrigger: {
        dashboard: 0,
        history: 0,
        publishManagement: 0,
      },

      setActiveTask: (task) => set({ activeTask: task }),

      setTaskProgress: (progress) => set({ taskProgress: progress }),

      setCompletionToast: (show, message = '') =>
        set({ showCompletionToast: show, completionMessage: message }),

      triggerRefresh: (page) =>
        set((state) => ({
          refreshTrigger: {
            ...state.refreshTrigger,
            [page]: state.refreshTrigger[page] + 1,
          },
        })),

      startTask: (taskId, type, platform, title) => {
        const task: Task = {
          id: taskId,
          type,
          status: 'PENDING',
          progress: 0,
          platform,
          title,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set({ activeTask: task, taskProgress: 0 });

        // 同时更新 localStorage 以向后兼容
        if (type === 'content-creation') {
          localStorage.setItem('smartCreation_taskId', taskId);
          if (platform) localStorage.setItem('smartCreation_platform', platform);
        }
      },

      updateTask: (updates) => {
        const { activeTask } = get();
        if (!activeTask) return;

        const updatedTask = {
          ...activeTask,
          ...updates,
          updatedAt: new Date().toISOString(),
        };

        set({
          activeTask: updatedTask,
          taskProgress: updates.progress ?? activeTask.progress,
        });
      },

      completeTask: (result) => {
        const { activeTask } = get();
        if (!activeTask) return;

        const completedTask = {
          ...activeTask,
          status: 'COMPLETED' as const,
          progress: 100,
          result,
          updatedAt: new Date().toISOString(),
        };

        set({
          activeTask: completedTask,
          taskProgress: 100,
          showCompletionToast: true,
          completionMessage: '创作完成！',
        });

        // 触发相关页面刷新
        get().triggerRefresh('dashboard');
        get().triggerRefresh('history');
        get().triggerRefresh('publishManagement');

        // 3秒后清除任务和提示
        setTimeout(() => {
          set({
            activeTask: null,
            showCompletionToast: false,
            completionMessage: '',
          });

          // 清除 localStorage
          localStorage.removeItem('smartCreation_taskId');
          localStorage.removeItem('smartCreation_platform');
          localStorage.removeItem('contentCreation_taskId');
          localStorage.removeItem('contentCreation_platform');
        }, 3000);
      },

      failTask: (error) => {
        const { activeTask } = get();
        if (!activeTask) return;

        const failedTask = {
          ...activeTask,
          status: 'FAILED' as const,
          error,
          updatedAt: new Date().toISOString(),
        };

        set({
          activeTask: failedTask,
          showCompletionToast: true,
          completionMessage: '创作失败，请重试',
        });

        // 5秒后清除提示
        setTimeout(() => {
          set({
            showCompletionToast: false,
            completionMessage: '',
          });
        }, 5000);
      },

      clearTask: () => {
        set({
          activeTask: null,
          taskProgress: 0,
          showCompletionToast: false,
          completionMessage: '',
        });

        // 清除 localStorage
        localStorage.removeItem('smartCreation_taskId');
        localStorage.removeItem('smartCreation_platform');
        localStorage.removeItem('contentCreation_taskId');
        localStorage.removeItem('contentCreation_platform');
      },
    }),
    {
      name: 'global-store',
      partialize: (state) => ({
        activeTask: state.activeTask,
        taskProgress: state.taskProgress,
      }),
    }
  )
);
