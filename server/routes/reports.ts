import { Router, Request, Response } from 'express';
import { db, User } from '../db.js';
import { authenticateUser } from './auth.js';

export const reportsRouter = Router();

// List reports
reportsRouter.get('/', authenticateUser, (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    const reports = db.getReportsByUser(user.id);
    res.json(reports);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch reports' });
  }
});

// Get single report
reportsRouter.get('/:id', authenticateUser, (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    const report = db.getReportById(req.params.id);
    if (!report || report.userId !== user.id) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch report' });
  }
});

// Generate report from real crop data
reportsRouter.post('/generate', authenticateUser, (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    const { cropId } = req.body;

    if (!cropId) {
      return res.status(400).json({ error: 'Crop ID is required' });
    }

    const crop = db.getCropById(cropId);
    if (!crop || crop.userId !== user.id) {
      return res.status(404).json({ error: 'Crop not found' });
    }

    const farm = db.getFarmById(crop.farmId);
    const scans = db.getScansByCrop(crop.id);
    const risks = db.getRisksByCrop(crop.id);

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
    const observations = scans.slice(0, 3).flatMap(s => s.observations).slice(0, 5);
    if (observations.length === 0) {
      observations.push('Baseline foliage registered with active vegetative characteristics.');
    }

    // Synthesize risks
    const risksList = risks.slice(0, 3).map(r => `${r.title}: ${r.description}`);
    if (risksList.length === 0) {
      risksList.push('No acute disease or pest threshold breaches active.');
    }

    // Synthesize recommendations
    const recommendations = scans.slice(0, 2).flatMap(s => s.recommendations).slice(0, 4);
    if (recommendations.length === 0) {
      recommendations.push('Maintain regular scouting cadence every 7 to 10 days.');
      recommendations.push('Verify soil moisture and nutrition balance before next vegetative tier.');
    }

    const report = db.createReport({
      userId: user.id,
      cropId: crop.id,
      cropName: crop.name,
      farmName: farm ? farm.name : 'Primary Farm',
      farmerName: user.name,
      title: `Phytoscan Comprehensive Health Intelligence Report — ${crop.name}`,
      dateRange,
      healthScore: crop.currentHealthScore,
      healthTrend,
      summary: `Automated diagnostic summary generated from ${scans.length} historical image scans. Current health score is ${crop.currentHealthScore}/100 with overall risk categorized as ${crop.currentRiskLevel.toUpperCase()}.`,
      observations,
      risks: risksList,
      recommendations,
      disclaimer: 'Phytoscan provides AI-assisted educational and crop-monitoring insights. It does not replace qualified agricultural expertise, lab assays, or licensed agronomist recommendations.'
    });

    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate report' });
  }
});
