import { Router, Request, Response } from 'express';
import { firestore } from '../firebase-admin.js';
import { authenticateUser } from './auth.js';
import { analyzeCropScanImage, compareScansWithAI } from '../ai/gemini.js';
import { Crop, CropScan } from '../db.js';

export const scansRouter = Router();

// Get scans for user or filtered by crop
scansRouter.get('/', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { cropId } = req.query;

    let scansQuery = firestore.collection('scans').where('userId', '==', user.id);
    if (cropId && typeof cropId === 'string') {
        scansQuery = scansQuery.where('cropId', '==', cropId);
    }
    
    const scansSnap = await scansQuery.orderBy('timestamp', 'desc').get();
    const scans = scansSnap.docs.map(doc => ({id: doc.id, ...doc.data()}));

    // Attach crop metadata to each scan
    const enriched = await Promise.all(scans.map(async (s: any) => {
      const cropDoc = await firestore.collection('crops').doc(s.cropId).get();
      const crop = cropDoc.data();
      return {
        ...s,
        cropName: crop ? crop.name : 'Unknown Crop',
        cropType: crop ? crop.cropType : '',
        field: crop ? crop.field : ''
      };
    }));

    res.json(enriched);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch scans' });
  }
});

// Get single scan
scansRouter.get('/:id', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const scanDoc = await firestore.collection('scans').doc(req.params.id).get();
    
    if (!scanDoc.exists) {
        return res.status(404).json({ error: 'Scan not found' });
    }
    const scan = scanDoc.data();
    if (scan?.userId !== user.id) {
        return res.status(404).json({ error: 'Scan not found' });
    }

    const cropDoc = await firestore.collection('crops').doc(scan.cropId).get();
    res.json({
      scan: {id: scanDoc.id, ...scan},
      crop: cropDoc.data()
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch scan' });
  }
});

