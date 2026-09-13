import { Router, Request, Response } from 'express';
import { db, User } from '../db.js';
import { authenticateUser } from './auth.js';

export const searchRouter = Router();

searchRouter.get('/', authenticateUser, (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    const q = (req.query.q as string || '').toLowerCase().trim();

    if (!q) {
      return res.json({ crops: [], scans: [], risks: [], reports: [] });
    }

    const crops = db.getCropsByUser(user.id).filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.cropType.toLowerCase().includes(q) ||
      c.field.toLowerCase().includes(q) ||
      (c.variety && c.variety.toLowerCase().includes(q))
    );

    const scans = db.getScansByUser(user.id).filter(s =>
      s.condition.toLowerCase().includes(q) ||
      s.symptoms.some(sym => sym.toLowerCase().includes(q)) ||
      s.explanation.toLowerCase().includes(q)
    ).map(s => {
      const crop = db.getCropById(s.cropId);
      return {
        ...s,
        cropName: crop ? crop.name : 'Crop'
      };
    });

    const risks = db.getRisksByUser(user.id).filter(r =>
      r.title.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q)
    );

    const reports = db.getReportsByUser(user.id).filter(rep =>
      rep.title.toLowerCase().includes(q) ||
      rep.cropName.toLowerCase().includes(q) ||
      rep.summary.toLowerCase().includes(q)
    );

    res.json({
      crops,
      scans,
      risks,
      reports
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Search failed' });
  }
});
