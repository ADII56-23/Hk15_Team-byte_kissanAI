import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bot, Sparkles, RefreshCcw } from 'lucide-react';
import CopilotChat from '../components/CopilotChat';

const ChatPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.post('http://localhost:8000/predict', {
          soil_moisture: 0.35,
          temperature: 31.5,
          humidity: 45,
          rain_probability: 0.15,
          crop_type: "Corn",
          labor_available: 7
        });
        setData(response.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full"><RefreshCcw className="animate-spin text-earth-main" size={40} /></div>;

  return (
    <div className="h-[calc(100vh-180px)] space-y-8 animate-in zoom-in-95 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-earth-dark">AI Decision Support</h1>
          <p className="text-gray-500">Instant context-aware advice for your farm operations.</p>
        </div>
        <div className="flex space-x-2">
          <div className="flex items-center space-x-2 bg-earth-beige px-4 py-2 rounded-xl text-earth-dark font-bold text-sm">
            <Sparkles size={16} className="text-earth-sand" />
            <span>GPT-4 Powered</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-full">
        <div className="lg:col-span-3 h-full">
          <CopilotChat explanation={data.explanation} />
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4">Suggested Queries</h3>
            <div className="space-y-2">
              {[
                "What's the weather outlook for tomorrow?",
                "How can I save more water?",
                "Check labor constraints for Sector 3",
                "Projected yield update",
                "Equipment maintenance status"
              ].map((q, i) => (
                <button key={i} className="w-full text-left p-3 rounded-xl border border-gray-100 hover:border-earth-main hover:bg-earth-beige/30 transition-all text-xs text-gray-600 font-medium">
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-earth-dark p-6 rounded-[2rem] text-white">
            <Bot size={32} className="text-earth-sand mb-4" />
            <h4 className="font-bold text-lg mb-2">Decision Guard</h4>
            <p className="text-xs text-earth-light leading-relaxed">
              I monitor thousands of data points every minute to ensure your decisions are backed by the highest confidence levels.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
