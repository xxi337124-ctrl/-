/**
 * API Keys 管理工具
 * 支持从 localStorage 读取用户配置的 API Keys
 */

interface ApiKeys {
  openrouterKey: string;
  siliconflowKey: string;
  doubaoKey: string;
  xhsCookie: string;
}

class ApiKeysManager {
  private static readonly STORAGE_KEY = "apiKeys";

  /**
   * 获取所有 API Keys
   */
  static getKeys(): ApiKeys | null {
    if (typeof window === "undefined") return null;

    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return null;

    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error("解析 API Keys 失败:", error);
      return null;
    }
  }

  /**
   * 获取 OpenRouter API Key
   */
  static getOpenRouterKey(): string {
    const keys = this.getKeys();
    return keys?.openrouterKey || process.env.OPENROUTER_API_KEY || "";
  }

  /**
   * 获取 SiliconFlow API Key
   */
  static getSiliconFlowKey(): string {
    const keys = this.getKeys();
    return keys?.siliconflowKey || process.env.SILICONFLOW_API_KEY || "";
  }

  /**
   * 获取 Doubao API Key
   */
  static getDoubaoKey(): string {
    const keys = this.getKeys();
    return keys?.doubaoKey || process.env.DOUBAO_API_KEY || "";
  }

  /**
   * 获取小红书 Cookie
   */
  static getXhsCookie(): string {
    const keys = this.getKeys();
    return keys?.xhsCookie || process.env.XHS_COOKIE || "";
  }

  /**
   * 保存 API Keys
   */
  static saveKeys(keys: ApiKeys): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(keys));
  }

  /**
   * 清除 API Keys
   */
  static clearKeys(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * 检查是否已配置所有必需的 Keys
   */
  static hasRequiredKeys(): boolean {
    return !!(
      this.getOpenRouterKey() &&
      this.getSiliconFlowKey() &&
      this.getDoubaoKey()
    );
  }

  /**
   * 获取缺失的 Keys 列表
   */
  static getMissingKeys(): string[] {
    const missing: string[] = [];
    if (!this.getOpenRouterKey()) missing.push("OpenRouter");
    if (!this.getSiliconFlowKey()) missing.push("SiliconFlow");
    if (!this.getDoubaoKey()) missing.push("Doubao");
    return missing;
  }
}

export default ApiKeysManager;
