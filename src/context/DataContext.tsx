import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Crop, CropScan, RiskEvent, Report, AgentInvestigation, AIConversation, AIMessage, Notification } from '../types';
import { useAuth } from './AuthContext';
import {
  getUserCrops,
  getUserScans,
  getUserRiskEvents,
  getUserReports,
  getUserInvestigations,
  getUserConversations,
  getConversationMessages,
  getUserNotifications,
  createCropInFirestore,
  updateCropInFirestore,
  deleteCropFromFirestore,
  createScanInFirestore,
  createRiskEventInFirestore,
  createReportInFirestore,
  createInvestigationInFirestore,
  createConversationInFirestore,
  addMessageInFirestore,
  markNotificationReadInFirestore,
  subscribeUserCrops,
  subscribeUserScans,
  subscribeUserConversations,
  DEMO_FARM_DATA
} from '../lib/firestoreService';
import { Unsubscribe } from 'firebase/firestore';

interface DataContextType {
  crops: Crop[];
  scans: CropScan[];
  risks: RiskEvent[];
  reports: Report[];
  investigations: AgentInvestigation[];
  conversations: AIConversation[];
  notifications: Notification[];
  isRestoring: boolean;
  refreshData: () => Promise<void>;
  addCrop: (cropData: Omit<Crop, 'id'>) => Promise<Crop>;
  updateCrop: (cropId: string, updates: Partial<Crop>) => Promise<void>;
  deleteCrop: (cropId: string) => Promise<void>;
  addScan: (scanData: Omit<CropScan, 'id'>) => Promise<CropScan>;
  addRiskEvent: (riskData: Omit<RiskEvent, 'id'>) => Promise<RiskEvent>;
  addReport: (reportData: Omit<Report, 'id'>) => Promise<Report>;
  addInvestigation: (invData: Omit<AgentInvestigation, 'id'>) => Promise<AgentInvestigation>;
  createConversation: (title: string, cropId?: string) => Promise<AIConversation>;
  addMessage: (conversationId: string, role: 'user' | 'assistant', content: string) => Promise<AIMessage>;
  getMessages: (conversationId: string) => Promise<AIMessage[]>;
  markNotificationRead: (notificationId: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isDemoMode } = useAuth();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [scans, setScans] = useState<CropScan[]>([]);
  const [risks, setRisks] = useState<RiskEvent[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [investigations, setInvestigations] = useState<AgentInvestigation[]>([]);
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);

  const activeSubscriptions = useRef<Unsubscribe[]>([]);
  const activeUserIdRef = useRef<string | null>(null);

  const clearSubscriptions = () => {
    activeSubscriptions.current.forEach(unsub => {
      try {
        unsub();
      } catch (err) {
        console.warn('Unsubscribe error:', err);
      }
    });
    activeSubscriptions.current = [];
  };

  const loadAllUserData = useCallback(async (uid: string) => {
    setIsRestoring(true);
    try {
      if (isDemoMode || uid === 'demo_agronomist_phytoscan') {
        setCrops([DEMO_FARM_DATA.crop]);
        setScans(DEMO_FARM_DATA.scans);
        setRisks(DEMO_FARM_DATA.risks);
        setReports([]);
        setInvestigations([]);
        setConversations([DEMO_FARM_DATA.conversation]);
        setNotifications([]);
      } else {
        // Load strictly from Cloud Firestore scoped to this UID
        const [
          userCrops,
          userScans,
          userRisks,
          userReports,
          userInvestigations,
          userConversations,
          userNotifications
        ] = await Promise.all([
          getUserCrops(uid),
          getUserScans(uid),
          getUserRiskEvents(uid),
          getUserReports(uid),
          getUserInvestigations(uid),
          getUserConversations(uid),
          getUserNotifications(uid)
        ]);

        // Guard against race conditions if user changed while loading
        if (activeUserIdRef.current === uid) {
          setCrops(userCrops);
          setScans(userScans);
          setRisks(userRisks);
          setReports(userReports);
          setInvestigations(userInvestigations);
          setConversations(userConversations);
          setNotifications(userNotifications);
        }
      }
    } catch (err) {
      console.error('[DataContext] Error restoring user data:', err);
    } finally {
      if (activeUserIdRef.current === uid) {
        setIsRestoring(false);
      }
    }
  }, [isDemoMode]);

