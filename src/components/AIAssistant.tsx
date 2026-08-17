/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import ResearchIntegrityBanner from './ResearchIntegrityBanner';
import { postWithAiRouting } from '../lib/localAiService';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const cached = localStorage.getItem('scholar_assistant_chat');
    return cached ? JSON.parse(cached) : [
      {
        id: 'initial',
        role: 'model',
        text: "Greetings. I am your AI writing, research, and project mentor. Whether you need to structure your methodology, reframe your project scope, overcome creative block, or prepare for presentations, I am here to assist with structured and supportive guidance. How can I support your project today?",
        timestamp: new Date().toISOString()
      }
    ];
  });
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Quick preset questions to guide scholars
  const starterPrompts = [
    "How do I narrow down my thesis scope?",
    "I'm feeling stuck on my methodology. What steps can I take?",
    "Help me draft an introductory outline for my project.",
    "How can I manage writing anxiety and perfectionism?",
  ];

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('scholar_assistant_chat', JSON.stringify(messages));
  }, [messages]);

  // Scroll to bottom on message load/change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      role: 'user',
      text: textToSend,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const customGuidance = localStorage.getItem('scholar_custom_guidance') || '';
      
      // We pass the history mapped to role and text
      const historyPayload = messages.map(m => ({
        role: m.role,
        text: m.text
      }));

      const response = await postWithAiRouting('/api/gemini/chat', {
        message: textToSend,
        history: historyPayload,
        customGuidance
      });

      if (response.ok) {
        const data = await response.json();
        const modelMsg: ChatMessage = {
          id: Math.random().toString(),
          role: 'model',
          text: data.text || "I was unable to synthesise a proper response. Please try again.",
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, modelMsg]);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to communicate with AI Assistant');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Connection lost. Please make sure your server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (confirm('Permanently clear your conversation history?')) {
      const defaultInitial: ChatMessage[] = [
        {
          id: 'initial',
          role: 'model',
          text: "Greetings. I am your AI writing, research, and project mentor. Whether you need to structure your methodology, reframe your project scope, overcome creative block, or prepare for presentations, I am here to assist with structured and supportive guidance. How can I support your project today?",
          timestamp: new Date().toISOString()
        }
      ];
      setMessages(defaultInitial);
      localStorage.setItem('scholar_assistant_chat', JSON.stringify(defaultInitial));
    }
  };

  return (
    <div className="w-full flex flex-col h-[calc(100vh-120px)] font-sans space-y-6 text-left" id="ai-assistant-module">
      
      {/* Header Panel - Unboxed and aligned to X value of title */}
      <div className="shrink-0 space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="font-sans font-medium text-2xl sm:text-3xl tracking-tight text-stone-900 dark:text-stone-100" id="ai-page-title">
              Ask AI
            </h1>
            <p className="font-sans text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
              Consult your dedicated guide for writing methods, structures, and mental clarity.
            </p>
          </div>
          
          <button
            onClick={handleClearHistory}
            className="text-[11px] font-sans text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 transition-colors cursor-pointer border border-stone-200 dark:border-stone-800 px-3 py-1.5 rounded-md hover:bg-stone-100 dark:hover:bg-stone-900"
            title="Clear active session"
          >
            Clear History
          </button>
        </div>

        {/* Starting points placed directly under 'Consult your...' subtitle */}
        <div className="pt-2">
          <span className="text-xs font-medium text-stone-600 dark:text-stone-400 block mb-2">
            Starting points:
          </span>
          <div className="flex flex-wrap gap-2">
            {starterPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSendMessage(prompt)}
                className="font-sans text-xs border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60 hover:border-[#912A4A] text-stone-700 dark:text-stone-300 px-3.5 py-1.5 rounded-md transition-all cursor-pointer text-left"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <ResearchIntegrityBanner compact />
        </div>
      </div>

      {/* Main chat log - Unboxed and aligned with title */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-5 min-h-0">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-3.5 max-w-3xl animate-fadeIn ${
              m.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
            }`}
          >
            {/* Role indicator */}
            <div className={`px-2 py-0.5 rounded text-[11px] font-semibold shrink-0 ${
              m.role === 'user' 
                ? 'bg-[#1B0A3B] text-white' 
                : 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border border-stone-200 dark:border-stone-700'
            }`}>
              {m.role === 'user' ? 'You' : 'AI'}
            </div>

            {/* Bubble */}
            <div className={`p-4 rounded-lg text-left ${
              m.role === 'user'
                ? 'bg-[#1B0A3B]/10 dark:bg-stone-800 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-700'
                : 'bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-800'
            }`}>
              <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-line font-sans">
                {m.text}
              </p>
              
              <div className="mt-2 pt-1 flex justify-end">
                <span className="text-[10px] font-mono text-stone-400">
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-3.5 mr-auto animate-fadeIn">
            <div className="px-2 py-0.5 rounded text-[11px] font-semibold bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border border-stone-200 dark:border-stone-700 shrink-0">
              AI
            </div>
            <div className="p-4 rounded-lg bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 italic text-xs flex items-center gap-2">
              Your advisor is synthesizing structured guidance...
            </div>
          </div>
        )}

        {error && (
          <div className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg text-xs text-red-700 dark:text-red-400 flex items-start gap-2 max-w-xl animate-fadeIn">
            <div>
              <p className="font-semibold">Unable to consult advisor</p>
              <p className="mt-0.5 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input container */}
      <div className="shrink-0 pt-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim() && !isLoading) {
              handleSendMessage(input.trim());
            }
          }}
          className="relative flex items-center"
        >
          <label htmlFor="ai-chat-input" className="sr-only">Type a message to your mentor</label>
          <input
            id="ai-chat-input"
            type="text"
            placeholder="Ask your mentor anything about your writing, research methods, chapters, or blockages..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="w-full font-sans text-xs sm:text-sm p-3.5 pr-24 border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-900 text-stone-850 dark:text-stone-100 focus:outline-none focus:border-[#912A4A] disabled:opacity-60"
            required
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 px-4 py-2 rounded-md bg-[#912A4A] hover:bg-[#78223d] text-white text-xs font-medium disabled:opacity-40 transition-colors cursor-pointer"
            title="Send query"
          >
            Send
          </button>
        </form>
      </div>

    </div>
  );
}
