import type {
  XhsSearchResponse,
  XhsUserNotesResponse,
  UnifiedArticle,
} from "@/types/xiaohongshu";

const XHS_API_BASE = "https://www.dajiala.com/fbmain/monitor/v3/xhs";
const XHS_API_KEY = process.env.DAJIALA_API_KEY || "";

/**
 * 小红书关键词搜索
 */
export async function searchXhsByKeyword(
  keyword: string,
  page: number = 1,
  options: {
    sort?: "general" | "popularity_descending" | "time_descending";
    note_type?: "image" | "video" | "all";
    note_time?: "不限" | "近一周" | "近一月" | "近三月";
    note_range?: "不限" | "10w+" | "1w+";
  } = {}
): Promise<UnifiedArticle[]> {
  const {
    sort = "general",
    note_type = "image",
    note_time = "不限",
    note_range = "不限",
  } = options;

  const response = await fetch(XHS_API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      key: XHS_API_KEY,
      type: 1,
      keyword,
      page,
      sort,
      note_type,
      note_time,
      note_range,
      proxy: "",
    }),
  });

  if (!response.ok) {
    throw new Error(`小红书API请求失败: ${response.statusText}`);
  }

  const data: XhsSearchResponse = await response.json();

  console.log('小红书API响应:', { code: data.code, itemCount: data.items?.length });

  // 小红书API可能返回code 0或200表示成功
  if (data.code !== 200 && data.code !== 0) {
    throw new Error(`小红书API返回错误: code ${data.code}`);
  }

  if (!data.items || data.items.length === 0) {
    console.log('小红书API返回空结果');
    return [];
  }

  // 转换为统一格式
  return data.items
    .filter((item) => item.note_card)
    .map((item) => {
      const note = item.note_card!;
      const images = note.image_list.map(
        (img) => img.info_list[0]?.url || note.cover.url_default
      );

      return {
        id: item.id,
        title: note.display_title || "无标题",
        content: note.display_title || "无标题", // 小红书笔记标题作为内容
        url: `https://www.xiaohongshu.com/explore/${item.id}`,
        images,
        views: 0, // 小红书不提供浏览量
        likes: parseInt(note.interact_info.liked_count) || 0,
        comments: parseInt(note.interact_info.comment_count) || 0,
        author: note.user.nickname || note.user.nick_name,
        authorAvatar: note.user.avatar,
        platform: "xiaohongshu" as const,
      };
    });
}

/**
 * 小红书用户笔记搜索（对标账号）
 */
export async function searchXhsByUserId(
  userId: string,
  cursor: string = ""
): Promise<{ articles: UnifiedArticle[]; nextCursor: string; hasMore: boolean }> {
  const response = await fetch(XHS_API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      key: XHS_API_KEY,
      type: 13,
      user_id: userId,
      cursor,
      proxy: "",
    }),
  });

  if (!response.ok) {
    throw new Error(`小红书API请求失败: ${response.statusText}`);
  }

  const data: XhsUserNotesResponse = await response.json();

  console.log('小红书用户笔记API响应:', { code: data.code, noteCount: data.notes?.length });

  // 小红书API可能返回code 0或200表示成功
  if (data.code !== 200 && data.code !== 0) {
    throw new Error(`小红书API返回错误: code ${data.code}`);
  }

  if (!data.notes || data.notes.length === 0) {
    console.log('用户没有笔记或返回空结果');
    return {
      articles: [],
      nextCursor: '',
      hasMore: false,
    };
  }

  // 转换为统一格式
  const articles = data.notes.map((note) => {
    const images = note.images_list.map((img) => img.url || img.url_size_large);
    const title = note.title || note.display_title || note.desc?.slice(0, 50) || "无标题";
    const content = note.desc || note.title || note.display_title || "无内容";

    return {
      id: note.id,
      title,
      content, // 使用desc作为内容
      url: `https://www.xiaohongshu.com/explore/${note.id}`,
      images,
      views: note.view_count || 0,
      likes: note.likes || note.nice_count || 0,
      comments: note.comments_count || 0,
      author: note.user.nickname,
      authorAvatar: note.user.images,
      platform: "xiaohongshu" as const,
      createTime: note.create_time,
    };
  });

  return {
    articles,
    nextCursor: data.cursor,
    hasMore: data.has_more,
  };
}
