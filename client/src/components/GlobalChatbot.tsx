import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import {
  Send, X, Bot, Sparkles, Sprout,
  RefreshCcw, User, CheckCircle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'assistant' | 'user';
  content: string;
}

const GlobalChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! I am your FarmCopilot Agent. I can help you with local weather, soil health, water pH, crop recommendations, and any other agricultural parameters you need." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Get current location from localStorage if available
      const location = localStorage.getItem('farm_location') || 'Ludhiana';

      const response = await axios.post('http://localhost:8000/kisaan-ai', {
        query: input,
        location: location,
        language: "English",
        mode: "global"
      });

      const aiMsg: Message = {
        role: 'assistant',
        content: response.data.response
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having a bit of trouble connecting to my sensors. Please try again in a moment."
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] font-sans">
      {/* Chat Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group bg-earth-main text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          <Bot size={28} className="relative z-10" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white w-[400px] h-[600px] rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-gray-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-12 fade-in duration-500">
          {/* Header */}
          <div className="bg-earth-dark p-6 text-white flex items-center justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
              <Sprout size={100} />
            </div>

            <div className="flex items-center space-x-4 relative z-10">
              <div className="bg-earth-main/20 p-2 rounded-2xl border border-white/20">
                <Bot size={24} className="text-white" />
              </div>
              <div>
                <h3 className="font-black text-lg tracking-tight">FarmCopilot Agent</h3>
                <div className="flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-100/70">Online </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors relative z-10"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth bg-gray-50/50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] flex items-start space-x-3 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-earth-dark text-white' : 'bg-white text-earth-main border border-gray-100'
                    }`}>
                    {msg.role === 'user' ? <User size={16} /> : <Sprout size={16} />}
                  </div>
                  <div className={`p-4 rounded-2xl text-xs leading-relaxed shadow-sm ${msg.role === 'user'
                    ? 'bg-earth-main text-white rounded-tr-none'
                    : 'bg-white text-gray-700 rounded-tl-none border border-gray-100'
                    }`}>
                    <div className="prose prose-xs max-w-none">
                      <ReactMarkdown
                        components={{
                          p: ({ node, ...props }: any) => <p className="mb-2 last:mb-0" {...props} />,
                          ul: ({ node, ...props }: any) => <ul className="list-disc ml-4 mb-2 space-y-1" {...props} />,
                          strong: ({ node, ...props }: any) => <strong className="font-black text-earth-dark" {...props} />
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-earth-main shadow-sm animate-spin">
                  <RefreshCcw size={16} />
                </div>
                <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm">
                  <div className="flex space-x-1">
                    {[1, 2, 3].map(i => <div key={i} className="w-1 h-1 bg-earth-main/40 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />)}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-6 bg-white border-t border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 pl-4 pr-12 text-sm font-medium text-gray-700 focus:outline-none focus:ring-4 focus:ring-earth-main/10 focus:border-earth-main transition-all"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Sparkles size={16} className="animate-pulse" />
                </div>
              </div>
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="bg-earth-main text-white p-3 rounded-xl hover:bg-earth-dark transition-all shadow-lg active:scale-95 disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </div>
            <p className="mt-3 text-[9px] text-gray-400 font-bold uppercase tracking-tight text-center flex items-center justify-center gap-1">
              <CheckCircle size={10} className="text-emerald-500" />
              Agricultural Intelligence Agent
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalChatbot;
