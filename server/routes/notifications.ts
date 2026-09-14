import { Router, Request, Response } from 'express';
import { firestore } from '../firebase-admin.js';
import { authenticateUser } from './auth.js';

export const notificationsRouter = Router();

// Get user notifications
notificationsRouter.get('/', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const notificationsSnap = await firestore.collection('notifications').where('userId', '==', user.id).orderBy('date', 'desc').get();
    const notifications = notificationsSnap.docs.map(doc => ({id: doc.id, ...doc.data()}));
    res.json(notifications);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch notifications' });
  }
});

// Mark single notification read
notificationsRouter.put('/:id/read', authenticateUser, async (req: Request, res: Response) => {
  try {
    await firestore.collection('notifications').doc(req.params.id).update({read: true});
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to mark notification' });
  }
});

// Mark all read
notificationsRouter.post('/read-all', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const notifsSnap = await firestore.collection('notifications').where('userId', '==', user.id).get();
    const batch = firestore.batch();
    notifsSnap.docs.forEach(doc => {
        batch.update(doc.ref, {read: true});
    });
    await batch.commit();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to mark all read' });
  }
});
