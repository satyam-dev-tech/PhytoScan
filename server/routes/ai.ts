import { Router, Request, Response } from 'express';
import { db, User } from '../db.js';
import { authenticateUser } from './auth.js';
import { chatWithCropAssistant, runAgentInvestigation } from '../ai/gemini.js';

export const aiRouter = Router();

// AI Assistant Chat Endpoint
aiRouter.post('/chat', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    const { message, conversationId, cropId, language } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get or create conversation
    let conv;
    if (conversationId) {
      conv = db.getConversationById(conversationId);
      if (!conv) {
        // Register conversation under this user
        const convTitle = message.slice(0, 40) + (message.length > 40 ? '...' : '');
        conv = {
          id: conversationId,
          userId: user.id,
          title: convTitle,
          cropId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        (db as any).data.conversations.push(conv);
        (db as any).save();
      }
    }
    if (!conv) {
      const convTitle = message.slice(0, 40) + (message.length > 40 ? '...' : '');
      conv = db.createConversation(user.id, convTitle, cropId);
    }

    // Retrieve prior conversation messages before appending the new user message
    const existingMessages = db.getMessagesByConversation(conv.id);
    const history = (req.body.history && Array.isArray(req.body.history))
      ? req.body.history
      : existingMessages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        }));

    // Store user message
    db.addMessage({
      conversationId: conv.id,
      role: 'user',
      content: message
    });

    // Gather full user crops context (from client if provided, or from db)
    const cropsContext = (req.body.cropsContext && Array.isArray(req.body.cropsContext))
      ? req.body.cropsContext
      : db.getCropsByUser(user.id).map(crop => ({
          crop,
          scans: db.getScansByCrop(crop.id),
          risks: db.getRisksByCrop(crop.id)
        }));

    // Generate AI Assistant response
    let assistantReply: string;
    try {
      assistantReply = await chatWithCropAssistant(
        message,
        history,
        cropsContext,
        language || user.language || 'en'
      );
    } catch (err: any) {
      console.warn('chatWithCropAssistant top-level catch:', err);
      assistantReply = `I am currently monitoring your registered crops. Please review your Crop Health Timeline in the dashboard or re-send your question in a moment.`;
    }

    // Store assistant response
    const storedAssistantMsg = db.addMessage({
      conversationId: conv.id,
      role: 'assistant',
      content: assistantReply
    });

    res.json({
      conversationId: conv.id,
      message: storedAssistantMsg
    });
  } catch (err: any) {
    console.error('AI chat route error', err);
    res.status(500).json({ error: err.message || 'AI Assistant processing failed' });
  }
});

// List conversations
aiRouter.get('/conversations', authenticateUser, (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    const conversations = db.getConversationsByUser(user.id);
    res.json(conversations);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch conversations' });
  }
});

// Get messages in a conversation
aiRouter.get('/conversations/:id/messages', authenticateUser, (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    const conv = db.getConversationById(req.params.id);
    if (!conv || conv.userId !== user.id) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    const messages = db.getMessagesByConversation(conv.id);
    res.json({ conversation: conv, messages });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch messages' });
  }
});

// AI Agent Investigation
aiRouter.post('/agent/investigate', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    const { cropId, request: userRequest } = req.body;

    if (!cropId) {
      return res.status(400).json({ error: 'Crop ID is required for AI Agent investigation' });
    }

    const crop = db.getCropById(cropId);
    if (!crop || crop.userId !== user.id) {
      return res.status(404).json({ error: 'Crop not found' });
    }

    const scans = db.getScansByCrop(crop.id);
    const risks = db.getRisksByCrop(crop.id);

    // Run structured tool-based investigation
    const result = await runAgentInvestigation(
      crop,
      scans,
      risks,
      userRequest || `Analyze health trajectory and pathogen trends for ${crop.name}`
    );

    // Save investigation record
    const savedInvestigation = db.createInvestigation({
      userId: user.id,
      cropId: crop.id,
      request: userRequest || `Analyze health trajectory and pathogen trends for ${crop.name}`,
      steps: result.steps,
      finding: result.finding,
      metrics: result.metrics
    });

    res.json(savedInvestigation);
  } catch (err: any) {
    console.error('Agent investigation error', err);
    res.status(500).json({ error: err.message || 'Agent investigation failed' });
  }
});

// Get past investigations
aiRouter.get('/agent/investigations', authenticateUser, (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    const investigations = db.getInvestigationsByUser(user.id);
    res.json(investigations);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch investigations' });
  }
});
