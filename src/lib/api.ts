import {
  User,
  Farm,
  Crop,
  CropScan,
  HealthTimelineEntry,
  RiskEvent,
  AIConversation,
  AIMessage,
  AgentInvestigation,
  Report,
  Notification
} from '../types';

const TOKEN_KEY = 'phytoscan_auth_token';

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    let errorMsg = 'An error occurred';
    try {
      const data = await res.json();
      errorMsg = data.error || errorMsg;
    } catch {
      errorMsg = res.statusText || errorMsg;
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export const api = {
  // Auth
  syncFirebaseUser: async (payload: { uid: string; email?: string; name?: string; avatar?: string; language?: string }): Promise<{ user: User; farms: Farm[]; hasCrops: boolean }> => {
    return fetchWithAuth('/api/auth/firebase-sync', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  register: async (payload: { name: string; email: string; password: string; language?: string }) => {
    const data = await fetchWithAuth('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    setAuthToken(data.token);
    return data;
  },

  login: async (payload: { email: string; password: string }) => {
    const data = await fetchWithAuth('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    setAuthToken(data.token);
    return data;
  },

  googleLogin: async (payload: { email?: string; name?: string; avatar?: string }) => {
    const data = await fetchWithAuth('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    setAuthToken(data.token);
    return data;
  },

  getMe: async (): Promise<{ user: User; farms: Farm[]; hasCrops: boolean }> => {
    return fetchWithAuth('/api/auth/me');
  },

  submitOnboarding: async (payload: {
    farmerName: string;
    language: string;
    farmName: string;
    farmLocation: string;
    farmSizeAcres?: number;
    firstCrop?: {
      name: string;
      cropType: string;
      variety?: string;
      field: string;
      plantingDate?: string;
      notes?: string;
    };
  }) => {
    return fetchWithAuth('/api/auth/onboarding', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  loadDemoFarm: async () => {
    return fetchWithAuth('/api/auth/demo-farm', {
      method: 'POST'
    });
  },

  // Crops
  getCrops: async (): Promise<{ crops: Crop[]; farms: Farm[] }> => {
    return fetchWithAuth('/api/crops');
  },

  getCrop: async (id: string): Promise<{
    crop: Crop;
    farm?: Farm;
    scans: CropScan[];
    timeline: HealthTimelineEntry[];
    risks: RiskEvent[];
    metrics: {
      totalScans: number;
      daysMonitored: number;
      scoreChangeTotal: number;
      trend: 'improving' | 'stable' | 'declining';
      overallRisk: string;
    };
  }> => {
    return fetchWithAuth(`/api/crops/${id}`);
  },

  createCrop: async (payload: Partial<Crop>): Promise<Crop> => {
    return fetchWithAuth('/api/crops', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  updateCrop: async (id: string, payload: Partial<Crop>): Promise<Crop> => {
    return fetchWithAuth(`/api/crops/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  deleteCrop: async (id: string): Promise<{ success: boolean }> => {
    return fetchWithAuth(`/api/crops/${id}`, {
      method: 'DELETE'
    });
  },

  // Scans
  getScans: async (cropId?: string): Promise<CropScan[]> => {
    const query = cropId ? `?cropId=${cropId}` : '';
    return fetchWithAuth(`/api/scans${query}`);
  },

  analyzeScan: async (payload: {
    cropId: string;
    imageBase64: string;
    mimeType?: string;
    cropContext?: any;
    previousScans?: any[];
    recentRisks?: any[];
  }) => {
    return fetchWithAuth('/api/scans/analyze', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  saveScan: async (payload: {
    cropId: string;
    imageUrl: string;
    healthScore: number;
    condition: string;
    severity: string;
    riskLevel: string;
    confidence: number;
    symptoms: string[];
    observations: string[];
    recommendations: string[];
    explanation: string;
    qualityScore?: string;
    qualityNotes?: string;
    cropContext?: any;
  }): Promise<{ success: boolean; scan: CropScan; updatedCrop: Crop }> => {
    return fetchWithAuth('/api/scans/save', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  compareScans: async (previousScanId: string, currentScanId: string) => {
    return fetchWithAuth('/api/scans/compare', {
      method: 'POST',
      body: JSON.stringify({ previousScanId, currentScanId })
    });
  },

  // AI Assistant & Chat
  sendChatMessage: async (payload: {
    message: string;
    conversationId?: string;
    cropId?: string;
    language?: 'en' | 'hi' | 'bn';
    cropsContext?: any[];
    history?: any[];
  }): Promise<{ conversationId: string; message: AIMessage }> => {
    return fetchWithAuth('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  getConversations: async (): Promise<AIConversation[]> => {
    return fetchWithAuth('/api/ai/conversations');
  },

  getConversationMessages: async (id: string): Promise<{ conversation: AIConversation; messages: AIMessage[] }> => {
    return fetchWithAuth(`/api/ai/conversations/${id}/messages`);
  },

  // AI Agent
  runAgentInvestigation: async (payload: {
    cropId: string;
    request?: string;
  }): Promise<AgentInvestigation> => {
    return fetchWithAuth('/api/ai/agent/investigate', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  getPastInvestigations: async (): Promise<AgentInvestigation[]> => {
    return fetchWithAuth('/api/ai/agent/investigations');
  },

  // Reports
  getReports: async (): Promise<Report[]> => {
    return fetchWithAuth('/api/reports');
  },

  getReport: async (id: string): Promise<Report> => {
    return fetchWithAuth(`/api/reports/${id}`);
  },

  generateReport: async (cropId: string): Promise<Report> => {
    return fetchWithAuth('/api/reports/generate', {
      method: 'POST',
      body: JSON.stringify({ cropId })
    });
  },

  // Notifications
  getNotifications: async (): Promise<Notification[]> => {
    return fetchWithAuth('/api/notifications');
  },

  markNotificationRead: async (id: string) => {
    return fetchWithAuth(`/api/notifications/${id}/read`, {
      method: 'PUT'
    });
  },

  markAllNotificationsRead: async () => {
    return fetchWithAuth('/api/notifications/read-all', {
      method: 'POST'
    });
  },

  // Search
  search: async (q: string): Promise<{
    crops: Crop[];
    scans: CropScan[];
    risks: RiskEvent[];
    reports: Report[];
  }> => {
    return fetchWithAuth(`/api/search?q=${encodeURIComponent(q)}`);
  }
};
