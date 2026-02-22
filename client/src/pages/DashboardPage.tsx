import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PriorityTasks from '../components/PriorityTasks';
import FarmStatus from '../components/FarmStatus';

import { ShieldCheck, TrendingUp, RefreshCcw, Sparkles, CloudRain, Wind, Thermometer } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const DashboardPage: React.FC = () => {
  const { t, language } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [weather, setWeather] = useState<any>(null);
  const [loadingPredict, setLoadingPredict] = useState(true);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [plannerState, setPlannerState] = useState<any>(null);
  const [savedPlan, setSavedPlan] = useState<any>(null);
  const [soilMoisture, setSoilMoisture] = useState(0.5);

  useEffect(() => {
    const loadState = () => {
      const rawState = localStorage.getItem('task_planner_state');
      const rawWeek = localStorage.getItem('task_planner_week');

      if (rawState) {
        try {
          setPlannerState(JSON.parse(rawState));
        } catch (e) { console.error(e); }
      } else {
        setPlannerState(null);
      }

      if (rawWeek) {
        try {
          setSavedPlan(JSON.parse(rawWeek));
        } catch (e) { console.error(e); }
      } else {
        setSavedPlan(null);
      }
    };

    const fetchWeatherAndPredict = async (locationName: string, lat?: number, lon?: number) => {
      setLoadingWeather(true);
      setLoadingPredict(true);
      try {
        let weatherUrl = `http://localhost:8000/weather?q=${locationName}`;
        if (lat !== undefined && lon !== undefined) {
          weatherUrl = `http://localhost:8000/weather?lat=${lat}&lon=${lon}`;
        }

        const wRes = await axios.get(weatherUrl);
        const wData = wRes.data;
        setWeather(wData);
        setLoadingWeather(false);

        const activeLoc = wData?.location?.split('(')[0].trim() || locationName;
        const humidity = wData?.current?.humidity || 50;
        const mockMoisture = Number(((humidity / 100) * 0.4 + (Math.random() * 0.2)).toFixed(2));
        setSoilMoisture(mockMoisture);

        // Get latest state directly to avoid stale closures
        const currentState = JSON.parse(localStorage.getItem('task_planner_state') || '{}');

        const pRes = await axios.post('http://localhost:8000/predict', {
          location: activeLoc,
          soil_moisture: mockMoisture,
          temperature: wData?.current?.temp,
          humidity: humidity,
          rain_probability: (wData?.forecast?.rain_sum || 0) > 0 ? 0.8 : 0.1,
          crop_type: currentState?.validatedCropName || currentState?.formData?.crop_type || 'Wheat',
          labor_available: parseInt(currentState?.formData?.labor_available) || 5,
          growth_stage: currentState?.formData?.growth_stage || 'growth',
          field_size: parseFloat(currentState?.formData?.field_size) || 10,
          language: language.name
        });
        setData(pRes.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingPredict(false);
      }
    };

    const initializeDashboard = async () => {
      loadState();
      const currentState = JSON.parse(localStorage.getItem('task_planner_state') || '{}');
      const savedLocation = currentState?.formData?.location;

      if (savedLocation) {
        await fetchWeatherAndPredict(savedLocation);
      } else if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            await fetchWeatherAndPredict('Current Location', latitude, longitude);
          },
          async (error) => {
            console.warn("Geolocation error:", error);
            await fetchWeatherAndPredict('Ludhiana');
          },
          { timeout: 10000 }
        );
      } else {
        await fetchWeatherAndPredict('Ludhiana');
      }
    };

    initializeDashboard();

    const handleSync = () => {
      initializeDashboard();
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener('focus', handleSync);
    window.addEventListener('locationChanged', handleSync);

    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('focus', handleSync);
      window.removeEventListener('locationChanged', handleSync);
    };
  }, []);

  // Calculate Progress
  const calculateProgress = () => {
    if (!savedPlan || !savedPlan.day_wise_plan) return 0;
    // Mock progress check from weekly planner logic
    const completed = localStorage.getItem('weekly_planner_completed_tasks');
    if (!completed) return 0;
    try {
      const parsed = JSON.parse(completed);
      const totalTasks = (savedPlan.day_wise_plan || []).reduce((acc: number, d: any) => acc + (d.tasks?.length || 0), 0);
      if (totalTasks === 0) return 0;
      const completedCount = Object.values(parsed).filter(v => v === true).length;
      return Math.round((completedCount / totalTasks) * 100);
    } catch (e) {
      console.error("Progress calculation error:", e);
      return 0;
    }
  };

  const currentProgress = calculateProgress();
  const isIrrigationRequired = Boolean(
    data?.irrigation_prediction?.urgency_score > 0.6 &&
    weather?.forecast?.rain_sum === 0
  );

  if (!plannerState && !loadingPredict) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 space-y-8 animate-in fade-in zoom-in-95 duration-700">
        <div className="w-24 h-24 bg-earth-main/10 rounded-[2.5rem] flex items-center justify-center shadow-inner">
          <ShieldCheck size={48} className="text-earth-main" />
        </div>
        <div className="text-center space-y-3 max-w-md">
          <h2 className="text-4xl font-black text-earth-dark tracking-tight">{t('initialize_farm')}</h2>
          <p className="text-gray-500 font-medium leading-relaxed">
            {t('dashboard_no_plan_desc')}
            {' '}{t('detecting_weather_for')} <span className="font-bold text-earth-dark">{weather?.location || t('your_area')}</span>...
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <RefreshCcw size={20} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-gray-400">{t('current_weather')}</p>
              <p className="text-lg font-black text-gray-900">{weather?.current?.temp || '--'}°C in {weather?.location?.split(',')[0] || t('your_area')}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-gray-400">{t('yield_potential')}</p>
              <p className="text-lg font-black text-gray-900">{t('high_growth_zone')}</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => window.location.href = '/tasks'}
          className="group flex items-center gap-3 bg-earth-dark text-white px-10 py-5 rounded-[2rem] font-black text-xl hover:bg-earth-main transition-all shadow-2xl hover:scale-105 active:scale-95"
        >
          <Sparkles size={24} className="group-hover:rotate-12 transition-transform" />
          {t('generate_farm_plan')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-earth-dark p-3 rounded-2xl shadow-lg">
            <ShieldCheck size={28} className="text-earth-sand" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-earth-dark tracking-tight">{t('operations_overview')}</h1>
            <p className="text-gray-500 font-bold flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              {loadingWeather ? 'Connecting to satellites...' : (weather?.location || 'Sector 7-B')}
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl font-black text-xs uppercase tracking-widest border border-emerald-100">
            {t('live_sync')}
          </div>
          <p className="text-[10px] text-gray-400 font-black uppercase pr-3 tracking-widest">v1.2 Operations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {loadingPredict ? (
            <div className="bg-white p-20 rounded-[3rem] border border-gray-100 flex flex-col items-center justify-center space-y-6 shadow-sm">
              <div className="relative">
                <RefreshCcw className="animate-spin text-earth-main" size={48} />
                <div className="absolute inset-0 bg-earth-main/10 blur-xl rounded-full" />
              </div>
              <div className="text-center">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-earth-dark mb-1">{t('analyzing_field')}</p>
                <p className="text-xs text-gray-400 font-medium">{t('fetching_satellite')}</p>
              </div>
            </div>
          ) : (
            <PriorityTasks tasks={data?.tasks || []} />
          )}

          <FarmStatus
            moisture={soilMoisture}
            labor={parseInt(plannerState?.formData?.labor_available) || 7}
            urgency={data?.irrigation_prediction?.irrigation_urgency || 'Normal'}
            field_size={parseFloat(plannerState?.formData?.field_size) || 10}
            growth_stage={plannerState?.formData?.growth_stage || 'growth'}
          />

          {/* New Recommendations & Analysis Section */}
          <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
            <h3 className="text-2xl font-black text-earth-dark flex items-center gap-3">
              <div className="w-10 h-10 bg-earth-main/10 rounded-xl flex items-center justify-center">
                <ShieldCheck size={20} className="text-earth-main" />
              </div>
              {t('intel_recomm')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Progress Tracker */}
              <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{t('weekly_progress')}</p>
                    <p className="text-3xl font-black text-earth-dark">{currentProgress}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-earth-main mb-1">{t('on_track')}</p>
                  </div>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-earth-main transition-all duration-1000 ease-out"
                    style={{ width: `${currentProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 font-medium leading-relaxed">
                  Based on your <span className="font-bold text-earth-dark">Weekly Planner</span> markers. {currentProgress < 50 ? 'You have some catch-up to do!' : 'Great job staying on top of tasks!'}
                </p>
              </div>

              {/* Irrigation Check */}
              <div className={`p-6 rounded-[2rem] border transition-all ${isIrrigationRequired ? 'bg-blue-50 border-blue-100' : 'bg-green-50 border-green-100'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isIrrigationRequired ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'}`}>
                    <RefreshCcw size={20} className={isIrrigationRequired ? 'animate-spin-slow' : ''} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest opacity-60">{t('irrigation_check')}</p>
                    <p className="text-lg font-black text-gray-900">{isIrrigationRequired ? t('required_today') : t('not_required')}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 font-medium leading-relaxed">
                  {isIrrigationRequired
                    ? t('irrigation_vital')
                    : t('irrigation_not_needed')}
                </p>
              </div>
            </div>
          </div>
        </div>


        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[3rem] border border-gray-200 shadow-xl shadow-earth-main/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />

            <h3 className="font-black text-gray-800 mb-2 flex items-center">
              <CloudRain className="mr-2 text-blue-500" size={20} />
              {t('local_conditions')}
            </h3>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-6">
              {weather?.location?.split(',')[0] || 'Unknown Location'}
            </p>

            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
                    <Thermometer size={20} />
                  </div>
                  <span className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">{t('temperature')}</span>
                </div>
                <span className="text-2xl font-black text-earth-dark">{weather?.current?.temp ?? '--'}°C</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                    <CloudRain size={20} />
                  </div>
                  <span className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">{t('rainfall')}</span>
                </div>
                <span className="text-2xl font-black text-earth-dark">{weather?.forecast?.rain_sum ?? '--'} mm</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-sky-100 text-sky-600 rounded-xl flex items-center justify-center">
                    <Wind size={20} />
                  </div>
                  <span className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">{t('wind_speed')}</span>
                </div>
                <span className="text-2xl font-black text-earth-dark">{weather?.current?.wind_speed ?? '--'} km/h</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-earth-dark to-green-950 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-widest text-earth-light mb-2">{t('monthly_yield')}</p>
              <div className="text-4xl font-black mb-4 text-earth-sand tracking-tight group-hover:translate-x-1 transition-transform">
                2.8 Tons/Acre
              </div>
              <p className="text-xs text-earth-light/70 font-medium leading-relaxed">
                Projected based on <span className="text-white font-bold">{plannerState?.validatedCropName || 'Crop'}</span> growth patterns and optimized fertilization.
              </p>
            </div>
            <div className="absolute -bottom-10 -right-10 text-white/5 group-hover:rotate-45 transition-transform duration-1000">
              <RefreshCcw size={200} />
            </div>
          </div>

          {/* Quick Stats sidebar items if needed */}
        </div>
      </div>


    </div>
  );
};


export default DashboardPage;