  // Auth State & User Change Lifecycle
  useEffect(() => {
    const currentUid = user?.id || null;
    activeUserIdRef.current = currentUid;

    // Clear prior listeners
    clearSubscriptions();

    if (!isAuthenticated || !currentUid) {
      // User logged out: clear all transient state immediately
      setCrops([]);
      setScans([]);
      setRisks([]);
      setReports([]);
      setInvestigations([]);
      setConversations([]);
      setNotifications([]);
      setIsRestoring(false);
      return;
    }

    // Returning or new user authenticated
    loadAllUserData(currentUid);

    // Set up real-time subscriptions if not demo mode
    if (!isDemoMode && currentUid !== 'demo_agronomist_phytoscan') {
      const unsubCrops = subscribeUserCrops(currentUid, updatedCrops => {
        if (activeUserIdRef.current === currentUid) {
          setCrops(updatedCrops);
        }
      });
      const unsubScans = subscribeUserScans(currentUid, updatedScans => {
        if (activeUserIdRef.current === currentUid) {
          setScans(updatedScans);
        }
      });
      const unsubConversations = subscribeUserConversations(currentUid, updatedConvs => {
        if (activeUserIdRef.current === currentUid) {
          setConversations(updatedConvs);
        }
      });

      activeSubscriptions.current = [unsubCrops, unsubScans, unsubConversations];
    }

    return () => {
      clearSubscriptions();
    };
  }, [user?.id, isAuthenticated, isDemoMode, loadAllUserData]);

  const refreshData = async () => {
    if (activeUserIdRef.current) {
      await loadAllUserData(activeUserIdRef.current);
    }
  };

  const addCrop = async (cropData: Omit<Crop, 'id'>): Promise<Crop> => {
    const uid = activeUserIdRef.current;
    if (!uid) throw new Error('Not authenticated');

    if (isDemoMode) {
      const newCrop: Crop = {
        id: `demo-${Date.now()}`,
        ...cropData
      };
      setCrops(prev => [newCrop, ...prev]);
      return newCrop;
    }

    const createdCrop = await createCropInFirestore(cropData, uid);
    setCrops(prev => [createdCrop, ...prev.filter(c => c.id !== createdCrop.id)]);
    return createdCrop;
  };

  const updateCrop = async (cropId: string, updates: Partial<Crop>): Promise<void> => {
    const uid = activeUserIdRef.current;
    if (!uid) return;

    if (isDemoMode) {
      setCrops(prev => prev.map(c => (c.id === cropId ? { ...c, ...updates } : c)));
      return;
    }

    await updateCropInFirestore(cropId, updates, uid);
    setCrops(prev => prev.map(c => (c.id === cropId ? { ...c, ...updates } : c)));
  };

  const deleteCrop = async (cropId: string): Promise<void> => {
    const uid = activeUserIdRef.current;
    if (!uid) return;

    if (isDemoMode) {
      setCrops(prev => prev.filter(c => c.id !== cropId));
      return;
    }

    await deleteCropFromFirestore(cropId, uid);
    setCrops(prev => prev.filter(c => c.id !== cropId));
  };

  const addScan = async (scanData: Omit<CropScan, 'id'>): Promise<CropScan> => {
    const uid = activeUserIdRef.current;
    if (!uid) throw new Error('Not authenticated');

    if (isDemoMode) {
      const newScan: CropScan = {
        id: `demo-scan-${Date.now()}`,
        ...scanData
      };
      setScans(prev => [...prev, newScan]);
      return newScan;
    }

    const createdScan = await createScanInFirestore(scanData, uid);
    setScans(prev => [...prev, createdScan]);

    // Update Crop Health Memory (Section 8)
    if (scanData.cropId && scanData.healthScore !== undefined) {
      const existingCrop = crops.find(c => c.id === scanData.cropId);
      const prevScore = existingCrop?.currentHealthScore || 0;
      const prevScansCount = scans.filter(s => s.cropId === scanData.cropId).length;

      let riskLevel: 'low' | 'moderate' | 'elevated' | 'high' = 'low';
      if (scanData.healthScore >= 80) riskLevel = 'low';
      else if (scanData.healthScore >= 65) riskLevel = 'moderate';
      else if (scanData.healthScore >= 50) riskLevel = 'elevated';
      else riskLevel = 'high';

      const scoreDiff = scanData.healthScore - prevScore;
      let trend: 'improving' | 'stable' | 'declining' = 'stable';
      if (scoreDiff > 2) trend = 'improving';
      else if (scoreDiff < -2) trend = 'declining';

      await updateCrop(scanData.cropId, {
        currentHealthScore: scanData.healthScore,
        currentRiskLevel: riskLevel,
        trend,
        scoreDiff,
        totalScans: prevScansCount + 1,
        latestScan: createdScan
      });
    }

    return createdScan;
  };

