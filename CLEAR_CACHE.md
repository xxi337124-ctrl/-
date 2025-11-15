# 清除选题洞察页面缓存

如果选题洞察页面显示空白，请在浏览器控制台（F12）运行以下命令：

```javascript
// 清除选题洞察缓存
sessionStorage.removeItem('topicAnalysis_currentSession');
console.log('✅ 已清除选题洞察缓存');

// 刷新页面
location.reload();
```

或者简单点，直接运行：

```javascript
sessionStorage.clear(); location.reload();
```

## 问题原因

页面使用了状态持久化功能，如果之前切换到其他tab后数据被清空，再切换回来时可能会出现空白页面。

## 已修复

代码已添加：
1. 状态过期检测（30分钟）
2. 数据完整性验证
3. Fallback UI（状态异常时显示返回按钮）

刷新页面后问题应该已经解决。
