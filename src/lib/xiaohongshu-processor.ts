/**
 * 小红书内容处理器
 * 专门处理小红书内容的二创流程：
 * 1. 文案通过 Gemini 3 Pro 进行二创优化
 * 2. 图片通过 Gemini 3 Pro 分析并生成提示词
 * 3. 使用分析提示词 + 原图通过 Imagen 3 生成新图片
 */

import { enhancedImageGenerator } from './enhanced-image-generator';
import { extractImagesFromContent, extractImagesFromArticles } from './image-utils';
import { generateBatchModifiedPrompts, generateUniqueModifications } from './image-prompt-modifier';
import { geminiClient } from './gemini-client';
import { siliconFlowClient } from './siliconflow';

export interface XiaohongshuPost {
  id: string;
  title: string;
  content: string;
  images: string[];
  author: string;
  likes: number;
  collections: number;
  comments: number;
  tags: string[];
  createdAt: string;
}

export interface XiaohongshuProcessingOptions {
  generateVariations?: boolean;      // 是否为每张原图生成变体
  variationCount?: number;           // 每个原图生成多少变体
  useContentAnalysis?: boolean;      // 是否使用内容分析生成提示词
  preserveStyle?: boolean;           // 是否保持原图风格
  targetPlatform?: 'xiaohongshu' | 'wechat' | 'universal'; // 目标平台
  enableBatchProcessing?: boolean;   // 是否启用批量处理
  progressCallback?: (progress: ProcessingProgress) => void;
  // 新增：文案二创选项
  optimizeContent?: boolean;         // 是否对文案进行二创优化
  useGeminiForAnalysis?: boolean;    // 是否使用 Gemini 3 Pro 分析图片
  useImagenForGeneration?: boolean;  // 是否使用 Imagen 3 生成图片
}

export interface ProcessingProgress {
  totalPosts: number;
  currentPost: number;
  totalImages: number;
  processedImages: number;
  status: 'analyzing' | 'generating' | 'completed' | 'failed';
  message: string;
  currentPostTitle?: string;
}

export interface ProcessedXiaohongshuPost {
  originalPost: XiaohongshuPost;
  optimizedContent?: {              // 新增：二创后的文案
    title: string;
    content: string;
  };
  generatedImages: GeneratedImageSet[];
  processingTime: number;
  successRate: number;
  contentAnalysis?: ContentAnalysis;
}

export interface GeneratedImageSet {
  originalImage: string;
  variations: ImageVariation[];
  contentBasedPrompt?: string;
}

export interface ImageVariation {
  url: string;
  prompt: string;
  modifications: string[];
  generationTime: number;
  success: boolean;
  error?: string;
}

export interface ContentAnalysis {
  mainTheme: string;
  colorPalette: string[];
  style: string;
  mood: string;
  keyElements: string[];
  suggestedModifications: string[];
}

/**
 * 小红书内容分析器
 */
class XiaohongshuContentAnalyzer {
  /**
   * 分析小红书内容，提取关键信息用于图片生成
   */
  analyzeContent(post: XiaohongshuPost): ContentAnalysis {
    const content = `${post.title} ${post.content} ${post.tags.join(' ')}`;

    // 简单的关键词提取和分析
    const keywords = this.extractKeywords(content);
    const colorPalette = this.extractColorPalette(content);
    const style = this.detectStyle(content);
    const mood = this.detectMood(content);
    const keyElements = this.extractKeyElements(content);

    return {
      mainTheme: keywords[0] || 'lifestyle',
      colorPalette,
      style,
      mood,
      keyElements,
      suggestedModifications: this.suggestModifications(keywords, style)
    };
  }

