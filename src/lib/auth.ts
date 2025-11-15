/**
 * 认证模块
 * 提供简单的用户认证功能
 */

export interface UserSession {
  id: string;
  email: string;
  name?: string;
}

/**
 * 模拟认证函数
 * 在实际应用中，这里应该连接到真实的认证系统
 */
export async function auth(): Promise<{
  user: UserSession | null
}> {
  // 模拟认证 - 在实际应用中应该验证JWT token或session

  // 检查是否存在模拟的用户ID（用于开发测试）
  if (typeof window !== 'undefined') {
    // 客户端 - 从localStorage获取
    const mockUserId = localStorage.getItem('mock_user_id');
    const mockUserEmail = localStorage.getItem('mock_user_email');

    if (mockUserId && mockUserEmail) {
      return {
        user: {
          id: mockUserId,
          email: mockUserEmail,
          name: localStorage.getItem('mock_user_name') || 'Test User'
        }
      };
    }
  }

  // 默认返回一个模拟用户（用于API测试）
  return {
    user: {
      id: 'test-user-123',
      email: 'test@example.com',
      name: 'Test User'
    }
  };
}

/**
 * 模拟登录函数
 */
export async function signIn(email: string, password: string): Promise<{
  success: boolean;
  user?: UserSession;
  error?: string;
}> {
  // 模拟登录验证
  if (email === 'test@example.com' && password === 'password') {
    const user = {
      id: 'test-user-123',
      email: email,
      name: 'Test User'
    };

    // 在客户端存储模拟用户信息
    if (typeof window !== 'undefined') {
      localStorage.setItem('mock_user_id', user.id);
      localStorage.setItem('mock_user_email', user.email);
      localStorage.setItem('mock_user_name', user.name);
    }

    return { success: true, user };
  }

  return { success: false, error: 'Invalid credentials' };
}

/**
 * 模拟登出函数
 */
export async function signOut(): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('mock_user_id');
    localStorage.removeItem('mock_user_email');
    localStorage.removeItem('mock_user_name');
  }
}

/**
 * 获取当前用户信息
 */
export function getCurrentUser(): UserSession | null {
  if (typeof window !== 'undefined') {
    const userId = localStorage.getItem('mock_user_id');
    const userEmail = localStorage.getItem('mock_user_email');
    const userName = localStorage.getItem('mock_user_name');

    if (userId && userEmail) {
      return {
        id: userId,
        email: userEmail,
        name: userName || 'Test User'
      };
    }
  }

  // 返回默认测试用户
  return {
    id: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User'
  };
}

/**
 * 检查用户是否已认证
 */
export function isAuthenticated(): boolean {
  const user = getCurrentUser();
  return user !== null;
}

/**
 * 中间件函数 - 用于API路由保护
 */
export async function requireAuth() {
  const { user } = await auth();

  if (!user) {
    throw new Error('未授权访问');
  }

  return user;
}

/**
 * 生成模拟用户（用于测试）
 */
export function createMockUser(overrides?: Partial<UserSession>): UserSession {
  const defaultUser: UserSession = {
    id: 'mock-user-' + Date.now(),
    email: 'mock@example.com',
    name: 'Mock User'
  };

  return { ...defaultUser, ...overrides };
}