  const addRiskEvent = async (riskData: Omit<RiskEvent, 'id'>): Promise<RiskEvent> => {
    const uid = activeUserIdRef.current;
    if (!uid) throw new Error('Not authenticated');

    if (isDemoMode) {
      const newRisk: RiskEvent = {
        id: `demo-risk-${Date.now()}`,
        ...riskData
      };
      setRisks(prev => [newRisk, ...prev]);
      return newRisk;
    }

    const created = await createRiskEventInFirestore(riskData, uid);
    setRisks(prev => [created, ...prev]);
    return created;
  };

  const addReport = async (reportData: Omit<Report, 'id'>): Promise<Report> => {
    const uid = activeUserIdRef.current;
    if (!uid) throw new Error('Not authenticated');

    if (isDemoMode) {
      const newReport: Report = {
        id: `demo-report-${Date.now()}`,
        ...reportData
      };
      setReports(prev => [newReport, ...prev]);
      return newReport;
    }

    const created = await createReportInFirestore(reportData, uid);
    setReports(prev => [created, ...prev]);
    return created;
  };

  const addInvestigation = async (invData: Omit<AgentInvestigation, 'id'>): Promise<AgentInvestigation> => {
    const uid = activeUserIdRef.current;
    if (!uid) throw new Error('Not authenticated');

    if (isDemoMode) {
      const newInv: AgentInvestigation = {
        id: `demo-inv-${Date.now()}`,
        ...invData
      };
      setInvestigations(prev => [newInv, ...prev]);
      return newInv;
    }

    const created = await createInvestigationInFirestore(invData, uid);
    setInvestigations(prev => [created, ...prev]);
    return created;
  };

  const createConversation = async (title: string, cropId?: string): Promise<AIConversation> => {
    const uid = activeUserIdRef.current;
    if (!uid) throw new Error('Not authenticated');

    if (isDemoMode) {
      const newConv: AIConversation = {
        id: `demo-conv-${Date.now()}`,
        userId: uid,
        title,
        cropId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setConversations(prev => [newConv, ...prev]);
      return newConv;
    }

    const created = await createConversationInFirestore(title, uid, cropId);
    setConversations(prev => [created, ...prev.filter(c => c.id !== created.id)]);
    return created;
  };

  const addMessage = async (
    conversationId: string,
    role: 'user' | 'assistant',
    content: string
  ): Promise<AIMessage> => {
    const uid = activeUserIdRef.current;
    if (!uid) throw new Error('Not authenticated');

    if (isDemoMode) {
      return {
        id: `demo-msg-${Date.now()}`,
        conversationId,
        userId: uid,
        role,
        content,
        timestamp: new Date().toISOString()
      };
    }

    return await addMessageInFirestore(conversationId, role, content, uid);
  };

  const getMessages = async (conversationId: string): Promise<AIMessage[]> => {
    const uid = activeUserIdRef.current;
    if (!uid) return [];
    return await getConversationMessages(conversationId, uid);
  };

  const markNotificationRead = async (notificationId: string): Promise<void> => {
    const uid = activeUserIdRef.current;
    if (!uid) return;
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
    if (!isDemoMode) {
      await markNotificationReadInFirestore(notificationId, uid);
    }
  };

  return (
    <DataContext.Provider
      value={{
        crops,
        scans,
        risks,
        reports,
        investigations,
        conversations,
        notifications,
        isRestoring,
        refreshData,
        addCrop,
        updateCrop,
        deleteCrop,
        addScan,
        addRiskEvent,
        addReport,
        addInvestigation,
        createConversation,
        addMessage,
        getMessages,
        markNotificationRead
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
