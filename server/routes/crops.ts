import { Router, Request, Response } from 'express';
import { db, User } from '../db.js';
import { authenticateUser } from './auth.js';

export const cropsRouter = Router();

// List all crops for current user
cropsRouter.get('/', authenticateUser, (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    const crops = db.getCropsByUser(user.id);
    const farms = db.getFarmsByUser(user.id);

    // Enrich crops with latest scan info and trend
    const enriched = crops.map(c => {
      const scans = db.getScansByCrop(c.id);
      const latestScan = scans[0];
      const previousScan = scans[1];
      const risks = db.getRisksByCrop(c.id).filter(r => !r.resolved);

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
    });

    res.json({ crops: enriched, farms });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch crops' });
  }
});

// Get single crop with full intelligence metrics
cropsRouter.get('/:id', authenticateUser, (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    const crop = db.getCropById(req.params.id);

    if (!crop || crop.userId !== user.id) {
      return res.status(404).json({ error: 'Crop not found' });
    }

    const scans = db.getScansByCrop(crop.id);
    const timeline = db.getTimelineByCrop(crop.id);
    const risks = db.getRisksByCrop(crop.id);
    const farm = db.getFarmById(crop.farmId);

    // Calculate historical trend statistics
    let scoreChangeTotal = 0;
    let daysMonitored = 0;
    let trend: 'improving' | 'stable' | 'declining' = 'stable';

    if (scans.length >= 2) {
      const oldest = scans[scans.length - 1];
      const newest = scans[0];
      scoreChangeTotal = newest.healthScore - oldest.healthScore;
      const oldestDate = new Date(oldest.timestamp);
      const newestDate = new Date(newest.timestamp);
      daysMonitored = Math.max(1, Math.round((newestDate.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24)));
      trend = scoreChangeTotal < -4 ? 'declining' : scoreChangeTotal > 4 ? 'improving' : 'stable';
    }

    const resolvedCrop = {
      ...crop,
      currentHealthScore: scans.length > 0 ? scans[0].healthScore : 0
    };

    res.json({
      crop: resolvedCrop,
      farm,
      scans,
      timeline,
      risks,
      metrics: {
        totalScans: scans.length,
        daysMonitored,
        scoreChangeTotal,
        trend,
        overallRisk: crop.currentRiskLevel
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch crop details' });
  }
});

// Create new crop
cropsRouter.post('/', authenticateUser, (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    const { name, cropType, variety, field, location, plantingDate, notes, imageUrl, farmId } = req.body;

    if (!name || !cropType || !field) {
      return res.status(400).json({ error: 'Crop name, crop type, and field are required' });
    }

    let targetFarmId = farmId;
    if (!targetFarmId) {
      const userFarms = db.getFarmsByUser(user.id);
      if (userFarms.length > 0) {
        targetFarmId = userFarms[0].id;
      } else {
        const defaultFarm = db.createFarm({
          userId: user.id,
          name: `${user.name}'s Farm`,
          location: location || 'Field Plot'
        });
        targetFarmId = defaultFarm.id;
      }
    }

    const defaultImages: Record<string, string> = {
      Tomato: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=800&q=80',
      Wheat: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=800&q=80',
      Corn: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=800&q=80',
      Potato: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80',
      Pepper: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=800&q=80',
      Rice: 'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?auto=format&fit=crop&w=800&q=80',
      Cotton: 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?auto=format&fit=crop&w=800&q=80'
    };

    const assignedImage = imageUrl || defaultImages[cropType] || 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=800&q=80';

    const newCrop = db.createCrop({
      farmId: targetFarmId,
      userId: user.id,
      name,
      cropType,
      variety: variety || 'Standard',
      field,
      location: location || 'Plot Section A',
      plantingDate: plantingDate || new Date().toISOString().split('T')[0],
      notes: notes || '',
      imageUrl: assignedImage,
      status: 'active',
      currentHealthScore: 0,
      currentRiskLevel: 'low'
    });

    res.json(newCrop);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create crop' });
  }
});

// Update crop
cropsRouter.put('/:id', authenticateUser, (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    const crop = db.getCropById(req.params.id);

    if (!crop || crop.userId !== user.id) {
      return res.status(404).json({ error: 'Crop not found' });
    }

    const updated = db.updateCrop(crop.id, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update crop' });
  }
});

// Delete crop
cropsRouter.delete('/:id', authenticateUser, (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    const crop = db.getCropById(req.params.id);

    if (!crop || crop.userId !== user.id) {
      return res.status(404).json({ error: 'Crop not found' });
    }

    db.deleteCrop(crop.id);
    res.json({ success: true, message: 'Crop deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete crop' });
  }
});

// Get Timeline for crop
cropsRouter.get('/:id/timeline', authenticateUser, (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    const crop = db.getCropById(req.params.id);
    if (!crop || crop.userId !== user.id) {
      return res.status(404).json({ error: 'Crop not found' });
    }
    const timeline = db.getTimelineByCrop(crop.id);
    res.json(timeline);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch timeline' });
  }
});

// Get Risks for crop
cropsRouter.get('/:id/risks', authenticateUser, (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    const crop = db.getCropById(req.params.id);
    if (!crop || crop.userId !== user.id) {
      return res.status(404).json({ error: 'Crop not found' });
    }
    const risks = db.getRisksByCrop(crop.id);
    res.json(risks);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch risks' });
  }
});
