// Always relative: routed through the Next.js rewrite in next.config.js so
// requests stay same-origin and wa_token lands as a same-site cookie. A
// direct cross-origin base here breaks auth in production (cookie set on
// the API's origin, never sent back to the app's origin).
const API_BASE = '';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options;

  let url = `${API_BASE}${endpoint}`;
  if (params) {
    const query = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    );
    url += `?${query.toString()}`;
  }

  const response = await fetch(url, {
    ...fetchOptions,
    credentials: 'include', // Send cookies
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(response.status, data?.message || 'Request failed', data);
  }

  return data as T;
}

// ── Auth ─────────────────────────────────────────────────────────────
export const authApi = {
  login: (username: string, password: string) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),

  register: (email: string, phone: string, password: string) =>
    request('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, phone, password }) }),

  logout: () => request('/api/auth/logout', { method: 'POST' }),

  me: () => request<{ success: boolean; data: { user: any } }>('/api/auth/me'),

  changePassword: (currentPassword: string, newPassword: string) =>
    request('/api/auth/password', { method: 'PATCH', body: JSON.stringify({ currentPassword, newPassword }) }),
  updateAISettings: (data: { apiKey?: string; geminiApiKey?: string; removeApiKey?: boolean; removeGeminiKey?: boolean; aiProvider?: 'auto' | 'openai' | 'gemini'; aiAutomationEnabled?: boolean; aiReplyEnabled?: boolean; aiOnlyReplyEnabled?: boolean; aiOwnerName?: string; aiRelationshipNotes?: string }) =>
    request<{ success: boolean; data: any }>('/api/auth/ai-settings', { method: 'PATCH', body: JSON.stringify(data) }),
  getAICreditStatus: () => request<{ success: boolean; data: { percentage: number | null; status: string; message: string } }>('/api/auth/ai-settings/credits'),
  uploadChatTraining: async (file: File, ownerName: string, chatName?: string) => {
    const body = new FormData(); body.append('file', file); body.append('ownerName', ownerName); if (chatName) body.append('chatName', chatName);
    const response = await fetch('/api/auth/ai-settings/training', { method: 'POST', credentials: 'include', body });
    const data = await response.json(); if (!response.ok) throw new ApiError(response.status, data?.message || 'Training upload failed', data);
    return data as { success: boolean; data: { imported: number; yourMessages: number } };
  },
};

// ── WhatsApp ──────────────────────────────────────────────────────────
export const whatsappApi = {
  getStatus: () => request<{ success: boolean; data: any }>('/api/whatsapp/status'),

  getQR: () => request<{ success: boolean; data: { qr: string } }>('/api/whatsapp/qr'),

  reconnect: () => request('/api/whatsapp/reconnect', { method: 'POST' }),

  logout: () => request('/api/whatsapp/logout', { method: 'POST' }),

  deleteSession: () => request('/api/whatsapp/session', { method: 'DELETE' }),
};

// ── Chats ─────────────────────────────────────────────────────────────


// ── Contacts ──────────────────────────────────────────────────────────





// ── Campaigns ─────────────────────────────────────────────────────────


// ── Send ──────────────────────────────────────────────────────────────


// ── Logs ──────────────────────────────────────────────────────────────


// ── Health ────────────────────────────────────────────────────────────
export const healthApi = {
  get: () => request<{ success: boolean; data: any }>('/api/health'),
};

// ── API Keys ──────────────────────────────────────────────────────────
export const keysApi = {
  list: () => request<{ success: boolean; data: any[] }>('/api/keys'),
  create: (name: string) => request<{ success: boolean; message: string; data: any }>('/api/keys', {
    method: 'POST',
    body: JSON.stringify({ name }),
  }),
  delete: (id: string) => request<{ success: boolean }>(`/api/keys/${id}`, { method: 'DELETE' }),
};

// ── Chatbot ─────────────────────────────────────────────────────────