  private extractKeywords(content: string): string[] {
    // 简化的关键词提取
    const commonWords = ['的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没', '看', '好', '自己', '这', '那', '她', '他', '它', '们', '想', '已经', '现在', '今天', '可以', '应该', '因为', '所以', '但是', '不过', '只是', '一些', '很多', '非常', '真的', '比较', '还是', '或者', '可能', '必须', '需要', '想要', '知道', '觉得', '感觉', '时间', '时候', '地方', '东西', '事情', '问题', '方法', '方式', '原因', '结果', '目的', '意义', '价值', '作用', '影响', '关系', '联系', '区别', '特点', '特色', '优点', '缺点', '好处', '坏处', '乐趣', '兴趣', '爱好', '习惯', '传统', '文化', '艺术', '音乐', '电影', '书籍', '旅游', '美食', '运动', '健康', '学习', '工作', '生活', '家庭', '朋友', '爱情', '友情', '亲情', '社交', '娱乐', '休闲', '放松', '休息', '睡眠', '梦想', '目标', '计划', '未来', '过去', '回忆', '经历', '经验', '教训', '成长', '进步', '成功', '失败', '挫折', '困难', '挑战', '机会', '运气', '命运', '选择', '决定', '变化', '发展', '创新', '改进', '提高', '增强', '加强', '扩大', '减少', '降低', '消除', '避免', '防止', '保护', '保存', '维护', '修理', '修复', '清理', '整理', '安排', '准备', '计划', '组织', '管理', '控制', '监督', '检查', '测试', '实验', '研究', '分析', '理解', '明白', '了解', '认识', '发现', '发明', '创造', '设计', '制作', '生产', '制造', '建造', '建设', '成立', '建立', '开始', '启动', '出发', '到达', '返回', '回来', '离开', '分开', '分离', '结合', '连接', '联系', '沟通', '交流', '分享', '合作', '协作', '竞争', '比赛', '比较', '对比', '评价', '评估', '判断', '决定', '选择', '挑选', '接受', '拒绝', '同意', '反对', '支持', '帮助', '协助', '服务', '贡献', '奉献', '牺牲', '付出', '回报', '奖励', '惩罚', '批评', '表扬', '赞美', '批评', '指责', '抱怨', '称赞', '祝贺', '感谢', '道歉', '原谅', '理解', '同情', '关心', '照顾', '爱护', '保护', '尊重', '信任', '相信', '怀疑', '质疑', '担心', '害怕', '恐惧', '紧张', '焦虑', '压力', '疲劳', '累', '疲倦', '困', '饿', '渴', '饱', '醉', '清醒', '意识', '注意', '专注', '集中', '分散', '混乱', '清楚', '模糊', '明显', '隐藏', '秘密', '公开', '透明', '明亮', '黑暗', '光明', '阴影', '颜色', '红色', '蓝色', '绿色', '黄色', '白色', '黑色', '灰色', '紫色', '橙色', '粉色', '金色', '银色', '铜色', '色彩', '彩色', '单色', '混合', '纯色', '透明', '不透明', '亮', '暗', '深', '浅', '浓', '淡', '强', '弱', '大', '小', '长', '短', '高', '低', '宽', '窄', '厚', '薄', '粗', '细', '胖', '瘦', '重', '轻', '硬', '软', '固体', '液体', '气体', '形状', '圆形', '方形', '三角形', '长方形', '椭圆形', '直线', '曲线', '波浪', '锯齿', '光滑', '粗糙', '平', '凸', '凹', '尖', '钝', '锋利', '钝', '快', '慢', '迅速', '立即', '马上', '立刻', '瞬间', '永恒', '永久', '暂时', '临时', '短暂', '长期', '短期', '新', '旧', '老', '年轻', '古老', '现代', '当代', '过去', '现在', '将来', '未来', '早', '晚', '晨', '昏', '白天', '黑夜', '上午', '下午', '晚上', '深夜', '凌晨', '黎明', '黄昏', '日出', '日落', '月出', '月落', '春天', '夏天', '秋天', '冬天', '季节', '月份', '一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月', '星期', '周一', '周二', '周三', '周四', '周五', '周六', '周日', '周末', '工作日', '假期', '节日', '新年', '春节', '元宵节', '清明节', '端午节', '中秋节', '国庆节', '劳动节', '儿童节', '妇女节', '教师节', '母亲节', '父亲节', '情人节', '圣诞节', '万圣节', '感恩节', '生日', '纪念日', '庆典', '仪式', '活动', '聚会', '派对', '会议', '展览', '演出', '表演', '音乐会', '演唱会', '话剧', '歌剧', '舞蹈', '芭蕾', '绘画', '雕塑', '摄影', '电影', '电视', '广播', '报纸', '杂志', '书籍', '小说', '诗歌', '散文', '论文', '报告', '文件', '文档', '资料', '信息', '数据', '事实', '真相', '谎言', '谣言', '新闻', '消息', '通知', '公告', '广告', '宣传', '推广', '营销', '品牌', '商标', '专利', '版权', '法律', '法规', '规则', '规定', '制度', '政策', '方针', '策略', '战略', '战术', '计划', '方案', '项目', '工程', '任务', '工作', '职业', '专业', '行业', '领域', '部门', '机构', '组织', '公司', '企业', '工厂', '商店', '超市', '市场', '商场', '中心', '大楼', '房屋', '住宅', '公寓', '别墅', '房间', '客厅', '卧室', '厨房', '卫生间', '阳台', '花园', '院子', '车库', '地下室', '阁楼', '楼梯', '电梯', '门', '窗', '墙', '地板', '天花板', '家具', '桌子', '椅子', '床', '沙发', '柜子', '书架', '灯', '电视', '电脑', '手机', '电话', '相机', '空调', '冰箱', '洗衣机', '微波炉', '烤箱', '炉灶', '抽油烟机', '餐具', '盘子', '碗', '杯子', '瓶子', '锅', '刀', '叉', '勺子', '筷子', '食材', '蔬菜', '水果', '肉类', '鱼类', '海鲜', '米饭', '面条', '面包', '蛋糕', '饼干', '巧克力', '糖果', '饮料', '水', '茶', '咖啡', '果汁', '牛奶', '酒', '啤酒', '葡萄酒', '白酒', '药物', '维生素', '营养', '健康', '医疗', '医院', '诊所', '药店', '医生', '护士', '病人', '疾病', '感冒', '发烧', '咳嗽', '头痛', '牙痛', '胃痛', '过敏', '感染', '病毒', '细菌', '疫苗', '治疗', '手术', '检查', '诊断', '处方', '药片', '胶囊', '注射', '绷带', '纱布', '酒精', '消毒', '清洁', '卫生', '干净', '脏', '污染', '垃圾', '废物', '回收', '环保', '绿色', '低碳', '节能', '减排', '保护', '保存', '维护', '修理', '修复', '清理', '整理', '安排', '准备', '计划', '组织', '管理', '控制', '监督', '检查', '测试', '实验', '研究', '分析', '理解', '明白', '了解', '认识', '发现', '发明', '创造', '设计', '制作', '生产', '制造', '建造', '建设', '成立', '建立', '开始', '启动', '出发', '到达', '返回', '回来', '离开', '分开', '分离', '结合', '连接', '联系', '沟通', '交流', '分享', '合作', '协作', '竞争', '比赛', '比较', '对比', '评价', '评估', '判断', '决定', '选择', '挑选', '接受', '拒绝', '同意', '反对', '支持', '帮助', '协助', '服务', '贡献', '奉献', '牺牲', '付出', '回报', '奖励', '惩罚', '批评', '表扬', '赞美', '批评', '指责', '抱怨', '称赞', '祝贺', '感谢', '道歉', '原谅', '理解', '同情', '关心', '照顾', '爱护', '保护', '尊重', '信任', '相信', '怀疑', '质疑', '担心', '害怕', '恐惧', '紧张', '焦虑', '压力', '疲劳', '累', '疲倦', '困', '饿', '渴', '饱', '醉', '清醒', '意识', '注意', '专注', '集中', '分散', '混乱', '清楚', '模糊', '明显', '隐藏', '秘密', '公开', '透明', '明亮', '黑暗', '光明', '阴影'];

    const words = content.split(/[\s\u00A0\u3000\u2002-\u200D\uFEFF\u2060-\u206F\u200B-\u200D\uFEFF]+/);
    const filteredWords = words.filter(word =>
      word.length > 1 && !commonWords.includes(word.toLowerCase())
    );

    // 返回频率最高的词
    const wordFreq = new Map<string, number>();
    filteredWords.forEach(word => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });

