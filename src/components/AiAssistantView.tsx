import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Mic,
  MicOff,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  Bot,
  User as UserIcon,
  Globe,
  RotateCcw
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Crop, AIConversation, AIMessage } from '../types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

interface AiAssistantViewProps {
  preselectedCropId?: string;
}

export const AiAssistantView: React.FC<AiAssistantViewProps> = ({ preselectedCropId }) => {
  const { user } = useAuth();
  const { crops, conversations, createConversation, addMessage, getMessages } = useData();
  const [selectedCropId, setSelectedCropId] = useState<string>(preselectedCropId || '');
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<'en' | 'hi' | 'bn'>(user?.language || 'en');

  // Voice Assistant State (Section 25)
  const [isListening, setIsListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'listening' | 'thinking' | 'responding'>('idle');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Dynamic suggested prompts
  const suggestedPrompts = crops.length === 0 ? [
    'How does Phytoscan Crop Health Memory work?',
    'What crop diseases can Phytoscan detect?',
    'How often should I scan my field foliage?',
    'How do health scores track foliar recovery?'
  ] : [
    `What is the health status of ${crops[0].name}?`,
    'Which crop or plot requires immediate attention?',
    'Explain how consecutive scans calculate trajectory.',
    'What pathogen prevention steps do you recommend?'
  ];

  // Load Initial Conversation on conversation list updates
  useEffect(() => {
    if (conversations.length > 0 && !currentConversationId) {
      loadConversation(conversations[0].id);
    } else if (conversations.length === 0) {
      // Welcome message personalized to user
      setMessages([
        {
          id: 'welcome-1',
          conversationId: 'default',
          role: 'assistant',
          content: `Hello ${user?.name || 'Farmer'}! I am Phytoscan's contextual agronomy assistant. As you register crops and perform leaf scans, I will maintain continuous health memory to advise on symptoms, disease risks, and targeted interventions. What would you like to explore today?`,
          timestamp: new Date().toISOString()
        }
      ]);
    }
  }, [conversations.length]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, voiceStatus]);

  const loadConversation = async (convId: string) => {
    try {
      setCurrentConversationId(convId);
      const msgs = await getMessages(convId);
      if (msgs && msgs.length > 0) {
        setMessages(msgs);
      } else {
        const res = await api.getConversationMessages(convId);
        setMessages(res.messages);
      }
    } catch (err) {
      console.error('Failed to load conversation', err);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const message = (textToSend || inputText).trim();
    if (!message || isLoading) return;

    setInputText('');
    setVoiceStatus('thinking');

    // Resolve or create conversation
    let convId = currentConversationId;
    if (!convId) {
      try {
        const newConv = await createConversation(message.slice(0, 30), selectedCropId || undefined);
        convId = newConv.id;
        setCurrentConversationId(convId);
      } catch (e) {
        console.warn('Conversation creation notice:', e);
      }
    }

    // Optimistically add user message
    const tempUserMsg: AIMessage = {
      id: `temp-${Date.now()}`,
      conversationId: convId || 'temp',
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);
    setIsLoading(true);

    // Save user message to Firestore
    if (convId) {
      try {
        await addMessage(convId, 'user', message);
      } catch (msgErr) {
        console.warn('Firestore message save notice:', msgErr);
      }
    }

    try {
      const cropsContext = crops.map(c => ({
        name: c.name,
        cropType: c.cropType,
        variety: c.variety,
        field: c.field,
        currentHealthScore: c.currentHealthScore,
        currentRiskLevel: c.currentRiskLevel,
        totalScans: c.totalScans
      }));

      const res = await api.sendChatMessage({
        message,
        conversationId: convId,
        cropId: selectedCropId || undefined,
        language,
        cropsContext,
        history: messages.slice(-10).map(m => ({ role: m.role, content: m.content }))
      });

      const assistantMsg = res.message;
      setMessages(prev => [...prev, assistantMsg]);
      setVoiceStatus('idle');

      // Save assistant message to Firestore
      if (convId) {
        try {
          await addMessage(convId, 'assistant', assistantMsg.content);
        } catch (saveErr) {
          console.warn('Firestore assistant message save notice:', saveErr);
        }
      }

      // Optional text to speech read out
      if (window.speechSynthesis && isListening) {
        speakResponse(assistantMsg.content);
      }
    } catch (err: any) {
      console.error('Chat error', err);
      setVoiceStatus('idle');
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          conversationId: convId || 'err',
          role: 'assistant',
          content: 'Sorry, I encountered an issue analyzing your request. Please try again.',
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Text-To-Speech
  const speakResponse = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    // Clean markdown for speech
    const cleanText = text.replace(/[*#_`[\]]/g, '').slice(0, 300);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language === 'hi' ? 'hi-IN' : language === 'bn' ? 'bn-IN' : 'en-US';

    utterance.onstart = () => {
      setIsSpeaking(true);
      setVoiceStatus('responding');
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setVoiceStatus('idle');
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setVoiceStatus('idle');
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setVoiceStatus('idle');
    }
  };

  // Speech Recognition (Voice Input)
  const toggleVoiceAssistant = () => {
    if (isSpeaking) {
      stopSpeaking();
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use text input.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      setVoiceStatus('idle');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'hi' ? 'hi-IN' : language === 'bn' ? 'bn-IN' : 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceStatus('listening');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        setVoiceStatus('thinking');
        handleSendMessage(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error', event.error);
        setIsListening(false);
        setVoiceStatus('idle');
      };

      recognition.onend = () => {
        setIsListening(false);
        if (voiceStatus === 'listening') {
          setVoiceStatus('idle');
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Speech recognition startup error', err);
      setIsListening(false);
      setVoiceStatus('idle');
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto h-[calc(100vh-5rem)] flex flex-col gap-4">
      
      {/* Top Context & Language Bar */}
      <div className="p-4 rounded-2xl bg-white border border-[#2D6A4F]/10 shadow-xs flex flex-wrap items-center justify-between gap-3 shrink-0 min-w-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-xl bg-[#1B4332] text-[#74C69D] flex items-center justify-center shrink-0">
            <Bot className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-outfit text-sm font-bold text-[#132A13] break-words">
              Phytoscan Agronomy Assistant
            </h2>
            <p className="text-[11px] text-[#52796F] break-words">
              Grounded in continuous crop health memory & field surveillance
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 max-w-full">
          {/* Crop Context Picker */}
          <select
            value={selectedCropId}
            onChange={e => setSelectedCropId(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold outline-none bg-white text-[#132A13] max-w-full truncate"
          >
            <option value="">All Farm Crops Context</option>
            {crops.map(c => (
              <option key={c.id} value={c.id}>
                Context: {c.name} ({c.currentHealthScore}/100)
              </option>
            ))}
          </select>

          {/* Language Selector */}
          <div className="flex items-center bg-[#F0F4F1] rounded-xl p-1 text-xs shrink-0">
            {(['en', 'hi', 'bn'] as const).map(l => (
              <button
                key={l}
                onClick={() => setLanguage(l)}
                className={`px-2 py-1 rounded-lg font-bold uppercase transition-colors ${
                  language === l ? 'bg-[#1B4332] text-white shadow-2xs' : 'text-[#52796F] hover:text-[#132A13]'
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Reset chat */}
          <button
            onClick={() => {
              setCurrentConversationId(undefined);
              setMessages([
                {
                  id: `welcome-${Date.now()}`,
                  conversationId: 'default',
                  role: 'assistant',
                  content: 'Conversation cleared. How can I assist your crop management today?',
                  timestamp: new Date().toISOString()
                }
              ]);
            }}
            className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            title="Start New Topic"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Voice Assistant Interactive Visualizer Bar (Section 25) */}
      {voiceStatus !== 'idle' && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white flex items-center justify-between shadow-md shrink-0 animate-in fade-in">
          <div className="flex items-center gap-3">
            {/* Animated Equalizer Waves */}
            <div className="flex items-center gap-1 h-5">
              <span className="w-1 bg-[#74C69D] rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-5" />
              <span className="w-1 bg-[#74C69D] rounded-full animate-[pulse_0.4s_ease-in-out_infinite] h-3" />
              <span className="w-1 bg-[#74C69D] rounded-full animate-[pulse_0.8s_ease-in-out_infinite] h-6" />
              <span className="w-1 bg-[#74C69D] rounded-full animate-[pulse_0.5s_ease-in-out_infinite] h-4" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#74C69D]">
                Voice Assistant
              </span>
              <p className="text-xs text-[#D8F3DC] font-medium">
                {voiceStatus === 'listening' && 'Listening to your question...'}
                {voiceStatus === 'thinking' && 'Consulting crop records and Gemini models...'}
                {voiceStatus === 'responding' && 'Speaking response...'}
              </p>
            </div>
          </div>

          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="px-3 py-1 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <VolumeX className="w-3.5 h-3.5" />
              <span>Mute</span>
            </button>
          )}
        </div>
      )}

      {/* Messages Transcript Scroll Area */}
      <div className="flex-1 bg-white rounded-3xl border border-[#2D6A4F]/10 shadow-xs p-4 sm:p-6 overflow-y-auto space-y-4">
        {messages.map((msg, i) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id || i}
              className={`flex gap-2.5 sm:gap-3 max-w-2xl min-w-0 ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                  isUser
                    ? 'bg-[#2D6A4F] text-white'
                    : 'bg-[#D8F3DC] text-[#1B4332]'
                }`}
              >
                {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`p-4 rounded-2xl text-xs leading-relaxed min-w-0 break-words ${
                  isUser
                    ? 'bg-[#1B4332] text-white rounded-tr-none'
                    : 'bg-[#F8FAF8] text-[#132A13] border border-[#2D6A4F]/10 rounded-tl-none'
                }`}
              >
                {isUser ? (
                  <p className="break-words">{msg.content}</p>
                ) : (
                  <div className="space-y-2 min-w-0 break-words">
                    <ReactMarkdown
                      components={{
                        p: ({ node, ...props }) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                        ul: ({ node, ...props }) => <ul className="list-disc pl-4 space-y-1 my-2" {...props} />,
                        ol: ({ node, ...props }) => <ol className="list-decimal pl-4 space-y-1 my-2" {...props} />,
                        li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                        strong: ({ node, ...props }) => <strong className="font-bold text-[#1B4332]" {...props} />
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[10px] text-gray-400">
                      <span>Phytoscan AI Agronomist</span>
                      <button
                        onClick={() => speakResponse(msg.content)}
                        className="hover:text-[#1B4332] flex items-center gap-1"
                        title="Read aloud"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>Listen</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 max-w-lg">
            <div className="w-8 h-8 rounded-xl bg-[#D8F3DC] text-[#1B4332] flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-2xl bg-[#F8FAF8] border border-[#2D6A4F]/10 text-xs text-[#52796F] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>Analyzing historical crop scans and formulation...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Suggested Quick Questions */}
      {messages.length <= 2 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0">
          <span className="text-[10px] font-bold text-[#52796F] uppercase tracking-wider shrink-0">
            Suggested:
          </span>
          {suggestedPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(prompt)}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#D8F3DC]/40 border border-[#2D6A4F]/15 text-[11px] text-[#1B4332] font-semibold whitespace-nowrap transition-colors shadow-2xs"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Chat Input Box with Voice Mic Trigger */}
      <div className="p-2 rounded-2xl bg-white border border-[#2D6A4F]/20 shadow-lg flex items-center gap-2 shrink-0">
        <button
          onClick={toggleVoiceAssistant}
          className={`p-2.5 rounded-xl transition-all ${
            isListening
              ? 'bg-rose-600 text-white animate-pulse'
              : 'bg-[#F0F4F1] hover:bg-[#D8F3DC] text-[#1B4332]'
          }`}
          title={isListening ? 'Stop listening' : 'Start voice input (English, Hindi, Bengali)'}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <input
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleSendMessage();
          }}
          placeholder={`Ask about crop health, trajectory, or recommendations in ${language === 'hi' ? 'Hindi' : language === 'bn' ? 'Bengali' : 'English'}...`}
          className="flex-1 px-3 py-2 text-sm text-[#132A13] placeholder-gray-400 outline-none bg-transparent"
        />

        <button
          onClick={() => handleSendMessage()}
          disabled={!inputText.trim() || isLoading}
          className="p-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white disabled:opacity-40 transition-colors shadow-md shadow-[#2D6A4F]/20"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
