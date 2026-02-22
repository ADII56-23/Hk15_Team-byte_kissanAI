import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { Link, useNavigate } from 'react-router-dom';
import {
  Send, Bot, Sparkles, RefreshCcw, User, Sprout,
  Globe, Wifi, Mic, Sun, Coins, Leaf, Bug,
  ChevronDown, CheckCircle, Square, Menu, Plus, MessageSquare, Image, Lightbulb, X, Share2, Edit2, Trash2
} from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useLanguage, languages as globalLanguages } from '../contexts/LanguageContext';

interface Message {
  role: 'assistant' | 'user';
  content: string;
  category?: string;
  image?: string; // base64 string
}

interface ChatSession {
  id: string;
  name: string;
  messages: Message[];
  timestamp: number;
}

const KisaanAIPage: React.FC = () => {
  const navigate = useNavigate();
  const { language: selectedLang, setLanguage: setSelectedLang, t } = useLanguage();
  const greeting: Message = { role: 'assistant', content: "Namaste! I am Kisaan AI, your dedicated agricultural expert. How can I help you improve your farm's productivity today?", category: "General" };

  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [messages, setMessages] = useState<Message[]>([greeting]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSidebarClosed, setIsSidebarClosed] = useState(false);
  const [showContextOpen, setShowContextOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Session State
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('kisaan_ai_sessions');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const isRecordingRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Sync sessions to localStorage
  useEffect(() => {
    localStorage.setItem('kisaan_ai_sessions', JSON.stringify(sessions));
  }, [sessions]);

  // Load session messages
  const loadSession = (session: ChatSession) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setShowContextOpen(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startNewChat = () => {
    setCurrentSessionId(null);
    setMessages([greeting]);
  };

  const handleVoiceSend = async (blob: Blob, extension: string) => {
    if (blob.size < 500) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Recording was too short. Please speak more clearly." }]);
      return;
    }
    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: '🎙️ Processing voice message...' }]);
    try {
      const location = localStorage.getItem('farm_location') || 'Gunupur';
      const history = messages
        .filter(m => !m.content.includes('🎙️ Voice message sent'))
        .map(m => ({ role: m.role, content: m.content }));

      const formData = new FormData();
      formData.append('file', blob, `recording.${extension}`);
      formData.append('location', location);
      formData.append('language', selectedLang.name);
      formData.append('lang_code', selectedLang.code);
      formData.append('mode', 'expert');
      formData.append('history', JSON.stringify(history));

      const res = await axios.post('http://localhost:8000/kisaan-ai/voice', formData);
      const { query, response: botMsg, audio } = res.data;

      if (query) {
        const userMsg: Message = { role: 'user', content: query };
        const aiMsg: Message = { role: 'assistant', content: botMsg || "Sorry, I couldn't process that.", category: 'Expert Advice' };

        // Pre-calculate the messages list to avoid state update race conditions
        const baseMessages = messages.filter(m => !m.content.includes('Processing voice message'));
        const finalMessages = [...baseMessages, userMsg, aiMsg];

        setMessages(finalMessages);
        updateOrStartSession(query, finalMessages);
      }

      if (audio) {
        console.log("Audio received, attempting to play...");
        const audioSrc = `data:audio/wav;base64,${audio}`;
        if (audioRef.current) {
          audioRef.current.src = audioSrc;
          audioRef.current.load();
          audioRef.current.play().catch(e => {
            console.error("Audio playback failed:", e);
            // Fallback: try creating a new Audio object if the ref has issues
            const newAudio = new Audio(audioSrc);
            newAudio.play().catch(err => console.error("New Audio object play failed:", err));
          });
        }
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I couldn't process your voice message." }]);
    } finally {
      setLoading(false);
    }
  };

  const updateOrStartSession = (text: string, allMsgs: Message[]) => {
    if (!currentSessionId) {
      const sessionName = text.length > 25 ? text.substring(0, 25) + '...' : text;
      const newSession: ChatSession = {
        id: Date.now().toString(),
        name: sessionName,
        messages: allMsgs,
        timestamp: Date.now()
      };
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
    } else {
      setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: allMsgs } : s));
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recordOptions = { mimeType: 'audio/webm' };
      const recorder = new MediaRecorder(stream, recordOptions);
      mediaRecorder.current = recorder;
      audioChunks.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        handleVoiceSend(audioBlob, 'webm');
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      isRecordingRef.current = true;
      setIsListening(true);
    } catch (err: any) {
      console.error("Error accessing microphone:", err);
      setMessages(prev => [...prev, { role: 'assistant', content: `Microphone error: ${err.message}` }]);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecordingRef.current) {
      mediaRecorder.current.stop();
      isRecordingRef.current = false;
      setIsListening(false);
    }
  };

  const toggleListening = () => {
    if (isListening) stopRecording();
    else startRecording();
  };

  const handleSend = async (query?: string) => {
    const textToSend = query || input;
    if ((!textToSend.trim() && !selectedImage) || loading) return;

    const userMsg: Message = { role: 'user', content: textToSend, image: selectedImage || undefined };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    const currentImg = selectedImage;
    removeSelectedImage();
    setLoading(true);

    try {
      const location = localStorage.getItem('farm_location') || 'Ludhiana';
      const history = messages
        .filter(m => !m.content.includes('🎙️ Voice message sent'))
        .map(m => ({ role: m.role, content: m.content }));

      const response = await axios.post('http://localhost:8000/kisaan-ai', {
        query: textToSend,
        image: currentImg,
        location: location,
        language: selectedLang.name,
        mode: "expert",
        history: history
      });
      const aiMsg: Message = {
        role: 'assistant',
        content: response.data.response,
        category: response.data.category
      };
      const finalMsgs = [...newMessages, aiMsg];
      setMessages(finalMsgs);
      updateOrStartSession(textToSend, finalMsgs);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Connect error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { icon: Sun, label: 'weather', color: 'text-orange-500', bg: 'bg-orange-50' },
    { icon: Coins, label: 'Market Prices', color: 'text-amber-600', bg: 'bg-amber-50' },
    { icon: Leaf, label: 'Crop Advice', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { icon: Bug, label: 'Pest Control', color: 'text-teal-600', bg: 'bg-teal-50' },
  ];

  const deleteSession = (sessionId: string) => {
    if (window.confirm("Are you sure you want to delete this chat history?")) {
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (currentSessionId === sessionId) {
        startNewChat();
      }
    }
  };

  const renameSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;
    const newName = window.prompt("Enter new name for this chat:", session.name);
    if (newName && newName.trim()) {
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, name: newName.trim() } : s));
    }
  };

  const shareSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;
    // Simple share implementation - copy summary to clipboard
    const summary = `FarmCopilot Chat: ${session.name}\n\nLast Message: ${session.messages[session.messages.length - 1]?.content.substring(0, 100)}...`;
    navigator.clipboard.writeText(summary).then(() => {
      alert("Chat summary copied to clipboard!");
    });
  };

  const customSidebarItems = sessions.map(s => ({
    id: s.id,
    label: s.name,
    icon: MessageSquare,
    isActive: currentSessionId === s.id,
    onClick: () => loadSession(s),
    onRename: renameSession,
    onDelete: deleteSession,
    onShare: shareSession
  }));

  return (
    <DashboardLayout
      hideHeader
      isSidebarClosed={isSidebarClosed}
      customSidebarTitle="CHAT HISTORY"
      customSidebarItems={customSidebarItems}
      showSidebarLogo={false}
    >
      <div className="h-screen bg-gray-50 flex flex-col font-sans relative overflow-hidden">
        <audio ref={audioRef} className="hidden" />
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileSelect}
        />

        {/* Fixed Header */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shadow-sm z-50 shrink-0">
          <div className="flex items-center space-x-6">
            <button
              onClick={() => setIsSidebarClosed(!isSidebarClosed)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500"
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center space-x-2 group">
              <Link to="/" className="flex items-center space-x-2">
                <div className="bg-earth-main p-1.5 rounded-lg">
                  <Sprout size={20} className="text-white" />
                </div>
                <span className="text-xl font-black tracking-tight text-earth-dark">{t('kisaan_ai')}</span>
              </Link>
              {currentSessionId && (
                <div className="hidden sm:flex items-center space-x-2 ml-4 pl-4 border-l border-gray-200">
                  <button
                    onClick={() => shareSession(currentSessionId)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-earth-main transition-all"
                    title="Share Chat"
                  >
                    <Share2 size={16} />
                  </button>
                  <button
                    onClick={() => renameSession(currentSessionId)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-earth-main transition-all"
                    title="Rename Chat"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => deleteSession(currentSessionId)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-500 transition-all"
                    title="Delete Chat"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={startNewChat}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-all border border-emerald-100 shadow-sm"
            >
              <Plus size={14} />
              <span className="hidden xs:inline">{t('new_chat')}</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowLangDropdown(!showLangDropdown)}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-earth-dark text-white text-xs font-bold hover:bg-earth-main transition-all shadow-sm"
              >
                <Globe size={14} />
                <span className="hidden xs:inline">{selectedLang.native}</span>
                <ChevronDown size={14} className={`transition-transform duration-300 ${showLangDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showLangDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-200">
                  {globalLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setSelectedLang(lang);
                        setShowLangDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-xs font-bold hover:bg-gray-50 transition-colors flex items-center justify-between ${selectedLang.code === lang.code ? 'text-earth-main bg-earth-main/5' : 'text-gray-600'}`}
                    >
                      <span>{lang.native}</span>
                      {selectedLang.code === lang.code && <CheckCircle size={14} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="hidden md:flex items-center space-x-2 text-emerald-600 font-bold text-xs bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
              <Wifi size={14} />
              <span>Online</span>
            </div>
          </div>
        </header>

        {/* Scrollable Chat Area */}
        <main className="flex-1 overflow-y-auto scrollbar-hide py-8 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto w-full flex flex-col min-h-full">
            {messages.length <= 1 ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-12 py-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="flex flex-col items-center space-y-4">
                  <div className="bg-white p-5 rounded-3xl shadow-xl border border-gray-100 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                    <Bot size={56} className="text-earth-main" />
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-earth-dark">Expert Agricultural Intelligence</h2>
                  <p className="text-gray-400 font-medium text-center">Your personalized AI companion for specialized farming advice.</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full">
                  {quickActions.map((action, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(action.label)}
                      className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group flex flex-col items-center space-y-4 text-center"
                    >
                      <div className={`${action.bg} ${action.color} p-5 rounded-3xl group-hover:scale-110 transition-transform`}>
                        <action.icon size={32} />
                      </div>
                      <span className="font-bold text-gray-700 text-xs tracking-widest uppercase">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6 pb-40">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4`}>
                    <div className={`max-w-[85%] sm:max-w-[80%] flex items-start space-x-3 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-earth-dark text-white' : 'bg-white text-earth-main border border-gray-100'}`}>
                        {msg.role === 'user' ? <User size={20} /> : <Sprout size={20} />}
                      </div>
                      <div className={`p-5 rounded-3xl text-sm leading-relaxed transition-all shadow-sm ${msg.role === 'user' ? 'bg-earth-main text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'}`}>
                        {msg.category && <p className="text-[10px] font-black uppercase text-earth-sand mb-2 tracking-widest">{msg.category}</p>}
                        {msg.image && (
                          <div className="mb-3 rounded-2xl overflow-hidden shadow-sm w-fit">
                            <img src={msg.image} alt="Attached context" className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl" />
                          </div>
                        )}
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                              ul: ({ children }) => <ul className="list-disc ml-4 mb-2 space-y-1">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal ml-4 mb-2 space-y-1">{children}</ol>,
                              li: ({ children }) => <li className="marker:text-earth-main">{children}</li>,
                              strong: ({ children }) => <strong className="font-black text-earth-dark">{children}</strong>
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
                    <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-earth-main shadow-sm animate-spin">
                      <RefreshCcw size={20} />
                    </div>
                    <div className="bg-white p-4 rounded-3xl rounded-tl-none border border-gray-100">
                      <div className="flex space-x-1">
                        {[1, 2, 3].map(i => <div key={i} className="w-1.5 h-1.5 bg-earth-main/40 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />)}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </main>

        {/* Fixed Bottom Input */}
        <div className={`fixed bottom-0 right-0 transition-all duration-300 ease-in-out ${isSidebarClosed ? 'left-0' : 'left-64'} bg-white/80 backdrop-blur-xl border-t border-gray-100 p-6 z-40`}>
          <div className="max-w-4xl mx-auto flex items-center space-x-3 sm:space-x-4">
            {/* Add Context Plus Button */}
            <div className="relative">
              <button
                onClick={() => setShowContextOpen(!showContextOpen)}
                className={`p-3 sm:p-4 rounded-2xl border transition-all shadow-lg active:scale-95 ${showContextOpen
                  ? 'bg-earth-dark text-white border-earth-dark'
                  : 'bg-white text-earth-main border-gray-100 hover:bg-gray-50'
                  }`}
                title="Add Context"
              >
                <Plus size={22} className={`transition-transform duration-300 ${showContextOpen ? 'rotate-45' : ''}`} />
              </button>

              {showContextOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowContextOpen(false)}
                  />
                  <div className="absolute bottom-full left-0 mb-4 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="p-3 border-b border-gray-50 text-center">
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Add Context</p>
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left group"
                    >
                      <div className="p-2 rounded-lg bg-blue-50 text-blue-500 group-hover:bg-blue-100 transition-colors">
                        <Image size={16} />
                      </div>
                      <span className="text-xs font-bold text-gray-700">Media</span>
                    </button>
                    <button
                      onClick={() => {
                        navigate("/crop-advisor");
                        setShowContextOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left group"
                    >
                      <div className="p-2 rounded-lg bg-amber-50 text-amber-500 group-hover:bg-amber-100 transition-colors">
                        <Lightbulb size={16} />
                      </div>
                      <span className="text-xs font-bold text-gray-700">Recommendations</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="flex-1 relative">
              {/* Image Preview */}
              {selectedImage && (
                <div className="absolute bottom-full left-0 mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="relative group">
                    <img
                      src={selectedImage}
                      alt="Preview"
                      className="w-24 h-24 object-cover rounded-2xl border-2 border-earth-main shadow-lg"
                    />
                    <button
                      onClick={removeSelectedImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              )}
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                disabled={isListening}
                placeholder={isListening ? '🎙️ Listening to you...' : 'Ask your farming expert anything...'}
                className={`w-full border rounded-2xl py-4 pl-6 pr-14 font-medium text-gray-700 shadow-inner transition-all ${isListening ? 'bg-red-50 border-red-200 text-red-500 ring-4 ring-red-100' : 'bg-gray-50 border-gray-200 focus:ring-4 focus:ring-earth-main/10 focus:border-earth-main'}`}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center text-gray-400">
                {isListening ? <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> : <Sparkles size={18} className="animate-pulse" />}
              </div>
            </div>

            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim() || isListening}
              className="bg-earth-main text-white p-4 rounded-2xl hover:bg-earth-dark transition-all disabled:opacity-50 shadow-lg active:scale-95 group"
            >
              <Send size={24} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </button>

            <button
              onClick={toggleListening}
              disabled={loading}
              className={`${isListening ? 'bg-red-500 animate-pulse text-white' : 'bg-white text-earth-main hover:bg-gray-50'} p-4 rounded-2xl border border-gray-100 transition-all shadow-lg active:scale-95`}
            >
              {isListening ? <Square size={24} /> : <Mic size={24} />}
            </button>
          </div>
          <div className="mt-3 text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest flex justify-center items-center gap-2">
            {isListening ? <><span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" /> Listening Mode Active</> : "Multi-Lingual Agricultural AI Intelligence"}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default KisaanAIPage;