    return Array.from(wordFreq.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }

  private extractColorPalette(content: string): string[] {
    const colors = [
      '红色', '蓝色', '绿色', '黄色', '紫色', '橙色', '粉色', '黑色', '白色', '灰色',
      '金色', '银色', '棕色', '青色', '品红', '靛蓝', '桃色', '米色', '咖啡色', '栗色'
    ];

    return colors.filter(color => content.includes(color));
  }

  private detectStyle(content: string): string {
    const styles = {
      'minimalist': ['简约', '简单', '干净', '整洁', '清新'],
      'vintage': ['复古', '怀旧', '古典', '老式', '传统'],
      'modern': ['现代', '时尚', '潮流', '新颖', '前卫'],
      'natural': ['自然', '清新', '田园', '乡村', '户外'],
      'elegant': ['优雅', '精致', '高档', '奢华', '典雅'],
      'cute': ['可爱', '萌', '甜美', '温馨', '温暖'],
      'cool': ['酷', '帅气', '个性', '独特', '特别']
    };

    for (const [style, keywords] of Object.entries(styles)) {
      if (keywords.some(keyword => content.includes(keyword))) {
        return style;
      }
    }

    return 'universal';
  }

  private detectMood(content: string): string {
    const moods = {
      'happy': ['开心', '快乐', '高兴', '愉快', '欢乐'],
      'romantic': ['浪漫', '温馨', '甜蜜', '温柔', '深情'],
      'energetic': ['活力', '精力充沛', '热情', '积极', '向上'],
      'calm': ['平静', '宁静', '安静', '放松', '舒适'],
      'exciting': ['兴奋', '激动', '刺激', '精彩', '震撼'],
      'nostalgic': ['怀念', '回忆', '怀旧', '思念', '缅怀']
    };

    for (const [mood, keywords] of Object.entries(moods)) {
      if (keywords.some(keyword => content.includes(keyword))) {
        return mood;
      }
    }

    return 'neutral';
  }

