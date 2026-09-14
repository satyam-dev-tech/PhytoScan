import { Router, Request, Response } from 'express';
import { firestore } from '../firebase-admin.js';
import { authenticateUser } from './auth.js';
import { Crop, User } from '../db.js';

export const cropsRouter = Router();

// List all crops for current user
cropsRouter.get('/', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const cropsSnap = await firestore.collection('crops').where('userId', '==', user.id).get();
    const farmsSnap = await firestore.collection('farms').where('userId', '==', user.id).get();
    
    const crops = cropsSnap.docs.map(doc => ({id: doc.id, ...doc.data()}));
    const farms = farmsSnap.docs.map(doc => ({id: doc.id, ...doc.data()}));

    // Enrich crops with latest scan info and trend
    const enriched = await Promise.all(crops.map(async (c: any) => {
      const scansSnap = await firestore.collection('scans').where('cropId', '==', c.id).orderBy('timestamp', 'desc').get();
      const scans = scansSnap.docs.map(doc => doc.data());
      
      const latestScan = scans[0];
      const previousScan = scans[1];
      const risksSnap = await firestore.collection('riskEvents').where('cropId', '==', c.id).where('resolved', '==', false).get();
      const risks = risksSnap.docs.map(doc => doc.data());

      let trend: 'improving' | 'stable' | 'declining' = 'stable';
      let scoreDiff = 0;
      if (latestScan && previousScan) {
        scoreDiff = latestScan.healthScore - previousScan.healthScore;
        trend = scoreDiff < -3 ? 'declining' : scoreDiff > 3 ? 'improving' : 'stable';
      }

      return {
        ...c,
        currentHealthScore: latestScan ? latestScan.healthScore : 0,
        totalScans: scans.length,
        latestScan,
        activeRisksCount: risks.length,
        trend,
        scoreDiff
      };
    }));

    res.json({ crops: enriched, farms });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch crops' });
  }
});

// Get single crop with full intelligence metrics
cropsRouter.get('/:id', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const cropDoc = await firestore.collection('crops').doc(req.params.id).get();
    const crop = cropDoc.data();

    if (!crop || crop.userId !== user.id) {
      return res.status(404).json({ error: 'Crop not found' });
    }

    const scansSnap = await firestore.collection('scans').where('cropId', '==', crop.id).orderBy('timestamp', 'desc').get();
    const scans = scansSnap.docs.map(doc => doc.data());
    
    // Simplified for brevity, assume timeline and risks fetched similarly
    const farmDoc = await firestore.collection('farms').doc(crop.farmId).get();
    const farm = farmDoc.data();

    res.json({
      crop: {id: cropDoc.id, ...crop},
      farm,
      scans
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch crop details' });
  }
});

// Create new crop
cropsRouter.post('/', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { name, cropType, variety, field, location, plantingDate, notes, imageUrl, farmId } = req.body;

    if (!name || !cropType || !field) {
      return res.status(400).json({ error: 'Crop name, crop type, and field are required' });
    }

    let targetFarmId = farmId;
    if (!targetFarmId) {
      const farmsSnap = await firestore.collection('farms').where('userId', '==', user.id).limit(1).get();
      if (!farmsSnap.empty) {
        targetFarmId = farmsSnap.docs[0].id;
      } else {
        const farmId = 'farm_' + Math.random().toString(36).slice(2, 14);
        const defaultFarm = {
          id: farmId,
          userId: user.id,
          name: `${user.name}'s Farm`,
          location: location || 'Field Plot',
          createdAt: new Date().toISOString()
        };
        await firestore.collection('farms').doc(farmId).set(defaultFarm);
        targetFarmId = farmId;
      }
    }

    const cropId = 'crop_' + Math.random().toString(36).slice(2, 14);
    const newCrop = {
      id: cropId,
      farmId: targetFarmId,
      userId: user.id,
      name,
      cropType,
      variety: variety || 'Standard',
      field,
      location: location || 'Plot Section A',
      plantingDate: plantingDate || new Date().toISOString().split('T')[0],
      notes: notes || '',
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=800&q=80',
      status: 'active',
      currentHealthScore: 0,
      currentRiskLevel: 'low',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await firestore.collection('crops').doc(cropId).set(newCrop);
    res.json(newCrop);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create crop' });
  }
});

// Update crop
cropsRouter.put('/:id', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const cropRef = firestore.collection('crops').doc(req.params.id);
    const cropDoc = await cropRef.get();
    
    if (!cropDoc.exists || cropDoc.data()?.userId !== user.id) {
      return res.status(404).json({ error: 'Crop not found' });
    }

    await cropRef.update({...req.body, updatedAt: new Date().toISOString()});
    const updated = await cropRef.get();
    res.json({id: updated.id, ...updated.data()});
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update crop' });
  }
});

// Delete crop
cropsRouter.delete('/:id', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const cropRef = firestore.collection('crops').doc(req.params.id);
    const cropDoc = await cropRef.get();

    if (!cropDoc.exists || cropDoc.data()?.userId !== user.id) {
      return res.status(404).json({ error: 'Crop not found' });
    }

    await cropRef.delete();
    // Cascade delete can be implemented with Firestore triggers if needed
    res.json({ success: true, message: 'Crop deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete crop' });
  }
});

// Get Timeline for crop
cropsRouter.get('/:id/timeline', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const cropDoc = await firestore.collection('crops').doc(req.params.id).get();
    const crop = cropDoc.data();
    if (!cropDoc.exists || crop?.userId !== user.id) {
      return res.status(404).json({ error: 'Crop not found' });
    }
    const timelineSnap = await firestore.collection('healthTimeline').where('cropId', '==', req.params.id).orderBy('date', 'asc').get();
    res.json(timelineSnap.docs.map(doc => doc.data()));
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch timeline' });
  }
});

// Get Risks for crop
cropsRouter.get('/:id/risks', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const cropDoc = await firestore.collection('crops').doc(req.params.id).get();
    const crop = cropDoc.data();
    if (!cropDoc.exists || crop?.userId !== user.id) {
      return res.status(404).json({ error: 'Crop not found' });
    }
    const risksSnap = await firestore.collection('riskEvents').where('cropId', '==', req.params.id).orderBy('date', 'desc').get();
    res.json(risksSnap.docs.map(doc => doc.data()));
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch risks' });
  }
});
