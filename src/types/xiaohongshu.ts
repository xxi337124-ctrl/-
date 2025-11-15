// 小红书关键词搜索响应
export interface XhsSearchResponse {
  code: number;
  cost: number;
  has_more: boolean;
  items: XhsSearchItem[];
  remain_money: number;
}

export interface XhsSearchItem {
  id: string;
  model_type: string;
  note_card?: XhsNoteCard;
  xsec_token: string;
}

export interface XhsNoteCard {
  corner_tag_info: CornerTagInfo[];
  cover: Cover;
  display_title?: string;
  image_list: ImageList[];
  interact_info: InteractInfo;
  type: string;
  user: XhsUser;
}

export interface CornerTagInfo {
  text: string;
  type: string;
}

export interface Cover {
  height: number;
  url_default: string;
  url_pre: string;
  width: number;
}

export interface ImageList {
  height: number;
  info_list: InfoList[];
  width: number;
}

export interface InfoList {
  image_scene: string;
  url: string;
}

export interface InteractInfo {
  collected: boolean;
  collected_count: string;
  comment_count: string;
  liked: boolean;
  liked_count: string;
  shared_count: string;
}

export interface XhsUser {
  avatar: string;
  nick_name: string;
  nickname: string;
  user_id: string;
  xsec_token: string;
}

// 小红书用户笔记响应
export interface XhsUserNotesResponse {
  code: number;
  cost: number;
  cursor: string;
  has_more: boolean;
  notes: XhsUserNote[];
  remain_money: number;
  tags: string[];
}

export interface XhsUserNote {
  advanced_widgets_groups: AdvancedWidgetsGroups;
  ats: string[];
  collected_count: number;
  comments_count: number;
  create_time: number;
  cursor: string;
  desc: string;
  display_title: string;
  has_music: boolean;
  id: string;
  images_list: XhsImagesList[];
  infavs: boolean;
  inlikes: boolean;
  is_goods_note: boolean;
  last_update_time: number;
  level: number;
  likes: number;
  nice_count: number;
  niced: boolean;
  price: number;
  recommend: Recommend;
  share_count: number;
  sticky: boolean;
  time_desc: string;
  title: string;
  type: string;
  user: XhsNoteUser;
  view_count: number;
  widgets_context: string;
}

export interface AdvancedWidgetsGroups {
  groups: Group[];
}

export interface Group {
  fetch_types: string[];
  mode: number;
}

export interface XhsImagesList {
  fileid: string;
  height: number;
  original: string;
  trace_id: string;
  url: string;
  url_size_large: string;
  width: number;
}

export interface Recommend {
  desc: string;
  icon: string;
  target_id: string;
  target_name: string;
  track_id: string;
  type: string;
}

export interface XhsNoteUser {
  followed: boolean;
  fstatus: string;
  images: string;
  nickname: string;
  red_official_verify_type: number;
  userid: string;
}

// 统一的文章格式（用于兼容现有系统）
export interface UnifiedArticle {
  id: string;
  title: string;
  content?: string; // 添加内容字段
  url: string;
  images: string[];
  views: number;
  likes: number;
  comments?: number;
  author?: string;
  authorAvatar?: string;
  platform: 'wechat' | 'xiaohongshu';
  createTime?: number;
}