  private extractKeyElements(content: string): string[] {
    const elements = [
      '食物', '美食', '料理', '烹饪', '烘焙', '咖啡', '茶', '甜点', '蛋糕', '面包',
      '花朵', '花束', '植物', '树木', '叶子', '草地', '花园', '森林', '山脉', '海洋',
      '建筑', '房子', '桥梁', '街道', '城市', '乡村', '室内', '室外', '装饰', '家具',
      '人物', '女孩', '男孩', '女人', '男人', '孩子', '家庭', '朋友', '情侣', '动物',
      '配饰', '首饰', '包包', '鞋子', '衣服', '化妆品', '香水', '手表', '眼镜', '帽子'
    ];

    return elements.filter(element => content.includes(element));
  }

  private suggestModifications(keywords: string[], style: string): string[] {
    const suggestions = [
      'change container color/style while keeping shape',
      'add/remove a sauce drizzle pattern',
      'place 2-3 new condiment elements',
      'add wooden chopsticks/spoon as prop',
      'include small sauce dish on side'
    ];

    // 根据关键词和风格推荐特定的修改
    if (keywords.some(k => ['浪漫', '温馨'].includes(k))) {
      suggestions.push('add soft lighting effects');
    }

    if (keywords.some(k => ['复古', '怀旧'].includes(k))) {
      suggestions.push('apply vintage filter effects');
    }

    if (style === 'minimalist') {
      suggestions.push('remove unnecessary decorations');
    }

    return suggestions.slice(0, 3);
  }
}

/**
 * 小红书处理器主类
 */
export class XiaohongshuProcessor {
  private analyzer = new XiaohongshuContentAnalyzer();

