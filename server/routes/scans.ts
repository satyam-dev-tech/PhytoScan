import { Router, Request, Response } from 'express';
import { db, User } from '../db.js';
import { authenticateUser } from './auth.js';
import { analyzeCropScanImage, compareScansWithAI } from '../ai/gemini.js';

export const scansRouter = Router();

// Get scans for user or filtered by crop
scansRouter.get('/', authenticateUser, (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    const { cropId } = req.query;

    let scans;
    if (cropId && typeof cropId === 'string') {
      scans = db.getScansByCrop(cropId);
    } else {
      scans = db.getScansByUser(user.id);
    }

    // Attach crop metadata to each scan
    const enriched = scans.map(s => {
      const crop = db.getCropById(s.cropId);
      return {
        ...s,
        cropName: crop ? crop.name : 'Unknown Crop',
        cropType: crop ? crop.cropType : '',
        field: crop ? crop.field : ''
      };
    });

    res.json(enriched);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch scans' });
  }
});

// Get single scan
scansRouter.get('/:id', authenticateUser, (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    const scan = db.getScanById(req.params.id);

    if (!scan || scan.userId !== user.id) {
      return res.status(404).json({ error: 'Scan not found' });
    }

    const crop = db.getCropById(scan.cropId);
    res.json({
      scan,
      crop
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch scan' });
  }
});

// Analyze Crop Image using Multimodal Vision AI with Image Quality evaluation
scansRouter.post('/analyze', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    const { cropId, imageBase64, mimeType, cropContext, previousScans: clientScans, recentRisks: clientRisks } = req.body;

    if (!cropId) {
      return res.status(400).json({ error: 'Crop ID is required' });
    }
    if (!imageBase64) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    let crop = db.getCropById(cropId);
    if (!crop || crop.userId !== user.id) {
      if (cropContext) {
        crop = {
          id: cropId,
          userId: user.id,
          name: cropContext.name || 'Crop Plant',
          cropType: cropContext.cropType || 'Crop',
          variety: cropContext.variety || 'Standard',
          field: cropContext.field || 'Field Plot',
          location: cropContext.location || '',
          plantingDate: cropContext.plantingDate || new Date().toISOString().split('T')[0],
          currentHealthScore: cropContext.currentHealthScore ?? 0,
          currentRiskLevel: cropContext.currentRiskLevel || 'low',
          status: 'active',
          farmId: cropContext.farmId || 'farm-1',
          imageUrl: cropContext.imageUrl || '',
          createdAt: cropContext.createdAt || new Date().toISOString(),
          updatedAt: cropContext.updatedAt || new Date().toISOString()
        };
        try {
          db.createCrop(crop);
        } catch {
          // ignore if already present
        }
      } else {
        return res.status(404).json({ error: 'Crop not found' });
      }
    }

    // Retrieve historical context for this crop from client Firestore data or local memory
    const previousScans = (Array.isArray(clientScans) && clientScans.length > 0)
      ? clientScans
      : db.getScansByCrop(crop.id);
    const recentRisks = (Array.isArray(clientRisks) && clientRisks.length > 0)
      ? clientRisks
      : db.getRisksByCrop(crop.id);

    // Google/Firebase compatible persistent image storage (data URI durable in document schema)
    const normalizedMime = mimeType || 'image/jpeg';
    const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    const savedImageUrl = imageBase64.startsWith('data:') 
      ? imageBase64 
      : `data:${normalizedMime};base64,${base64Data}`;

    // Run multimodal AI vision analysis with crop context
    const visionResult = await analyzeCropScanImage(
      base64Data,
      mimeType || 'image/jpeg',
      {
        crop,
        previousScans,
        recentRisks
      }
    );

    res.json({
      imageUrl: savedImageUrl,
      crop,
      analysis: visionResult
    });
  } catch (err: any) {
    console.error('Scan analysis endpoint error', err);
    res.status(500).json({ error: err.message || 'Failed to analyze crop image' });
  }
});

// Save verified scan to database & update crop intelligence
scansRouter.post('/save', authenticateUser, (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    const {
      cropId,
      imageUrl,
      healthScore,
      condition,
      severity,
      riskLevel,
      confidence,
      symptoms,
      observations,
      recommendations,
      explanation,
      qualityScore,
      qualityNotes,
      cropContext
    } = req.body;

    let crop = db.getCropById(cropId);
    if (!crop || crop.userId !== user.id) {
      if (cropContext) {
        crop = {
          id: cropId,
          userId: user.id,
          name: cropContext.name || 'Crop Plant',
          cropType: cropContext.cropType || 'Crop',
          variety: cropContext.variety || 'Standard',
          field: cropContext.field || 'Field Plot',
          location: cropContext.location || '',
          plantingDate: cropContext.plantingDate || new Date().toISOString().split('T')[0],
          currentHealthScore: cropContext.currentHealthScore ?? 0,
          currentRiskLevel: cropContext.currentRiskLevel || 'low',
          status: 'active',
          farmId: cropContext.farmId || 'farm-1',
          imageUrl: cropContext.imageUrl || '',
          createdAt: cropContext.createdAt || new Date().toISOString(),
          updatedAt: cropContext.updatedAt || new Date().toISOString()
        };
        try {
          db.createCrop(crop);
        } catch {
          // ignore
        }
      } else {
        return res.status(404).json({ error: 'Crop not found' });
      }
    }

    const newScan = db.createScan(
      {
        cropId,
        userId: user.id,
        imageUrl: imageUrl || crop.imageUrl || '',
        timestamp: new Date().toISOString(),
        healthScore: Number(healthScore) || 75,
        condition: condition || 'AI-Assisted Assessment',
        severity: severity || 'low',
        riskLevel: riskLevel || 'stable',
        confidence: Number(confidence) || 0.8,
        symptoms: Array.isArray(symptoms) ? symptoms : [],
        observations: Array.isArray(observations) ? observations : [],
        recommendations: Array.isArray(recommendations) ? recommendations : [],
        explanation: explanation || 'Scan recorded in Phytoscan intelligence system.',
        modelMeta: {
          model: 'gemini-3.8-flash'
        }
      },
      qualityScore ? {
        qualityScore,
        qualityNotes,
        detectedLeavesCount: 1
      } : undefined
    );

    // Send notification about scan completion
    db.save();

    res.json({
      success: true,
      scan: newScan,
      updatedCrop: db.getCropById(cropId)
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to save scan' });
  }
});

// Compare two scans with AI explanation
scansRouter.post('/compare', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    const { previousScanId, currentScanId } = req.body;

    if (!previousScanId || !currentScanId) {
      return res.status(400).json({ error: 'Both previousScanId and currentScanId are required' });
    }

    const prevScan = db.getScanById(previousScanId);
    const currScan = db.getScanById(currentScanId);

    if (!prevScan || !currScan || prevScan.userId !== user.id || currScan.userId !== user.id) {
      return res.status(404).json({ error: 'One or both scans not found' });
    }

    const crop = db.getCropById(currScan.cropId);
    if (!crop) {
      return res.status(404).json({ error: 'Crop not found' });
    }

    const comparison = await compareScansWithAI(prevScan, currScan, crop);

    res.json({
      crop,
      previousScan: prevScan,
      currentScan: currScan,
      comparison
    });
  } catch (err: any) {
    console.error('Scan comparison error', err);
    res.status(500).json({ error: err.message || 'Failed to compare scans' });
  }
});
