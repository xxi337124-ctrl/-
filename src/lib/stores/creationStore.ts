import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// 定义类型
export interface Insight {
  id: string;
  category: string;
  title: string;
  description: string;
  content: string;
  trend: 'up' | 'down' | 'stable';
  count: number;
  tags: string[];
  icon: string;
  color: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  content: string;
  platform: string[];
  style: string;
  tags: string[];
  icon: string;
}

export interface Draft {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  wordCount: number;
  status: 'active' | 'archived';
  settings?: CreationSettings;
}

export interface CreationSettings {
  platform: string;
  style: string;
  tone: string;
  wordCount: number;
  includeImages: boolean;
  imageCount: number;
  customPrompts: string[];
}

export interface CreationState {
  // 输入状态
  userInput: string;
  selectedInsight: Insight | null;
  selectedTemplate: Template | null;
  currentStep: 'input' | 'enhance' | 'preview' | 'generate';

  // 设置状态
  settings: CreationSettings;
  showAdvancedSettings: boolean;

  // 草稿状态
  autoSaveEnabled: boolean;
  lastSavedAt: Date | null;

  // 生成状态
  isGenerating: boolean;
  generatedContent: string | null;
  generatedImages: string[];

  // 错误状态
  error: string | null;

  // 操作方法
  setUserInput: (input: string) => void;
  setSelectedInsight: (insight: Insight | null) => void;
  setSelectedTemplate: (template: Template | null) => void;
  setCurrentStep: (step: CreationState['currentStep']) => void;

  updateSettings: (settings: Partial<CreationSettings>) => void;
  toggleAdvancedSettings: () => void;

  setAutoSaveEnabled: (enabled: boolean) => void;
  setLastSavedAt: (date: Date | null) => void;

  setIsGenerating: (generating: boolean) => void;
  setGeneratedContent: (content: string | null) => void;
  setGeneratedImages: (images: string[]) => void;

  setError: (error: string | null) => void;

  // 核心功能
  generateContent: () => Promise<string | void>; // 返回 taskId（任务模式）或 void（直接模式）
  saveDraft: () => Promise<string>;
  loadDraft: (draftId: string) => Promise<void>;

  // 重置状态
  resetState: () => void;
  resetGeneratedContent: () => void;
}

// 默认设置
const defaultSettings: CreationSettings = {
  platform: 'xiaohongshu',
  style: '轻松活泼',
  tone: 'friendly',
  wordCount: 500,
  includeImages: true,
  imageCount: 3,
  customPrompts: []
};