  /**
   * 处理单个小红书帖子
   */
  async processPost(
    post: XiaohongshuPost,
    options: XiaohongshuProcessingOptions = {}
  ): Promise<ProcessedXiaohongshuPost> {
    const startTime = Date.now();
    const {
      generateVariations = true,
      variationCount = 3,
      useContentAnalysis = true,
      preserveStyle = true,
      targetPlatform = 'xiaohongshu',
      enableBatchProcessing = true,
      progressCallback,
      optimizeContent = true,           // 默认开启文案二创
      useGeminiForAnalysis = true,      // 默认使用 Gemini 分析图片
      useImagenForGeneration = true,    // 默认使用 Imagen 3 生成图片
    } = options;

    try {
      progressCallback?.({
        totalPosts: 1,
        currentPost: 1,
        totalImages: post.images.length,
        processedImages: 0,
        status: 'analyzing',
        message: '正在分析内容...',
        currentPostTitle: post.title
      });

      // 第一步：文案二创（使用 Gemini 3 Pro）
      let optimizedContentResult: { title: string; content: string } | undefined;

      if (optimizeContent) {
        progressCallback?.({
          totalPosts: 1,
          currentPost: 1,
          totalImages: post.images.length,
          processedImages: 0,
          status: 'analyzing',
          message: '正在使用 Gemini 3 Pro 优化文案...',
          currentPostTitle: post.title
        });

        try {
          const originalContent = `${post.title}\n\n${post.content}`;
          const optimizedContent = await geminiClient.optimizeContent(originalContent, {
            platform: targetPlatform,
            style: targetPlatform === 'xiaohongshu' ? '轻松活泼' : '专业正式',
          });

          // 简单拆分标题和内容（取第一行作为标题）
          const lines = optimizedContent.split('\n').filter(l => l.trim());
          optimizedContentResult = {
            title: lines[0] || post.title,
            content: lines.slice(1).join('\n') || optimizedContent,
          };

          console.log('✅ 文案优化成功');
        } catch (error) {
          console.error('❌ 文案优化失败:', error);
          // 如果失败，使用原文案
          optimizedContentResult = undefined;
        }
      }

      // 分析内容
      const contentAnalysis = useContentAnalysis
        ? this.analyzer.analyzeContent(post)
        : undefined;

      const generatedImageSets: GeneratedImageSet[] = [];

      // 处理每张图片
      for (let i = 0; i < post.images.length; i++) {
        const originalImage = post.images[i];

        progressCallback?.({
          totalPosts: 1,
          currentPost: 1,
          totalImages: post.images.length,
          processedImages: i,
          status: 'generating',
          message: `正在处理第 ${i + 1}/${post.images.length} 张图片...`,
          currentPostTitle: post.title
        });

        if (generateVariations) {
          const imageSet = await this.generateImageVariations(
            originalImage,
            contentAnalysis,
            variationCount,
            preserveStyle,
            targetPlatform,
            useGeminiForAnalysis,
            useImagenForGeneration
          );
          generatedImageSets.push(imageSet);
        } else {
          // 只生成一张图片
          const imageSet: GeneratedImageSet = {
            originalImage,
            variations: []
          };
          generatedImageSets.push(imageSet);
        }
      }

      const processingTime = Date.now() - startTime;
      const totalVariations = generatedImageSets.reduce((sum, set) => sum + set.variations.length, 0);
      const successfulVariations = generatedImageSets.reduce(
        (sum, set) => sum + set.variations.filter(v => v.success).length,
        0
      );

      progressCallback?.({
        totalPosts: 1,
        currentPost: 1,
        totalImages: post.images.length,
        processedImages: post.images.length,
        status: 'completed',
        message: `处理完成！生成了 ${successfulVariations}/${totalVariations} 个变体`,
        currentPostTitle: post.title
      });

      return {
        originalPost: post,
        optimizedContent: optimizedContentResult,
        generatedImages: generatedImageSets,
        processingTime,
        successRate: totalVariations > 0 ? successfulVariations / totalVariations : 0,
        contentAnalysis
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : '处理失败';

      progressCallback?.({
        totalPosts: 1,
        currentPost: 1,
        totalImages: post.images.length,
        processedImages: 0,
        status: 'failed',
        message: `处理失败: ${errorMessage}`,
        currentPostTitle: post.title
      });

      throw new Error(`处理小红书帖子失败: ${errorMessage}`);
    }
  }

  /**
   * 批量处理多个小红书帖子
   */
  async processMultiplePosts(
    posts: XiaohongshuPost[],
    options: XiaohongshuProcessingOptions = {}
  ): Promise<ProcessedXiaohongshuPost[]> {
    const results: ProcessedXiaohongshuPost[] = [];
    const { progressCallback } = options;

    console.log(`🎯 开始批量处理 ${posts.length} 个小红书帖子...`);

    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];

      try {
        const result = await this.processPost(post, {
          ...options,
          progressCallback: (progress) => {
            progressCallback?.({
              ...progress,
              totalPosts: posts.length,
              currentPost: i + 1
            });
          }
        });

        results.push(result);
        console.log(`✅ 第 ${i + 1}/${posts.length} 个帖子处理完成`);

      } catch (error) {
        console.error(`❌ 第 ${i + 1}/${posts.length} 个帖子处理失败:`, error);
        // 继续处理其他帖子
      }

      // 在帖子之间添加延迟，避免API过载
      if (i < posts.length - 1) {
        await this.sleep(3000);
      }
    }

