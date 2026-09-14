import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db as firestoreDb } from '../lib/firebase';
import { User, Farm } from '../types';
import { api, setAuthToken, clearAuthToken, getAuthToken } from '../lib/api';

interface AuthContextType {
  user: User | null;
  farms: Farm[];
  isLoading: boolean;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string, lang?: string) => Promise<void>;
  googleLogin: () => Promise<void>;
  exploreDemoMode: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUserLanguage: (lang: 'en' | 'hi' | 'bn') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isDemoMode = user?.id === 'demo_agronomist_phytoscan';

  // Sync user state with Firestore and Backend
  const syncUserSession = async (firebaseUser: FirebaseUser, preferredName?: string, preferredLang?: string) => {
    try {
      const idToken = await firebaseUser.getIdToken();
      setAuthToken(idToken);

      const email = firebaseUser.email || `${firebaseUser.uid}@phytoscan.ai`;
      const name = preferredName || firebaseUser.displayName || email.split('@')[0] || 'Phytoscan Farmer';
      const avatar = firebaseUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`;
      const language = (preferredLang || 'en') as 'en' | 'hi' | 'bn';

      // 1. Persist/merge user document in Cloud Firestore
      let firestoreOnboarded = false;
      let existingCreatedAt: string | undefined;
      try {
        const userDocRef = doc(firestoreDb, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (!userDocSnap.exists()) {
          const now = new Date().toISOString();
          await setDoc(userDocRef, {
            id: firebaseUser.uid,
            email,
            name,
            avatar,
            role: 'farmer',
            farmName: `${name.split(' ')[0]}'s Farm`,
            language,
            cropsMonitored: 0,
            onboarded: false,
            createdAt: now,
            lastLoginAt: now,
            updatedAt: now
          });
          firestoreOnboarded = false;
        } else {
          const existingData = userDocSnap.data();
          firestoreOnboarded = existingData?.onboarded === true;
          existingCreatedAt = existingData?.createdAt;
          await setDoc(userDocRef, {
            lastLoginAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }, { merge: true });
        }
      } catch (firestoreErr) {
        console.warn('Firestore user profile direct sync notice:', firestoreErr);
      }

      // 2. Synchronize with server-side API (for Gemini reasoning and context)
      const data = await api.syncFirebaseUser({
        uid: firebaseUser.uid,
        email,
        name,
        avatar,
        language
      });

      setUser({
        ...data.user,
        onboarded: firestoreOnboarded || data.user.onboarded === true,
        createdAt: existingCreatedAt || data.user.createdAt
      });
      setFarms(data.farms || []);
    } catch (err) {
      console.error('Failed to sync user session:', err);
      // Fallback local state if network glitch
      setUser({
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || 'Phytoscan Farmer',
        avatar: firebaseUser.photoURL || undefined,
        language: 'en',
        onboarded: false,
        createdAt: new Date().toISOString()
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await syncUserSession(firebaseUser);
      } else {
        // Check if there is an existing guest/demo session token
        const existingToken = getAuthToken();
        if (existingToken && existingToken.startsWith('demo_')) {
          try {
            const data = await api.getMe();
            setUser(data.user);
            setFarms(data.farms || []);
          } catch {
            clearAuthToken();
            setUser(null);
            setFarms([]);
          }
        } else {
          clearAuthToken();
          setUser(null);
          setFarms([]);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshUser = async () => {
    if (auth.currentUser) {
      await syncUserSession(auth.currentUser);
    } else {
      const token = getAuthToken();
      if (!token) {
        setUser(null);
        return;
      }
      try {
        const data = await api.getMe();
        setUser(data.user);
        setFarms(data.farms || []);
      } catch {
        clearAuthToken();
        setUser(null);
      }
    }
  };

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      await syncUserSession(cred.user);
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        throw new Error('Email/Password sign-in is not enabled for this project.');
      } else if (err.code === 'auth/invalid-credential') {
        throw new Error('Invalid email or password.');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, pass: string, lang?: string) => {
    setIsLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      if (name) {
        await updateProfile(cred.user, { displayName: name });
      }
      await syncUserSession(cred.user, name, lang);
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        throw new Error('Registration is not enabled for this project.');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = async () => {
    setIsLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      await syncUserSession(cred.user);
    } catch (popupErr: any) {
      console.warn('Firebase Google popup flow notice:', popupErr);
      if (popupErr.code === 'auth/popup-blocked') {
        throw new Error('Google Sign-In popup was blocked by your browser. Please allow popups or use Email/Password sign-in.');
      } else if (popupErr.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-In popup was closed before completing.');
      } else if (popupErr.code === 'auth/unauthorized-domain') {
        throw new Error('This domain is not authorized for Google Sign-In.');
      }
      throw popupErr;
    } finally {
      setIsLoading(false);
    }
  };

  // Explicit opt-in demonstration mode
  const exploreDemoMode = async () => {
    setIsLoading(true);
    try {
      const demoUid = 'demo_agronomist_phytoscan';
      setAuthToken(demoUid);
      const data = await api.syncFirebaseUser({
        uid: demoUid,
        email: 'agronomist@phytoscan.ai',
        name: 'Demo Agronomist (Sample Data)',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        language: 'en'
      });
      setUser(data.user);
      setFarms(data.farms || []);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Firebase signout notice:', err);
    }
    clearAuthToken();
    setUser(null);
    setFarms([]);
  };

  const updateUserLanguage = (lang: 'en' | 'hi' | 'bn') => {
    if (user) {
      setUser({ ...user, language: lang });
      if (auth.currentUser) {
        const userDocRef = doc(firestoreDb, 'users', auth.currentUser.uid);
        setDoc(userDocRef, { language: lang, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        farms,
        isLoading,
        isAuthenticated: !!user,
        isDemoMode,
        login,
        register,
        googleLogin,
        exploreDemoMode,
        logout,
        refreshUser,
        updateUserLanguage
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
