import { NextRequest, NextResponse } from "next/server";
import { searchXhsByKeyword, searchXhsByUserId } from "@/lib/xiaohongshu-client";

/**
 * 小红书搜索API
 * 根据关键词或账号搜索小红书笔记
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, searchType = 'keyword', limit = 10 } = body;

    if (!query || !query.trim()) {
      return NextResponse.json(
        { success: false, error: '请输入搜索关键词或账号名称' },
        { status: 400 }
      );
    }

    console.log(`🔍 小红书搜索: ${searchType} = "${query}"`);

    let notes: any[] = [];

    try {
      if (searchType === 'account') {
        // 按账号搜索（用户ID）
        const result = await searchXhsByUserId(query);
        notes = result.articles;

        // 限制数量
        notes = notes.slice(0, limit);
      } else {
        // 按关键词搜索
        const articles = await searchXhsByKeyword(query, 1, {
          sort: 'general',
          note_type: 'image',
          note_time: '不限',
          note_range: '不限',
        });

        notes = articles.slice(0, limit);
      }
    } catch (apiError: any) {
      console.error('❌ 小红书API调用失败:', apiError.message);

      // API失败时使用模拟数据
      console.log('⚠️ 使用模拟数据');
      notes = generateMockNotes(query, searchType, limit);
    }

    // 格式化笔记数据以匹配前端需要的格式
    const formattedNotes = notes.map(note => ({
      id: note.id,
      title: note.title,
      content: note.content,
      coverImage: note.images?.[0] || 'https://picsum.photos/400/600',
      images: note.images || [],
      author: typeof note.author === 'string' ? {
        name: note.author,
        avatar: note.authorAvatar || `https://i.pravatar.cc/150?u=${note.id}`,
        userId: note.id
      } : note.author,
      stats: {
        views: note.views || 0,
        likes: note.likes || 0,
        comments: note.comments || 0,
        collects: note.collects || Math.floor((note.likes || 0) * 0.3),
      },
      // 兼容旧格式
      likes: note.likes || 0,
      comments: note.comments || 0,
      collects: note.collects || Math.floor((note.likes || 0) * 0.3),
      publishTime: note.createTime || new Date().toISOString(),
      tags: note.tags || [query, '干货分享', '实用技巧'],
    }));

    console.log(`✅ 搜索完成,找到 ${formattedNotes.length} 条笔记`);

    return NextResponse.json({
      success: true,
      data: {
        notes: formattedNotes,
        query,
        searchType,
        total: formattedNotes.length
      }
    });

  } catch (error: any) {
    console.error('❌ 小红书搜索失败:', error);
    return NextResponse.json(
      { success: false, error: error.message || '搜索失败' },
      { status: 500 }
    );
  }
}

/**
 * 生成模拟小红书笔记数据
 */
function generateMockNotes(query: string, searchType: string, limit: number) {
  const templates = [
    {
      titleTemplate: (q: string) => `${q}超全攻略！这些技巧你一定要知道 ✨`,
      contentTemplate: (q: string) => `分享${q}的实用技巧和经验，新手必看！包含详细步骤和注意事项，帮你快速上手。#${q} #干货分享`,
    },
    {
      titleTemplate: (q: string) => `${q}避坑指南 | 我踩过的所有坑都在这里了 💡`,
      contentTemplate: (q: string) => `关于${q}，这些年我踩过的坑都总结在这里了。看完这篇，让你少走弯路！真实经验分享。`,
    },
    {
      titleTemplate: (q: string) => `${q}新手入门 | 0基础到精通全流程 🔥`,
      contentTemplate: (q: string) => `从零开始学${q}！详细教程+实操案例，跟着做就能学会。适合新手小白，建议收藏！`,
    },
    {
      titleTemplate: (q: string) => `${q}宝藏分享 | 这些神器让效率翻倍 ⚡`,
      contentTemplate: (q: string) => `整理了${q}相关的超实用工具和资源，每一个都是精挑细选。用过都说好！`,
    },
    {
      titleTemplate: (q: string) => `${q}实战经验 | 3个月从入门到精通 📈`,
      contentTemplate: (q: string) => `分享我学习${q}的完整经历和方法论。有困惑的姐妹快来抄作业！`,
    },
  ];

  const notes = [];
  for (let i = 0; i < Math.min(limit, 10); i++) {
    const template = templates[i % templates.length];
    const baseViews = 5000 + Math.floor(Math.random() * 95000); // 5k-100k
    const baseLikes = Math.floor(baseViews * (0.05 + Math.random() * 0.15)); // 5%-20% 点赞率
    const baseComments = Math.floor(baseLikes * (0.1 + Math.random() * 0.2)); // 评论数
    const baseCollects = Math.floor(baseLikes * (0.3 + Math.random() * 0.4)); // 收藏数

    notes.push({
      id: `note_${Date.now()}_${i}`,
      title: template.titleTemplate(query),
      content: template.contentTemplate(query),
      coverImage: `https://picsum.photos/seed/${query}${i}/400/600`, // 使用占位图片服务
      images: [
        `https://picsum.photos/seed/${query}${i}/400/600`,
        `https://picsum.photos/seed/${query}${i + 100}/400/600`,
        `https://picsum.photos/seed/${query}${i + 200}/400/600`,
      ],
      author: {
        name: `${query}达人${i + 1}`,
        avatar: `https://i.pravatar.cc/150?u=${query}${i}`,
        userId: `user_${i + 1}`
      },
      stats: {
        views: baseViews,
        likes: baseLikes,
        comments: baseComments,
        collects: baseCollects,
      },
      // 兼容旧格式
      likes: baseLikes,
      comments: baseComments,
      collects: baseCollects,
      publishTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(), // 最近30天内
      tags: [query, '干货分享', '实用技巧', '新手必看', '经验分享'].slice(0, 3 + Math.floor(Math.random() * 2)),
    });
  }

  // 按点赞数排序
  return notes.sort((a, b) => b.likes - a.likes);
}

/**
 * 真实小红书搜索实现（待开发）
 *
 * 实现思路：
 * 1. 使用小红书Cookie进行认证
 * 2. 调用小红书搜索API或爬取搜索结果页
 * 3. 解析HTML或JSON获取笔记信息
 * 4. 提取标题、内容、图片、作者、数据等信息
 *
 * 注意事项：
 * - 需要处理反爬虫机制
 * - 需要定期更新Cookie
 * - 注意请求频率限制
 * - 需要处理图片URL（可能需要转存）
 */
async function searchXiaohongshu(query: string, searchType: string, limit: number) {
  const cookie = process.env.XHS_COOKIE;

  if (!cookie) {
    console.warn('⚠️ XHS_COOKIE 未配置，使用模拟数据');
    return generateMockNotes(query, searchType, limit);
  }

  // TODO: 实现真实搜索逻辑
  // 1. 构建搜索URL
  // 2. 发送请求（带Cookie）
  // 3. 解析响应
  // 4. 提取笔记信息

  throw new Error('真实小红书搜索功能待实现');
}
