# AI创作任务持久化优化

## 修复时间
2025-11-10

## 问题描述

用户反馈: **AI创作过程中,切换功能就打断了**

### 原因分析

1. ContentCreation组件使用useEffect进行任务轮询
2. 当用户切换到其他页面时,组件被卸载
3. useEffect的cleanup函数清除了interval
4. 导致轮询停止,任务看起来被"打断"
5. 实际上后端任务还在运行,只是前端不再轮询

## 解决方案

### 1. 任务ID持久化到localStorage

**文件**: [src/components/pages/ContentCreation.tsx](src/components/pages/ContentCreation.tsx)

#### 创建任务时保存
```typescript
// 行320-322
localStorage.setItem('contentCreation_taskId', data.data.taskId);
localStorage.setItem('contentCreation_platform', platform);
console.log('💾 已保存创作任务ID到localStorage:', data.data.taskId);
```

#### 任务完成/失败时清除
```typescript
// 行196-197, 230-231
localStorage.removeItem('contentCreation_taskId');
localStorage.removeItem('contentCreation_platform');
```

### 2. 页面加载时恢复任务

**文件**: [src/components/pages/ContentCreation.tsx:62-128](src/components/pages/ContentCreation.tsx#L62-L128)

```typescript
useEffect(() => {
  const savedTaskId = localStorage.getItem('contentCreation_taskId');
  const savedTaskPlatform = localStorage.getItem('contentCreation_platform');

  if (savedTaskId) {
    console.log('🔄 检测到未完成的创作任务:', savedTaskId);
    // 检查任务状态
    fetch(`/api/content-creation/${savedTaskId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.task) {
          const task = data.data.task;

          if (task.status === 'PROCESSING') {
            // 任务还在进行中,恢复状态
            setCurrentTaskId(savedTaskId);
            setCreating(true);
            setStep(4);
            if (savedTaskPlatform) {
              setPlatform(savedTaskPlatform as 'wechat' | 'xiaohongshu');
            }
            console.log('✅ 已恢复创作任务轮询');
          } else if (task.status === 'COMPLETED' && data.data.article) {
            // 任务已完成,直接显示结果
            // ... 加载文章数据并跳转到预览页面
          }
        }
      })
  }
}, []);
```

### 3. 全局任务状态提示

**文件**: [src/app/page.tsx](src/app/page.tsx)

#### 添加全局状态检查
```typescript
// 行17-18
const [hasActiveTask, setHasActiveTask] = useState(false);
const [taskProgress, setTaskProgress] = useState(0);

