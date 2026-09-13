import { Router, Request, Response } from 'express';
import { db, User } from '../db.js';

export const authRouter = Router();

// Helper to parse Firebase ID token JWT payload
function parseFirebaseJwt(token: string): { uid: string; email?: string; name?: string; picture?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payloadStr = Buffer.from(parts[1], 'base64url').toString('utf-8');
      const payload = JSON.parse(payloadStr);
      const uid = payload.user_id || payload.sub;
      if (uid) {
        return {
          uid,
          email: payload.email,
          name: payload.name,
          picture: payload.picture
        };
      }
    }
  } catch (err) {
    // Non-fatal, continue to fallback
  }
  return null;
}

// Middleware to extract user from Authorization header or cookie
export function authenticateUser(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.replace('Bearer ', '').trim();

  // 1. Check if token is a Firebase ID Token JWT
  const firebaseData = parseFirebaseJwt(token);
  if (firebaseData) {
    const user = db.findOrCreateFirebaseUser(
      firebaseData.uid,
      firebaseData.email || `${firebaseData.uid}@phytoscan.ai`,
      firebaseData.name,
      firebaseData.picture
    );
    (req as any).user = user;
    return next();
  }

  // 2. Direct user ID lookup
  let user = db.findUserById(token);
  if (!user && token.startsWith('demo_')) {
    user = db.findOrCreateFirebaseUser(token, `${token}@phytoscan.ai`, 'Demo Farmer');
  }

  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  (req as any).user = user;
  next();
}

// Optional auth middleware (attaches user if present, proceeds otherwise)
export function optionalAuth(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '').trim();
    const firebaseData = parseFirebaseJwt(token);
    if (firebaseData) {
      const user = db.findOrCreateFirebaseUser(
        firebaseData.uid,
        firebaseData.email || `${firebaseData.uid}@phytoscan.ai`,
        firebaseData.name,
        firebaseData.picture
      );
      (req as any).user = user;
      return next();
    }

    const user = db.findUserById(token);
    if (user) {
      (req as any).user = user;
    }
  }
  next();
}

// Firebase Auth user synchronization
authRouter.post('/firebase-sync', (req: Request, res: Response) => {
  try {
    const { uid, email, name, avatar, language } = req.body;
    if (!uid) {
      return res.status(400).json({ error: 'Firebase UID is required' });
    }

    const user = db.findOrCreateFirebaseUser(
      uid,
      email || `${uid}@phytoscan.ai`,
      name || 'Phytoscan Farmer',
      avatar
    );

    if (language) {
      db.updateUser(user.id, { language });
    }

    const farms = db.getFarmsByUser(user.id);
    const crops = db.getCropsByUser(user.id);

    res.json({
      user,
      farms,
      hasCrops: crops.length > 0
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Firebase sync failed' });
  }
});

// Register
authRouter.post('/register', (req: Request, res: Response) => {
  try {
    const { name, email, password, language } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existing = db.findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const user = db.createUser({
      email,
      name,
      passwordHash: password, // In production use bcrypt, stored safely in server db
      language: language || 'en',
      onboarded: false,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`
    });

    res.json({
      user,
      token: user.id
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

// Login
authRouter.post('/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.findUserByEmail(email);
    if (!user || user.passwordHash !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json({
      user,
      token: user.id
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// Google Sign-In
authRouter.post('/google', (req: Request, res: Response) => {
  try {
    const { email, name, avatar } = req.body;
    const userEmail = email || 'farmer@phytoscan.ai';
    const userName = name || 'Phytoscan Farmer';

    let user = db.findUserByEmail(userEmail);
    if (!user) {
      user = db.createUser({
        email: userEmail,
        name: userName,
        avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(userName)}`,
        language: 'en',
        onboarded: false
      });
    }

    res.json({
      user,
      token: user.id
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Google login failed' });
  }
});

// Current User Session
authRouter.get('/me', authenticateUser, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const farms = db.getFarmsByUser(user.id);
  const crops = db.getCropsByUser(user.id);

  res.json({
    user,
    farms,
    hasCrops: crops.length > 0
  });
});

// Complete Onboarding
authRouter.post('/onboarding', authenticateUser, (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    const { farmerName, language, farmName, farmLocation, farmSizeAcres, firstCrop } = req.body;

    // Update user profile
    const updatedUser = db.updateUser(user.id, {
      name: farmerName || user.name,
      language: language || user.language,
      onboarded: true
    });

    // Create Farm
    const farm = db.createFarm({
      userId: user.id,
      name: farmName || 'My Primary Farm',
      location: farmLocation || 'Regional Sector',
      sizeAcres: farmSizeAcres ? Number(farmSizeAcres) : 50
    });

    // Create First Crop if provided
    let createdCrop = null;
    if (firstCrop && firstCrop.name) {
      createdCrop = db.createCrop({
        farmId: farm.id,
        userId: user.id,
        name: firstCrop.name,
        cropType: firstCrop.cropType || 'Tomato',
        variety: firstCrop.variety || 'Standard Variety',
        field: firstCrop.field || 'Field 1',
        location: farm.location,
        plantingDate: firstCrop.plantingDate || new Date().toISOString().split('T')[0],
        notes: firstCrop.notes || 'Registered during onboarding.',
        imageUrl: firstCrop.imageUrl || 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=800&q=80',
        status: 'active',
        currentHealthScore: 0,
        currentRiskLevel: 'low'
      });
    }

    res.json({
      user: updatedUser,
      farm,
      firstCrop: createdCrop
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Onboarding failed' });
  }
});

// Seed Demo Farm
authRouter.post('/demo-farm', authenticateUser, (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    const { farm, crops } = db.seedDemoFarm(user.id);
    db.updateUser(user.id, { onboarded: true });

    res.json({
      success: true,
      message: 'Demo farm with 21-day historical crop memory loaded successfully',
      farm,
      crops
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to seed demo farm' });
  }
});
