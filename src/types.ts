export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  language: 'en' | 'hi' | 'bn';
  role?: 'farmer' | 'admin' | 'agronomist';
  farmName?: string;
  location?: string;
  cropsMonitored?: number;
  onboarded: boolean;
  createdAt: string;
  lastLoginAt?: string;
  updatedAt?: string;
}

export interface Farm {
  id: string;
  userId: string;
  name: string;
  location: string;
  sizeAcres?: number;
  createdAt: string;
}

export interface Crop {
  id: string;
  farmId: string;
  userId: string;
  name: string;
  cropType: string;
  variety?: string;
  field: string;
  location?: string;
  plantingDate: string;
  notes?: string;
  imageUrl?: string;
  status: 'active' | 'archived' | 'harvested';
  currentHealthScore: number;
  currentRiskLevel: 'low' | 'moderate' | 'elevated' | 'high';
  createdAt: string;
  updatedAt: string;
  totalScans?: number;
  latestScan?: CropScan;
  activeRisksCount?: number;
  trend?: 'improving' | 'stable' | 'declining';
  scoreDiff?: number;
}

export interface CropScan {
  id: string;
  cropId: string;
  userId: string;
  imageUrl: string;
  timestamp: string;
  healthScore: number;
  condition: string;
  primaryCondition?: string;
  severity: 'none' | 'low' | 'moderate' | 'high' | 'critical';
  riskLevel: 'low' | 'moderate' | 'elevated' | 'high' | 'stable' | 'monitoring_required' | 'increasing' | 'high_risk';
  confidence: number;
  qualityScore?: 'low' | 'moderate' | 'high';
  qualityNotes?: string;
  imageQuality?: {
    usable: boolean;
    issues: string[];
    notes: string;
  };
  cropMatch?: {
    matchesSelectedCrop: boolean;
    detectedCrop: string;
  };
  symptoms: string[];
  observations: string[];
  recommendations: string[];
  explanation: string;
  cropName?: string;
  cropType?: string;
  field?: string;
  modelUsed?: string;
  rawAiResponse?: any;
}

export interface HealthTimelineEntry {
  id: string;
  cropId: string;
  date: string;
  healthScore: number;
  statusLabel: string;
  scanId?: string;
  notes?: string;
}

export interface RiskEvent {
  id: string;
  cropId: string;
  userId: string;
  scanId?: string;
  title: string;
  description: string;
  riskLevel: 'low' | 'moderate' | 'elevated' | 'high';
  severity: 'low' | 'moderate' | 'high' | 'critical';
  recommendation?: string;
  date: string;
  resolved: boolean;
}

export interface AIConversation {
  id: string;
  userId: string;
  cropId?: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIMessage {
  id: string;
  conversationId: string;
  userId?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  contextData?: any;
  timestamp: string;
}

export interface InvestigationStep {
  step: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  detail?: string;
}

export interface AgentInvestigation {
  id: string;
  userId: string;
  cropId: string;
  request: string;
  steps: InvestigationStep[];
  finding: string;
  metrics: {
    startScore: number;
    currentScore: number;
    scoreChange: number;
    daysSpan: number;
    scansEvaluated: number;
    trend: 'improving' | 'stable' | 'declining';
    riskLevel: 'low' | 'moderate' | 'elevated' | 'high';
    confidence: string;
  };
  date: string;
}

export interface Report {
  id: string;
  userId: string;
  cropId: string;
  cropName: string;
  farmName: string;
  farmerName: string;
  title: string;
  dateRange: string;
  healthScore: number;
  healthTrend: string;
  summary: string;
  observations: string[];
  risks: string[];
  recommendations: string[];
  disclaimer: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  cropId?: string;
  type: 'trend_alert' | 'emerging_risk' | 'reminder' | 'scan_complete';
  title: string;
  message: string;
  date: string;
  read: boolean;
}

export type ViewState =
  | 'landing'
  | 'dashboard'
  | 'crops'
  | 'crop-detail'
  | 'scan'
  | 'history'
  | 'assistant'
  | 'agent'
  | 'risks'
  | 'reports';
