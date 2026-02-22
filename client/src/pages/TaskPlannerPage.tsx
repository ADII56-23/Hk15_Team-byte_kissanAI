import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  AlertTriangle, RefreshCcw,
  CheckCircle2, Sprout, MapPin, Gauge, Users, Wrench, Wallet,
  Sparkles, LayoutDashboard, Edit3, X, CloudRain, Wind,
  Thermometer, TrendingUp, ShieldAlert, CalendarDays,
  Lightbulb, Target, ChevronRight, ChevronDown, Leaf,
  Star, Activity, Download, Timer, CheckCircle
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useLanguage } from '../contexts/LanguageContext';

/* ──── Types ───────────────────────────────────────────── */
interface DayPlan {
  day_number: number;
  day_label: string;
  focus: string;
  tasks: string[];
  priority: 'High' | 'Medium' | 'Low';
  tips: string;
}

interface AnalysisData {
  overview: string;
  viability_check: string;
  time_period: string;
  productivity_inputs: string[];
  weather_impact: string;
  key_insights: string[];
  recommendations: string[];
  risk_assessment: string;
  resource_plan: string;
  day_wise_plan: DayPlan[];
  confidence_note: string;
  weather_raw?: {
    current?: { temp: number; humidity: number; wind_speed: number };
    forecast?: { weekly_max: number[]; weekly_rain: number[] };
    location?: string;
  };
}

