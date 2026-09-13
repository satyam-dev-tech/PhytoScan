import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface User {
  id: string;
  email: string;
  passwordHash?: string;
  name: string;
  avatar?: string;
  language: 'en' | 'hi' | 'bn';
  onboarded: boolean;
  createdAt: string;
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
}

export interface CropScan {
  id: string;
  cropId: string;
  userId: string;
  imageUrl: string;
  timestamp: string;
  healthScore: number;
  condition: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  riskLevel: 'stable' | 'monitoring_required' | 'increasing' | 'high_risk';
  confidence: number;
  symptoms: string[];
  observations: string[];
  recommendations: string[];
  explanation: string;
  modelMeta?: {
    model: string;
    tokensUsed?: number;
    latencyMs?: number;
  };
}

export interface ScanAnalysis {
  id: string;
  scanId: string;
  qualityScore: 'good' | 'moderate' | 'low_quality' | 'unusable';
  qualityNotes?: string;
  detectedLeavesCount?: number;
  rawJson?: string;
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

export interface DatabaseSchema {
  users: User[];
  farms: Farm[];
  crops: Crop[];
  scans: CropScan[];
  analyses: ScanAnalysis[];
  healthTimeline: HealthTimelineEntry[];
  riskEvents: RiskEvent[];
  conversations: AIConversation[];
  messages: AIMessage[];
  investigations: AgentInvestigation[];
  reports: Report[];
  notifications: Notification[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

class Database {
  private data: DatabaseSchema = {
    users: [],
    farms: [],
    crops: [],
    scans: [],
    analyses: [],
    healthTimeline: [],
    riskEvents: [],
    conversations: [],
    messages: [],
    investigations: [],
    reports: [],
    notifications: []
  };

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = { ...this.data, ...JSON.parse(raw) };
      } else {
        this.save();
      }
    } catch (err) {
      console.error('Failed to load database.json, initializing fresh schema', err);
      this.save();
    }
  }

