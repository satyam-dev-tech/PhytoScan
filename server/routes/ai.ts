import { Router, Request, Response } from 'express';
import { firestore } from '../firebase-admin.js';
import { authenticateUser } from './auth.js';
import { chatWithCropAssistant, runAgentInvestigation } from '../ai/gemini.js';

export const aiRouter = Router();

// AI Assistant Chat Endpoint
aiRouter.post('/chat', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { message, conversationId, cropId, language } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    let convId = conversationId;
    let conv;

    if (convId) {
        const doc = await firestore.collection('conversations').doc(convId).get();
        conv = doc.data();
        if (doc.exists && conv?.userId !== user.id) return res.status(404).json({ error: 'Conversation not found' });
    }
    
    if (!convId || !conv) {
        convId = 'conv_' + Math.random().toString(36).slice(2, 14);
        const convTitle = message.slice(0, 40) + (message.length > 40 ? '...' : '');
        conv = {
            userId: user.id,
            title: convTitle,
            cropId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        await firestore.collection('conversations').doc(convId).set(conv);
    }

    const messagesSnap = await firestore.collection('messages').where('conversationId', '==', convId).orderBy('timestamp', 'asc').get();
    const existingMessages = messagesSnap.docs.map(doc => ({id: doc.id, ...doc.data()}));
    
    const history = (req.body.history && Array.isArray(req.body.history))
      ? req.body.history
      : existingMessages.map((m: any) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        }));

    // Store user message
    const userMsgId = 'msg_' + Math.random().toString(36).slice(2, 14);
    await firestore.collection('messages').doc(userMsgId).set({
      conversationId: convId,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    });

    // Gather full user crops context
    // This part is very expensive in Firestore, let's keep it simple for now or fetch only for the relevant cropId
    const cropsContext = (req.body.cropsContext && Array.isArray(req.body.cropsContext))
      ? req.body.cropsContext
      : []; // For now, empty if not provided.

    // Generate AI Assistant response
    let assistantReply: string;
    try {
      assistantReply = await chatWithCropAssistant(
        message,
        history,
        cropsContext,
        language || 'en'
      );
    } catch (err: any) {
      console.warn('chatWithCropAssistant top-level catch:', err);
      assistantReply = `I am currently monitoring your registered crops. Please review your Crop Health Timeline in the dashboard or re-send your question in a moment.`;
    }

    // Store assistant response
    const assistantMsgId = 'msg_' + Math.random().toString(36).slice(2, 14);
    await firestore.collection('messages').doc(assistantMsgId).set({
      conversationId: convId,
      role: 'assistant',
      content: assistantReply,
      timestamp: new Date().toISOString()
    });
    
    await firestore.collection('conversations').doc(convId).update({updatedAt: new Date().toISOString()});

    res.json({
      conversationId: convId,
      message: {id: assistantMsgId, conversationId: convId, role: 'assistant', content: assistantReply, timestamp: new Date().toISOString()}
    });
  } catch (err: any) {
    console.error('AI chat route error', err);
    res.status(500).json({ error: err.message || 'AI Assistant processing failed' });
  }
});

// List conversations
aiRouter.get('/conversations', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const convsSnap = await firestore.collection('conversations').where('userId', '==', user.id).orderBy('updatedAt', 'desc').get();
    const conversations = convsSnap.docs.map(doc => ({id: doc.id, ...doc.data()}));
    res.json(conversations);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch conversations' });
  }
});

// Get messages in a conversation
aiRouter.get('/conversations/:id/messages', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const convDoc = await firestore.collection('conversations').doc(req.params.id).get();
    const conv = convDoc.data();
    if (!convDoc.exists || conv?.userId !== user.id) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    const msgsSnap = await firestore.collection('messages').where('conversationId', '==', req.params.id).orderBy('timestamp', 'asc').get();
    const messages = msgsSnap.docs.map(doc => ({id: doc.id, ...doc.data()}));
    res.json({ conversation: {id: convDoc.id, ...conv}, messages });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch messages' });
  }
});

// AI Agent Investigation
aiRouter.post('/agent/investigate', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { cropId, request: userRequest } = req.body;

    if (!cropId) {
      return res.status(400).json({ error: 'Crop ID is required for AI Agent investigation' });
    }

    const cropDoc = await firestore.collection('crops').doc(cropId).get();
    const crop = cropDoc.data();
    if (!cropDoc.exists || crop?.userId !== user.id) {
      return res.status(404).json({ error: 'Crop not found' });
    }
    const cropData = {id: cropDoc.id, ...crop};

    const scansSnap = await firestore.collection('scans').where('cropId', '==', cropData.id).orderBy('timestamp', 'desc').get();
    const scans = scansSnap.docs.map(doc => doc.data());
    
    const risksSnap = await firestore.collection('riskEvents').where('cropId', '==', cropData.id).get();
    const risks = risksSnap.docs.map(doc => doc.data());

    // Run structured tool-based investigation
    const result = await runAgentInvestigation(
      cropData,
      scans,
      risks,
      userRequest || `Analyze health trajectory and pathogen trends for ${cropData.name}`
    );

    // Save investigation record
    const invId = 'inv_' + Math.random().toString(36).slice(2, 14);
    const investigationData = {
      userId: user.id,
      cropId: cropData.id,
      request: userRequest || `Analyze health trajectory and pathogen trends for ${cropData.name}`,
      steps: result.steps,
      finding: result.finding,
      metrics: result.metrics,
      date: new Date().toISOString()
    };
    
    await firestore.collection('investigations').doc(invId).set(investigationData);

    res.json({id: invId, ...investigationData});
  } catch (err: any) {
    console.error('Agent investigation error', err);
    res.status(500).json({ error: err.message || 'Agent investigation failed' });
  }
});

// Get past investigations
aiRouter.get('/agent/investigations', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const invsSnap = await firestore.collection('investigations').where('userId', '==', user.id).orderBy('date', 'desc').get();
    const investigations = invsSnap.docs.map(doc => ({id: doc.id, ...doc.data()}));
    res.json(investigations);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch investigations' });
  }
});
