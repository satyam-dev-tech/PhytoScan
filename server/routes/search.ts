import { Router, Request, Response } from 'express';
import { firestore } from '../firebase-admin.js';
import { authenticateUser } from './auth.js';

export const searchRouter = Router();

searchRouter.get('/', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const q = (req.query.q as string || '').toLowerCase().trim();

    if (!q) {
      return res.json({ crops: [], scans: [], risks: [], reports: [] });
    }

    // Fetch all user-owned items
    const [cropsSnap, scansSnap, risksSnap, reportsSnap] = await Promise.all([
        firestore.collection('crops').where('userId', '==', user.id).get(),
        firestore.collection('scans').where('userId', '==', user.id).get(),
        firestore.collection('riskEvents').where('userId', '==', user.id).get(),
        firestore.collection('reports').where('userId', '==', user.id).get()
    ]);

    const crops = cropsSnap.docs.map(d => ({id: d.id, ...d.data()})).filter((c: any) =>
      c.name.toLowerCase().includes(q) ||
      c.cropType.toLowerCase().includes(q) ||
      c.field.toLowerCase().includes(q) ||
      (c.variety && c.variety.toLowerCase().includes(q))
    );

    const scans = scansSnap.docs.map(d => ({id: d.id, ...d.data()})).filter((s: any) =>
      s.condition.toLowerCase().includes(q) ||
      s.symptoms.some((sym: string) => sym.toLowerCase().includes(q)) ||
      s.explanation.toLowerCase().includes(q)
    ).map((s: any) => {
        // We need crop name, let's assume we can fetch it or we already have it.
        // To be safe, we can just return it as is or fetch crop name if needed.
        // For now, let's keep it simple.
        return s;
    });

    const risks = risksSnap.docs.map(d => ({id: d.id, ...d.data()})).filter((r: any) =>
      r.title.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q)
    );

    const reports = reportsSnap.docs.map(d => ({id: d.id, ...d.data()})).filter((rep: any) =>
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