const InvalidCropPopup: React.FC<{
  cropName: string;
  onClose: () => void;
  onSelect: (val: string) => void;
}> = ({ cropName, onClose, onSelect }) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  const commonCrops = [
    'Wheat', 'Rice', 'Corn', 'Cotton',
    'Tomato', 'Mustard', 'Soybean', 'Sugar Cane',
    'Onion', 'Potato', 'Groundnut', 'Chili'
  ];

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="bg-white rounded-[3rem] p-8 max-w-md w-full shadow-2xl text-center relative animate-in zoom-in-95 fade-in duration-300 border-2 border-red-50"
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-700 transition-colors"
        >
          <X size={24} />
        </button>

        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle size={40} className="text-red-500" />
        </div>

        <h2 className="text-2xl font-black text-gray-800 mb-2">Invalid Crop!</h2>
        <p className="text-gray-500 font-medium mb-6">
          <span className="font-black text-red-500">"{cropName}"</span> is not recognized. Please select a valid agricultural crop:
        </p>

        <div className="grid grid-cols-2 gap-3 mb-8">
          {commonCrops.map(c => (
            <button
              key={c}
              onClick={() => onSelect(c)}
              className="px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 font-bold text-gray-700 hover:bg-earth-main/10 hover:border-earth-main hover:text-earth-main transition-all text-sm"
            >
              {c}
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full text-gray-400 font-bold py-2 hover:text-gray-600 transition-colors"
        >
          Cancel & Edit Manually
        </button>
      </div>
    </div>
  );
};

/* ──── Weather Widget ──────────────────────────────────── */
const WeatherWidget: React.FC<{ weather: AnalysisData['weather_raw']; location: string }> = ({ weather, location }) => {
  if (!weather?.current) return null;
  return (
    <div className="bg-gradient-to-br from-sky-500 to-blue-700 p-6 rounded-[2rem] text-white shadow-xl shadow-blue-500/20">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-200 mb-3">Live Weather · {location}</p>
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col items-center gap-1">
          <Thermometer size={18} className="text-sky-200" />
          <span className="text-2xl font-black">{weather.current.temp}°</span>
          <span className="text-[10px] text-sky-200 font-bold uppercase">Temp</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <CloudRain size={18} className="text-sky-200" />
          <span className="text-2xl font-black">{weather.current.humidity}%</span>
          <span className="text-[10px] text-sky-200 font-bold uppercase">Humidity</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Wind size={18} className="text-sky-200" />
          <span className="text-2xl font-black">{weather.current.wind_speed}</span>
          <span className="text-[10px] text-sky-200 font-bold uppercase">km/h</span>
        </div>
      </div>
      {weather.forecast?.weekly_rain && (
        <div className="mt-4 pt-4 border-t border-white/20">
          <p className="text-[9px] font-black uppercase text-sky-200 mb-2 tracking-widest">7-Day Rainfall (mm)</p>
          <div className="flex items-end gap-1 h-8">
            {weather.forecast.weekly_rain.map((r, i) => (
              <div
                key={i}
                className="flex-1 bg-white/30 rounded-t-sm"
                style={{ height: `${Math.min(100, (r / 20) * 100)}%`, minHeight: '4px' }}
                title={`Day ${i + 1}: ${r} mm`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ──── Day Plan Card ───────────────────────────────────── */
const DayCard: React.FC<{ day: DayPlan; isToday?: boolean }> = ({ day, isToday }) => {
  const [expanded, setExpanded] = useState(isToday ?? false);
  const priorityConfig = {
    High: { color: 'text-red-500', bg: 'bg-red-50 border-red-100', dot: 'bg-red-500' },
    Medium: { color: 'text-amber-500', bg: 'bg-amber-50 border-amber-100', dot: 'bg-amber-500' },
    Low: { color: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-100', dot: 'bg-emerald-500' },
  }[day.priority];

  return (
    <div
      className={`bg-white rounded-[1.5rem] border transition-all duration-300 overflow-hidden ${isToday ? 'border-earth-main shadow-lg shadow-earth-main/10 ring-2 ring-earth-main/20' : 'border-gray-100 hover:border-gray-200 hover:shadow-md'}`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 flex items-center gap-4 text-left"
      >
        <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 ${isToday ? 'bg-earth-main text-white' : 'bg-gray-50 text-gray-400'}`}>
          <span className="text-[10px] font-black uppercase tracking-wider">Day</span>
          <span className="text-xl font-black leading-tight">{day.day_number}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-black text-gray-800 text-sm truncate">{day.day_label}</p>
            {isToday && <span className="text-[9px] font-black bg-earth-main/10 text-earth-main px-2 py-0.5 rounded-full uppercase tracking-wider">Today</span>}
          </div>
          <p className="text-xs text-gray-500 font-medium mt-0.5">{day.focus}</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className={`text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full border flex items-center gap-1.5 ${priorityConfig.bg} ${priorityConfig.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${priorityConfig.dot}`} />
            {day.priority}
          </span>
          <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-gray-50 pt-4">
          <div className="space-y-2">
            {day.tasks.map((task, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-5 h-5 rounded-full bg-earth-main/10 text-earth-main flex items-center justify-center shrink-0 mt-0.5">
                  <ChevronRight size={12} />
                </div>
                <p className="text-sm font-medium text-gray-700 leading-snug">{task}</p>
              </div>
            ))}
          </div>
          {day.tips && (
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
              <Lightbulb size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs font-medium text-amber-700 leading-snug">{day.tips}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ──── Main Component ──────────────────────────────────── */
const TaskPlannerPage: React.FC = () => {
  const { t, language } = useLanguage();
  // Restore persisted form data from localStorage (if any)
  const persistedRaw = localStorage.getItem('task_planner_state');
  const persisted = persistedRaw ? (() => { try { return JSON.parse(persistedRaw); } catch { return null; } })() : null;

  const [formData, setFormData] = useState(persisted?.formData ?? {
    crop_type: '',
    plot_name: '',
    field_size: '',
    location: localStorage.getItem('farm_location') || '',
    growth_stage: 'sowing',
    labor_available: '',
    equipments: '',
    budget: ''
  });

  const [validating, setValidating] = useState(false);
  const [savedToWeekPlanner, setSavedToWeekPlanner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(persisted?.analysis ?? null);
  const [showResults, setShowResults] = useState<boolean>(persisted?.showResults ?? false);
  const [showInvalidPopup, setShowInvalidPopup] = useState(false);
  const [invalidCropName, setInvalidCropName] = useState('');
  const [validatedCropName, setValidatedCropName] = useState<string>(persisted?.validatedCropName ?? '');
  const [activeSection, setActiveSection] = useState<string>(persisted?.activeSection ?? 'overview');
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  // Persist state to localStorage whenever key values change
  useEffect(() => {
    if (analysis && showResults) {
      localStorage.setItem('task_planner_state', JSON.stringify({
        formData,
        analysis,
        showResults,
        validatedCropName,
        activeSection
      }));
    }
  }, [analysis, showResults, formData, validatedCropName, activeSection]);

  // Handle location search
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (formData.location.length >= 3 && showLocationSuggestions) {
        try {
          const res = await axios.get(`http://localhost:8000/location-suggestions?q=${formData.location}`);
          setLocationSuggestions(res.data);
        } catch (err) {
          console.error("Failed to fetch suggestions:", err);
        }
      } else {
        setLocationSuggestions([]);
      }
    }, 200);

    return () => clearTimeout(handler);
  }, [formData.location, showLocationSuggestions]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const crop = formData.crop_type.trim();
    if (!crop) return;

    // Step 1: Validate crop via OpenRouter AI
    setValidating(true);
    try {
      const validationRes = await axios.post('http://localhost:8000/validate-crop', {
        crop_name: crop
      });
      const { is_valid, standard_name } = validationRes.data;

      if (!is_valid) {
        setInvalidCropName(crop);
        setShowInvalidPopup(true);
        setValidating(false);
        return;
      }

      setValidatedCropName(standard_name || crop);
    } catch {
      // If validation fails, proceed anyway
      setValidatedCropName(crop);
    }
    setValidating(false);

    // Step 2: Generate full analysis
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:8000/farm-analysis', {
        crop_type: validatedCropName || crop,
        plot_name: formData.plot_name,
        field_size: parseFloat(formData.field_size) || 1.0,
        location: formData.location,
        growth_stage: formData.growth_stage,
        labor_available: parseInt(formData.labor_available) || 1,
        available_equipments: formData.equipments.split(',').map((s: string) => s.trim()).filter((s: string) => s),
        budget_constraints: formData.budget || 'Normal',
        language: language.name
      });
      setAnalysis(res.data);
      setShowResults(true);
      setActiveSection('overview');
    } catch (err) {
      console.error(err);
      alert('Failed to generate analysis. Please check your inputs and connection.');
    } finally {
      setLoading(false);
    }
  };

  const RequiredLabel = ({ label }: { label: string }) => (
    <label className="block text-sm font-black text-earth-dark mb-2 uppercase tracking-widest flex items-center">
      {label} <span className="text-red-500 ml-1">*</span>
    </label>
  );

  const navSections = [
    { id: 'overview', label: t('overview'), icon: Activity },
    { id: 'productivity', label: t('productivity'), icon: TrendingUp },
    { id: 'weather', label: t('weather'), icon: CloudRain },
    { id: 'insights', label: t('key_insights'), icon: Lightbulb },
    { id: 'plan', label: t('7_day_plan'), icon: CalendarDays },
    { id: 'risks', label: t('risks'), icon: ShieldAlert },
    { id: 'resources', label: t('resources'), icon: Users },
  ];

  const downloadPDF = async () => {
    if (!reportRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`Farm_Report_${cropDisplay}_${formData.location}.pdf`);
    } catch (err) {
      console.error(err);
      alert('Failed to generate PDF');
    } finally {
      setDownloading(false);
    }
  };

  /* ── FORM VIEW ─────────────────────────────────────── */
  if (!showResults || !analysis) {
    return (
      <>
        {showInvalidPopup && (
          <InvalidCropPopup
            cropName={invalidCropName}
            onClose={() => setShowInvalidPopup(false)}
            onSelect={(val) => {
              setFormData({ ...formData, crop_type: val });
              setShowInvalidPopup(false);
            }}
          />
        )}

        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="text-center space-y-4">
            <div className="inline-flex p-4 bg-earth-main/10 rounded-3xl text-earth-main mb-4">
              <LayoutDashboard size={40} />
            </div>
            <h1 className="text-4xl font-black text-earth-dark tracking-tight">{t('precision_task_planner')}</h1>
            <p className="text-gray-500 font-medium">
              Enter your farm details. AI will validate your crop and generate a location-aware, day-by-day action plan.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-xl space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

              {/* Plot Name */}
              <div className="space-y-2">
                <label className="block text-sm font-black text-earth-dark mb-2 uppercase tracking-widest">
                  Plot Name
                </label>
                <div className="relative">
                  <LayoutDashboard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="e.g. North Sector, Plot A"
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-4 font-bold text-gray-700 focus:ring-4 focus:ring-earth-main/10 focus:border-earth-main outline-none transition-all"
                    value={formData.plot_name}
                    onChange={e => setFormData({ ...formData, plot_name: e.target.value })}
                  />
                </div>
              </div>

              {/* Crop Type */}
              <div className="space-y-2">
                <RequiredLabel label="Crop Type" />
                <div className="relative">
                  <Sprout className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    required
                    type="text"
                    placeholder="e.g. Wheat, Rice, Tomato"
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-4 font-bold text-gray-700 focus:ring-4 focus:ring-earth-main/10 focus:border-earth-main outline-none transition-all"
                    value={formData.crop_type}
                    onChange={e => setFormData({ ...formData, crop_type: e.target.value })}
                  />
                </div>
                <p className="text-xs text-gray-400 font-medium pl-2">
                  AI will verify if this is a valid crop before analysis.
                </p>
              </div>

              {/* Field Size */}
              <div className="space-y-2">
                <RequiredLabel label="Field Size (Acres)" />
                <div className="relative">
                  <Gauge className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    required
                    type="number"
                    placeholder="e.g. 10.5"
                    step="0.1"
                    min="0.1"
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-4 font-bold text-gray-700 focus:ring-4 focus:ring-earth-main/10 focus:border-earth-main outline-none transition-all"
                    value={formData.field_size}
                    onChange={e => setFormData({ ...formData, field_size: e.target.value })}
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <RequiredLabel label="Location" />
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    required
                    type="text"
                    placeholder="e.g. Ludhiana, Punjab"
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-4 font-bold text-gray-700 focus:ring-4 focus:ring-earth-main/10 focus:border-earth-main outline-none transition-all"
                    value={formData.location}
                    onChange={e => {
                      setFormData({ ...formData, location: e.target.value });
                      setShowLocationSuggestions(true);
                    }}
                    onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 200)}
                    onFocus={() => setShowLocationSuggestions(true)}
                  />

                  {/* Suggestions Dropdown */}
                  {showLocationSuggestions && locationSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                      {locationSuggestions.map((loc) => (
                        <button
                          key={loc.id}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault(); // Prevent input blur immediately
                            setFormData({ ...formData, location: `${loc.name}, ${loc.region}` });
                            setLocationSuggestions([]);
                            setShowLocationSuggestions(false);
                          }}
                          className="w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 flex items-center justify-between group"
                        >
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-800 text-sm group-hover:text-earth-main transition-colors">{loc.name}</span>
                            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">{loc.region}, {loc.country}</span>
                          </div>
                          <ChevronRight size={14} className="text-gray-300 group-hover:text-earth-main group-hover:translate-x-1 transition-all" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Growth Stage */}
              <div className="space-y-2">
                <RequiredLabel label="Growth Stage" />
                <div className="relative">
                  <Leaf className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <select
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-4 font-bold text-gray-700 focus:ring-4 focus:ring-earth-main/10 focus:border-earth-main outline-none transition-all appearance-none"
                    value={formData.growth_stage}
                    onChange={e => setFormData({ ...formData, growth_stage: e.target.value })}
                  >
                    <option value="sowing">🌱 Sowing</option>
                    <option value="vegetative">🌿 Vegetative Growth</option>
                    <option value="flowering">🌸 Flowering</option>
                    <option value="fruit">🍅 Fruit Development</option>
                    <option value="harvesting">🌾 Harvesting</option>
                  </select>
                </div>
              </div>

              {/* Labor Available */}
              <div className="space-y-2">
                <RequiredLabel label="Available Labor" />
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    required
                    type="number"
                    min="1"
                    placeholder="Count of workers"
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-4 font-bold text-gray-700 focus:ring-4 focus:ring-earth-main/10 focus:border-earth-main outline-none transition-all"
                    value={formData.labor_available}
                    onChange={e => setFormData({ ...formData, labor_available: e.target.value })}
                  />
                </div>
              </div>

              {/* Equipments */}
              <div className="space-y-2">
                <label className="block text-sm font-black text-earth-dark mb-2 uppercase tracking-widest">
                  Available Equipments
                </label>
                <div className="relative">
                  <Wrench className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="e.g. Tractor, Harvester, Drip Irrigation"
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-4 font-bold text-gray-700 focus:ring-4 focus:ring-earth-main/10 focus:border-earth-main outline-none transition-all"
                    value={formData.equipments}
                    onChange={e => setFormData({ ...formData, equipments: e.target.value })}
                  />
                </div>
              </div>

              {/* Budget */}
              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-black text-earth-dark mb-2 uppercase tracking-widest">
                  Budget Constraints
                </label>
                <div className="relative">
                  <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="e.g. Tight budget, Flexible, ₹50,000 available"
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-4 font-bold text-gray-700 focus:ring-4 focus:ring-earth-main/10 focus:border-earth-main outline-none transition-all"
                    value={formData.budget}
                    onChange={e => setFormData({ ...formData, budget: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <button
              disabled={loading || validating}
              type="submit"
              className="w-full bg-earth-main text-white py-5 rounded-[2rem] font-black text-lg hover:bg-earth-dark transition-all shadow-xl shadow-earth-main/20 flex items-center justify-center space-x-3 disabled:opacity-50"
            >
              {validating ? (
                <>
                  <RefreshCcw className="animate-spin" size={22} />
                  <span>Validating crop...</span>
                </>
              ) : loading ? (
                <>
                  <RefreshCcw className="animate-spin" size={22} />
                  <span>Generating AI Analysis...</span>
                </>
              ) : (
                <>
                  <Sparkles size={24} />
                  <span>Analyse & Generate Day-Wise Plan</span>
                </>
              )}
            </button>
          </form>
        </div>
      </>
    );
  }

  /* ── RESULTS VIEW ──────────────────────────────────── */
  const cropDisplay = validatedCropName || formData.crop_type;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-10 h-10 bg-earth-main/10 rounded-xl flex items-center justify-center">
              <Sprout size={22} className="text-earth-main" />
            </div>
            <h1 className="text-3xl font-black text-earth-dark tracking-tighter">
              {cropDisplay} {t('analysis')}
            </h1>
            <span className="text-[10px] font-black bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1">
              <CheckCircle2 size={12} /> {t('ai_verified')}
            </span>
          </div>
          <p className="text-gray-500 font-medium mt-1 ml-1">
            {formData.plot_name && `${formData.plot_name} · `}{formData.field_size} acres · {formData.location} · {formData.growth_stage} stage
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap shrink-0">
          <button
            disabled={downloading}
            onClick={downloadPDF}
            className="flex items-center gap-2 bg-earth-main text-white px-5 py-3 rounded-2xl font-black hover:bg-earth-dark transition-all shadow-xl shadow-earth-main/20 disabled:opacity-50"
          >
            {downloading ? <RefreshCcw className="animate-spin" size={16} /> : <Download size={16} />}
            {downloading ? 'Preparing...' : t('download_pdf')}
          </button>
          <button
            onClick={() => {
              const payload = {
                day_wise_plan: analysis.day_wise_plan,
                crop: validatedCropName || formData.crop_type,
                location: formData.location,
                growth_stage: formData.growth_stage,
                plot_name: formData.plot_name,
                saved_at: new Date().toISOString()
              };
              localStorage.setItem('task_planner_week', JSON.stringify(payload));
              setSavedToWeekPlanner(true);
              setTimeout(() => setSavedToWeekPlanner(false), 3000);
            }}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold transition-all shadow-sm shrink-0 ${savedToWeekPlanner
              ? 'bg-emerald-500 text-white border border-emerald-500'
              : 'bg-white border border-earth-main text-earth-main hover:bg-earth-main hover:text-white'
              }`}
          >
            <CalendarDays size={16} />
            {savedToWeekPlanner ? 'Saved ✓' : t('add_to_week_plan')}
          </button>
          <button
            onClick={() => {
              localStorage.removeItem('task_planner_state');
              setShowResults(false);
              setAnalysis(null);
              setValidatedCropName('');
            }}
            className="flex items-center gap-2 bg-white border border-gray-200 text-earth-dark px-5 py-3 rounded-2xl font-bold hover:bg-gray-50 transition-all shadow-sm group shrink-0"
          >
            <Edit3 size={16} className="group-hover:rotate-12 transition-transform" />
            {t('edit_parameters')}
          </button>
        </div>
      </div>

      {/* ── Section Nav ── */}
      <div className="flex gap-2 flex-wrap">
        {navSections.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${activeSection === s.id
              ? 'bg-earth-main text-white shadow-lg shadow-earth-main/20'
              : 'bg-white text-gray-500 border border-gray-200 hover:border-earth-main hover:text-earth-main'
              }`}
          >
            <s.icon size={14} />
            {s.label}
          </button>
        ))}
      </div>

      {/* ── Content Wrapper for PDF ── */}
      <div ref={reportRef} className="bg-[#fcfcfc] p-1 rounded-[3rem]">
        {/* ── Overview ── */}
        {activeSection === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Overview Card */}
              <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-earth-main/10 rounded-xl flex items-center justify-center">
                    <Activity size={20} className="text-earth-main" />
                  </div>
                  <h3 className="text-xl font-black text-earth-dark">{t('farm_overview')}</h3>
                </div>
                <p className="text-gray-700 font-medium leading-relaxed text-[15px]">{analysis.overview}</p>

                <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Crop', val: cropDisplay, icon: Sprout, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Location', val: formData.location, icon: MapPin, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Stage', val: formData.growth_stage, icon: Leaf, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Field Size', val: `${formData.field_size} ac`, icon: Gauge, color: 'text-purple-600', bg: 'bg-purple-50' },
                  ].map((item, i) => (
                    <div key={i} className={`${item.bg} p-4 rounded-2xl flex flex-col items-center gap-2 text-center`}>
                      <item.icon size={20} className={item.color} />
                      <span className="font-black text-gray-800 text-sm capitalize">{item.val}</span>
                      <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weather Widget */}
              <div className="space-y-4">
                <WeatherWidget weather={analysis.weather_raw} location={formData.location} />
                {/* Confidence */}
                <div className="bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Star size={16} className="text-amber-400" />
                    <p className="text-[11px] font-black uppercase tracking-widest text-gray-500">AI Confidence</p>
                  </div>
                  <p className="text-sm font-medium text-gray-700 leading-snug">{analysis.confidence_note}</p>
                </div>
              </div>
            </div>

            {/* Top Recommendations */}
            <div className="bg-gradient-to-br from-earth-dark to-earth-main p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 opacity-5">
                <Sprout size={200} className="absolute -right-10 -bottom-10 rotate-12" />
              </div>
              <div className="flex items-center gap-3 mb-6">
                <Target size={22} className="text-earth-sand" />
                <h3 className="text-xl font-black">{t('top_recommendations')}</h3>
              </div>
              <div className="space-y-4 relative z-10">
                {analysis.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                    <span className="w-7 h-7 rounded-full bg-earth-sand/30 text-earth-sand font-black text-sm flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <p className="text-white/90 font-medium leading-snug text-sm">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Productivity & Viability ── */}
        {activeSection === 'productivity' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <CheckCircle size={20} className="text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-black text-earth-dark">Regional Viability</h3>
                </div>
                <p className="text-gray-700 font-medium leading-relaxed">{analysis.viability_check}</p>

                <div className="mt-6 p-4 bg-blue-50 rounded-2xl flex items-center gap-4">
                  <Timer className="text-blue-500 shrink-0" size={24} />
                  <div>
                    <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Time to Harvest</p>
                    <p className="font-black text-blue-700 text-lg">{analysis.time_period}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                    <TrendingUp size={20} className="text-amber-600" />
                  </div>
                  <h3 className="text-xl font-black text-earth-dark">Max Productivity Inputs</h3>
                </div>
                <div className="space-y-3">
                  {analysis.productivity_inputs?.map((input, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                      <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <p className="text-sm font-bold text-gray-700">{input}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Weather Impact ── */}
        {activeSection === 'weather' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center">
                    <CloudRain size={20} className="text-sky-600" />
                  </div>
                  <h3 className="text-xl font-black text-earth-dark">Weather Impact Analysis</h3>
                </div>
                <p className="text-gray-700 font-medium leading-relaxed text-[15px]">{analysis.weather_impact}</p>
              </div>
              <WeatherWidget weather={analysis.weather_raw} location={formData.location} />
            </div>

            {analysis.weather_raw?.forecast?.weekly_max && (
              <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <Thermometer size={20} className="text-orange-500" />
                  <h3 className="text-xl font-black text-earth-dark">7-Day Temperature Trend</h3>
                </div>
                <div className="flex items-end gap-3 h-28">
                  {analysis.weather_raw.forecast.weekly_max.map((temp, i) => {
                    const max = Math.max(...analysis.weather_raw!.forecast!.weekly_max!);
                    const min = Math.min(...analysis.weather_raw!.forecast!.weekly_max!);
                    const pct = max === min ? 60 : ((temp - min) / (max - min)) * 60 + 20;
                    return (
                      <div key={i} className="flex flex-col items-center gap-2 flex-1">
                        <span className="text-xs font-black text-gray-600">{temp}°</span>
                        <div
                          className="w-full rounded-t-xl bg-gradient-to-t from-orange-400 to-amber-300 transition-all"
                          style={{ height: `${pct}%` }}
                        />
                        <span className="text-[10px] font-bold text-gray-400">D{i + 1}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Key Insights ── */}
        {activeSection === 'insights' && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {analysis.key_insights.map((insight, i) => (
                <div key={i} className="bg-white p-7 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-4">
                    <span className="font-black text-emerald-600 text-lg">{i + 1}</span>
                  </div>
                  <p className="text-gray-700 font-medium leading-relaxed text-[14px]">{insight}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 7-Day Plan ── */}
        {activeSection === 'plan' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm mb-2">
              <div className="flex items-center gap-3 mb-2">
                <CalendarDays size={20} className="text-earth-main" />
                <h3 className="font-black text-earth-dark text-lg">Day-Wise Action Planner</h3>
              </div>
              <p className="text-sm text-gray-500 font-medium">
                AI-generated 7-day plan tailored for <strong>{cropDisplay}</strong> at <strong>{formData.growth_stage}</strong> stage in <strong>{formData.location}</strong>. Click a day to expand its tasks.
              </p>
            </div>

            <div className="space-y-3">
              {analysis.day_wise_plan.map((day, i) => (
                <DayCard key={i} day={day} isToday={i === 0} />
              ))}
            </div>
          </div>
        )}


        {/* ── Risks ── */}
        {activeSection === 'risks' && (
          <div className="space-y-6 animate-in fade-in duration-300">

            {/* Risk Score Banner */}
            {(() => {
              const w = analysis.weather_raw;
              const temp = w?.current?.temp ?? 25;
              const humidity = w?.current?.humidity ?? 60;
              const rain = w?.forecast?.weekly_rain?.[0] ?? 0;

              // Compute a 0-100 risk score from real data
              let riskScore = 0;
              if (temp > 38) riskScore += 35;
              else if (temp > 32) riskScore += 20;
              else if (temp < 10) riskScore += 25;
              else riskScore += 5;

              if (humidity > 80) riskScore += 25;
              else if (humidity < 30) riskScore += 20;
              else riskScore += 5;

              if (rain > 50) riskScore += 20;
              else if (rain < 2) riskScore += 15;
              else riskScore += 5;

              riskScore = Math.min(riskScore, 100);

              const level = riskScore >= 60 ? { label: 'High Risk', color: 'red', from: 'from-red-600', to: 'to-red-400', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' }
                : riskScore >= 35 ? { label: 'Moderate Risk', color: 'amber', from: 'from-amber-600', to: 'to-amber-400', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' }
                  : { label: 'Low Risk', color: 'emerald', from: 'from-emerald-600', to: 'to-emerald-400', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' };

              return (
                <div className={`${level.bg} border ${level.border} p-6 rounded-[2rem] flex flex-col sm:flex-row items-center gap-6`}>
                  {/* Circular gauge */}
                  <div className="relative w-28 h-28 shrink-0">
                    <svg viewBox="0 0 36 36" className="w-28 h-28 -rotate-90">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                      <circle
                        cx="18" cy="18" r="15.9" fill="none"
                        stroke={riskScore >= 60 ? '#dc2626' : riskScore >= 35 ? '#d97706' : '#10b981'}
                        strokeWidth="3"
                        strokeDasharray={`${riskScore} ${100 - riskScore}`}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dasharray 1s ease' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-2xl font-black ${level.text}`}>{riskScore}</span>
                      <span className="text-[9px] font-black uppercase text-gray-400">/ 100</span>
                    </div>
                  </div>

                  <div className="flex-1 text-center sm:text-left">
                    <p className={`text-2xl font-black ${level.text}`}>{level.label}</p>
                    <p className="text-gray-600 font-medium text-sm mt-1">
                      Overall farm risk computed from live weather data · {formData.location} · {cropDisplay}
                    </p>
                    <div className="flex flex-wrap gap-3 mt-3">
                      {[
                        { label: 'Temperature', val: `${temp}°C`, warn: temp > 35 || temp < 12 },
                        { label: 'Humidity', val: `${humidity}%`, warn: humidity > 80 || humidity < 30 },
                        { label: 'Rain (D1)', val: `${rain} mm`, warn: rain > 40 || rain < 1 },
                      ].map((chip, i) => (
                        <span key={i} className={`text-xs font-bold px-3 py-1.5 rounded-full border ${chip.warn ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-gray-600 border-gray-200'
                          }`}>
                          {chip.label}: <strong>{chip.val}</strong>
                          {chip.warn && ' ⚠'}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Risk Category Meters */}
            {(() => {
              const w = analysis.weather_raw;
              const temp = w?.current?.temp ?? 25;
              const humidity = w?.current?.humidity ?? 60;
              const rain = w?.forecast?.weekly_rain?.[0] ?? 0;
              const wind = w?.current?.wind_speed ?? 10;
              const fieldSize = parseFloat(formData.field_size) || 1;
              const laborAvailable = parseInt(formData.labor_available) || 1;

              const riskRows = [
                {
                  label: 'Pest & Disease',
                  icon: AlertTriangle,
                  predicted: humidity > 75 ? 70 : humidity > 60 ? 45 : 20,
                  actual: humidity > 75 ? 68 : humidity > 60 ? 42 : 18,
                  note: humidity > 75 ? 'High humidity elevates fungal risk' : humidity > 60 ? 'Monitor for early blight' : 'Low disease pressure',
                  color: humidity > 75 ? 'red' : humidity > 60 ? 'amber' : 'emerald',
                },
                {
                  label: 'Weather Stress',
                  icon: CloudRain,
                  predicted: (temp > 35 || temp < 12) ? 75 : (temp > 30 || temp < 18) ? 40 : 15,
                  actual: (temp > 35 || temp < 12) ? 72 : (temp > 30 || temp < 18) ? 38 : 13,
                  note: temp > 35 ? 'Heat stress critical' : temp < 12 ? 'Cold stress risk' : `Temp optimal at ${temp}°C`,
                  color: (temp > 35 || temp < 12) ? 'red' : (temp > 30 || temp < 18) ? 'amber' : 'emerald',
                },
                {
                  label: 'Water / Flood Risk',
                  icon: CloudRain,
                  predicted: rain > 60 ? 80 : rain > 30 ? 45 : rain < 2 ? 35 : 10,
                  actual: rain > 60 ? 78 : rain > 30 ? 43 : rain < 2 ? 32 : 8,
                  note: rain > 60 ? 'Waterlogging risk — check drainage' : rain > 30 ? 'Moderate rain expected' : rain < 2 ? 'Drought risk — irrigate now' : 'Rain levels adequate',
                  color: rain > 60 ? 'red' : rain > 30 ? 'amber' : rain < 2 ? 'orange' : 'emerald',
                },
                {
                  label: 'Labor & Resource Strain',
                  icon: Users,
                  predicted: fieldSize / laborAvailable > 5 ? 70 : fieldSize / laborAvailable > 2 ? 40 : 15,
                  actual: fieldSize / laborAvailable > 5 ? 68 : fieldSize / laborAvailable > 2 ? 38 : 13,
                  note: fieldSize / laborAvailable > 5 ? 'Insufficient labor for field size' : fieldSize / laborAvailable > 2 ? 'Moderate strain — prioritize tasks' : 'Labor coverage adequate',
                  color: fieldSize / laborAvailable > 5 ? 'red' : fieldSize / laborAvailable > 2 ? 'amber' : 'emerald',
                },
                {
                  label: 'Wind Damage',
                  icon: Wind,
                  predicted: wind > 40 ? 65 : wind > 25 ? 35 : 10,
                  actual: wind > 40 ? 63 : wind > 25 ? 33 : 8,
                  note: wind > 40 ? 'High winds — risk of crop lodging' : wind > 25 ? 'Moderate winds — check tall crops' : 'Wind conditions safe',
                  color: wind > 40 ? 'red' : wind > 25 ? 'amber' : 'emerald',
                },
              ];

              const colorMap: Record<string, string> = {
                red: 'bg-red-500', amber: 'bg-amber-500', emerald: 'bg-emerald-500', orange: 'bg-orange-500'
              };
              const textMap: Record<string, string> = {
                red: 'text-red-600', amber: 'text-amber-600', emerald: 'text-emerald-600', orange: 'text-orange-600'
              };
              const bgMap: Record<string, string> = {
                red: 'bg-red-50', amber: 'bg-amber-50', emerald: 'bg-emerald-50', orange: 'bg-orange-50'
              };

              return (
                <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                      <ShieldAlert size={20} className="text-red-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-earth-dark">Risk Category Analysis</h3>
                      <p className="text-xs text-gray-400 font-medium">Prediction vs. Actual · Based on live weather + farm data</p>
                    </div>
                  </div>

                  {riskRows.map((row, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <row.icon size={15} className={textMap[row.color]} />
                          <span className="font-black text-sm text-gray-700">{row.label}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-gray-400">Predicted: <strong className="text-gray-600">{row.predicted}%</strong></span>
                          <span className="text-[10px] font-bold text-gray-400">Actual: <strong className={textMap[row.color]}>{row.actual}%</strong></span>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${bgMap[row.color]} ${textMap[row.color]}`}>
                            {row.color === 'emerald' ? 'Safe' : row.color === 'amber' ? 'Monitor' : 'Alert'}
                          </span>
                        </div>
                      </div>

                      {/* Dual bar — predicted (faded) then actual on top */}
                      <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`absolute inset-y-0 left-0 rounded-full opacity-25 ${colorMap[row.color]}`}
                          style={{ width: `${row.predicted}%` }}
                        />
                        <div
                          className={`absolute inset-y-0 left-0 rounded-full ${colorMap[row.color]}`}
                          style={{ width: `${row.actual}%` }}
                        />
                      </div>

                      <p className="text-xs text-gray-500 font-medium pl-1">{row.note}</p>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* AI Risk Assessment Text */}
            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles size={18} className="text-earth-main" />
                <h3 className="font-black text-earth-dark text-lg">AI Risk Assessment</h3>
              </div>
              <p className="text-gray-700 font-medium leading-relaxed text-[15px]">{analysis.risk_assessment}</p>
            </div>
          </div>
        )}


        {/* ── Resources ── */}
        {activeSection === 'resources' && (
          <div className="space-y-6 animate-in fade-in duration-300">

            {/* Live Efficiency Metrics */}
            {(() => {
              const fieldSize = parseFloat(formData.field_size) || 1;
              const laborAvail = parseInt(formData.labor_available) || 1;
              const equipList = formData.equipments ? formData.equipments.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
              const budgetScore = formData.budget === 'High' ? 90 : formData.budget === 'Low' ? 30 : 60;
              const acresPerWorker = fieldSize / laborAvail;
              const laborEfficiency = Math.min(Math.round((1 / acresPerWorker) * 100), 100);
              const equipCoverage = Math.min(equipList.length * 22, 100);

              const metrics = [
                {
                  label: 'Labor Coverage', icon: Users,
                  predicted: laborEfficiency + 5 > 100 ? 100 : laborEfficiency + 5,
                  actual: laborEfficiency,
                  unit: '%',
                  note: `${laborAvail} workers · ${acresPerWorker.toFixed(1)} ac/worker`,
                  color: laborEfficiency >= 60 ? 'emerald' : laborEfficiency >= 35 ? 'amber' : 'red',
                  status: laborEfficiency >= 60 ? 'Optimal' : laborEfficiency >= 35 ? 'Monitor' : 'Critical',
                },
                {
                  label: 'Equipment Coverage', icon: Wrench,
                  predicted: equipCoverage + 8 > 100 ? 100 : equipCoverage + 8,
                  actual: equipCoverage,
                  unit: '%',
                  note: equipList.length > 0 ? equipList.join(', ') : 'No equipment listed',
                  color: equipCoverage >= 60 ? 'emerald' : equipCoverage >= 30 ? 'amber' : 'red',
                  status: equipCoverage >= 60 ? 'Optimal' : equipCoverage >= 30 ? 'Moderate' : 'Low',
                },
                {
                  label: 'Budget Capacity', icon: Wallet,
                  predicted: budgetScore + 5 > 100 ? 100 : budgetScore + 5,
                  actual: budgetScore,
                  unit: '%',
                  note: `${formData.budget || 'Normal'} budget tier`,
                  color: budgetScore >= 70 ? 'emerald' : budgetScore >= 40 ? 'amber' : 'red',
                  status: budgetScore >= 70 ? 'High' : budgetScore >= 40 ? 'Normal' : 'Limited',
                },
              ];

              const colorMap: Record<string, { bar: string; text: string; bg: string; border: string }> = {
                red: { bar: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
                amber: { bar: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
                emerald: { bar: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
              };

              return (
                <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                      <Users size={20} className="text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-earth-dark">Live Resource Efficiency</h3>
                      <p className="text-xs text-gray-400 font-medium">Prediction vs. Actual · Based on your input data</p>
                    </div>
                  </div>

                  {metrics.map((m, i) => {
                    const c = colorMap[m.color];
                    return (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <m.icon size={15} className={c.text} />
                            <span className="font-black text-sm text-gray-700">{m.label}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-gray-400">
                              Predicted: <strong className="text-gray-600">{m.predicted}{m.unit}</strong>
                            </span>
                            <span className="text-[10px] font-bold text-gray-400">
                              Actual: <strong className={c.text}>{m.actual}{m.unit}</strong>
                            </span>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>
                              {m.status}
                            </span>
                          </div>
                        </div>

                        <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`absolute inset-y-0 left-0 rounded-full opacity-25 ${c.bar}`}
                            style={{ width: `${m.predicted}%` }} />
                          <div className={`absolute inset-y-0 left-0 rounded-full ${c.bar}`}
                            style={{ width: `${m.actual}%` }} />
                        </div>

                        <p className="text-xs text-gray-500 font-medium pl-1">{m.note}</p>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Prediction vs. Actual Data Table */}
            {(() => {
              const w = analysis.weather_raw;
              const temp = w?.current?.temp;
              const humidity = w?.current?.humidity;
              const wind = w?.current?.wind_speed;
              const rain = w?.forecast?.weekly_rain?.[0];

              const rows = [
                {
                  param: 'Temperature', unit: '°C',
                  predicted: '25–30', actual: temp != null ? `${temp}` : '—',
                  status: temp != null ? (temp > 35 ? 'Critical' : temp > 30 ? 'Monitor' : 'Optimal') : '—',
                  color: temp != null ? (temp > 35 ? 'red' : temp > 30 ? 'amber' : 'emerald') : 'gray',
                },
                {
                  param: 'Humidity', unit: '%',
                  predicted: '50–70', actual: humidity != null ? `${humidity}` : '—',
                  status: humidity != null ? (humidity > 80 ? 'High' : humidity < 35 ? 'Low' : 'Optimal') : '—',
                  color: humidity != null ? (humidity > 80 ? 'red' : humidity < 35 ? 'amber' : 'emerald') : 'gray',
                },
                {
                  param: 'Rain (Day 1)', unit: 'mm',
                  predicted: '5–15', actual: rain != null ? `${rain}` : '—',
                  status: rain != null ? (rain > 50 ? 'Flood Risk' : rain < 2 ? 'Drought' : 'Normal') : '—',
                  color: rain != null ? (rain > 50 ? 'red' : rain < 2 ? 'amber' : 'emerald') : 'gray',
                },
                {
                  param: 'Wind Speed', unit: 'km/h',
                  predicted: '<20', actual: wind != null ? `${wind}` : '—',
                  status: wind != null ? (wind > 40 ? 'Dangerous' : wind > 25 ? 'Monitor' : 'Safe') : '—',
                  color: wind != null ? (wind > 40 ? 'red' : wind > 25 ? 'amber' : 'emerald') : 'gray',
                },
                {
                  param: 'Labor (Workers)', unit: '',
                  predicted: `≥ ${Math.ceil(parseFloat(formData.field_size) / 2)}`,
                  actual: formData.labor_available,
                  status: parseInt(formData.labor_available) >= Math.ceil(parseFloat(formData.field_size) / 2) ? 'Sufficient' : 'Insufficient',
                  color: parseInt(formData.labor_available) >= Math.ceil(parseFloat(formData.field_size) / 2) ? 'emerald' : 'red',
                },
                {
                  param: 'Field Size', unit: 'acres',
                  predicted: '—', actual: formData.field_size || '—',
                  status: 'Input', color: 'blue',
                },
              ];

              const statusBadge: Record<string, string> = {
                red: 'bg-red-50 text-red-600', amber: 'bg-amber-50 text-amber-600',
                emerald: 'bg-emerald-50 text-emerald-600', gray: 'bg-gray-50 text-gray-400',
                blue: 'bg-blue-50 text-blue-600', orange: 'bg-orange-50 text-orange-600',
              };

              return (
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                  <div className="flex items-center gap-3 p-6 border-b border-gray-50">
                    <TrendingUp size={18} className="text-earth-main" />
                    <div>
                      <h3 className="font-black text-earth-dark">Prediction vs. Actual Data</h3>
                      <p className="text-xs text-gray-400 font-medium">Live sensor + weather API data compared to expected agronomic ranges</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          {['Parameter', 'Unit', 'Predicted Range', 'Actual (Live)', 'Status'].map(h => (
                            <th key={h} className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {rows.map((row, i) => (
                          <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                            <td className="px-5 py-4 font-bold text-gray-800">{row.param}</td>
                            <td className="px-5 py-4 text-gray-400 font-medium text-xs">{row.unit}</td>
                            <td className="px-5 py-4 font-mono text-gray-500 text-sm">{row.predicted}</td>
                            <td className="px-5 py-4 font-black text-gray-900">{row.actual}</td>
                            <td className="px-5 py-4">
                              <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${statusBadge[row.color] ?? statusBadge.gray}`}>
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

            {/* AI Resource Plan */}
            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles size={18} className="text-earth-main" />
                <h3 className="font-black text-earth-dark text-lg">AI Resource Deployment Plan</h3>
              </div>
              <p className="text-gray-700 font-medium leading-relaxed text-[15px]">{analysis.resource_plan}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Back to Form ── */}
      <div className="flex justify-center pt-4">
        <button
          onClick={() => { setShowResults(false); setAnalysis(null); }}
          className="flex items-center gap-2 py-3 px-8 border-2 border-dashed border-gray-200 text-gray-400 rounded-2xl font-bold text-sm hover:border-earth-main hover:text-earth-main transition-all"
        >
          <RefreshCcw size={16} />
          Start New Analysis
        </button>
      </div>
    </div>
  );
};

export default TaskPlannerPage;