// 行28-59: 全局轮询检查
useEffect(() => {
  const checkActiveTask = () => {
    const taskId = localStorage.getItem('contentCreation_taskId');
    if (taskId && activeTab !== 'content-creation') {
      setHasActiveTask(true);

      // 轮询任务状态
      fetch(`/api/content-creation/${taskId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data.task) {
            const task = data.data.task;
            setTaskProgress(task.progress || 0);

            if (task.status === 'COMPLETED' || task.status === 'FAILED') {
              setHasActiveTask(false);
            }
          }
        })
    }
  };

  checkActiveTask();
  const interval = setInterval(checkActiveTask, 3000);
  return () => clearInterval(interval);
}, [activeTab]);
```

#### 添加顶部任务提示栏
```typescript
// 行166-191
{hasActiveTask && (
  <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg">
    <div className="max-w-7xl mx-auto px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span className="font-medium">AI创作进行中...</span>
          <span className="text-sm opacity-90">{taskProgress}%</span>
        </div>
        <button
          onClick={() => setActiveTab('content-creation')}
          className="px-4 py-1.5 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-sm font-medium transition-all"
        >
          查看进度 →
        </button>
      </div>
      {/* 进度条 */}
      <div className="mt-2 h-1 bg-white bg-opacity-30 rounded-full overflow-hidden">
        <div className="h-full bg-white transition-all duration-500" style={{ width: `${taskProgress}%` }} />
      </div>
    </div>
  </div>
)}
```

## 功能特性

### ✅ 任务持久化
- 创作任务ID保存到localStorage
- 切换页面不会丢失任务状态
- 刷新页面自动恢复任务

### ✅ 全局任务提示
- 顶部固定紫粉色渐变提示栏
- 实时显示创作进度百分比
- 动画转圈加载效果
- 进度条可视化
- 一键跳转到创作页面

### ✅ 智能状态恢复
- 检测到PROCESSING状态 → 恢复轮询
- 检测到COMPLETED状态 → 直接显示结果
- 检测到FAILED状态 → 清除任务

### ✅ 自动清理
- 任务完成后自动清除localStorage
- 避免过期任务干扰

## 使用流程

### 正常流程
```
1. 用户开始创作 → 保存taskId到localStorage
2. 显示创作进度(步骤4)
3. 轮询任务状态
4. 任务完成 → 清除localStorage → 显示结果
```

### 切换页面流程
```
1. 用户开始创作
2. 切换到其他页面(如选题洞察)
3. 顶部显示"AI创作进行中..."提示
4. 后台继续轮询任务状态(每3秒)
5. 用户点击"查看进度" → 跳转回创作页面
6. ContentCreation组件检测到taskId → 恢复状态
7. 继续显示创作进度
```

### 刷新页面流程
```
1. 创作进行中,用户刷新页面
2. 页面重新加载
3. ContentCreation检测localStorage中的taskId
4. 查询任务状态
5. 如果PROCESSING → 恢复到步骤4继续轮询
6. 如果COMPLETED → 直接跳到步骤5显示结果
```

## 界面设计

### 全局任务提示栏

**位置**: 顶部固定,z-index: 50

**样式**:
- 背景: 紫色到粉色渐变 (from-purple-500 to-pink-500)
- 文字: 白色
- 高度: 约80px
- 阴影: shadow-lg

**元素**:
1. 加载动画: 旋转的圆圈 (animate-spin)
2. 文字提示: "AI创作进行中..."
3. 进度百分比: "45%"
4. 操作按钮: "查看进度 →"
5. 进度条: 底部1px高度的进度指示器

### 页面布局调整

**侧边栏**: `marginTop: hasActiveTask ? '80px' : '0'`
**内容区**: `marginTop: hasActiveTask ? '80px' : '0'`

确保提示栏显示时,其他内容向下偏移,不被遮挡。

## 技术实现

### localStorage键名
- `contentCreation_taskId`: 任务ID
- `contentCreation_platform`: 平台类型 (wechat/xiaohongshu)

### 轮询间隔
- ContentCreation页面: 2秒 (快速更新)
- 全局检查: 3秒 (节省资源)

### 状态同步
```
localStorage ←→ React State ←→ API状态
```

## 测试场景

### ✅ 场景1: 正常创作
```
1. 开始创作
2. 等待完成
3. 查看结果
✅ 任务正常完成,无提示栏
```

### ✅ 场景2: 切换页面
```
1. 开始创作
2. 切换到"选题洞察"
3. 顶部显示创作进度提示
4. 点击"查看进度"
5. 返回创作页面
✅ 任务继续进行,进度保持
```

### ✅ 场景3: 刷新页面
```
1. 开始创作(进度50%)
2. 刷新页面
3. 自动恢复到创作页面
4. 继续显示进度
✅ 任务无缝恢复
```

### ✅ 场景4: 任务完成后切换
```
1. 任务完成
2. 切换到其他页面
3. 不显示提示栏
✅ localStorage已清除
```

## 修改的文件

### 主要修改
1. [src/components/pages/ContentCreation.tsx](src/components/pages/ContentCreation.tsx)
   - 添加页面加载时的任务恢复逻辑 (行62-128)
   - 保存taskId到localStorage (行320-322)
   - 清除localStorage (行196-197, 230-231)

2. [src/app/page.tsx](src/app/page.tsx)
   - 添加全局任务状态检查 (行17-18, 28-59)
   - 添加顶部任务提示栏 (行166-191)
   - 调整页面布局margin (行194, 235)

## 优化建议

### 已实现
- ✅ 任务ID持久化
- ✅ 页面加载恢复
- ✅ 全局任务提示
- ✅ 进度可视化
- ✅ 一键跳转

### 未来可优化
- [ ] 添加任务取消功能
- [ ] 支持多任务并行
- [ ] 添加任务历史记录
- [ ] 失败任务重试机制
- [ ] 推送通知(任务完成时)

## 用户价值

1. **无缝体验**: 切换页面不会丢失进度
2. **实时反馈**: 始终能看到创作进度
3. **容错能力**: 刷新页面自动恢复
4. **清晰提示**: 知道任务正在后台运行
5. **便捷操作**: 一键返回查看详情

---

**功能状态**: ✅ 已完成
**测试状态**: ✅ 待用户验证
**下一步**: 优化创作设置的提示词管理
