import React, { useState } from 'react';
import axios from 'axios';
import {
  MapPin, Calendar, Layers, Maximize, Sprout, CheckCircle,
  Thermometer, CloudRain, Droplets, ArrowLeft, RefreshCcw, Sparkles, Key, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

interface AdvisorResult {
  location: string;
  months: string[];
  season: string;
  weather_summary: {
    avg_temp: number;
    avg_rain: number;
    avg_humidity: number;
  };
  irrigation_advice: {
    status: string;
    litres_per_acre_day: number;
    total_litres_day: number;
    frequency: string;
    schedule_note: string;
    recommendations: string[];
  };
  top_recommendation: {
    name: string;
    confidence_score: number;
    season: string;
    rank: number;
    total_ranks: number;
    reason: string;
  };
  other_crops: Array<{
    name: string;
    season: string;
    match_percentage: number;
    reason: string;
  }>;
}

const CropAdvisorPage: React.FC = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    location: '',
    soilType: 'Loam (Most Common)',
    fieldArea: 1,
  });
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AdvisorResult | null>(null);
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);

  // Handle location search
  React.useEffect(() => {
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

  const monthsList = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const soilTypes = ['Loam (Most Common)', 'Clay', 'Sandy', 'Black Soil', 'Red Soil', 'Laterite'];

  const toggleMonth = (month: string) => {
    setSelectedMonths(prev =>
      prev.includes(month) ? prev.filter(m => m !== month) : [...prev, month]
    );
  };

  const handlePredict = async () => {
    if (!formData.location || selectedMonths.length === 0) {
      alert("Please enter location and select at least one growing month.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:8000/crop-recommendation', {
        location: formData.location,
        months: selectedMonths,
        soil_type: formData.soilType,
        field_area: formData.fieldArea,
        language: language.name
      });
      setResults(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to get recommendations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setResults(null);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] p-4 md:p-6 font-sans relative">
      {/* Absolute Close Button */}
      <button
        onClick={() => navigate('/kisaan')}
        className="fixed top-6 right-6 z-[100] bg-white text-gray-400 p-2.5 rounded-full shadow-xl border border-gray-100 hover:text-gray-900 transition-all hover:scale-110 active:scale-95"
      >
        <X size={20} />
      </button>

      <div className="max-w-6xl mx-auto">
        {!results && !loading && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Header Section */}
            <div className="text-center space-y-3">
              <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-tight">{t('smart_crop_advisor')}</h1>
              <p className="text-gray-500 text-sm font-medium max-w-xl mx-auto">
                {t('crop_advisor_desc')}
              </p>
            </div>

            {/* Input Form Card */}
            <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-2xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden">
              <div className="space-y-6">
                {/* Section Tag */}
                <div className="flex items-center space-x-2 text-earth-main font-black text-xs uppercase tracking-widest bg-earth-main/5 w-fit px-4 py-2 rounded-full">
                  <span className="relative flex h-2 w-2 mr-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-earth-main opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-earth-main"></span>
                  </span>
                  {t('location_season')}
                </div>

                {/* Farming Location */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-gray-500 ml-1">{t('farming_location')}</label>
                  <div className="relative group">
                    <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-earth-main transition-colors" size={20} />
                    <input
                      type="text"
                      placeholder={t('eg_punjab_india')}
                      className="w-full bg-gray-50 border-gray-100 border-2 rounded-2xl py-5 pl-14 pr-6 font-bold text-gray-800 placeholder:text-gray-300 focus:ring-4 focus:ring-earth-main/10 focus:border-earth-main transition-all outline-none"
                      value={formData.location}
                      onChange={(e) => {
                        setFormData({ ...formData, location: e.target.value });
                        setShowLocationSuggestions(true);
                      }}
                      onFocus={() => setShowLocationSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 200)}
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
                            <Maximize size={14} className="text-gray-300 group-hover:text-earth-main group-hover:translate-x-1 transition-all" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Growing Months */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-sm font-bold text-gray-500">{t('growing_months')} <span className="text-gray-300 italic">({t('select_all_apply')})</span></label>
                    <button
                      onClick={() => setSelectedMonths(monthsList)}
                      className="text-[10px] font-black uppercase text-earth-main hover:underline"
                    >
                      {t('select_all')}
                    </button>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {monthsList.map(m => (
                      <button
                        key={m}
                        onClick={() => toggleMonth(m)}
                        className={`py-3 rounded-xl font-bold transition-all border-2 text-sm ${selectedMonths.includes(m)
                          ? 'bg-earth-main border-earth-main text-white shadow-lg shadow-earth-main/20 scale-105'
                          : 'bg-gray-50 border-gray-50 text-gray-400 hover:border-gray-200'
                          }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Soil & Area Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500 ml-1 flex items-center gap-2">
                      <Layers size={14} className="text-gray-400" /> {t('soil_type')}
                    </label>
                    <select
                      className="w-full bg-gray-50 border-gray-100 border-2 rounded-xl py-3 px-4 font-bold text-gray-800 focus:ring-4 focus:ring-earth-main/10 focus:border-earth-main transition-all outline-none appearance-none"
                      value={formData.soilType}
                      onChange={(e) => setFormData({ ...formData, soilType: e.target.value })}
                    >
                      {soilTypes.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500 ml-1 flex items-center gap-2">
                      <Maximize size={14} className="text-gray-400" /> {t('field_area_acres')}
                    </label>
                    <input
                      type="number"
                      className="w-full bg-gray-50 border-gray-100 border-2 rounded-xl py-3 px-4 font-bold text-gray-800 focus:ring-4 focus:ring-earth-main/10 focus:border-earth-main transition-all outline-none"
                      value={formData.fieldArea}
                      onChange={(e) => setFormData({ ...formData, fieldArea: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                {/* Predict Button */}
                <button
                  onClick={handlePredict}
                  className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-base hover:bg-black transition-all flex items-center justify-center space-x-3 shadow-2xl active:scale-95 group"
                >
                  <Sprout size={20} className="group-hover:rotate-12 transition-transform" />
                  <span>{t('predict_crops_plan')}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="max-w-4xl mx-auto flex flex-col items-center justify-center py-32 space-y-8">
            <div className="relative">
              <div className="w-24 h-24 border-8 border-gray-100 border-t-earth-main rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="text-earth-main animate-pulse" size={32} />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-gray-800">{t('analyzing_datasets')}</h3>
              <p className="text-gray-400 font-medium">{t('consulting_trends')}</p>
            </div>
            {/* Simple progress simulated */}
            <div className="w-64 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-earth-main animate-[progress_3s_ease-in-out_infinite]" style={{ width: '40%' }}></div>
            </div>
          </div>
        )}

        {/* Results Section */}
        {results && !loading && (
          <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-700 pb-20">
            {/* Analysis Header */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border border-emerald-100 shadow-sm">
                <CheckCircle size={14} />
                <span>{t('prediction_complete')}</span>
              </div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tight">{t('top_crops_for')} <span className="text-earth-main underline decoration-earth-main/30">{results.location}</span></h1>
              <div className="flex flex-wrap justify-center gap-3">
                <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm text-sm font-bold text-gray-600">
                  <MapPin size={14} className="text-red-400" />
                  <span>{results.location}</span>
                </div>
                <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm text-sm font-bold text-gray-600">
                  <Calendar size={14} className="text-blue-400" />
                  <span>Months: {results.months.join(', ')}</span>
                </div>
                <div className="flex items-center space-x-2 bg-amber-50 px-4 py-2 rounded-xl border border-amber-100 shadow-sm text-sm font-bold text-amber-700">
                  <Sprout size={14} className="text-amber-500" />
                  <span>{results.season}</span>
                </div>
              </div>
            </div>

            {/* Historical Weather Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center space-y-3 hover:shadow-xl transition-all">
                <div className="p-4 bg-orange-50 text-orange-500 rounded-2xl">
                  <Thermometer size={32} />
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-gray-900">{results.weather_summary.avg_temp}°</div>
                  <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{t('avg_temp_unit')}</div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center space-y-3 hover:shadow-xl transition-all">
                <div className="p-4 bg-blue-50 text-blue-500 rounded-2xl">
                  <CloudRain size={32} />
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-gray-900">{results.weather_summary.avg_rain}</div>
                  <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{t('avg_monthly_rain')}</div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center space-y-3 hover:shadow-xl transition-all">
                <div className="p-4 bg-sky-50 text-sky-500 rounded-2xl">
                  <Droplets size={32} />
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-gray-900">{results.weather_summary.avg_humidity}</div>
                  <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{t('avg_humidity_unit')}</div>
                </div>
              </div>
            </div>

            {/* Irrigation Advice Section */}
            <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-2xl shadow-gray-200/50 border border-gray-100 space-y-6">
              <div className="flex items-center space-x-3 text-sky-500">
                <Droplets size={24} />
                <h2 className="text-xl font-black tracking-tight text-gray-800">{t('irrigation_advice')}</h2>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-emerald-100">
                  <CheckCircle size={14} />
                  <span>{results.irrigation_advice.status}</span>
                </div>
                <div className="flex items-center space-x-2 bg-gray-50 text-gray-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-gray-100">
                  <Layers size={14} />
                  <span>{formData.soilType} — {formData.fieldArea} {t('acres')}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-6 rounded-3xl flex flex-col items-center space-y-2">
                  <Droplets size={24} className="text-sky-500" />
                  <span className="text-xl font-black text-gray-900">{results.irrigation_advice.litres_per_acre_day}</span>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">{t('litres_acre_day')}</span>
                </div>
                <div className="bg-gray-50 p-6 rounded-3xl flex flex-col items-center space-y-2">
                  <Sprout size={24} className="text-emerald-500" />
                  <span className="text-xl font-black text-gray-900">{results.irrigation_advice.total_litres_day}</span>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">{t('total_litres_day')}</span>
                </div>
                <div className="bg-gray-50 p-6 rounded-3xl flex flex-col items-center space-y-2 text-center px-4">
                  <Key size={24} className="text-amber-500" />
                  <span className="text-lg font-black text-gray-900 leading-tight">{results.irrigation_advice.frequency}</span>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('irrigation_frequency')}</span>
                </div>
              </div>

              <div className="bg-rose-50 p-6 rounded-[2rem] border border-rose-100 flex items-start space-x-4">
                <Sparkles size={20} className="text-rose-500 shrink-0 mt-1" />
                <p className="text-sm font-bold text-rose-800 leading-relaxed italic">
                  Schedule: {results.irrigation_advice.status} · Soil: {formData.soilType}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4">
                {results.irrigation_advice.recommendations.map((tip, i) => (
                  <div key={i} className="flex items-start space-x-3">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 shrink-0"></div>
                    <p className="text-sm font-bold text-gray-600">{tip}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Recommendation */}
            <div className="bg-white rounded-[3rem] p-10 shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-earth-main/5 rounded-full -mr-32 -mt-32"></div>
              <div className="relative space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 text-amber-500">
                    <ArrowLeft size={20} className="rotate-135" />
                    <h2 className="text-xl font-black tracking-tight text-gray-800 uppercase tracking-widest text-xs">{t('top_recommendation')}</h2>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-gray-900">{results.top_recommendation.confidence_score}%</div>
                    <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{t('confidence_score')}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h1 className="text-5xl font-black text-gray-900 tracking-tighter">{results.top_recommendation.name}</h1>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mt-4">
                    <div className="h-full bg-gray-900" style={{ width: `${results.top_recommendation.confidence_score}%` }}></div>
                  </div>
                </div>

                <div className="flex space-x-8 pt-4">
                  <div>
                    <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">{t('season')}</div>
                    <div className="flex items-center gap-2 font-black text-gray-800">
                      <Sprout size={16} className="text-emerald-500" />
                      {results.top_recommendation.season}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">{t('rank')}</div>
                    <div className="flex items-center gap-2 font-black text-gray-800">
                      <Maximize size={16} className="text-amber-500" />
                      #{results.top_recommendation.rank} {t('of')} {results.top_recommendation.total_ranks}
                    </div>
                  </div>
                </div>

                <p className="text-gray-500 font-medium pt-4 border-t border-gray-50">
                  {results.top_recommendation.reason}
                </p>
              </div>
            </div>

            {/* Other Recommendations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
              {results.other_crops.map((crop, i) => (
                <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-earth-main group-hover:bg-earth-main group-hover:text-white transition-colors shadow-sm">
                        {i === 0 ? <CheckCircle size={24} /> : <Sprout size={24} />}
                      </div>
                      <div>
                        <h4 className="text-2xl font-black text-gray-900 leading-none">{crop.name}</h4>
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-1">{crop.season}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black text-gray-900">{crop.match_percentage}%</div>
                      <div className="w-16 h-1 bg-gray-100 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-gray-400 group-hover:bg-earth-main transition-all" style={{ width: `${crop.match_percentage}%` }}></div>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs font-bold text-gray-400 line-clamp-2 leading-relaxed">
                    {crop.reason}
                  </p>
                </div>
              ))}
            </div>

            {/* Sticky Actions */}
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex space-x-4">
              <button
                onClick={handleBack}
                className="bg-white text-gray-900 px-8 py-4 rounded-2xl font-black shadow-2xl border border-gray-100 hover:bg-gray-50 transition-all flex items-center space-x-3 active:scale-95"
              >
                <ArrowLeft size={20} />
                <span>{t('new_analysis')}</span>
              </button>
              <button
                className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black shadow-2xl hover:bg-black transition-all flex items-center space-x-3 active:scale-95"
                onClick={() => window.print()}
              >
                <RefreshCcw size={20} />
                <span>{t('export_report')}</span>
              </button>
            </div>
          </div>
        )}
      </div> {/* End max-w-6xl */}

      <style>{`
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
      `}</style>
    </div>
  );
};

export default CropAdvisorPage;
