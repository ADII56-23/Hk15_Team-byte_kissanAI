import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Thermometer, Wind, RefreshCcw } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const dataChart = [
  { time: '06:00', moisture: 30 },
  { time: '09:00', moisture: 28 },
  { time: '12:00', moisture: 25 },
  { time: '15:00', moisture: 22 },
  { time: '18:00', moisture: 35 },
  { time: '21:00', moisture: 34 },
];

const IrrigationPage: React.FC = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await axios.post('http://localhost:8000/predict', {
          soil_moisture: 0.35,
          temperature: 31.5,
          humidity: 45,
          rain_probability: 0.15,
          crop_type: "Corn",
          labor_available: 7
        });
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
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-earth-dark">Irrigation Intelligence</h1>
          <p className="text-gray-500">Real-time soil hydration monitoring and prediction.</p>
        </div>
        <div className="bg-blue-100 text-blue-700 px-6 py-3 rounded-2xl flex items-center shadow-sm border border-blue-200">
          <Activity size={20} className="mr-2" />
          <span className="font-bold">Next cycle: 14:00 (Predicted)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { icon: Activity, label: 'Soil moisture', value: '35%', sub: 'Critical -5%', color: 'text-blue-600', bg: 'bg-blue-50' },
          { icon: Activity, label: 'Pump status', value: 'Active', sub: 'North Valve', color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { icon: Thermometer, label: 'Soil temp', value: '28.4°C', sub: 'Surface +1.2', color: 'text-amber-600', bg: 'bg-amber-50' },
          { icon: Wind, label: 'Evaporation', value: 'High', sub: 'Low Humidity', color: 'text-purple-600', bg: 'bg-purple-50' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div className={`${stat.bg} ${stat.color} p-3 rounded-xl w-fit mb-4`}>
              <stat.icon size={24} />
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-2xl font-black text-gray-800">{stat.value}</p>
            <p className="text-xs font-bold text-emerald-600 mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold mb-6">Moisture Delta (24h)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dataChart}>
                <defs>
                  <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis hide domain={[0, 50]} />
                <Tooltip />
                <Area type="monotone" dataKey="moisture" stroke="#2563eb" strokeWidth={3} fill="url(#colorMoisture)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-8 rounded-[2.5rem] text-white flex flex-col justify-between relative overflow-hidden shadow-xl">
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-2">Water Audit</h3>
            <p className="text-blue-100 text-sm mb-8">AI-optimized scheduling has outperformed the manual baseline by 18% this month.</p>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-blue-200 mb-2">
                  <span>Actual Usage</span>
                  <span>4.2k Liters</span>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full">
                  <div className="bg-white h-full rounded-full w-[60%]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-blue-200 mb-2">
                  <span>Forecasted Need</span>
                  <span>7.0k Liters</span>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full">
                  <div className="bg-earth-sand h-full rounded-full w-[100%]" />
                </div>
              </div>
            </div>
          </div>
          <Activity className="absolute -bottom-10 -right-10 text-white/5" size={200} />
        </div>
      </div>
    </div>
  );
};

export default IrrigationPage;