// 创建 Store
export const useCreationStore = create<CreationState>()(
  devtools(
    persist(
      (set, get) => ({
        // 初始状态
        userInput: '',
        selectedInsight: null,
        selectedTemplate: null,
        currentStep: 'input',
        settings: defaultSettings,
        showAdvancedSettings: false,
        autoSaveEnabled: true,
        lastSavedAt: null,
        isGenerating: false,
        generatedContent: null,
        generatedImages: [],
        error: null,

        // 设置方法
        setUserInput: (input) => set({ userInput: input }),

        setSelectedInsight: (insight) => set({ selectedInsight: insight }),

        setSelectedTemplate: (template) => set({ selectedTemplate: template }),

        setCurrentStep: (step) => set({ currentStep: step }),

        updateSettings: (newSettings) => set((state) => ({
          settings: { ...state.settings, ...newSettings }
        })),

        toggleAdvancedSettings: () => set((state) => ({
          showAdvancedSettings: !state.showAdvancedSettings
        })),

        setAutoSaveEnabled: (enabled) => set({ autoSaveEnabled: enabled }),

        setLastSavedAt: (date) => set({ lastSavedAt: date }),

        setIsGenerating: (generating) => set({ isGenerating: generating }),

        setGeneratedContent: (content) => set({ generatedContent: content }),

        setGeneratedImages: (images) => set({ generatedImages: images }),

        setError: (error) => set({ error }),

        // 核心功能实现
        generateContent: async () => {
          const { userInput, selectedInsight, selectedTemplate, settings } = get();

          if (!userInput.trim()) {
            set({ error: '请输入创作内容' });
            return;
          }

          set({ isGenerating: true, error: null });

          try {
            // 构建请求数据 - 适配任务模式API
            const requestData: any = {
              platform: settings.platform,
              style: settings.style,
              length: settings.wordCount >= 1500 ? 'long' : settings.wordCount >= 800 ? 'medium' : 'short',
              imageStrategy: settings.includeImages ? 'auto' : 'minimal',
            };

            // 如果有洞察，使用洞察模式
            if (selectedInsight && selectedInsight.id) {
              requestData.mode = 'creation';
              requestData.insightId = selectedInsight.id;
              requestData.topicIndexes = [0]; // 默认使用第一个洞察
            } else {
              // 如果没有洞察，提示用户需要选择洞察或使用其他创作方式
              throw new Error('请先选择一个洞察报告，或使用"选题洞察"页面创建洞察后再进行创作');
            }

            // 调用内容生成API（任务模式）
            const response = await fetch('/api/content-creation', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestData),
            });

            if (!response.ok) {
              throw new Error('内容生成失败');
            }

            const result = await response.json();

            if (result.success && result.data?.taskId) {
              // 任务模式：保存任务ID到localStorage以便持久化
              const taskId = result.data.taskId;
              localStorage.setItem('smartCreation_taskId', taskId);
              localStorage.setItem('smartCreation_platform', settings.platform);
              console.log('💾 已保存创作任务ID到localStorage:', taskId);
              
              // 返回任务ID，由调用方进行轮询
              return taskId;
            } else {
              // 兼容旧模式：直接返回内容
              set({
                generatedContent: result.content,
                generatedImages: result.images || [],
                currentStep: 'preview'
              });
            }

          } catch (error) {
            set({
              error: error instanceof Error ? error.message : '生成失败，请重试'
            });
            throw error;
          } finally {
            // 注意：任务模式下不立即设置 isGenerating 为 false，需要等待任务完成
          }
        },

        saveDraft: async () => {
          const { userInput, settings, selectedInsight, selectedTemplate } = get();

          if (!userInput.trim()) {
            throw new Error('没有内容可保存');
          }

          try {
            const draftData = {
              title: userInput.slice(0, 50) + (userInput.length > 50 ? '...' : ''),
              content: userInput,
              excerpt: userInput.slice(0, 100) + (userInput.length > 100 ? '...' : ''),
              tags: [], // 可以从内容中提取标签
              wordCount: userInput.length,
              settings: settings,
              insight: selectedInsight,
              template: selectedTemplate
            };

            const response = await fetch('/api/drafts', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(draftData),
            });

            if (!response.ok) {
              throw new Error('保存草稿失败');
            }

            const result = await response.json();
            set({ lastSavedAt: new Date() });

            return result.id;

          } catch (error) {
            throw new Error(error instanceof Error ? error.message : '保存失败');
          }
        },

        loadDraft: async (draftId: string) => {
          try {
            const response = await fetch(`/api/drafts/${draftId}`);

            if (!response.ok) {
              throw new Error('加载草稿失败');
            }

            const draft = await response.json();

            set({
              userInput: draft.content,
              settings: draft.settings || defaultSettings,
              selectedInsight: draft.insight || null,
              selectedTemplate: draft.template || null
            });

          } catch (error) {
            set({ error: error instanceof Error ? error.message : '加载失败' });
          }
        },

        // 重置方法
        resetState: () => set({
          userInput: '',
          selectedInsight: null,
          selectedTemplate: null,
          currentStep: 'input',
          settings: defaultSettings,
          error: null
        }),

        resetGeneratedContent: () => set({
          generatedContent: null,
          generatedImages: [],
          isGenerating: false
        })
      }),
      {
        name: 'creation-store',
        partialize: (state) => ({
          // 只持久化部分状态
          settings: state.settings,
          autoSaveEnabled: state.autoSaveEnabled
        })
      }
    )
  )
);

// 自动保存功能
let autoSaveTimeout: NodeJS.Timeout | null = null;

// 监听输入变化，自动保存
if (typeof window !== 'undefined') {
  useCreationStore.subscribe((state) => {
    const { userInput, autoSaveEnabled } = state;

    if (autoSaveEnabled && userInput.trim()) {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }

      autoSaveTimeout = setTimeout(async () => {
        try {
          await state.saveDraft();
          state.setLastSavedAt(new Date());
        } catch (error) {
          console.error('自动保存失败:', error);
        }
      }, 3000); // 3秒后自动保存
    }
  });
}

// 选择器
export const selectCreationInput = (state: CreationState) => ({
  userInput: state.userInput,
  setUserInput: state.setUserInput
});

export const selectCreationSelection = (state: CreationState) => ({
  selectedInsight: state.selectedInsight,
  selectedTemplate: state.selectedTemplate,
  setSelectedInsight: state.setSelectedInsight,
  setSelectedTemplate: state.setSelectedTemplate
});

export const selectCreationGeneration = (state: CreationState) => ({
  isGenerating: state.isGenerating,
  generatedContent: state.generatedContent,
  generatedImages: state.generatedImages,
  generateContent: state.generateContent,
  setIsGenerating: state.setIsGenerating
});

export const selectCreationSettings = (state: CreationState) => ({
  settings: state.settings,
  showAdvancedSettings: state.showAdvancedSettings,
  updateSettings: state.updateSettings,
  toggleAdvancedSettings: state.toggleAdvancedSettings
});