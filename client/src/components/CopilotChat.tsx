import React, { useState } from 'react';
import { Send, Bot, Sparkles } from 'lucide-react';

interface Message {
  role: 'assistant' | 'user';
  content: string;
}


const CopilotChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! I'm your AI Farm Operations Copilot. I've analyzed today's data and prepared an action plan. What would you like to know?" }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: 'user', content: input } as Message];
    setMessages(newMessages);
    setInput('');

    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I recommend following the prioritized task list. The soil moisture trend suggests we should focus on the North Sector first."
      }]);
    }, 1000);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[500px]">
      <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-earth-dark rounded-t-2xl">
        <div className="flex items-center space-x-2">
          <div className="bg-earth-light p-1.5 rounded-lg">
            <Bot size={18} className="text-earth-dark" />
          </div>
          <h2 className="text-white font-bold">AI Copilot Chat</h2>
        </div>
        <Sparkles size={16} className="text-earth-sand animate-pulse" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user'
              ? 'bg-earth-main text-white rounded-tr-none'
              : 'bg-gray-100 text-gray-800 rounded-tl-none border border-gray-200'
              }`}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-50">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="What should I do today?"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-earth-main focus:border-transparent transition-all"
          />
          <button
            onClick={handleSend}
            className="absolute right-2 top-1.5 p-2 bg-earth-main text-white rounded-lg hover:bg-earth-dark transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CopilotChat;
