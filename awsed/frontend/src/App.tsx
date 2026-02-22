import { useState, useRef, useEffect } from 'react';
import { Mic, Volume2, StopCircle, RefreshCcw, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const App = () => {
  const [interactionMode, setInteractionMode] = useState<'voice' | 'text'>('voice');
  const [textInput, setTextInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoListen] = useState(true);
  const [hasStarted, setHasStarted] = useState(false); // tracks first user tap (needed for browser autoplay)
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('Welcome back. How can I assist you with your farm today?');
  const [displayedResponse, setDisplayedResponse] = useState('');
  const [history, setHistory] = useState<{ role: string, content: string }[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Typewriter Effect Logic
  useEffect(() => {
    setDisplayedResponse('');
    let i = 0;
    const typingInterval = setInterval(() => {
      if (i < response.length) {
        setDisplayedResponse((prev) => prev + response.charAt(i));
        i++;
      } else {
        clearInterval(typingInterval);
      }
    }, 30); // 30ms per character

    return () => clearInterval(typingInterval);
  }, [response]);

  // Media Recorder & Audio Context State
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const audioContext = useRef<AudioContext | null>(null);
  const silenceTimer = useRef<number | null>(null);
  // Ref to reliably track recording state inside closures (avoids stale state in rAF)
  const isRecordingRef = useRef(false);

  const sendVoiceToBackend = async (blob: Blob, extension: string) => {
    try {
      const formData = new FormData();
      formData.append('file', blob, `recording.${extension}`);

      const res = await axios.post('http://localhost:8000/api/voice-chat', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const { query, response: botMsg, audio } = res.data;

      if (!query || query.includes("Could not transcribe")) {
        setTranscript("I didn't catch that. Please try again.");
        return;
      }

      setTranscript(query);
      setResponse(botMsg);
      setHistory(prev => [...prev.slice(-4),
      { role: 'user', content: query },
      { role: 'assistant', content: botMsg }
      ]);

      if (audio) {
        const audioSrc = `data:audio/wav;base64,${audio}`;
        if (audioRef.current) {
          audioRef.current.src = audioSrc;
          audioRef.current.load();
          audioRef.current.play().then(() => {
            setIsSpeaking(true);
          }).catch(e => console.error("Audio playback failed:", e));
        }
      } else {
        console.warn("No audio returned from backend.");
      }
    } catch (err: any) {
      console.error("Backend error:", err);
      setResponse("Could not process voice. Check backend.");
      setTranscript('');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Silence Detection Setup
      const context = new AudioContext();
      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      audioContext.current = context;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const recordingStart = Date.now();
      const MAX_DURATION_MS = 25000;

      // Adaptive VAD — calibrate background noise first
      let baselineNoise = 0;
      let calibrationSamples: number[] = [];
      const CALIBRATION_TIME_MS = 600; // measure background for 600ms
      let hasSpoken = false;
      let lastSpeechTime = Date.now();

      const getVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        return dataArray.reduce((acc, val) => acc + val, 0) / bufferLength;
      };

      const checkSilence = () => {
        if (!mediaRecorder.current || !isRecordingRef.current) return;

        const elapsed = Date.now() - recordingStart;

        if (elapsed > MAX_DURATION_MS) {
          mediaRecorder.current.stop();
          isRecordingRef.current = false;
          setIsListening(false);
          setTranscript('Processing voice...');
          return;
        }

        const volume = getVolume();

        // Phase 1: Calibrate background noise for the first 600ms
        if (elapsed < CALIBRATION_TIME_MS) {
          calibrationSamples.push(volume);
          // During calibration, show hint
          silenceTimer.current = requestAnimationFrame(checkSilence);
          return;
        }

        // After calibration — compute baseline once
        if (baselineNoise === 0 && calibrationSamples.length > 0) {
          baselineNoise = calibrationSamples.reduce((a, b) => a + b, 0) / calibrationSamples.length;
          console.log(`Baseline noise level: ${baselineNoise.toFixed(1)}`);
        }

        // Speech threshold = baseline + significant margin (adaptive to room)
        const speechThreshold = baselineNoise + Math.max(10, baselineNoise * 0.6);

        if (volume > speechThreshold) {
          // User is speaking
          lastSpeechTime = Date.now();
          if (!hasSpoken) {
            hasSpoken = true;
            setTranscript('Listening...');
          }
        } else if (hasSpoken && (Date.now() - lastSpeechTime > 1500)) {
          // Volume dropped back to near baseline for 1.5s — done speaking
          mediaRecorder.current.stop();
          isRecordingRef.current = false;
          setIsListening(false);
          setTranscript('Processing voice...');
          return;
        } else if (!hasSpoken && elapsed > 10000) {
          // 10s with no speech detected — stop
          mediaRecorder.current.stop();
          isRecordingRef.current = false;
          setIsListening(false);
          setTranscript('Tap to talk');
          return;
        }

        silenceTimer.current = requestAnimationFrame(checkSilence);
      };

      // Determine supported type
      const types = ['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav'];
      const supportedType = types.find(type => MediaRecorder.isTypeSupported(type)) || '';

      const recorder = new MediaRecorder(stream, supportedType ? { mimeType: supportedType } : {});
      mediaRecorder.current = recorder;
      audioChunks.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunks.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const mimeType = recorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunks.current, { type: mimeType });
        const extension = mimeType.includes('wav') ? 'wav' : (mimeType.includes('mp3') ? 'mp3' : 'webm');

        sendVoiceToBackend(audioBlob, extension);
        stream.getTracks().forEach(track => track.stop());

        if (audioContext.current) {
          audioContext.current.close();
          audioContext.current = null;
        }
        if (silenceTimer.current) {
          cancelAnimationFrame(silenceTimer.current);
        }
      };

      recorder.start(250);
      isRecordingRef.current = true;
      setIsListening(true);
      setTranscript('Listening...');
      checkSilence();
    } catch (err: any) {
      console.error("Error accessing microphone:", err);
      setResponse("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecordingRef.current) {
      mediaRecorder.current.stop();
      isRecordingRef.current = false;
      setIsListening(false);
      setTranscript('Processing voice...');
    }
  };

  const handleSendTextInput = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!textInput.trim()) return;

    const query = textInput;
    setTextInput('');
    setTranscript(query);
    setResponse('Processing request...');

    try {
      const res = await axios.post('http://localhost:8000/api/chat', {
        text: query
      });

      const { response: botMsg, audio } = res.data;
      setResponse(botMsg);
      setHistory(prev => [...prev.slice(-4),
      { role: 'user', content: query },
      { role: 'assistant', content: botMsg }
      ]);

      if (audio) {
        const audioSrc = `data:audio/mp3;base64,${audio}`;
        if (audioRef.current) {
          audioRef.current.src = audioSrc;
          audioRef.current.play();
          setIsSpeaking(true);
        }
      }
    } catch (err: any) {
      setResponse("Could not process request. Check backend.");
    }
  };

  const toggleListening = () => {
    if (!hasStarted) {
      setHasStarted(true); // First tap unlocks browser audio policy
    }
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleAudioEnd = () => {
    setIsSpeaking(false);
    if (autoListen && interactionMode === 'voice') {
      setTimeout(() => {
        startRecording();
      }, 200); // Reduced delay for faster loop
    }
  };

  const resetConversation = async () => {
    await axios.post('http://localhost:8000/api/chat', { reset: true });
    setHistory([]);
    setResponse('Conversation reset. How can I help?');
    setTranscript('');
  };

  return (
    <div className="assistant-container">
      <audio ref={audioRef} onEnded={handleAudioEnd} className="hidden" />

      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: isSpeaking ? [1, 1.4, 1] : (isListening ? [1, 1.2, 1] : 1),
            opacity: isSpeaking ? [0.1, 0.3, 0.1] : (isListening ? [0.1, 0.2, 0.1] : 0.05)
          }}
          transition={{ repeat: Infinity, duration: 2.5 }}
          className="absolute -inset-[200px] bg-blue-500/20 rounded-full blur-[120px]"
        />
      </div>

      {/* Header Overlay */}
      <div className="absolute top-8 left-8 right-8 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-cyan-500 animate-pulse' : 'bg-white/20'}`} />
          <span className="text-[10px] font-bold tracking-[0.3em] text-white/40 uppercase">
            {interactionMode === 'voice' ? 'Voice Active' : 'Text Active'}
          </span>
        </div>

        {/* Interaction Mode Toggle */}
        <div className="flex bg-white/5 p-1 rounded-full border border-white/10">
          <button
            onClick={() => setInteractionMode('voice')}
            className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${interactionMode === 'voice' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'text-white/40 hover:text-white'}`}
          >
            Voice-to-Voice
          </button>
          <button
            onClick={() => setInteractionMode('text')}
            className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${interactionMode === 'text' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'text-white/40 hover:text-white'}`}
          >
            Text-to-Voice
          </button>
        </div>

        <button onClick={resetConversation} className="p-2 text-white/20 hover:text-white/60 transition-colors">
          <RefreshCcw size={16} />
        </button>
      </div>

      {/* History Timeline Sidebar (Minimal) */}
      <div className="absolute left-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-4 opacity-20 hover:opacity-100 transition-opacity duration-500">
        {history.slice(-3).map((h, i) => (
          <div key={i} className="flex items-center gap-3 max-w-[200px]">
            {h.role === 'user' ? <MessageSquare size={12} /> : <Volume2 size={12} />}
            <p className="text-[10px] truncate">{h.content}</p>
          </div>
        ))}
      </div>

      {/* Central Interactive Area */}
      <div className="relative flex flex-col items-center w-full max-w-lg">
        <AnimatePresence mode="wait">
          {interactionMode === 'voice' ? (
            <motion.div
              key="voice-ui"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center"
            >
              <motion.div
                onClick={toggleListening}
                className={`voice-orb relative z-10 ${isListening ? 'listening' : ''} ${isSpeaking ? 'shadow-[0_0_100px_rgba(34,211,238,0.4)]' : ''}`}
                animate={{ scale: isSpeaking ? [1, 1.1, 1] : 1 }}
                transition={{ repeat: Infinity, duration: 0.5, ease: "easeInOut" }}
              >
                <AnimatePresence mode="wait">
                  {!hasStarted ? (
                    <motion.div key="start" initial={{ scale: 0 }} animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} exit={{ scale: 0 }} className="flex flex-col items-center gap-1">
                      <Mic size={48} className="text-cyan-400 drop-shadow-lg" />
                      <span className="text-[10px] text-cyan-400 font-bold tracking-widest uppercase">Tap to Begin</span>
                    </motion.div>
                  ) : isListening ? (
                    <motion.div key="stop" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                      <StopCircle size={56} className="text-white drop-shadow-lg" />
                    </motion.div>
                  ) : (
                    <motion.div key="mic" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                      <Mic size={56} className="text-white drop-shadow-lg" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Visual Waveform Ring */}
                {isSpeaking && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                    className="absolute inset-[-15px] border-2 border-dashed border-cyan-500/30 rounded-full"
                  />
                )}
              </motion.div>

              <div className="mt-8 text-center flex flex-col items-center gap-4">
                <motion.p
                  key={transcript || 'idle'}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-white/40 text-sm font-medium tracking-wide italic min-h-[1.5em]"
                >
                  {transcript || (isListening ? 'Listening...' : (isSpeaking ? 'Barnaby is speaking...' : 'Tap to talk'))}
                </motion.p>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={response}
                  className="text-lg md:text-xl font-medium leading-relaxed text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 max-w-2xl px-4"
                >
                  {displayedResponse}
                </motion.p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="text-ui"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full"
            >
              <form onSubmit={handleSendTextInput} className="relative group">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Ask Barnaby anything..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 px-8 pr-20 text-lg focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-white/20 shadow-2xl backdrop-blur-xl"
                />
                <button
                  type="submit"
                  disabled={!textInput.trim()}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-cyan-500 text-black rounded-xl hover:bg-cyan-400 transition-colors disabled:opacity-20 disabled:hover:bg-cyan-500"
                >
                  <MessageSquare size={20} />
                </button>
              </form>
              <p className="mt-4 text-center text-[10px] text-white/20 uppercase tracking-[0.3em]">Typing Mode • TTS Response Active</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Response Display */}
      <div className="mt-12 flex flex-col items-center w-full px-6">
        <motion.div
          layout
          className="glass-chat-bubble max-w-2xl w-full border-cyan-500/10 shadow-2xl"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="flex gap-6 items-start">
            <div className={`p-3 rounded-full transition-colors ${isSpeaking ? "bg-cyan-500/20" : "bg-white/5"}`}>
              <Volume2 size={24} className={isSpeaking ? "text-cyan-400" : "text-white/20"} />
            </div>
            <div>
              <p className="text-cyan-500/50 text-[9px] font-bold uppercase tracking-[0.2em] mb-2">Barnaby AI Response</p>
              <p className="text-lg leading-relaxed font-light">{response}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Advanced Control Bar */}
      <div className="controls-bottom flex flex-col gap-4 items-center">
        <p className="text-[10px] text-white/30 tracking-widest uppercase">Sarvam AI Vikram Series • Low Latency Conversational Hub</p>
      </div>
    </div>
  );
};

export default App;