// Analyze Crop Image using Multimodal Vision AI with Image Quality evaluation
scansRouter.post('/analyze', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { cropId, imageBase64, mimeType, cropContext, previousScans: clientScans, recentRisks: clientRisks } = req.body;

    if (!cropId) {
      return res.status(400).json({ error: 'Crop ID is required' });
    }
    if (!imageBase64) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    const cropRef = firestore.collection('crops').doc(cropId);
    let cropDoc = await cropRef.get();
    let crop = cropDoc.data() as Crop | undefined;

    if (!cropDoc.exists || crop?.userId !== user.id) {
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
        await cropRef.set(crop);
      } else {
        return res.status(404).json({ error: 'Crop not found' });
      }
    } else {
        crop = {id: cropDoc.id, ...crop} as Crop;
    }

    // Retrieve historical context for this crop
    const previousScans = (Array.isArray(clientScans) && clientScans.length > 0)
      ? clientScans
      : (await firestore.collection('scans').where('cropId', '==', crop.id).orderBy('timestamp', 'desc').limit(10).get()).docs.map(d => ({id: d.id, ...d.data()} as CropScan));
      
    const recentRisks = (Array.isArray(clientRisks) && clientRisks.length > 0)
      ? clientRisks
      : (await firestore.collection('riskEvents').where('cropId', '==', crop!.id).where('resolved', '==', false).get()).docs.map(d => ({id: d.id, ...d.data()}));

    // Google/Firebase compatible persistent image storage
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
scansRouter.post('/save', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
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

    const cropRef = firestore.collection('crops').doc(cropId);
    let cropDoc = await cropRef.get();
    let cropData = cropDoc.data() as Crop | undefined;

    if (!cropDoc.exists || cropData?.userId !== user.id) {
       // ... (handle cropContext as before if needed, but maybe just return 404 for now to simplify)
       return res.status(404).json({ error: 'Crop not found' });
    }
    const crop = {id: cropDoc.id, ...cropData};

    const batch = firestore.batch();

    const scanId = 'scan_' + Math.random().toString(36).slice(2, 14);
    const scanRef = firestore.collection('scans').doc(scanId);
    const newScan = {
        cropId,
        userId: user.id,
        imageUrl: imageUrl || crop!.imageUrl || '',
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
    };
    batch.set(scanRef, newScan);

    if (qualityScore) {
        const anaId = 'ana_' + Math.random().toString(36).slice(2, 14);
        batch.set(firestore.collection('analyses').doc(anaId), {
            scanId,
            qualityScore,
            qualityNotes,
            detectedLeavesCount: 1
        });
    }

    // Auto-update crop
    const prevScore = crop!.currentHealthScore;
    const newHealthScore = Number(healthScore) || 75;
    const newRiskLevel = 
        riskLevel === 'high_risk' ? 'high' :
        riskLevel === 'increasing' ? 'elevated' :
        riskLevel === 'monitoring_required' ? 'moderate' : 'low';
        
    batch.update(cropRef, {
        currentHealthScore: newHealthScore,
        currentRiskLevel: newRiskLevel,
        updatedAt: new Date().toISOString()
    });

    // Add to timeline
    const hlId = 'hl_' + Math.random().toString(36).slice(2, 14);
    batch.set(firestore.collection('healthTimeline').doc(hlId), {
        cropId,
        date: newScan.timestamp,
        healthScore: newHealthScore,
        statusLabel: condition,
        scanId,
        notes: explanation.slice(0, 120) + (explanation.length > 120 ? '...' : '')
    });

    // Risk event and notification
    const scoreDiff = newHealthScore - prevScore;
    if (scoreDiff <= -8 || riskLevel === 'increasing' || riskLevel === 'high_risk') {
        const riskId = 'risk_' + Math.random().toString(36).slice(2, 14);
        batch.set(firestore.collection('riskEvents').doc(riskId), {
            cropId,
            userId: user.id,
            scanId,
            title: `Health Decline Observed: ${condition}`,
            description: `Score dropped by ${Math.abs(scoreDiff)} points to ${newHealthScore}/100. Symptoms: ${symptoms.join(', ')}`,
            riskLevel: riskLevel === 'high_risk' ? 'high' : 'elevated',
            severity: severity,
            date: new Date().toISOString(),
            resolved: false
        });

        const notifId = 'notif_' + Math.random().toString(36).slice(2, 14);
        batch.set(firestore.collection('notifications').doc(notifId), {
            userId: user.id,
            cropId,
            type: 'trend_alert',
            title: `Health Alert: ${crop!.name}`,
            message: `${crop!.name} health score decreased by ${Math.abs(scoreDiff)} points. Monitoring recommended.`,
            date: new Date().toISOString(),
            read: false
        });
    }

    await batch.commit();

    res.json({
      success: true,
      scan: {id: scanId, ...newScan},
      updatedCrop: {id: cropDoc.id, ...crop, currentHealthScore: newHealthScore, currentRiskLevel: newRiskLevel}
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to save scan' });
  }
});

// Compare two scans with AI explanation
scansRouter.post('/compare', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { previousScanId, currentScanId } = req.body;

    if (!previousScanId || !currentScanId) {
      return res.status(400).json({ error: 'Both previousScanId and currentScanId are required' });
    }

    const prevScanDoc = await firestore.collection('scans').doc(previousScanId).get();
    const currScanDoc = await firestore.collection('scans').doc(currentScanId).get();

    if (!prevScanDoc.exists || !currScanDoc.exists) {
        return res.status(404).json({ error: 'One or both scans not found' });
    }
    
    const prevScan = {id: prevScanDoc.id, ...prevScanDoc.data()} as CropScan;
    const currScan = {id: currScanDoc.id, ...currScanDoc.data()} as CropScan;
    
    if (prevScan.userId !== user.id || currScan.userId !== user.id) {
      return res.status(404).json({ error: 'One or both scans not found' });
    }

    const cropDoc = await firestore.collection('crops').doc(currScan.cropId).get();
    if (!cropDoc.exists) {
      return res.status(404).json({ error: 'Crop not found' });
    }
    const crop = {id: cropDoc.id, ...cropDoc.data()} as Crop;

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