// ── Chatbot Leads ─────────────────────────────────────────────────
export const chatbotLeadsApi = {
  list: (params?: { page?: number; limit?: number; domain?: string }) =>
    request<{ success: boolean; data: any[]; pagination: any }>('/api/chatbot/leads', { params }),
  reply: (id: string, text: string) =>
    request<{ success: boolean; data: any }>(`/api/chatbot/leads/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
  delete: (id: string) =>
    request<{ success: boolean }>(`/api/chatbot/leads/${id}`, { method: 'DELETE' }),
};

// ── Company Knowledge ─────────────────────────────────────────────
export const knowledgeApi = {
  list: (params?: { category?: string; status?: string; search?: string }) =>
    request<{ success: boolean; data: any[] }>('/api/chatbot/knowledge', { params }),

  create: (data: {
    title: string;
    category: string;
    content: string;
    keywords: string[];
    synonyms: string[];
    priority: number;
    status: 'active' | 'inactive';
  }) =>
    request<{ success: boolean; data: any }>('/api/chatbot/knowledge', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<{
    title: string;
    category: string;
    content: string;
    keywords: string[];
    synonyms: string[];
    priority: number;
    status: 'active' | 'inactive';
  }>) =>
    request<{ success: boolean; data: any }>(`/api/chatbot/knowledge/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<{ success: boolean }>(`/api/chatbot/knowledge/${id}`, { method: 'DELETE' }),

  test: (message: string, sessionId?: string) =>
    request<{
      success: boolean;
      data: {
        message: string;
        reply: string;
        intent: string;
        confidence: number;
        knowledgeId: string | null;
        knowledgeTitle: string | null;
        suggestions: string[];
      };
    }>('/api/chatbot/knowledge/test', {
      method: 'POST',
      body: JSON.stringify({ message, sessionId }),
    }),
};

// ── Admin ─────────────────────────────────────────────────────────



// ── Safe Mode ─────────────────────────────────────────────────────────


// ── Analytics ─────────────────────────────────────────────────────────


// ── Tabdeal Management ──────────────────────────────────────────────
export const telemetryApi = {
  getEventLogs: (params?: any) => request<{ success: boolean; data: any[]; pagination: any }>('/api/event-logs', { params }),
  getMessageLogs: (params?: any) => request<{ success: boolean; data: any[]; pagination: any }>('/api/message-logs', { params }),
  getDashboardMetrics: () => request<{ success: boolean; data: any }>('/api/dashboard/metrics'),
};

export const clientTemplatesApi = {
  list: (params?: any) => request<{ success: boolean; data: any[]; pagination: any }>('/api/client-templates', { params }),
};

export const tabdealApi = {
  // Categories
  getCategories: () => request<{ success: boolean; data: any[] }>('/api/tabdeal/categories'),
  getCategory: (id: string) => request<{ success: boolean; data: any }>(`/api/tabdeal/categories/${id}`),
  createCategory: (data: any) => request<{ success: boolean; data: any }>('/api/tabdeal/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id: string, data: any) => request<{ success: boolean; data: any }>(`/api/tabdeal/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteCategory: (id: string) => request<{ success: boolean; message: string }>(`/api/tabdeal/categories/${id}`, { method: 'DELETE' }),
  
  // Template Packs
  getTemplatePacks: () => request<{ success: boolean; data: any[] }>('/api/tabdeal/template-packs'),
  createTemplatePack: (data: any) => request<{ success: boolean; data: any }>('/api/tabdeal/template-packs', { method: 'POST', body: JSON.stringify(data) }),
  updateTemplatePack: (id: string, data: any) => request<{ success: boolean; data: any }>(`/api/tabdeal/template-packs/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  getTemplatePack: (id: string) => request<{ success: boolean; data: any }>(`/api/tabdeal/template-packs/${id}`),
  deleteTemplatePack: (id: string) => request<{ success: boolean; message: string }>(`/api/tabdeal/template-packs/${id}`, { method: 'DELETE' }),

  // Clients
  getClients: (params?: any) => request<{ success: boolean; data: any[]; pagination: any }>('/api/tabdeal/clients', { params }),
  createClient: (data: any) => request<{ success: boolean; data: any }>('/api/tabdeal/clients', { method: 'POST', body: JSON.stringify(data) }),
  getClient: (id: string) => request<{ success: boolean; data: any }>(`/api/tabdeal/clients/${id}`),
  updateClient: (id: string, data: any) => request<{ success: boolean; data: any }>(`/api/tabdeal/clients/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  updateClientStatus: (id: string, status: string) => request<{ success: boolean; data: any }>(`/api/tabdeal/clients/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // Client WhatsApp Admin
  provisionClientWhatsApp: (clientId: string) => request<{ success: boolean }>(`/api/tabdeal/clients/${clientId}/whatsapp/provision`, { method: 'POST' }),
  getClientWhatsAppQR: (clientId: string, t?: number) => request<{ success: boolean; data: { qr: string } }>(`/api/tabdeal/clients/${clientId}/whatsapp/qr`, t ? { params: { _t: t } } : undefined),
  getClientWhatsAppStatus: (clientId: string) => request<{ success: boolean; data: any }>(`/api/tabdeal/clients/${clientId}/whatsapp/status`),
  reconnectClientWhatsApp: (clientId: string) => request<{ success: boolean }>(`/api/tabdeal/clients/${clientId}/whatsapp/reconnect`, { method: 'POST' }),
  resetClientWhatsAppSession: (clientId: string) => request<{ success: boolean }>(`/api/tabdeal/clients/${clientId}/whatsapp/reset`, { method: 'POST' }),

  // Templates
  getTemplates: (params?: any) => request<{ success: boolean; data: any[]; pagination: any }>('/api/tabdeal/templates', { params }),
  createTemplate: (data: any) => request<{ success: boolean; data: any }>('/api/tabdeal/templates', { method: 'POST', body: JSON.stringify(data) }),
  getTemplate: (id: string) => request<{ success: boolean; data: any }>(`/api/tabdeal/templates/${id}`),
  updateTemplate: (id: string, data: any) => request<{ success: boolean; data: any }>(`/api/tabdeal/templates/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  updateTemplateStatus: (id: string, status: string) => request<{ success: boolean; data: any }>(`/api/tabdeal/templates/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteTemplate: (id: string) => request<{ success: boolean; message: string }>(`/api/tabdeal/templates/${id}`, { method: 'DELETE' }),

  // Client Templates
  getClientTemplates: (params?: any) => request<{ success: boolean; data: any[]; pagination: any }>('/api/tabdeal/client-templates', { params }),
  createClientTemplate: (data: any) => request<{ success: boolean; data: any }>('/api/tabdeal/client-templates', { method: 'POST', body: JSON.stringify(data) }),
  updateClientTemplate: (id: string, data: any) => request<{ success: boolean; data: any }>(`/api/tabdeal/client-templates/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // API Keys
    getClientApiKeys: (clientId: string) => request<{ success: boolean; data: any[] }>(`/api/tabdeal/clients/${clientId}/api-keys`),
    createClientApiKey: (clientId: string, name: string) => request<{ success: boolean; message: string; data: any }>(`/api/tabdeal/clients/${clientId}/api-keys`, { method: 'POST', body: JSON.stringify({ name }) }),
    deleteClientApiKey: (clientId: string, keyId: string) => request<{ success: boolean }>(`/api/tabdeal/clients/${clientId}/api-keys/${keyId}`, { method: 'DELETE' }),

    // Logs & Diagnostics
  getMessageLogs: (params?: any) => request<{ success: boolean; data: any[]; pagination: any }>('/api/tabdeal/message-logs', { params }),
  getMessageLog: (id: string) => request<{ success: boolean; data: any }>(`/api/tabdeal/message-logs/${id}`),
  getEventLogs: (params?: any) => request<{ success: boolean; data: any[]; pagination: any }>('/api/tabdeal/event-logs', { params }),
  getEventLog: (id: string) => request<{ success: boolean; data: any }>(`/api/tabdeal/event-logs/${id}`),
  getDashboardMetrics: () => request<{ success: boolean; data: any }>('/api/tabdeal/dashboard-metrics'),
};

export { ApiError, request };
