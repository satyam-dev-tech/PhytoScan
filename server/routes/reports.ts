import { Router, Request, Response } from 'express';
import { firestore } from '../firebase-admin.js';
import { authenticateUser } from './auth.js';

export const reportsRouter = Router();

// List reports
reportsRouter.get('/', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const reportsSnap = await firestore.collection('reports').where('userId', '==', user.id).get();
    const reports = reportsSnap.docs.map(doc => ({id: doc.id, ...doc.data()}));
    res.json(reports);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch reports' });
  }
});

// Get single report
reportsRouter.get('/:id', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const reportDoc = await firestore.collection('reports').doc(req.params.id).get();
    const report = reportDoc.data();
    if (!reportDoc.exists || report?.userId !== user.id) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json({id: reportDoc.id, ...report});
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch report' });
  }
});

// Generate report from real crop data
reportsRouter.post('/generate', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { cropId } = req.body;

    if (!cropId) {
      return res.status(400).json({ error: 'Crop ID is required' });
    }

    const cropDoc = await firestore.collection('crops').doc(cropId).get();
    const crop = cropDoc.data();
    if (!cropDoc.exists || crop?.userId !== user.id) {
      return res.status(404).json({ error: 'Crop not found' });
    }
    const cropData = {id: cropDoc.id, ...crop};

    const farmDoc = await firestore.collection('farms').doc(cropData.farmId).get();
    const scansSnap = await firestore.collection('scans').where('cropId', '==', cropData.id).orderBy('timestamp', 'desc').get();
    const scans = scansSnap.docs.map(doc => doc.data());
    
    const risksSnap = await firestore.collection('riskEvents').where('cropId', '==', cropData.id).get();
    const risks = risksSnap.docs.map(doc => doc.data());

    let dateRange = 'Current Assessment';
    let healthTrend = 'Stable';
    if (scans.length >= 2) {
      const oldest = scans[scans.length - 1];
      const newest = scans[0];
      const days = Math.max(1, Math.round((new Date(newest.timestamp).getTime() - new Date(oldest.timestamp).getTime()) / (1000 * 60 * 60 * 24)));
      dateRange = `${new Date(oldest.timestamp).toLocaleDateString()} – ${new Date(newest.timestamp).toLocaleDateString()} (${days} Days)`;
      const diff = newest.healthScore - oldest.healthScore;
      healthTrend = diff < -4 ? `Declining (${diff} pts over ${days} days)` :
                    diff > 4 ? `Improving (+${diff} pts over ${days} days)` : `Stable (${diff} pts)`;
    } else if (scans.length === 1) {
      dateRange = new Date(scans[0].timestamp).toLocaleDateString();
    }

    // Synthesize observations from recent scans
    const observations = scans.slice(0, 3).flatMap((s: any) => s.observations).slice(0, 5);
    if (observations.length === 0) {
      observations.push('Baseline foliage registered with active vegetative characteristics.');
    }

    // Synthesize risks
    const risksList = risks.slice(0, 3).map((r: any) => `${r.title}: ${r.description}`);
    if (risksList.length === 0) {
      risksList.push('No acute disease or pest threshold breaches active.');
    }

    // Synthesize recommendations
    const recommendations = scans.slice(0, 2).flatMap((s: any) => s.recommendations).slice(0, 4);
    if (recommendations.length === 0) {
      recommendations.push('Maintain regular scouting cadence every 7 to 10 days.');
      recommendations.push('Verify soil moisture and nutrition balance before next vegetative tier.');
    }

    const reportId = 'rep_' + Math.random().toString(36).slice(2, 14);
    const reportData = {
      userId: user.id,
      cropId: cropData.id,
      cropName: cropData.name,
      farmName: farmDoc.data()?.name || 'Primary Farm',
      farmerName: user.name,
      title: `Phytoscan Comprehensive Health Intelligence Report — ${cropData.name}`,
      dateRange,
      healthScore: cropData.currentHealthScore,
      healthTrend,
      summary: `Automated diagnostic summary generated from ${scans.length} historical image scans. Current health score is ${cropData.currentHealthScore}/100 with overall risk categorized as ${cropData.currentRiskLevel.toUpperCase()}.`,
      observations,
      risks: risksList,
      recommendations,
      disclaimer: 'Phytoscan provides AI-assisted educational and crop-monitoring insights. It does not replace qualified agricultural expertise, lab assays, or licensed agronomist recommendations.',
      createdAt: new Date().toISOString()
    };
    
    await firestore.collection('reports').doc(reportId).set(reportData);

    res.json({id: reportId, ...reportData});
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate report' });
  }
});
