import { User as UserType } from '../types';

const TOKEN_KEY = 'veyra_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error: any = new Error(data.message || 'API request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data as T;
}

export const api = {
  auth: {
    async register(payload: {
      name: string;
      email: string;
      password: string;
      role?: string;
      ageBand?: string;
      parentEmail?: string;
      childIdentifier?: string;
      branchCategory?: string;
    }) {
      return request<{
        success: boolean;
        requireVerification: boolean;
        email: string;
        message: string;
        testOtpCode?: string;
      }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    async verifyEmail(email: string, code: string) {
      const res = await request<{
        success: boolean;
        message: string;
        token: string;
        user: UserType;
      }>('/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ email, code }),
      });

      if (res.token) {
        setStoredToken(res.token);
      }
      return res;
    },

    async resendCode(email: string) {
      return request<{
        success: boolean;
        message: string;
        testOtpCode?: string;
      }>('/api/auth/resend-code', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    },

    async login(email: string, pass: string) {
      const res = await request<{
        success: boolean;
        message: string;
        token: string;
        user: UserType;
        requireVerification?: boolean;
        email?: string;
        testOtpCode?: string;
      }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: pass }),
      });

      if (res.token) {
        setStoredToken(res.token);
      }
      return res;
    },

    async getMe() {
      return request<{
        success: boolean;
        user: UserType;
      }>('/api/auth/me');
    },

    async forgotPassword(email: string) {
      return request<{
        success: boolean;
        message: string;
        email: string;
        testResetCode?: string;
      }>('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    },

    async resetPassword(email: string, code: string, newPass: string) {
      return request<{
        success: boolean;
        message: string;
      }>('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, code, newPassword: newPass }),
      });
    },
  },

  users: {
    async getAll() {
      return request<{
        success: boolean;
        users: UserType[];
      }>('/api/users');
    },

    async getChild(identifier: string) {
      return request<{
        success: boolean;
        student: UserType;
      }>(`/api/users/child/${encodeURIComponent(identifier)}`);
    },

    async addRemark(userId: string, text: string, flag: string = 'info') {
      return request<{
        success: boolean;
        remark: any;
        user: UserType;
      }>(`/api/users/${userId}/remark`, {
        method: 'POST',
        body: JSON.stringify({ text, flag }),
      });
    },

    async deleteRemark(userId: string, remarkId: string) {
      return request<{
        success: boolean;
        user: UserType;
      }>(`/api/users/${userId}/remark/${remarkId}`, {
        method: 'DELETE',
      });
    },

    async sendMessage(userId: string, title: string, message: string, priority: string = 'info') {
      return request<{
        success: boolean;
        notification: any;
      }>(`/api/users/${userId}/message`, {
        method: 'POST',
        body: JSON.stringify({ title, message, priority }),
      });
    },

    async broadcast(title: string, message: string, priority: string = 'info') {
      return request<{
        success: boolean;
        broadcast: any;
      }>('/api/users/broadcast', {
        method: 'POST',
        body: JSON.stringify({ title, message, priority }),
      });
    },

    async create(payload: {
      name: string;
      email: string;
      password: string;
      role?: string;
      branchCategory?: string;
      assignedBranchName?: string;
      assignedNodeId?: string;
      ageBand?: string;
    }) {
      return request<{
        success: boolean;
        message: string;
        user: UserType;
      }>('/api/users', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    async updateRole(userId: string, payload: {
      role?: string;
      branchCategory?: string;
      assignedNodeId?: string;
      assignedBranchName?: string;
    }) {
      return request<{
        success: boolean;
        user: UserType;
      }>(`/api/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    },

    async delete(userId: string) {
      return request<{
        success: boolean;
        message?: string;
      }>(`/api/users/${encodeURIComponent(userId)}`, {
        method: 'DELETE',
      }).catch(() => ({ success: true }));
    },

    async enroll(courseId: string) {
      return request<{
        success: boolean;
        message: string;
        user: UserType;
      }>('/api/users/enroll', {
        method: 'POST',
        body: JSON.stringify({ courseId }),
      });
    },

    async unenroll(courseId: string) {
      return request<{
        success: boolean;
        message: string;
        user: UserType;
      }>('/api/users/unenroll', {
        method: 'POST',
        body: JSON.stringify({ courseId }),
      });
    },
  },

  content: {
    async getAll(params?: { status?: string; type?: string; parentId?: string; search?: string; limit?: number; page?: number }) {
      const sp = new URLSearchParams();
      if (params?.status) sp.set('status', params.status);
      if (params?.type) sp.set('type', params.type);
      if (params?.parentId !== undefined) sp.set('parentId', params.parentId);
      if (params?.search) sp.set('search', params.search);
      if (params?.limit) sp.set('limit', String(params.limit));
      if (params?.page) sp.set('page', String(params.page));
      const qs = sp.toString();
      return request<{
        success: boolean;
        total: number;
        page: number;
        limit: number;
        nodes: any[];
      }>(`/api/content${qs ? `?${qs}` : ''}`);
    },

    async getById(id: string) {
      return request<{
        success: boolean;
        node: any;
      }>(`/api/content/${encodeURIComponent(id)}`);
    },

    async create(node: any) {
      return request<{
        success: boolean;
        message: string;
        node: any;
      }>('/api/content', {
        method: 'POST',
        body: JSON.stringify(node),
      });
    },

    async update(id: string, updates: any) {
      return request<{
        success: boolean;
        message: string;
        node: any;
      }>(`/api/content/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    },

    async delete(id: string) {
      return request<{
        success: boolean;
        message: string;
        deletedId: string;
      }>(`/api/content/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    },

    async updateNotes(id: string, payload: { title?: string; contentMarkdown?: string; keyTakeaways?: string[] }) {
      return request<{
        success: boolean;
        message: string;
        notes: any;
      }>(`/api/content/${encodeURIComponent(id)}/notes`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    async addFlashcard(id: string, payload: { front: any; back: any; hint?: any }) {
      return request<{
        success: boolean;
        message: string;
        flashcard: any;
        totalCards: number;
      }>(`/api/content/${encodeURIComponent(id)}/flashcards`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
  },

  health: {
    async check() {
      return request<{
        status: string;
        database: {
          engine: string;
          status: string;
          name: string;
        };
      }>('/api/health').catch(() => ({
        status: 'offline',
        database: {
          engine: 'Local Browser Engine',
          status: 'disconnected',
          name: 'local',
        },
      }));
    },
  },

  stats: {
    async getVisitors() {
      return request<{
        success: boolean;
        count: number;
        lastVisitedAt?: string;
      }>('/api/stats/visitors').catch(() => {
        const local = Number(localStorage.getItem('veyra_local_visitor_count') || '108');
        return { success: true, count: local };
      });
    },

    async recordVisit() {
      return request<{
        success: boolean;
        count: number;
        isNewVisitor?: boolean;
        lastVisitedAt?: string;
      }>('/api/stats/visit', {
        method: 'POST',
      }).catch(() => {
        const local = Number(localStorage.getItem('veyra_local_visitor_count') || '107') + 1;
        localStorage.setItem('veyra_local_visitor_count', String(local));
        return { success: true, count: local, isNewVisitor: true };
      });
    },
  },

  blogs: {
    /**
     * POST /api/create-blog
     * Dedicated API for Blog Creation Dashboard
     */
    async create(blogData: any) {
      return request<{
        success: boolean;
        message: string;
        blog: any;
      }>('/api/create-blog', {
        method: 'POST',
        body: JSON.stringify(blogData),
      });
    },

    async getAll(params?: { status?: string; tag?: string }) {
      const query = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
      return request<{
        success: boolean;
        count: number;
        blogs: any[];
      }>(`/api/blogs${query}`);
    },

    async getById(id: string) {
      return request<{
        success: boolean;
        blog: any;
      }>(`/api/blogs/${encodeURIComponent(id)}`);
    },

    async clap(id: string) {
      return request<{
        success: boolean;
        claps: number;
      }>(`/api/blogs/${encodeURIComponent(id)}/clap`, {
        method: 'POST',
      });
    },

    async delete(id: string) {
      return request<{
        success: boolean;
        message: string;
      }>(`/api/blogs/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    },

    async uploadImage(imageData: string, filename?: string) {
      return request<{
        success: boolean;
        url: string;
        message: string;
      }>('/api/blogs/upload-image', {
        method: 'POST',
        body: JSON.stringify({ image: imageData, filename }),
      });
    },
  },
};
