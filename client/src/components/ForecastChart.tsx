import React from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface ForecastChartProps {
  weekly_rain: number[];
  moisture: number;
}


const ForecastChart: React.FC<ForecastChartProps> = ({ weekly_rain, moisture }) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Logic: Map the weekly rain to charts
  // Demand logic: Higher if rain is low and baseline moisture is low.
  const chartData = days.map((day, i) => {
    const rainVal = (weekly_rain[i] || 0) * 10; // scale for visibility (mm to %)
    const demand = Math.max(0, Math.min(100, (1 - moisture) * 100 - rainVal * 0.5 + ((i * 1337 % 10))));

    return {
      name: day,
      demand: Math.round(demand),
      rain: Math.round(Math.min(100, rainVal))
    };
  });

  return (
    <div className="bg-white p-2 h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-black text-earth-dark tracking-tight">7-Day Operations Forecast</h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Multi-vector Predictive Graph</p>
        </div>
        <div className="flex bg-gray-50 p-2 rounded-2xl gap-4 border border-gray-100">
          <div className="flex items-center px-2">
            <div className="w-2.5 h-2.5 bg-earth-main rounded-full mr-2 shadow-sm shadow-earth-main" />
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Irrigation Demand</span>
          </div>
          <div className="flex items-center px-2 border-l border-gray-200">
            <div className="w-2.5 h-2.5 bg-blue-400 rounded-full mr-2 shadow-sm shadow-blue-400" />
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Rain Prob.</span>
          </div>
        </div>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4A5D23" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4A5D23" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorRain" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fontWeight: 800, fill: '#9ca3af', textAnchor: 'middle' }}
              dy={15}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fontWeight: 700, fill: '#d1d5db' }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '20px',
                border: '1px solid #f3f4f6',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
                padding: '12px 16px',
                fontWeight: 'bold'
              }}
              cursor={{ stroke: '#4A5D23', strokeWidth: 1, strokeDasharray: '5 5' }}
            />
            <Area
              type="monotone"
              dataKey="demand"
              stroke="#4A5D23"
              strokeWidth={4}
              fillOpacity={1}
              fill="url(#colorDemand)"
              animationDuration={2000}
            />
            <Area
              type="monotone"
              dataKey="rain"
              stroke="#60a5fa"
              strokeWidth={4}
              fillOpacity={1}
              fill="url(#colorRain)"
              animationDuration={2500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};


export default ForecastChart;
