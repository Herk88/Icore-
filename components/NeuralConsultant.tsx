
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { BrainCircuit, Send, Loader2, Bot, User, Sparkles, Terminal, WifiOff } from 'lucide-react';

interface Message {
  role: 'user' | 'model';
  text: string;
}

const NeuralConsultant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Neural Link established. I am the 1Man1Machine AI Tuning Consultant. How can I optimize your performance today?" }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  const handleSend = async () => {
    if (!input.trim() || isThinking || !isOnline) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsThinking(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [...messages, { role: 'user', text: userMessage }].map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        })),
        config: {
          systemInstruction: "You are the 1Man1Machine Neural Consultant, an elite expert in HID optimization, DualSense controller mapping, and competitive gaming strategy. You specialize in explaining complex tuning concepts like response curves, deadzones, and neural magnet snap algorithms. Be technical, helpful, and maintain a professional cyber-ops tone.",
          thinkingConfig: { thinkingBudget: 32768 }
        },
      });

      const aiText = response.text || "Neural connection interrupted. Please re-query.";
      setMessages(prev => [...prev, { role: 'model', text: aiText }]);
    } catch (error) {
      console.error("Neural Query Failed:", error);
      setMessages(prev => [...prev, { role: 'model', text: "FATAL_ERROR: Neural Pipeline saturated. Check console logs." }]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="flex flex-col h-[700px] glass rounded-[3.5rem] border border-white/5 shadow-2xl overflow-hidden relative animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />
      
      {/* Header */}
      <div className="p-8 bg-slate-950/50 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-500/20 rounded-2xl border border-purple-500/30">
            <BrainCircuit className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Neural Intelligence</h3>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Powered by Gemini 3 Pro // Hernan H Edition</p>
          </div>
        </div>
        
        {isOnline ? (
          <div className="flex items-center gap-3 px-4 py-2 bg-blue-500/10 rounded-full border border-blue-500/20">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Neural Link Synchronized</span>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-4 py-2 bg-red-500/10 rounded-full border border-red-500/20">
            <WifiOff className="w-3.5 h-3.5 text-red-400" />
            <span className="text-[9px] font-black text-red-400 uppercase tracking-widest">Neural Link Offline</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar bg-slate-900/10"
      >
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-5 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
              msg.role === 'user' ? 'bg-blue-600/20 border-blue-500/30' : 'bg-slate-800 border-white/5 shadow-xl'
            }`}>
              {msg.role === 'user' ? <User className="w-5 h-5 text-blue-400" /> : <Bot className="w-5 h-5 text-purple-400" />}
            </div>
            <div className={`max-w-[80%] p-6 rounded-3xl text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-blue-600/10 text-blue-100 border border-blue-500/20' 
                : 'bg-slate-950/50 text-slate-300 border border-white/5'
            }`}>
              {msg.text.split('\n').map((line, j) => <p key={j} className={j > 0 ? 'mt-3' : ''}>{line}</p>)}
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="flex gap-5 animate-in fade-in duration-300">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-800 border border-white/5 shrink-0">
              <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
            </div>
            <div className="p-6 rounded-3xl bg-slate-950/50 text-slate-500 border border-white/5 flex items-center gap-3">
              <Terminal className="w-4 h-4 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Agent is thinking... analyzing hardware vectors...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-8 bg-slate-950/80 border-t border-white/5 backdrop-blur-xl">
        <div className="relative group">
          <input 
            type="text" 
            value={input}
            disabled={!isOnline}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isOnline ? "Ask about response curves, macros, or combat strategies..." : "Neural Consultant requires an active sync link to query cloud intelligence."}
            className={`w-full bg-slate-900 border border-white/10 p-6 pr-20 rounded-3xl font-bold text-[13px] text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all ${!isOnline ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
          <button 
            onClick={handleSend}
            disabled={isThinking || !input.trim() || !isOnline}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-500 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-blue-600/20"
          >
            {isOnline ? <Send className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NeuralConsultant;
