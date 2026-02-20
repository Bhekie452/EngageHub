import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Send,
  Mic,
  MessageSquare,
  Bot,
  MicOff,
  Volume2,
} from 'lucide-react';

interface AISalesChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const KNOWLEDGE_BASE: { keywords: string[]; response: string }[] = [
  {
    keywords: ['pricing', 'price', 'cost', 'plan', 'plans', 'subscription', 'pay', 'afford', 'cheap', 'expensive'],
    response:
      'We offer three flexible, usage-based plans:\n\n⭐ **Starter** — R549/mo\nPerfect for solo creators & small brands getting started.\n\n🚀 **Professional** — R1,499/mo\nIdeal for growing teams with advanced analytics & AI tools.\n\n🏢 **Business** — R2,849/mo\nFull-suite access with priority support & custom integrations.\n\nAll plans include a **14-day free trial** — no credit card required!',
  },
  {
    keywords: ['trial', 'free', 'demo', 'test', 'try'],
    response:
      "Great news! EngageHub offers a **14-day free trial** with full access to all features — no credit card required. It's the easiest way to see how EngageHub can transform your social media workflow. Ready to get started?",
  },
  {
    keywords: ['social', 'platform', 'instagram', 'tiktok', 'youtube', 'facebook', 'linkedin', 'twitter', 'connect', 'channel', 'network'],
    response:
      'EngageHub connects all your social channels in one place! We support:\n\n📸 Instagram\n🎵 TikTok\n📺 YouTube\n📘 Facebook\n✖️ X (Twitter)\n💼 LinkedIn\n\nConnect your accounts in seconds and manage everything — scheduling, publishing, engagement — from a single dashboard.',
  },
  {
    keywords: ['crm', 'customer', 'lead', 'contact', 'pipeline', 'deal', 'relationship'],
    response:
      "Our built-in **CRM** helps you turn followers into customers. Track leads, manage your sales pipeline, store customer information, and log every interaction — all without leaving EngageHub. It's social selling made simple.",
  },
  {
    keywords: ['task', 'project', 'manage', 'team', 'collaborate', 'assign', 'workflow'],
    response:
      'EngageHub includes powerful **task & project management** tools. Assign tasks to team members, set deadlines, track progress, and streamline your content approval workflow — all integrated with your social calendar.',
  },
  {
    keywords: ['ai', 'generate', 'content', 'create', 'write', 'caption', 'post', 'automate', 'automation', 'smart'],
    response:
      'Our **AI-powered content engine** is a game-changer! 🤖\n\n• Generate captions, hashtags & post ideas in seconds\n• AI-optimised scheduling for peak engagement\n• Smart content suggestions based on your audience\n• Automated post creation across all platforms\n\nSpend less time creating, more time growing.',
  },
  {
    keywords: ['analytics', 'insight', 'report', 'data', 'metric', 'performance', 'growth', 'track', 'roi'],
    response:
      'EngageHub delivers **real-time analytics & insights** across every connected platform:\n\n📊 Engagement rates & audience growth\n📈 Post performance & best times to publish\n🎯 ROI tracking & conversion metrics\n📋 Custom reports you can export & share\n\nMake every decision data-driven.',
  },
  {
    keywords: ['contact', 'support', 'help', 'email', 'reach', 'talk', 'human', 'agent', 'phone'],
    response:
      "We'd love to hear from you! Reach our team at:\n\n📧 **info@engagehub.co**\n\nOur support team typically responds within a few hours during business days. For urgent issues, Professional & Business plan members get priority support.",
  },
  {
    keywords: ['feature', 'what', 'do', 'offer', 'about', 'tell', 'overview', 'capability'],
    response:
      "EngageHub is your **all-in-one social media marketing automation** platform. Here's what you get:\n\n🔗 Multi-platform management (6+ networks)\n🤖 AI-powered content creation\n📊 Advanced analytics & reporting\n👥 Built-in CRM & lead tracking\n📋 Task & project management\n📅 Smart scheduling & auto-publishing\n💬 Unified inbox for all messages\n\nEverything you need to grow your brand online!",
  },
  {
    keywords: ['schedule', 'publish', 'calendar', 'queue', 'post time', 'when'],
    response:
      'Scheduling content is effortless with EngageHub! 📅\n\n• Drag-and-drop content calendar\n• Bulk scheduling for weeks ahead\n• AI-recommended optimal posting times\n• Auto-publishing across all platforms\n• Queue system so you never miss a day\n\nPlan once, publish everywhere.',
  },
  {
    keywords: ['inbox', 'message', 'comment', 'reply', 'engage', 'dm', 'notification'],
    response:
      'Our **unified inbox** brings all your social messages, comments, and DMs into one stream. Reply to Instagram comments, Facebook messages, and more — without ever switching tabs. Stay responsive and build stronger relationships.',
  },
  {
    keywords: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'greetings'],
    response:
      "Hey there! 👋 Welcome to EngageHub! I'm here to help you learn about our social media marketing platform. Feel free to ask about features, pricing, integrations, or anything else!",
  },
  {
    keywords: ['thanks', 'thank', 'awesome', 'great', 'cool', 'perfect', 'appreciate'],
    response:
      "You're welcome! 😊 If you have any other questions about EngageHub, feel free to ask. I'm here to help! You can also reach our team at info@engagehub.co.",
  },
  {
    keywords: ['compare', 'competitor', 'buffer', 'hootsuite', 'sprout', 'later', 'alternative', 'better', 'different', 'vs'],
    response:
      'What sets EngageHub apart?\n\n✅ **All-in-one platform** — social management, CRM, tasks & AI in a single tool\n✅ **AI-first approach** — content generation & smart scheduling built in\n✅ **Affordable** — competitive pricing with no hidden fees\n✅ **Built-in CRM** — most competitors charge extra for this\n✅ **Local support** — dedicated team that understands your market\n\nWhy juggle five tools when one does it all?',
  },
];

