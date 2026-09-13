import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocFromServer,
  Unsubscribe
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Crop, CropScan, RiskEvent, Report, AgentInvestigation, AIConversation, AIMessage, Notification, User } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operation: OperationType;
  path: string | null;
  authUid: string | null;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const err = error as any;
  const isPermissionError =
    err?.code === 'permission-denied' ||
    (typeof err?.message === 'string' && err.message.toLowerCase().includes('permission'));

  const authUid = auth.currentUser?.uid || null;

  if (isPermissionError) {
    const errorInfo: FirestoreErrorInfo = {
      error: `Missing or insufficient permissions: The following operation failed: ${operationType} at ${path || 'unknown'}`,
      operation: operationType,
      path,
      authUid
    };
    console.error('[Firestore Security]', errorInfo);
    throw new Error(JSON.stringify(errorInfo));
  }
  throw error;
}

// Connection test on boot as recommended by Firebase skill
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore client appears offline');
    }
    return false;
  }
}

// ==========================================
// DEMO SANDBOX IN-MEMORY DATA (ISOLATED)
// ==========================================
const DEMO_UID = 'demo_agronomist_phytoscan';

export const DEMO_FARM_DATA = {
  crop: {
    id: 'demo-tomato-field-a',
    userId: DEMO_UID,
    farmId: 'demo-farm-1',
    name: 'Tomato Field A',
    cropType: 'Tomato',
    variety: 'Roma VF',
    field: 'Sector 4B',
    location: 'Salinas Valley, CA',
    plantingDate: '2026-08-15',
    notes: 'Monitored Roma plot showing recurring morning condensation on lower leaves.',
    imageUrl: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=800&q=80',
    status: 'active' as const,
    currentHealthScore: 68,
    currentRiskLevel: 'elevated' as const,
    createdAt: '2026-08-15T08:00:00.000Z',
    updatedAt: '2026-09-05T08:00:00.000Z'
  },
  scans: [
    {
      id: 'demo-scan-1',
      cropId: 'demo-tomato-field-a',
      userId: DEMO_UID,
      imageUrl: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=800&q=80',
      timestamp: '2026-08-16T09:00:00.000Z',
      healthScore: 94,
      condition: 'Healthy Vegetative Baseline',
      severity: 'low' as const,
      riskLevel: 'stable' as const,
      confidence: 0.96,
      symptoms: ['Optimal chlorophyll distribution', 'Turgid stem posture'],
      observations: ['No pathogenic lesions observed.', 'Lush canopy vigor.'],
      recommendations: ['Maintain current drip irrigation schedule.', 'Next routine scan in 7 days.'],
      explanation: 'Baseline vegetative scan shows optimal growth metrics with 0 foliar pathogens detected.'
    },
    {
      id: 'demo-scan-2',
      cropId: 'demo-tomato-field-a',
      userId: DEMO_UID,
      imageUrl: 'https://images.unsplash.com/photo-1582284540020-8acbe03f4924?auto=format&fit=crop&w=800&q=80',
      timestamp: '2026-08-23T09:30:00.000Z',
      healthScore: 87,
      condition: 'Early Foliar Stress',
      severity: 'low' as const,
      riskLevel: 'monitoring_required' as const,
      confidence: 0.91,
      symptoms: ['Slight lower leaf chlorosis', 'Occasional necrotic pinpoint margins'],
      observations: ['Micro-spots on leaf 4 and 5 margins.', 'Airflow in center rows slightly restricted.'],
      recommendations: ['Prune dense suckers to enhance row aeration.', 'Inspect lower crown.'],
      explanation: 'Early sign of stress following consecutive humid mornings.'
    },
    {
      id: 'demo-scan-3',
      cropId: 'demo-tomato-field-a',
      userId: DEMO_UID,
      imageUrl: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=800&q=80',
      timestamp: '2026-08-30T10:00:00.000Z',
      healthScore: 74,
      condition: 'Alternaria solani (Early Blight) Initiation',
      severity: 'moderate' as const,
      riskLevel: 'increasing' as const,
      confidence: 0.94,
      symptoms: ['Concentric brownish rings', 'Target-like chlorotic halos'],
      observations: ['Lower third canopy displays distinct target rings.', 'Sporulation risk elevated by dew.'],
      recommendations: ['Apply preventive copper hydroxide fungicide.', 'Strictly avoid overhead sprinkler use.'],
      explanation: 'Characteristic concentric target spot progression confirms early blight onset.'
    },
    {
      id: 'demo-scan-4',
      cropId: 'demo-tomato-field-a',
      userId: DEMO_UID,
      imageUrl: 'https://images.unsplash.com/photo-1582284540020-8acbe03f4924?auto=format&fit=crop&w=800&q=80',
      timestamp: '2026-09-05T11:15:00.000Z',
      healthScore: 68,
      condition: 'Active Early Blight Expansion',
      severity: 'moderate' as const,
      riskLevel: 'high_risk' as const,
      confidence: 0.95,
      symptoms: ['Expanding target lesions >8mm', 'Lower foliage senescence'],
      observations: ['25% of lower foliage affected.', 'Spread arrested from upper fruit trusses.'],
      recommendations: ['Perform targeted leaf sanitation.', 'Continue biological bacillus subtilis treatment.'],
      explanation: 'Consecutive trajectory confirms 94 → 87 → 74 → 68 decline requiring immediate intervention.'
    }
  ],
  risks: [
    {
      id: 'demo-risk-1',
      cropId: 'demo-tomato-field-a',
      userId: DEMO_UID,
      title: 'Active Early Blight Escalation',
      description: 'Concentric target spots have expanded across 25% of lower foliage in Tomato Field A.',
      riskLevel: 'elevated' as const,
      severity: 'moderate' as const,
      recommendation: 'Remove symptomatic bottom foliage and apply targeted bio-fungicide before rain event.',
      date: '2026-09-05',
      resolved: false
    }
  ],
  conversation: {
    id: 'demo-conv-1',
    userId: DEMO_UID,
    title: 'Tomato Field A Health Decline Review',
    cropId: 'demo-tomato-field-a',
    createdAt: '2026-09-05T12:00:00.000Z',
    updatedAt: '2026-09-05T12:05:00.000Z'
  },
  messages: [
    {
      id: 'demo-msg-1',
      conversationId: 'demo-conv-1',
      userId: DEMO_UID,
      role: 'user' as const,
      content: 'Why did my Tomato Field A health score drop from 94 to 68 over the past 21 days?',
      timestamp: '2026-09-05T12:00:00.000Z'
    },
    {
      id: 'demo-msg-2',
      conversationId: 'demo-conv-1',
      userId: DEMO_UID,
      role: 'assistant' as const,
      content: 'Based on your 4 consecutive scans in **Tomato Field A**, your crop experienced an active early blight progression caused by *Alternaria solani*:\n\n• **Day 1 (Score 94):** Baseline vigor was optimal with zero lesions.\n• **Day 7 (Score 87):** Mild lower leaf chlorosis appeared due to elevated morning leaf wetness.\n• **Day 14 (Score 74):** Distinct concentric brown target rings developed with chlorotic halos.\n• **Day 21 (Score 68):** Lesions expanded to >8mm across ~25% of lower canopy.\n\n**Actionable Advice:** Prune and safely discard all infected bottom leaves, avoid overhead watering, and apply a copper-based protectant or *Bacillus subtilis* to safeguard developing fruit trusses.',
      timestamp: '2026-09-05T12:01:00.000Z'
    }
  ]
};