  public save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database.json', err);
    }
  }

  // --- USERS ---
  findUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  findUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  createUser(user: Omit<User, 'id' | 'createdAt'>): User {
    const newUser: User = {
      ...user,
      id: 'usr_' + crypto.randomUUID().slice(0, 12),
      createdAt: new Date().toISOString()
    };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  findOrCreateFirebaseUser(uid: string, email: string, name?: string, avatar?: string): User {
    let existing = this.data.users.find(u => u.id === uid || (email && u.email && u.email.toLowerCase() === email.toLowerCase()));
    if (existing) {
      if (existing.id !== uid) {
        existing.id = uid;
      }
      if (name && (!existing.name || existing.name === 'Phytoscan Farmer')) {
        existing.name = name;
      }
      if (avatar && !existing.avatar) {
        existing.avatar = avatar;
      }
      this.save();
      return existing;
    }

    const newUser: User = {
      id: uid,
      email: email || `${uid}@phytoscan.ai`,
      name: name || 'Phytoscan Farmer',
      avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(uid)}`,
      language: 'en',
      onboarded: false,
      createdAt: new Date().toISOString()
    };
    this.data.users.push(newUser);

    // Note: Do NOT auto-seed fake demo farm or crops into authenticated accounts.
    // New users must start with a clean zero-data state.

    this.save();
    return newUser;
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const user = this.findUserById(id);
    if (!user) return undefined;
    Object.assign(user, updates);
    this.save();
    return user;
  }

  // --- FARMS ---
  getFarmsByUser(userId: string): Farm[] {
    return this.data.farms.filter(f => f.userId === userId);
  }

  getFarmById(id: string): Farm | undefined {
    return this.data.farms.find(f => f.id === id);
  }

  createFarm(farm: Omit<Farm, 'id' | 'createdAt'>): Farm {
    const newFarm: Farm = {
      ...farm,
      id: 'farm_' + crypto.randomUUID().slice(0, 12),
      createdAt: new Date().toISOString()
    };
    this.data.farms.push(newFarm);
    this.save();
    return newFarm;
  }

  // --- CROPS ---
  getCropsByUser(userId: string): Crop[] {
    return this.data.crops.filter(c => c.userId === userId);
  }

  getCropById(id: string): Crop | undefined {
    return this.data.crops.find(c => c.id === id);
  }

  createCrop(crop: Omit<Crop, 'id' | 'createdAt' | 'updatedAt'>): Crop {
    const newCrop: Crop = {
      ...crop,
      id: 'crop_' + crypto.randomUUID().slice(0, 12),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.crops.push(newCrop);

    this.save();
    return newCrop;
  }

  updateCrop(id: string, updates: Partial<Crop>): Crop | undefined {
    const crop = this.getCropById(id);
    if (!crop) return undefined;
    Object.assign(crop, updates, { updatedAt: new Date().toISOString() });
    this.save();
    return crop;
  }

  deleteCrop(id: string): boolean {
    const idx = this.data.crops.findIndex(c => c.id === id);
    if (idx === -1) return false;
    this.data.crops.splice(idx, 1);
    // Cascade delete associated records
    this.data.scans = this.data.scans.filter(s => s.cropId !== id);
    this.data.healthTimeline = this.data.healthTimeline.filter(h => h.cropId !== id);
    this.data.riskEvents = this.data.riskEvents.filter(r => r.cropId !== id);
    this.data.investigations = this.data.investigations.filter(i => i.cropId !== id);
    this.save();
    return true;
  }

  // --- SCANS ---
  getScansByCrop(cropId: string): CropScan[] {
    return this.data.scans
      .filter(s => s.cropId === cropId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  getScansByUser(userId: string): CropScan[] {
    return this.data.scans
      .filter(s => s.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  getScanById(id: string): CropScan | undefined {
    return this.data.scans.find(s => s.id === id);
  }

  createScan(scan: Omit<CropScan, 'id'>, qualityAnalysis?: Omit<ScanAnalysis, 'id' | 'scanId'>): CropScan {
    const newScan: CropScan = {
      ...scan,
      id: 'scan_' + crypto.randomUUID().slice(0, 12)
    };
    this.data.scans.push(newScan);

    if (qualityAnalysis) {
      this.data.analyses.push({
        id: 'ana_' + crypto.randomUUID().slice(0, 12),
        scanId: newScan.id,
        ...qualityAnalysis
      });
    }

    // Auto-update crop current health score and current risk level
    const crop = this.getCropById(scan.cropId);
    if (crop) {
      const prevScore = crop.currentHealthScore;
      crop.currentHealthScore = scan.healthScore;
      crop.currentRiskLevel =
        scan.riskLevel === 'high_risk' ? 'high' :
        scan.riskLevel === 'increasing' ? 'elevated' :
        scan.riskLevel === 'monitoring_required' ? 'moderate' : 'low';
      crop.updatedAt = new Date().toISOString();

      // Add to timeline
      this.data.healthTimeline.push({
        id: 'hl_' + crypto.randomUUID().slice(0, 12),
        cropId: crop.id,
        date: scan.timestamp,
        healthScore: scan.healthScore,
        statusLabel: scan.condition,
        scanId: newScan.id,
        notes: scan.explanation.slice(0, 120) + (scan.explanation.length > 120 ? '...' : '')
      });

      // If health score dropped significantly, generate risk event and notification
      const scoreDiff = scan.healthScore - prevScore;
      if (scoreDiff <= -8 || scan.riskLevel === 'increasing' || scan.riskLevel === 'high_risk') {
        const riskEvent: RiskEvent = {
          id: 'risk_' + crypto.randomUUID().slice(0, 12),
          cropId: crop.id,
          userId: crop.userId,
          scanId: newScan.id,
          title: `Health Decline Observed: ${scan.condition}`,
          description: `Score dropped by ${Math.abs(scoreDiff)} points to ${scan.healthScore}/100. Symptoms: ${scan.symptoms.join(', ')}`,
          riskLevel: scan.riskLevel === 'high_risk' ? 'high' : 'elevated',
          severity: scan.severity,
          date: new Date().toISOString(),
          resolved: false
        };
        this.data.riskEvents.push(riskEvent);

        this.data.notifications.push({
          id: 'notif_' + crypto.randomUUID().slice(0, 12),
          userId: crop.userId,
          cropId: crop.id,
          type: 'trend_alert',
          title: `Health Alert: ${crop.name}`,
          message: `${crop.name} health score decreased by ${Math.abs(scoreDiff)} points. Monitoring recommended.`,
          date: new Date().toISOString(),
          read: false
        });
      }
    }

    this.save();
    return newScan;
  }

  // --- TIMELINE ---
  getTimelineByCrop(cropId: string): HealthTimelineEntry[] {
    return this.data.healthTimeline
      .filter(h => h.cropId === cropId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  // --- RISKS ---
  getRisksByUser(userId: string): RiskEvent[] {
    return this.data.riskEvents
      .filter(r => r.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  getRisksByCrop(cropId: string): RiskEvent[] {
    return this.data.riskEvents
      .filter(r => r.cropId === cropId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // --- CONVERSATIONS & CHAT ---
  getConversationsByUser(userId: string): AIConversation[] {
    return this.data.conversations
      .filter(c => c.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  getConversationById(id: string): AIConversation | undefined {
    return this.data.conversations.find(c => c.id === id);
  }

  createConversation(userId: string, title: string, cropId?: string): AIConversation {
    const conv: AIConversation = {
      id: 'conv_' + crypto.randomUUID().slice(0, 12),
      userId,
      cropId,
      title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.conversations.unshift(conv);
    this.save();
    return conv;
  }

  getMessagesByConversation(conversationId: string): AIMessage[] {
    return this.data.messages
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  addMessage(msg: Omit<AIMessage, 'id' | 'timestamp'>): AIMessage {
    const newMsg: AIMessage = {
      ...msg,
      id: 'msg_' + crypto.randomUUID().slice(0, 12),
      timestamp: new Date().toISOString()
    };
    this.data.messages.push(newMsg);

    const conv = this.getConversationById(msg.conversationId);
    if (conv) {
      conv.updatedAt = new Date().toISOString();
    }

    this.save();
    return newMsg;
  }

  // --- INVESTIGATIONS ---
  getInvestigationsByUser(userId: string): AgentInvestigation[] {
    return this.data.investigations
      .filter(i => i.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  createInvestigation(inv: Omit<AgentInvestigation, 'id' | 'date'>): AgentInvestigation {
    const newInv: AgentInvestigation = {
      ...inv,
      id: 'inv_' + crypto.randomUUID().slice(0, 12),
      date: new Date().toISOString()
    };
    this.data.investigations.unshift(newInv);
    this.save();
    return newInv;
  }

  // --- REPORTS ---
  getReportsByUser(userId: string): Report[] {
    return this.data.reports
      .filter(r => r.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getReportById(id: string): Report | undefined {
    return this.data.reports.find(r => r.id === id);
  }

  createReport(report: Omit<Report, 'id' | 'createdAt'>): Report {
    const newReport: Report = {
      ...report,
      id: 'rep_' + crypto.randomUUID().slice(0, 12),
      createdAt: new Date().toISOString()
    };
    this.data.reports.unshift(newReport);
    this.save();
    return newReport;
  }

  // --- NOTIFICATIONS ---
  getNotificationsByUser(userId: string): Notification[] {
    return this.data.notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  markNotificationAsRead(id: string): boolean {
    const n = this.data.notifications.find(item => item.id === id);
    if (!n) return false;
    n.read = true;
    this.save();
    return true;
  }

  markAllNotificationsRead(userId: string): void {
    this.data.notifications.forEach(n => {
      if (n.userId === userId) n.read = true;
    });
    this.save();
  }

  // --- DEMO SEEDER ---
  seedDemoFarm(userId: string): { farm: Farm; crops: Crop[] } {
    // Check if user already has farm
    let farm = this.data.farms.find(f => f.userId === userId);
    if (!farm) {
      farm = this.createFarm({
        userId,
        name: 'Verdant Horizon Agro',
        location: 'Salinas Valley, CA',
        sizeAcres: 120
      });
    }

    // Tomato Field A (with historical memory: 94 -> 87 -> 74 -> 68 as in prompt specifications!)
    const tomatoCrop = this.createCrop({
      farmId: farm.id,
      userId,
      name: 'Tomato Field A',
      cropType: 'Tomato',
      variety: 'Roma VF',
      field: 'Field A - Section 3',
      location: 'Salinas Valley Plot 4',
      plantingDate: '2026-08-01',
      notes: 'Monitored for early blight susceptibility during humid mornings. Drip irrigated.',
      imageUrl: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=800&q=80',
      status: 'active',
      currentHealthScore: 68,
      currentRiskLevel: 'moderate'
    });

    // Clear auto-created timeline so we can add exact historical scans
    this.data.healthTimeline = this.data.healthTimeline.filter(h => h.cropId !== tomatoCrop.id);

    // 4 Historical Scans for Tomato Field A
    const day1Date = '2026-08-20T10:00:00.000Z';
    const day7Date = '2026-08-27T10:30:00.000Z';
    const day14Date = '2026-09-03T11:15:00.000Z';
    const day21Date = '2026-09-10T09:45:00.000Z';

    const scan1: CropScan = {
      id: 'scan_tom_01',
      cropId: tomatoCrop.id,
      userId,
      imageUrl: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=800&q=80',
      timestamp: day1Date,
      healthScore: 94,
      condition: 'Healthy Vegetative State',
      severity: 'low',
      riskLevel: 'stable',
      confidence: 0.95,
      symptoms: ['None detected', 'Uniform foliage pigmentation'],
      observations: ['Vigorous canopy growth', 'Optimal chlorophyll density', 'No fungal spotting'],
      recommendations: ['Maintain current irrigation schedule', 'Routine scout in 7 days'],
      explanation: 'Foliage shows vibrant cell turgidity and no evidence of pathogenic stress.'
    };

    const scan2: CropScan = {
      id: 'scan_tom_02',
      cropId: tomatoCrop.id,
      userId,
      imageUrl: 'https://images.unsplash.com/photo-1594489428504-5c0c480a15fd?auto=format&fit=crop&w=800&q=80',
      timestamp: day7Date,
      healthScore: 87,
      condition: 'Early Symptom Emergence',
      severity: 'low',
      riskLevel: 'monitoring_required',
      confidence: 0.86,
      symptoms: ['Faint chlorotic micro-speckling on lower leaf margins'],
      observations: ['Minor moisture retention in lower canopy', 'Targeted spot inspection needed'],
      recommendations: ['Inspect lower leaf underside for fungal mycelium', 'Reduce morning leaf wetness duration'],
      explanation: 'Subtle lower leaf chlorosis observed; likely early foliar adaptation or initial fungal spore germination.'
    };

    const scan3: CropScan = {
      id: 'scan_tom_03',
      cropId: tomatoCrop.id,
      userId,
      imageUrl: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=800&q=80',
      timestamp: day14Date,
      healthScore: 74,
      condition: 'Possible Early Blight (Alternaria solani)',
      severity: 'moderate',
      riskLevel: 'increasing',
      confidence: 0.78,
      symptoms: ['Concentric ring brown lesions', 'Chlorotic halo around lesions on lower leaves'],
      observations: ['Pathogen spread advancing upward by 1 node', 'Leaf margin curling detected'],
      recommendations: ['Apply preventive copper-based or bio-fungicide', 'Prune lower leaves touching wet soil'],
      explanation: 'Concentric ring brown lesions strongly suggest early blight progression. Risk is increasing due to ambient humidity.'
    };

    const scan4: CropScan = {
      id: 'scan_tom_04',
      cropId: tomatoCrop.id,
      userId,
      imageUrl: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=800&q=80',
      timestamp: day21Date,
      healthScore: 68,
      condition: 'Progressing Early Blight — Monitoring Required',
      severity: 'moderate',
      riskLevel: 'increasing',
      confidence: 0.84,
      symptoms: ['Multiple concentric lesions', 'Premature senescent leaf drop', 'Mild stem collar speckling'],
      observations: ['Canopy density reduced by ~12%', 'Active spore propagation risk'],
      recommendations: ['Conduct targeted bio-fungicide treatment', 'Isolate affected rows during cultivation', 'Re-scan in 48 hours'],
      explanation: 'Symptom severity has intensified with leaf shedding on primary lower tiers. Continuous monitoring required.'
    };

    this.data.scans.push(scan1, scan2, scan3, scan4);

    // Timeline for Tomato Field A
    this.data.healthTimeline.push(
      { id: 'hl_tom_1', cropId: tomatoCrop.id, date: day1Date, healthScore: 94, statusLabel: 'Healthy', scanId: scan1.id, notes: 'Day 1 scan: Vigorous, healthy foliage.' },
      { id: 'hl_tom_2', cropId: tomatoCrop.id, date: day7Date, healthScore: 87, statusLabel: 'Early Symptoms', scanId: scan2.id, notes: 'Day 7 scan: Minor chlorotic speckling observed.' },
      { id: 'hl_tom_3', cropId: tomatoCrop.id, date: day14Date, healthScore: 74, statusLabel: 'Risk Increasing', scanId: scan3.id, notes: 'Day 14 scan: Concentric lesions indicate early blight.' },
      { id: 'hl_tom_4', cropId: tomatoCrop.id, date: day21Date, healthScore: 68, statusLabel: 'Monitoring Required', scanId: scan4.id, notes: 'Day 21 scan: Moderate progression, requires intervention.' }
    );

    // Risk Event for Tomato Field A
    this.data.riskEvents.push({
      id: 'risk_tom_01',
      cropId: tomatoCrop.id,
      userId,
      scanId: scan4.id,
      title: 'Progressive Early Blight Alert',
      description: 'Tomato Field A has experienced a 26-point decline across 21 days (94 → 68). Repeated concentric ring lesions observed.',
      riskLevel: 'elevated',
      severity: 'moderate',
      date: day21Date,
      resolved: false
    });

    // Second crop: Wheat North Acre (Healthy, Stable 88/100)
    const wheatCrop = this.createCrop({
      farmId: farm.id,
      userId,
      name: 'Wheat North Acre',
      cropType: 'Wheat',
      variety: 'Hard Red Winter',
      field: 'North Acre Field 1',
      location: 'Northern Terrace',
      plantingDate: '2026-07-15',
      notes: 'Heading stage. Excellent tiller development, optimal soil nitrogen levels.',
      imageUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=800&q=80',
      status: 'active',
      currentHealthScore: 88,
      currentRiskLevel: 'low'
    });

    const scanWheat: CropScan = {
      id: 'scan_wht_01',
      cropId: wheatCrop.id,
      userId,
      imageUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=800&q=80',
      timestamp: '2026-09-08T08:00:00.000Z',
      healthScore: 88,
      condition: 'Optimal Canopy Development',
      severity: 'low',
      riskLevel: 'stable',
      confidence: 0.92,
      symptoms: ['Minimal tip desiccation on older leaves'],
      observations: ['Robust flag leaf emergence', 'Uniform spikelet development', 'No rust pustules detected'],
      recommendations: ['Monitor soil moisture during grain filling', 'Re-scan in 10 days'],
      explanation: 'Healthy wheat stand with stable nitrogen assimilation and no rust or mildew pathogen traces.'
    };
    this.data.scans.push(scanWheat);

    // Third crop: Bell Pepper Greenhouse (High Health 92/100)
    const pepperCrop = this.createCrop({
      farmId: farm.id,
      userId,
      name: 'Bell Pepper Greenhouse',
      cropType: 'Bell Pepper',
      variety: 'California Wonder',
      field: 'Greenhouse B',
      location: 'Climate Zone 2',
      plantingDate: '2026-08-10',
      notes: 'Controlled environment agriculture. High relative humidity management.',
      imageUrl: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=800&q=80',
      status: 'active',
      currentHealthScore: 92,
      currentRiskLevel: 'low'
    });

    const scanPepper: CropScan = {
      id: 'scan_pep_01',
      cropId: pepperCrop.id,
      userId,
      imageUrl: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=800&q=80',
      timestamp: '2026-09-11T14:20:00.000Z',
      healthScore: 92,
      condition: 'Optimal Vegetative Stage',
      severity: 'low',
      riskLevel: 'stable',
      confidence: 0.94,
      symptoms: ['None'],
      observations: ['Strong stem calyx structure', 'Deep green pigmentation', 'Zero aphid or mite presence'],
      recommendations: ['Continue balanced fertigation', 'Maintain greenhouse humidity below 75%'],
      explanation: 'Greenhouse peppers exhibit outstanding vigor and balanced nutritional development.'
    };
    this.data.scans.push(scanPepper);

    // Seed Sample Report
    this.createReport({
      userId,
      cropId: tomatoCrop.id,
      cropName: tomatoCrop.name,
      farmName: farm.name,
      farmerName: 'Lead Agronomist',
      title: 'Phytoscan Health Diagnostic & Trend Report — Tomato Field A',
      dateRange: 'Aug 20, 2026 – Sep 10, 2026 (21 Days)',
      healthScore: 68,
      healthTrend: 'Declining (-26 pts over 21 days)',
      summary: 'Continuous 21-day timeline surveillance indicates a progressive shift from healthy baseline (94/100) to moderate early blight pathogen stress (68/100). Concentric fungal lesions identified.',
      observations: [
        'Initial chlorosis first surfaced at Day 7 on lower canopy leaves.',
        'Concentric brown ring lesions appeared at Day 14 (confidence 78%).',
        'By Day 21, approximately 12% foliar leaf drop was observed.'
      ],
      risks: [
        'High likelihood of upward canopy migration if relative morning humidity persists above 85%.',
        'Secondary bacterial soft rot risk during fruiting stage.'
      ],
      recommendations: [
        'Administer copper-hydroxide or registered organic bio-fungicide immediately.',
        'Prune lower 6 inches of foliage to limit splash dispersal of soilborne spores.',
        'Transition from overhead watering to localized drip irrigation.'
      ],
      disclaimer: 'Phytoscan provides AI-assisted educational and crop-monitoring insights. It does not replace qualified agricultural expertise or laboratory tissue testing.'
    });

    // Seed Notifications
    this.data.notifications.push(
      {
        id: 'notif_demo_1',
        userId,
        cropId: tomatoCrop.id,
        type: 'trend_alert',
        title: 'Health Trend Changed: Tomato Field A',
        message: 'Tomato Field A health score decreased by 6 points (74 → 68). Monitoring required.',
        date: day21Date,
        read: false
      },
      {
        id: 'notif_demo_2',
        userId,
        cropId: tomatoCrop.id,
        type: 'emerging_risk',
        title: 'Emerging Risk Detected',
        message: 'Repeated possible early blight symptoms were observed across 3 consecutive scans.',
        date: day14Date,
        read: false
      },
      {
        id: 'notif_demo_3',
        userId,
        cropId: wheatCrop.id,
        type: 'reminder',
        title: 'Monitoring Reminder',
        message: 'Wheat North Acre is due for its weekly flag-leaf inspection scan.',
        date: new Date().toISOString(),
        read: true
      }
    );

    this.save();
    return { farm, crops: [tomatoCrop, wheatCrop, pepperCrop] };
  }
}

export const db = new Database();