const DEFAULT_RESPONSE =
  "Thanks for your question! I'd be happy to help. Could you tell me more about what you're looking for? I can assist with:\n\n• Platform features & capabilities\n• Pricing & plans\n• Social media integrations\n• CRM & task management\n• AI content tools\n• Analytics & reporting\n\nOr reach us directly at **info@engagehub.co**!";

function matchResponse(input: string): string {
  const lower = input.toLowerCase();
  let bestMatch: { response: string; score: number } = { response: DEFAULT_RESPONSE, score: 0 };

  for (const entry of KNOWLEDGE_BASE) {
    const score = entry.keywords.reduce((acc, kw) => (lower.includes(kw) ? acc + 1 : acc), 0);
    if (score > bestMatch.score) {
      bestMatch = { response: entry.response, score };
    }
  }

  return bestMatch.response;
}

export const AISalesChatbot: React.FC<AISalesChatbotProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hi there! 👋 I'm the EngageHub AI assistant. I can help you learn about our social media marketing platform, pricing, features, and more. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && !isVoiceMode) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, isVoiceMode]);

  const addMessage = useCallback(
    (role: 'user' | 'assistant', content: string) => {
      const msg: ChatMessage = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        role,
        content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, msg]);
      return msg;
    },
    []
  );

  const simulateResponse = useCallback(
    (userText: string) => {
      setIsTyping(true);
      const response = matchResponse(userText);
      const delay = 600 + Math.random() * 800;

      setTimeout(() => {
        addMessage('assistant', response);
        setIsTyping(false);

        if (isVoiceMode) {
          setIsSpeaking(true);
          setTimeout(() => setIsSpeaking(false), 3000 + Math.random() * 2000);
        }
      }, delay);
    },
    [addMessage, isVoiceMode]
  );

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text) return;

    addMessage('user', text);
    setInput('');
    simulateResponse(text);
  }, [input, addMessage, simulateResponse]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleVoice = () => {
    setIsVoiceMode((prev) => !prev);
    setIsListening(false);
    setIsSpeaking(false);
    setVoiceTranscript('');
  };

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      if (voiceTranscript.trim()) {
        addMessage('user', voiceTranscript.trim());
        simulateResponse(voiceTranscript.trim());
        setVoiceTranscript('');
      }
    } else {
      setIsListening(true);
      setIsSpeaking(false);
      // Simulate voice transcript appearing
      const sampleQueries = [
        'What are your pricing plans?',
        'Tell me about your features',
        'Do you offer a free trial?',
        'How does the AI content creation work?',
        'What social platforms do you support?',
      ];
      const chosen = sampleQueries[Math.floor(Math.random() * sampleQueries.length)];
      let i = 0;
      const interval = setInterval(() => {
        if (i <= chosen.length) {
          setVoiceTranscript(chosen.slice(0, i));
          i++;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            setIsListening(false);
            addMessage('user', chosen);
            simulateResponse(chosen);
            setVoiceTranscript('');
          }, 500);
        }
      }, 50);
    }
  };

  const formatMessageContent = (content: string) => {
    // Basic markdown-like formatting
    return content.split('\n').map((line, i) => {
      // Bold
      const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return (
        <span key={i}>
          <span dangerouslySetInnerHTML={{ __html: formatted }} />
          {i < content.split('\n').length - 1 && <br />}
        </span>
      );
    });
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Chat panel */}
      <div
        className={`fixed bottom-4 right-4 z-50 flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
        }`}
        style={{ width: '400px', height: '550px', maxWidth: 'calc(100vw - 2rem)', maxHeight: 'calc(100vh - 2rem)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm leading-tight">EngageHub AI</h3>
              <p className="text-[11px] text-indigo-100">Sales Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleVoice}
              className={`p-2 rounded-full transition-colors ${
                isVoiceMode
                  ? 'bg-white/25 text-white'
                  : 'hover:bg-white/15 text-white/80'
              }`}
              title={isVoiceMode ? 'Switch to text chat' : 'Switch to voice mode'}
            >
              {isVoiceMode ? <MessageSquare className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/15 text-white/80 transition-colors"
              title="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col min-h-0">
          {!isVoiceMode ? (
            <>
              {/* Messages area */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50/50">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-indigo-600 text-white rounded-br-md'
                          : 'bg-white text-gray-700 border border-gray-100 shadow-sm rounded-bl-md'
                      }`}
                    >
                      {formatMessageContent(msg.content)}
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white text-gray-400 border border-gray-100 shadow-sm px-4 py-3 rounded-2xl rounded-bl-md">
                      <div className="flex gap-1.5 items-center">
                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Text input */}
              <div className="px-3 py-3 border-t border-gray-100 bg-white flex-shrink-0">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about EngageHub..."
                    className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="p-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 flex-shrink-0"
                    title="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Voice mode */
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-4 bg-gradient-to-b from-gray-50 to-white">
              {/* Animated avatar */}
              <div className="relative mb-6">
                {/* Pulse rings */}
                <div
                  className={`absolute inset-0 rounded-full transition-all duration-500 ${
                    isSpeaking
                      ? 'animate-ping bg-indigo-400/20'
                      : isListening
                      ? 'animate-pulse bg-blue-400/20'
                      : ''
                  }`}
                  style={{ transform: 'scale(1.6)' }}
                />
                <div
                  className={`absolute inset-0 rounded-full transition-all duration-700 ${
                    isSpeaking
                      ? 'animate-pulse bg-indigo-400/15'
                      : isListening
                      ? 'animate-pulse bg-blue-400/10'
                      : ''
                  }`}
                  style={{ transform: 'scale(1.3)', animationDelay: '200ms' }}
                />

                {/* Avatar circle */}
                <div
                  className={`relative w-28 h-28 rounded-full flex items-center justify-center transition-all duration-500 ${
                    isSpeaking
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 scale-110'
                      : isListening
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 scale-105'
                      : 'bg-gradient-to-br from-indigo-500 to-blue-600 shadow-md'
                  }`}
                >
                  {/* Simple face */}
                  <div className="flex flex-col items-center gap-2">
                    {/* Eyes */}
                    <div className="flex gap-4">
                      <div className={`w-2.5 h-2.5 rounded-full bg-white transition-all ${isListening ? 'scale-125' : ''}`} />
                      <div className={`w-2.5 h-2.5 rounded-full bg-white transition-all ${isListening ? 'scale-125' : ''}`} />
                    </div>
                    {/* Mouth */}
                    <div
                      className={`bg-white/90 rounded-full transition-all duration-300 ${
                        isSpeaking
                          ? 'w-5 h-3 animate-pulse'
                          : isListening
                          ? 'w-4 h-1.5'
                          : 'w-6 h-1.5 rounded-full'
                      }`}
                      style={
                        !isSpeaking && !isListening
                          ? { borderRadius: '0 0 999px 999px', height: '6px' }
                          : {}
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Status text */}
              <p className="text-sm font-medium text-gray-600 mb-1">
                {isSpeaking
                  ? 'Speaking...'
                  : isListening
                  ? 'Listening...'
                  : 'Tap the mic to speak'}
              </p>

              {/* Transcript */}
              {voiceTranscript && (
                <p className="text-xs text-gray-400 mb-4 text-center max-w-[80%] italic">
                  "{voiceTranscript}"
                </p>
              )}
              {!voiceTranscript && <div className="mb-4" />}

              {/* Mic button */}
              <button
                onClick={toggleListening}
                disabled={isSpeaking}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 ${
                  isListening
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 hover:bg-red-600'
                    : 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-700'
                } ${isSpeaking ? 'opacity-40 cursor-not-allowed' : ''}`}
                title={isListening ? 'Stop listening' : 'Start listening'}
              >
                {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>

              {/* Hint */}
              <p className="text-[11px] text-gray-400 mt-4 text-center">
                Voice mode simulates speech interaction.
                <br />
                Switch to text chat for full conversation.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-100 bg-white flex-shrink-0">
          <p className="text-[10px] text-gray-400 text-center">
            Powered by <span className="font-medium text-indigo-500">EngageHub AI</span>
          </p>
        </div>
      </div>

      {/* Voice mode keyframe styles */}
      <style>{`
        @keyframes chatbot-pulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.15); opacity: 1; }
        }
      `}</style>
    </>
  );
};
