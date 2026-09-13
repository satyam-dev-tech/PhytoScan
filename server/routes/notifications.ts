import { Router, Request, Response } from 'express';
import { db, User } from '../db.js';
import { authenticateUser } from './auth.js';

export const notificationsRouter = Router();

// Get user notifications
notificationsRouter.get('/', authenticateUser, (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    const notifications = db.getNotificationsByUser(user.id);
    res.json(notifications);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch notifications' });
  }
});

// Mark single notification read
notificationsRouter.put('/:id/read', authenticateUser, (req: Request, res: Response) => {
  try {
    const updated = db.markNotificationAsRead(req.params.id);
    res.json({ success: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to mark notification' });
  }
});

// Mark all read
notificationsRouter.post('/read-all', authenticateUser, (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    db.markAllNotificationsRead(user.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to mark all read' });
  }
});