// ==========================================
// USER PROFILE PERSISTENCE (FIRESTORE)
// ==========================================
export async function getOrCreateUserProfile(
  uid: string,
  email: string,
  name?: string,
  avatar?: string
): Promise<User> {
  const path = `users/${uid}`;
  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);

    if (snap.exists()) {
      const data = snap.data();
      // Returning user: update lastLoginAt without overwriting createdAt or resetting onboarded
      const updatedProfile: Partial<User> = {
        lastLoginAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      if (name && (!data.name || data.name === 'Phytoscan Farmer')) {
        updatedProfile.name = name;
      }
      if (avatar && !data.avatar) {
        updatedProfile.avatar = avatar;
      }
      await updateDoc(userDocRef, updatedProfile);
      return {
        id: uid,
        email: data.email || email,
        name: data.name || name || 'Phytoscan Farmer',
        avatar: data.avatar || avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(uid)}`,
        role: data.role || 'farmer',
        farmName: data.farmName,
        location: data.location,
        language: data.language || 'en',
        cropsMonitored: data.cropsMonitored || 0,
        onboarded: data.onboarded === true,
        createdAt: data.createdAt || new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };
    } else {
      // Brand new user: fresh zero-data account profile
      const newUser: User = {
        id: uid,
        email,
        name: name || 'Phytoscan Farmer',
        avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(uid)}`,
        role: 'farmer',
        language: 'en',
        cropsMonitored: 0,
        onboarded: false,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };
      await setDoc(userDocRef, {
        ...newUser,
        updatedAt: new Date().toISOString()
      });
      return newUser;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function updateUserProfile(uid: string, updates: Partial<User>): Promise<void> {
  const path = `users/${uid}`;
  try {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ==========================================
// CROPS (USER SCOPED)
// ==========================================
export async function getUserCrops(uid: string): Promise<Crop[]> {
  if (uid === DEMO_UID) {
    return [DEMO_FARM_DATA.crop];
  }
  const path = 'crops';
  try {
    const q = query(
      collection(db, 'crops'),
      where('userId', '==', uid)
    );
    const querySnapshot = await getDocs(q);
    const crops: Crop[] = [];
    querySnapshot.forEach(docSnap => {
      crops.push({ id: docSnap.id, ...(docSnap.data() as any) });
    });
    return crops.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export function subscribeUserCrops(uid: string, callback: (crops: Crop[]) => void): Unsubscribe {
  if (uid === DEMO_UID) {
    callback([DEMO_FARM_DATA.crop]);
    return () => {};
  }
  const q = query(
    collection(db, 'crops'),
    where('userId', '==', uid)
  );
  return onSnapshot(
    q,
    snapshot => {
      const crops: Crop[] = [];
      snapshot.forEach(docSnap => {
        crops.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      crops.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      callback(crops);
    },
    error => {
      console.warn('[Firestore] Crops listener error:', error);
      callback([]);
    }
  );
}

export async function createCropInFirestore(cropData: Omit<Crop, 'id'>, uid: string): Promise<Crop> {
  const path = 'crops';
  try {
    const newCropData = {
      ...cropData,
      userId: uid,
      createdAt: cropData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, 'crops'), newCropData);
    return {
      id: docRef.id,
      ...newCropData
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

export async function updateCropInFirestore(cropId: string, updates: Partial<Crop>, uid: string): Promise<void> {
  const path = `crops/${cropId}`;
  try {
    const cropRef = doc(db, 'crops', cropId);
    await updateDoc(cropRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateCropHealthMemoryInFirestore(
  cropId: string,
  newHealthScore: number,
  uid: string,
  previousScore = 0,
  previousScansCount = 0
): Promise<void> {
  const path = `crops/${cropId}`;
  try {
    let currentRiskLevel: 'low' | 'moderate' | 'elevated' | 'high' = 'low';
    if (newHealthScore >= 80) currentRiskLevel = 'low';
    else if (newHealthScore >= 65) currentRiskLevel = 'moderate';
    else if (newHealthScore >= 50) currentRiskLevel = 'elevated';
    else currentRiskLevel = 'high';

    const scoreDiff = newHealthScore - previousScore;
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (scoreDiff > 2) trend = 'improving';
    else if (scoreDiff < -2) trend = 'declining';

    const cropRef = doc(db, 'crops', cropId);
    await updateDoc(cropRef, {
      currentHealthScore: newHealthScore,
      currentRiskLevel,
      lastScanDate: new Date().toISOString(),
      totalScans: previousScansCount + 1,
      trend,
      scoreDiff,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteCropFromFirestore(cropId: string, uid: string): Promise<void> {
  const path = `crops/${cropId}`;
  try {
    await deleteDoc(doc(db, 'crops', cropId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ==========================================
// SCANS (USER SCOPED)
// ==========================================
export async function getUserScans(uid: string, cropId?: string): Promise<CropScan[]> {
  if (uid === DEMO_UID) {
    return cropId ? DEMO_FARM_DATA.scans.filter(s => s.cropId === cropId) : DEMO_FARM_DATA.scans;
  }
  const path = 'scans';
  try {
    const constraints: any[] = [where('userId', '==', uid)];
    if (cropId) {
      constraints.push(where('cropId', '==', cropId));
    }
    const q = query(collection(db, 'scans'), ...constraints);
    const querySnapshot = await getDocs(q);
    const scans: CropScan[] = [];
    querySnapshot.forEach(docSnap => {
      scans.push({ id: docSnap.id, ...(docSnap.data() as any) });
    });
    return scans.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export function subscribeUserScans(uid: string, callback: (scans: CropScan[]) => void, cropId?: string): Unsubscribe {
  if (uid === DEMO_UID) {
    callback(cropId ? DEMO_FARM_DATA.scans.filter(s => s.cropId === cropId) : DEMO_FARM_DATA.scans);
    return () => {};
  }
  const constraints: any[] = [where('userId', '==', uid)];
  if (cropId) {
    constraints.push(where('cropId', '==', cropId));
  }
  const q = query(collection(db, 'scans'), ...constraints);
  return onSnapshot(
    q,
    snapshot => {
      const scans: CropScan[] = [];
      snapshot.forEach(docSnap => {
        scans.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      scans.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      callback(scans);
    },
    error => {
      console.warn('[Firestore] Scans listener error:', error);
      callback([]);
    }
  );
}

export async function createScanInFirestore(scanData: Omit<CropScan, 'id'>, uid: string): Promise<CropScan> {
  const path = 'scans';
  try {
    const newScanData = {
      ...scanData,
      userId: uid,
      timestamp: scanData.timestamp || new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, 'scans'), newScanData);
    return {
      id: docRef.id,
      ...newScanData
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

// ==========================================
// RISK EVENTS (USER SCOPED)
// ==========================================
export async function getUserRiskEvents(uid: string, cropId?: string): Promise<RiskEvent[]> {
  if (uid === DEMO_UID) {
    return cropId ? DEMO_FARM_DATA.risks.filter(r => r.cropId === cropId) : DEMO_FARM_DATA.risks;
  }
  const path = 'riskEvents';
  try {
    const constraints: any[] = [where('userId', '==', uid)];
    if (cropId) {
      constraints.push(where('cropId', '==', cropId));
    }
    const q = query(collection(db, 'riskEvents'), ...constraints);
    const querySnapshot = await getDocs(q);
    const risks: RiskEvent[] = [];
    querySnapshot.forEach(docSnap => {
      risks.push({ id: docSnap.id, ...(docSnap.data() as any) });
    });
    return risks.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function createRiskEventInFirestore(eventData: Omit<RiskEvent, 'id'>, uid: string): Promise<RiskEvent> {
  const path = 'riskEvents';
  try {
    const newRisk = {
      ...eventData,
      userId: uid,
      date: eventData.date || new Date().toISOString().split('T')[0]
    };
    const docRef = await addDoc(collection(db, 'riskEvents'), newRisk);
    return {
      id: docRef.id,
      ...newRisk
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

// ==========================================
// REPORTS (USER SCOPED)
// ==========================================
export async function getUserReports(uid: string, cropId?: string): Promise<Report[]> {
  if (uid === DEMO_UID) {
    return [];
  }
  const path = 'reports';
  try {
    const constraints: any[] = [where('userId', '==', uid)];
    if (cropId) {
      constraints.push(where('cropId', '==', cropId));
    }
    const q = query(collection(db, 'reports'), ...constraints);
    const querySnapshot = await getDocs(q);
    const reports: Report[] = [];
    querySnapshot.forEach(docSnap => {
      reports.push({ id: docSnap.id, ...(docSnap.data() as any) });
    });
    return reports.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function createReportInFirestore(reportData: Omit<Report, 'id'>, uid: string): Promise<Report> {
  const path = 'reports';
  try {
    const newReport = {
      ...reportData,
      userId: uid,
      createdAt: reportData.createdAt || new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, 'reports'), newReport);
    return {
      id: docRef.id,
      ...newReport
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

// ==========================================
// INVESTIGATIONS (USER SCOPED)
// ==========================================
export async function getUserInvestigations(uid: string, cropId?: string): Promise<AgentInvestigation[]> {
  if (uid === DEMO_UID) {
    return [];
  }
  const path = 'investigations';
  try {
    const constraints: any[] = [where('userId', '==', uid)];
    if (cropId) {
      constraints.push(where('cropId', '==', cropId));
    }
    const q = query(collection(db, 'investigations'), ...constraints);
    const querySnapshot = await getDocs(q);
    const investigations: AgentInvestigation[] = [];
    querySnapshot.forEach(docSnap => {
      investigations.push({ id: docSnap.id, ...(docSnap.data() as any) });
    });
    return investigations.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function createInvestigationInFirestore(
  invData: Omit<AgentInvestigation, 'id'>,
  uid: string
): Promise<AgentInvestigation> {
  const path = 'investigations';
  try {
    const newInv = {
      ...invData,
      userId: uid,
      date: invData.date || new Date().toISOString().split('T')[0]
    };
    const docRef = await addDoc(collection(db, 'investigations'), newInv);
    return {
      id: docRef.id,
      ...newInv
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

// ==========================================
// AI CONVERSATIONS & MESSAGES (USER SCOPED)
// ==========================================
export async function getUserConversations(uid: string): Promise<AIConversation[]> {
  if (uid === DEMO_UID) {
    return [DEMO_FARM_DATA.conversation];
  }
  const path = 'conversations';
  try {
    const q = query(
      collection(db, 'conversations'),
      where('userId', '==', uid)
    );
    const querySnapshot = await getDocs(q);
    const convs: AIConversation[] = [];
    querySnapshot.forEach(docSnap => {
      convs.push({ id: docSnap.id, ...(docSnap.data() as any) });
    });
    return convs.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export function subscribeUserConversations(uid: string, callback: (convs: AIConversation[]) => void): Unsubscribe {
  if (uid === DEMO_UID) {
    callback([DEMO_FARM_DATA.conversation]);
    return () => {};
  }
  const q = query(
    collection(db, 'conversations'),
    where('userId', '==', uid)
  );
  return onSnapshot(
    q,
    snapshot => {
      const convs: AIConversation[] = [];
      snapshot.forEach(docSnap => {
        convs.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      convs.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
      callback(convs);
    },
    error => {
      console.warn('[Firestore] Conversations listener error:', error);
      callback([]);
    }
  );
}

export async function createConversationInFirestore(
  title: string,
  uid: string,
  cropId?: string
): Promise<AIConversation> {
  const path = 'conversations';
  try {
    const now = new Date().toISOString();
    const convData = {
      userId: uid,
      title,
      cropId: cropId || null,
      createdAt: now,
      updatedAt: now
    };
    const docRef = await addDoc(collection(db, 'conversations'), convData);
    return {
      id: docRef.id,
      ...convData,
      cropId: convData.cropId || undefined
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

export async function getConversationMessages(conversationId: string, uid: string): Promise<AIMessage[]> {
  if (uid === DEMO_UID && conversationId === DEMO_FARM_DATA.conversation.id) {
    return DEMO_FARM_DATA.messages;
  }
  const path = 'messages';
  try {
    const q = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      where('userId', '==', uid)
    );
    const querySnapshot = await getDocs(q);
    const msgs: AIMessage[] = [];
    querySnapshot.forEach(docSnap => {
      msgs.push({ id: docSnap.id, ...(docSnap.data() as any) });
    });
    return msgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export function subscribeConversationMessages(
  conversationId: string,
  uid: string,
  callback: (messages: AIMessage[]) => void
): Unsubscribe {
  if (uid === DEMO_UID && conversationId === DEMO_FARM_DATA.conversation.id) {
    callback(DEMO_FARM_DATA.messages);
    return () => {};
  }
  const q = query(
    collection(db, 'messages'),
    where('conversationId', '==', conversationId),
    where('userId', '==', uid)
  );
  return onSnapshot(
    q,
    snapshot => {
      const msgs: AIMessage[] = [];
      snapshot.forEach(docSnap => {
        msgs.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      msgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      callback(msgs);
    },
    error => {
      console.warn('[Firestore] Messages listener error:', error);
      callback([]);
    }
  );
}

export async function addMessageInFirestore(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  uid: string
): Promise<AIMessage> {
  const path = 'messages';
  try {
    const timestamp = new Date().toISOString();
    const msgData = {
      conversationId,
      userId: uid,
      role,
      content,
      timestamp
    };
    const docRef = await addDoc(collection(db, 'messages'), msgData);

    // Update conversation updatedAt
    try {
      await updateDoc(doc(db, 'conversations', conversationId), {
        updatedAt: timestamp
      });
    } catch {
      // Ignore if conversation doc update fails
    }

    return {
      id: docRef.id,
      ...msgData
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

// ==========================================
// NOTIFICATIONS (USER SCOPED)
// ==========================================
export async function getUserNotifications(uid: string): Promise<Notification[]> {
  if (uid === DEMO_UID) {
    return [];
  }
  const path = 'notifications';
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', uid)
    );
    const querySnapshot = await getDocs(q);
    const notifs: Notification[] = [];
    querySnapshot.forEach(docSnap => {
      notifs.push({ id: docSnap.id, ...(docSnap.data() as any) });
    });
    return notifs.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function markNotificationReadInFirestore(notificationId: string, uid: string): Promise<void> {
  const path = `notifications/${notificationId}`;
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      read: true
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
