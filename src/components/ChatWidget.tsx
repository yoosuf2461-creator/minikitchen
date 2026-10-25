'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessageInput } from '@/lib/gemini';

interface Message extends ChatMessageInput {
  id: string;
  timestamp: string;
  modelUsed?: string;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content:
        "Good evening. I am **Remy**, your AI Culinary Concierge at MiniKitchen.\n\nI can assist you with our seasonal menu, wine pairings, dietary requirements, or help you place a **table reservation**.\n\nHow may I assist your dining plans today?",
      timestamp: 'Just now',
      modelUsed: 'MiniKitchen Concierge Engine',
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    'What are your vegetarian dishes?',
    'What are your service hours today?',
    'Reserve a table for 2 guests tonight',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isTyping) return;

    const userMsg: Message = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const history = [...messages, userMsg].map(({ role, content }) => ({ role, content }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });

      const data = await res.json();

      const assistantMsg: Message = {
        id: 'msg-' + (Date.now() + 1),
        role: 'assistant',
        content: data.reply || 'Pardon me, please allow me a moment to re-check with our host team.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data.modelUsed,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: 'msg-' + (Date.now() + 1),
          role: 'assistant',
          content: 'Pardon me, our communication channel had a momentary interruption. Please feel free to try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // Format simple markdown (bold, lists, code) without heavy library
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');

    return (
      <div className="space-y-2 text-xs sm:text-[13px] font-body font-light leading-relaxed">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-1" />;

          // Highlight PENDING status warnings
          const isWarning = line.includes('PENDING') || line.includes('⚠️');

          // Process bold markers
          const parts = line.split(/(\*\*.*?\*\*)/g);

          return (
            <p
              key={idx}
              className={`m-0 ${
                isWarning
                  ? 'text-[#f1f1f1] border-l-2 border-[#d4cebe] pl-2.5 py-1 bg-white/5'
                  : 'text-[#bdb8b0]'
              }`}
            >
              {parts.map((part, pIdx) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return (
                    <strong key={pIdx} className="text-[#f1f1f1] font-normal">
                      {part.slice(2, -2)}
                    </strong>
                  );
                }
                if (part.startsWith('`') && part.endsWith('`')) {
                  return (
                    <code key={pIdx} className="bg-black/50 px-1 py-0.5 text-[#d4cebe] font-mono text-[11px]">
                      {part.slice(1, -1)}
                    </code>
                  );
                }
                return part;
              })}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50">
      
      {/* Floating Trigger Button (Matches Mayot circular action button) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open AI Concierge"
          className="group relative w-16 h-16 md:w-20 md:h-20 rounded-full border border-white/30 bg-[#161514] hover:bg-[#f1f1f1] hover:text-[#121110] text-[#f1f1f1] flex flex-col items-center justify-center gap-0.5 shadow-2xl transition-all duration-300 cursor-pointer select-none"
        >
          {/* Subtle live indicator dot */}
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#d4cebe] border border-[#161514]" />
          
          <span className="text-[8px] md:text-[9px] uppercase tracking-wider font-body font-light leading-tight group-hover:text-[#121110] transition-colors">
            Remy
            <br />
            AI Host
          </span>
          <svg
            className="w-3.5 h-3.5 group-hover:text-[#121110] transition-colors mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.75.75 0 01-.82-.67 6.46 6.46 0 01.442-2.316C3.765 16.48 3 14.364 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
            />
          </svg>
        </button>
      )}

      {/* Chat Window Panel (Anti-Slop: clean architectural frame, high contrast) */}
      {isOpen && (
        <div className="w-[clamp(320px,92vw,410px)] h-[560px] bg-[#161514] border border-white/20 shadow-2xl flex flex-col relative overflow-hidden transition-all duration-300">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#131211]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full border border-white/20 bg-white/5 flex items-center justify-center font-disp text-base text-[#f1f1f1]">
                R
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <h4 className="font-disp text-lg text-[#f1f1f1] tracking-wide m-0">
                    Remy
                  </h4>
                  <span className="text-[9px] uppercase tracking-widest text-[#8a857e]">
                    AI Concierge
                  </span>
                </div>
                <p className="text-[10px] text-[#8a857e] font-body m-0">
                  Artisanal Dining Host • Online
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 flex items-center justify-center text-[#8a857e] hover:text-[#f1f1f1] transition-colors cursor-pointer text-sm"
              aria-label="Close Concierge"
            >
              ✕
            </button>
          </div>

          {/* Messages Stream */}
          <div data-lenis-prevent className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] p-3.5 ${
                    msg.role === 'user'
                      ? 'bg-[#262422] text-[#f1f1f1] border border-white/10'
                      : 'bg-[#1b1a19] text-[#bdb8b0] border border-white/10'
                  }`}
                >
                  {renderFormattedContent(msg.content)}
                </div>

                <div className="flex items-center gap-2 mt-1 px-1 text-[9px] text-[#6b6760]">
                  <span>{msg.timestamp}</span>
                  {msg.modelUsed && msg.role === 'assistant' && (
                    <span>• {msg.modelUsed}</span>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-[#8a857e] font-body italic p-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#bdb8b0] animate-pulse" />
                <span>Remy is conferring with the kitchen...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div className="px-4 py-2 border-t border-white/5 flex gap-2 overflow-x-auto no-scrollbar">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSend(prompt)}
                disabled={isTyping}
                className="whitespace-nowrap text-[10px] uppercase tracking-wider text-[#8a857e] hover:text-[#f1f1f1] border border-white/10 hover:border-white/30 px-2.5 py-1 transition-colors cursor-pointer shrink-0 disabled:opacity-40"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 border-t border-white/10 flex items-center gap-2 bg-[#131211]"
          >
            <input
              type="text"
              placeholder="Inquire about dishes, dietary needs, or book a table..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isTyping}
              className="flex-1 bg-[#1a1918] border border-white/15 px-3.5 py-2.5 text-xs text-[#f1f1f1] placeholder-[#6b6760] font-body focus:border-white/50 focus:outline-none transition-colors"
            />

            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="px-4 py-2.5 border border-[#f1f1f1] bg-[#f1f1f1] hover:bg-transparent text-[#121110] hover:text-[#f1f1f1] text-xs uppercase tracking-widest font-normal transition-all duration-200 cursor-pointer disabled:opacity-30 shrink-0"
            >
              Send
            </button>
          </form>

        </div>
      )}

    </div>
  );
}