    console.log(`📊 批量处理完成 - 总计: ${posts.length}, 成功: ${results.length}`);
    return results;
  }

  /**
   * 为单张图片生成多个变体
   * 第二步：使用 Gemini 3 Pro 分析图片并生成提示词
   * 第三步：使用提示词 + 原图通过 Imagen 3 生成新图片
   */
  private async generateImageVariations(
    originalImage: string,
    contentAnalysis: ContentAnalysis | undefined,
    variationCount: number,
    preserveStyle: boolean,
    targetPlatform: string,
    useGeminiForAnalysis: boolean = true,
    useImagenForGeneration: boolean = true
  ): Promise<GeneratedImageSet> {
    // 基于内容分析生成基础提示词
    let contentBasedPrompt = "";

    if (contentAnalysis) {
      contentBasedPrompt = this.generateContentBasedPrompt(contentAnalysis, preserveStyle, targetPlatform);
    }

    // 第二步：使用 Gemini 3 Pro 分析图片
    let geminiAnalysisPrompt = contentBasedPrompt;

    if (useGeminiForAnalysis) {
      try {
        console.log(`🔍 使用 Gemini 3 Pro 分析图片: ${originalImage.slice(0, 80)}...`);

        // 获取用户配置的图片分析提示词
        const { prisma } = await import("@/lib/prisma");
        const settings = await prisma.prompt_settings.findUnique({
          where: { userId: "default" },
        });

        const customPrompt = settings?.imageAnalysisPrompt;

        const analysis = await geminiClient.analyzeImage(originalImage, customPrompt);

        geminiAnalysisPrompt = analysis.suggestedPrompt;
        console.log(`✅ Gemini 分析成功: ${geminiAnalysisPrompt.slice(0, 100)}...`);
      } catch (error) {
        console.error('❌ Gemini 图片分析失败:', error);
        // 如果失败，使用基础提示词
        geminiAnalysisPrompt = contentBasedPrompt;
      }
    }

    // 生成变体
    const variations: ImageVariation[] = [];

    // 第三步：使用 Imagen 3 (通过 apicore.ai) 生成图片
    if (useImagenForGeneration) {
      try {
        console.log(`🎨 使用 Imagen 3 生成 ${variationCount} 个变体...`);

        // 为每个变体使用相同的分析提示词，但通过 siliconflow 的图生图功能
        for (let i = 0; i < variationCount; i++) {
          const startTime = Date.now();

          try {
            const generatedUrl = await siliconFlowClient.imageToImage(
              originalImage,
              geminiAnalysisPrompt,
              {
                imageSize: "1024x1024",
                maxRetries: 3,
              }
            );

            variations.push({
              url: generatedUrl,
              prompt: geminiAnalysisPrompt,
              modifications: [`Variation ${i + 1}`],
              generationTime: Date.now() - startTime,
              success: true,
            });

            console.log(`✅ 变体 ${i + 1}/${variationCount} 生成成功`);
          } catch (error) {
            console.error(`❌ 变体 ${i + 1}/${variationCount} 生成失败:`, error);
            variations.push({
              url: '',
              prompt: geminiAnalysisPrompt,
              modifications: [`Variation ${i + 1}`],
              generationTime: Date.now() - startTime,
              success: false,
              error: error instanceof Error ? error.message : '生成失败',
            });
          }

          // 在每个变体之间添加延迟，避免 API 过载
          if (i < variationCount - 1) {
            await this.sleep(2000);
          }
        }
      } catch (error) {
        console.error('❌ 图片生成失败:', error);
        // 创建失败记录
        for (let i = 0; i < variationCount; i++) {
          variations.push({
            url: '',
            prompt: geminiAnalysisPrompt,
            modifications: [],
            generationTime: 0,
            success: false,
            error: error instanceof Error ? error.message : '生成失败',
          });
        }
      }
    } else {
      // 使用原有的增强版生成器（不使用 Imagen 3）
      try {
        const result = await enhancedImageGenerator.generateEnhancedBatchImages(
          Array(variationCount).fill(originalImage),
          Array(variationCount).fill(geminiAnalysisPrompt),
          {
            usePromptModifications: true,
            waitForCompletion: true,
            timeoutPerImage: 60000,
            maxRetries: 3,
            imageSize: "1024x1024",
            enableFallback: true,
          }
        );

        // 转换结果格式
        result.results.forEach((result, index) => {
          variations.push({
            url: result.generatedUrl,
            prompt: result.prompt,
            modifications: result.modifications,
            generationTime: result.generationTime || 0,
            success: result.success,
            error: result.error,
          });
        });
      } catch (error) {
        console.error('生成图片变体失败:', error);
        // 创建失败记录
        for (let i = 0; i < variationCount; i++) {
          variations.push({
            url: '',
            prompt: geminiAnalysisPrompt,
            modifications: [],
            generationTime: 0,
            success: false,
            error: error instanceof Error ? error.message : '生成失败',
          });
        }
      }
    }

    return {
      originalImage,
      variations,
      contentBasedPrompt: geminiAnalysisPrompt,
    };
  }

  /**
   * 基于内容分析生成提示词
   */
  private generateContentBasedPrompt(
    analysis: ContentAnalysis,
    preserveStyle: boolean,
    targetPlatform: string
  ): string {
    let prompt = `[${analysis.mainTheme}] `;

    if (preserveStyle) {
      prompt += `${analysis.style} style, ${analysis.mood} mood, `;
    }

    if (analysis.colorPalette.length > 0) {
      prompt += `color palette: ${analysis.colorPalette.join(', ')}, `;
    }

    if (analysis.keyElements.length > 0) {
      prompt += `featuring ${analysis.keyElements.join(', ')}, `;
    }

    // 添加平台特定的优化
    if (targetPlatform === 'xiaohongshu') {
      prompt += 'optimized for social media sharing, bright and appealing, ';
    }

    // 添加基础修改模板
    prompt += 'maintaining overall composition, apply THREE random modifications';

    return prompt.trim();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 生成处理报告
   */
  generateProcessingReport(results: ProcessedXiaohongshuPost[]): string {
    const totalPosts = results.length;
    const totalImages = results.reduce((sum, result) => sum + result.generatedImages.length, 0);
    const totalVariations = results.reduce(
      (sum, result) => sum + result.generatedImages.reduce((vSum, set) => vSum + set.variations.length, 0),
      0
    );
    const successfulVariations = results.reduce(
      (sum, result) => sum + result.generatedImages.reduce(
        (vSum, set) => vSum + set.variations.filter(v => v.success).length,
        0
      ),
      0
    );

    let report = `📊 小红书内容处理报告\n`;
    report += `========================\n`;
    report += `处理帖子: ${totalPosts} 个\n`;
    report += `处理原图: ${totalImages} 张\n`;
    report += `生成变体: ${totalVariations} 个\n`;
    report += `成功变体: ${successfulVariations} 个\n`;
    report += `整体成功率: ${totalVariations > 0 ? Math.round((successfulVariations / totalVariations) * 100) : 0}%\n\n`;

    // 按帖子详细统计
    results.forEach((result, index) => {
      const post = result.originalPost;
      const variationCount = result.generatedImages.reduce((sum, set) => sum + set.variations.length, 0);
      const successCount = result.generatedImages.reduce(
        (sum, set) => sum + set.variations.filter(v => v.success).length,
        0
      );

      report += `帖子 ${index + 1}: ${post.title.slice(0, 30)}...\n`;
      report += `  原图: ${post.images.length} 张\n`;
      report += `  变体: ${variationCount} 个\n`;
      report += `  成功: ${successCount} 个\n`;
      report += `  耗时: ${result.processingTime}ms\n`;
      report += `  成功率: ${variationCount > 0 ? Math.round((successCount / variationCount) * 100) : 0}%\n\n`;
    });

    return report;
  }
}

// 导出单例
export const xiaohongshuProcessor = new XiaohongshuProcessor();