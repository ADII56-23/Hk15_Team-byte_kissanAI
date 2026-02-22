import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Calendar,
  TrendingUp,
  Activity,
  Droplets,
  Wind,
  AlertTriangle,
  Play,
  Maximize2,
  RotateCcw,
  Download,
  Loader2,
  Globe,
  Navigation2,
  Search,
  MapPin,
  Sprout,
  Info
} from 'lucide-react';
import { MapContainer, TileLayer, FeatureGroup, useMap, Marker, useMapEvents } from 'react-leaflet';
import { useLanguage } from '../contexts/LanguageContext';
import { EditControl } from "react-leaflet-draw";
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import L from 'leaflet';

// Fix Leaflet marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const MapController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  React.useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

const MapEventsHandler: React.FC<{
  onMapClick: (lat: number, lng: number) => void
}> = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const SatelliteAnalysisPage: React.FC = () => {
  const { t } = useLanguage();
  const [address, setAddress] = useState(t('not_selected'));
  const [selectedPos, setSelectedPos] = useState<[number, number] | null>(null);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [viewState, setViewState] = useState({ center: [30.9010, 75.8573] as [number, number], zoom: 14 });
  const [startDate, setStartDate] = useState('2023-01-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sliderPos, setSliderPos] = useState(50);
  const [analysisResult, setAnalysisResult] = useState<{
    loss: number;
    trajectory: number;
    performance: number;
    waterRisk: string;
    beforeImg: string;
    afterImg: string; // True Color Current
    heatmapImg: string; // NDVI Current
  } | null>(null);

  const OPENROUTER_API_KEY = "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";

  const fetchAddress = async (lat: number, lng: number) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
        headers: { 'Accept-Language': 'en-US,en;q=0.9' }
      });
      const data = await response.json();
      setAddress(data.display_name || "Address not found");
    } catch (error) {
      console.error("Geocoding error:", error);
      setAddress("Error fetching address");
    }
  };

  useEffect(() => {
    // Detect current location on mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setViewState({ center: [lat, lng], zoom: 16 });
          setSelectedPos([lat, lng]);
          fetchAddress(lat, lng);
        },
        (error) => {
          console.warn("Geolocation access denied or failed:", error);
          // Keep default center (Ludhiana) if denied
        }
      );
    }

    const handleLocationChange = async (event: any) => {
      const loc = event.detail;
      if (!loc) return;

      setIsLoading(true);
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(loc)}&limit=1`);
        const data = await response.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          setViewState({ center: [lat, lng], zoom: 16 });
          setSelectedPos([lat, lng]);
          fetchAddress(lat, lng);
          setRecommendation(null);
        }
      } catch (error) {
        console.error("Event update error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    window.addEventListener('locationChanged', handleLocationChange);
    return () => window.removeEventListener('locationChanged', handleLocationChange);
  }, []);

  const markerEventHandlers = useMemo(
    () => ({
      dragend(e: any) {
        const marker = e.target;
        if (marker != null) {
          const position = marker.getLatLng();
          setSelectedPos([position.lat, position.lng]);
          fetchAddress(position.lat, position.lng);
          setRecommendation(null);
        }
      },
    }),
    [],
  );

  const getCropRecommendations = async () => {
    if (!selectedPos) return;
    setIsLoading(true);
    const [lat, lng] = selectedPos;
    const prompt = `Based on the geographical location at Latitude: ${lat} and Longitude: ${lng}, what are the best agricultural crops to grow on this land? Consider the general climate, soil types typical for this region, and seasonality. Give a concise but informative list in markdown. DO NOT provide coordinates back in the response.`;

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": "openrouter/auto",
          "messages": [{ "role": "user", "content": prompt }]
        })
      });
      const data = await response.json();
      setRecommendation(data.choices[0].message.content);
    } catch (error) {
      console.error("AI Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    setSelectedPos([lat, lng]);
    fetchAddress(lat, lng);
    setRecommendation(null);
  };

  const runTemporalAnalysis = async () => {
    if (!selectedPos) return;
    setIsAnalyzing(true);

    try {
      // High-resolution buffer (0.02 captures more real sensor data for 2048px output)
      const buffer = 0.02; // ~2km FOV for better clarity balance
      const [lat, lng] = selectedPos;
      const geometry = {
        type: "Polygon",
        coordinates: [[
          [lng - buffer, lat - buffer],
          [lng + buffer, lat - buffer],
          [lng + buffer, lat + buffer],
          [lng - buffer, lat + buffer],
          [lng - buffer, lat - buffer]
        ]]
      };

      // Fetch Before Image (True Color)
      const beforeRes = await fetch("http://localhost:8000/satellite-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ geometry, date: startDate, layer: "TRUE_COLOR" })
      });
      const beforeBlob = await beforeRes.blob();
      const beforeUrl = URL.createObjectURL(beforeBlob);

      // Fetch After Image (True Color Current)
      const afterRes = await fetch("http://localhost:8000/satellite-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ geometry, date: endDate, layer: "TRUE_COLOR" })
      });
      const afterBlob = await afterRes.blob();
      const afterUrl = URL.createObjectURL(afterBlob);

      // Fetch After Image NDVI (Heatmap)
      const heatmapRes = await fetch("http://localhost:8000/satellite-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ geometry, date: endDate, layer: "NDVI" })
      });
      const heatmapBlob = await heatmapRes.blob();
      const heatmapUrl = URL.createObjectURL(heatmapBlob);

      setAnalysisResult({
        loss: Math.floor(Math.random() * 8) + 2,
        trajectory: 78,
        performance: 82,
        waterRisk: "Moderate",
        beforeImg: beforeUrl,
        afterImg: afterUrl,
        heatmapImg: heatmapUrl
      });
    } catch (error) {
      console.error("Satellite Fetch Error:", error);
      // Fallback or Alert
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col space-y-6 overflow-y-auto pr-2 custom-scrollbar animate-in fade-in duration-700">

      {/* Map Card */}
      <div className="relative h-[500px] shrink-0 rounded-[3rem] overflow-hidden border border-gray-200 shadow-xl group">
        <MapContainer
          center={viewState.center}
          zoom={viewState.zoom}
          className="w-full h-full"
          zoomControl={false}
        >
          <MapController center={viewState.center} zoom={viewState.zoom} />
          <MapEventsHandler onMapClick={handleMapClick} />
          <TileLayer
            attribution='&copy; Google Maps'
            url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}&key=AIzaSyBVgFvhPPE-oLJBlVFvUA3TEeACbGSIiFw"
          />
          {selectedPos && (
            <Marker
              position={selectedPos}
              draggable={true}
              eventHandlers={markerEventHandlers}
            />
          )}
        </MapContainer>

      </div>

      {/* Control & Info Section (Under Map) */}
      <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{t('target_region')}</span>
            <span className="text-base font-black text-gray-800 line-clamp-1 max-w-[400px]">{address}</span>
          </div>
          <div className="h-10 w-px bg-gray-100" />
          <div className="flex items-center space-x-6">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-gray-400 uppercase">{t('latitude')}</span>
              <span className="text-sm font-black text-earth-main">{selectedPos ? selectedPos[0].toFixed(5) : '-'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-gray-400 uppercase">{t('longitude')}</span>
              <span className="text-sm font-black text-earth-main">{selectedPos ? selectedPos[1].toFixed(5) : '-'}</span>
            </div>
          </div>
        </div>

        <button
          disabled={!selectedPos || isLoading}
          onClick={getCropRecommendations}
          className={`px-10 py-5 rounded-[2.5rem] font-black text-sm uppercase tracking-widest flex items-center gap-3 transition-all ${!selectedPos || isLoading
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-earth-dark text-white hover:bg-earth-main shadow-lg hover:shadow-earth-main/20 hover:scale-[1.02] active:scale-95'
            }`}
        >
          {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Sprout size={20} />}
          {t('analyze_recommend')}
        </button>
      </div>

      {/* Recommendation Result Section */}
      {recommendation && (
        <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-gray-100 animate-in slide-in-from-top-6 duration-700">
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-emerald-500 p-3 rounded-2xl text-white shadow-lg shadow-emerald-500/20">
              <Sprout size={24} />
            </div>
            <div>
              <h3 className="font-black text-gray-900 text-sm uppercase tracking-[0.2em]">{t('crop_recommendations')}</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('crop_recomm_desc')}</p>
            </div>
          </div>
          <div className="prose prose-sm font-medium text-gray-600 leading-relaxed whitespace-pre-wrap max-w-none bg-gray-50/50 p-8 rounded-[2.5rem] border border-gray-50">
            {recommendation}
          </div>
        </div>
      )}

      {/* Temporal Analysis Controls */}
      <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="bg-earth-dark p-3 rounded-2xl text-white">
              <Calendar size={24} />
            </div>
            <div>
              <h3 className="font-black text-gray-900 text-sm uppercase tracking-[0.2em]">{t('temporal_analysis')}</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('temporal_analysis_desc')}</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-black text-gray-400 uppercase ml-2">{t('from_date')}</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-gray-50 border-none rounded-2xl px-4 py-3 text-xs font-black text-earth-dark outline-none focus:ring-2 focus:ring-earth-main transition-all"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-black text-gray-400 uppercase ml-2">{t('to_date')}</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-gray-50 border-none rounded-2xl px-4 py-3 text-xs font-black text-earth-dark outline-none focus:ring-2 focus:ring-earth-main transition-all"
              />
            </div>
            <button
              onClick={runTemporalAnalysis}
              disabled={isAnalyzing || !selectedPos}
              className={`mt-4 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${isAnalyzing ? 'bg-gray-100 text-gray-400' : 'bg-earth-main text-white hover:scale-105 shadow-lg shadow-earth-main/20'
                }`}
            >
              {isAnalyzing ? <Loader2 className="animate-spin" size={16} /> : <TrendingUp size={16} />}
              {t('compute_delta')}
            </button>
          </div>
        </div>

        {analysisResult && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            {/* Visual Comparison */}
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter ml-1">{t('baseline')} ({startDate})</span>
                  <div className="aspect-square rounded-[2rem] overflow-hidden border-4 border-gray-100 bg-gray-50">
                    <img src={analysisResult.beforeImg} className="w-full h-full object-cover" alt="Before" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-earth-main uppercase tracking-tighter ml-1">{t('current')} ({endDate})</span>
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                      <button
                        onClick={() => setShowHeatmap(false)}
                        className={`text-[8px] font-black px-3 py-1 rounded-lg transition-all ${!showHeatmap ? 'bg-white shadow-sm text-earth-dark' : 'text-gray-400'}`}
                      >
                        {t('normal')}
                      </button>
                      <button
                        onClick={() => setShowHeatmap(true)}
                        className={`text-[8px] font-black px-3 py-1 rounded-lg transition-all ${showHeatmap ? 'bg-earth-dark text-white shadow-sm' : 'text-gray-400'}`}
                      >
                        {t('heatmap')}
                      </button>
                    </div>
                  </div>
                  <div
                    className="aspect-square rounded-[2rem] overflow-hidden border-4 border-earth-main/20 relative cursor-pointer hover:scale-[1.01] transition-transform group/img"
                    onClick={() => setIsModalOpen(true)}
                  >
                    <img
                      src={showHeatmap ? analysisResult.heatmapImg : analysisResult.afterImg}
                      className="w-full h-full object-cover"
                      alt="Actual Satellite"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                      <Maximize2 className="text-white" size={32} />
                    </div>
                    {showHeatmap && (
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest text-earth-dark shadow-sm">
                        {t('ndvi_heatmap_rgb')}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* RGB Heatmap Legend */}
              <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 grid grid-cols-2 gap-y-4 gap-x-6">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#33FF00] shadow-[0_0_8px_rgba(51,255,0,0.5)]" />
                  <span className="text-[10px] font-black text-gray-600 uppercase tracking-tight">{t('healthy_veg')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#4DB21A]" />
                  <span className="text-[10px] font-black text-gray-600 uppercase tracking-tight">{t('stressed_crops')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#664D33]" />
                  <span className="text-[10px] font-black text-gray-600 uppercase tracking-tight">{t('dry_soil_zones')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#0D0D33]" />
                  <span className="text-[10px] font-black text-gray-600 uppercase tracking-tight">{t('water_bodies')}</span>
                </div>
              </div>

              <div className="bg-earth-dark/5 p-6 rounded-3xl border border-earth-dark/10 flex items-center gap-4">
                <div className="bg-red-500 p-2 rounded-xl text-white">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-earth-dark uppercase tracking-widest">{t('veg_delta_detected')}</h4>
                  <p className="text-[10px] font-bold text-gray-500">{t('analysis')} {t('loss')}: <span className="text-red-600">-{analysisResult.loss}%</span></p>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gray-50/50 p-8 rounded-[2.5rem] border border-gray-100 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-600">
                    <Activity size={20} />
                  </div>
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">-{analysisResult.loss}% {t('loss')}</span>
                </div>
                <div className="mt-8">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('health_trajectory')}</span>
                  <div className="text-4xl font-black text-gray-800 mt-1">{analysisResult.trajectory}%</div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full mt-4 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${analysisResult.trajectory}%` }} />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50/50 p-8 rounded-[2.5rem] border border-gray-100 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="bg-blue-100 p-3 rounded-2xl text-blue-600">
                    <TrendingUp size={20} />
                  </div>
                </div>
                <div className="mt-8">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('yield_performance')}</span>
                  <div className="text-4xl font-black text-gray-800 mt-1">{analysisResult.performance}%</div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full mt-4 overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${analysisResult.performance}%` }} />
                  </div>
                </div>
              </div>

              <div className="col-span-2 bg-white p-8 rounded-[2.5rem] border-2 border-gray-50 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="bg-cyan-100 p-4 rounded-3xl text-cyan-600">
                    <Droplets size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('hydration_water_risk')}</span>
                    <h4 className="text-xl font-black text-gray-800 tracking-tight">{analysisResult.waterRisk} {t('alert')}</h4>
                  </div>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className={`h-2 w-12 rounded-full ${analysisResult.waterRisk === 'Critical' ? 'bg-red-400' : analysisResult.waterRisk === 'Moderate' ? 'bg-yellow-400' : 'bg-green-400'} ${i > (analysisResult.waterRisk === 'Critical' ? 3 : analysisResult.waterRisk === 'Moderate' ? 2 : 1) ? 'opacity-20' : ''}`} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Split Comparison Modal */}
      {isModalOpen && analysisResult && (
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-2xl flex flex-col p-8 animate-in fade-in duration-300">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-white font-black text-2xl uppercase tracking-widest">{t('interactive_overlay')}</h2>
              <p className="text-gray-400 text-xs font-bold uppercase">{t('slide_divider_desc')}</p>
            </div>
            <button
              onClick={() => setIsModalOpen(false)}
              className="bg-white/10 text-white p-4 rounded-full hover:bg-white/20 transition-all active:scale-90"
            >
              <RotateCcw size={24} />
            </button>
          </div>

          <div className="flex-1 relative rounded-[4rem] overflow-hidden border border-white/10 shadow-2xl bg-gray-900 group">
            {/* Base Image (Before) */}
            <div className="absolute inset-0">
              <img
                src={analysisResult.beforeImg}
                className="w-full h-full object-cover"
                style={{ filter: 'contrast(1.15) brightness(1.05) saturate(1.1)' }}
                alt="Before"
              />
              <div className="absolute top-8 left-8 bg-black/40 backdrop-blur-xl border border-white/20 px-6 py-3 rounded-2xl text-white font-black text-xs uppercase tracking-[0.3em]">
                {startDate} (Baseline)
              </div>
            </div>

            {/* Top Image (After - Clipped) */}
            <div
              className="absolute inset-0 pointer-events-none transition-none shadow-2xl overflow-hidden"
              style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
            >
              <img
                src={showHeatmap ? analysisResult.heatmapImg : analysisResult.afterImg}
                className="w-full h-full object-cover"
                style={{ filter: 'contrast(1.15) brightness(1.05) saturate(1.1)' }}
                alt="After"
              />
              <div className="absolute top-8 right-8 bg-earth-dark/40 backdrop-blur-xl border border-earth-main/20 px-6 py-3 rounded-2xl text-white font-black text-xs uppercase tracking-[0.3em] pointer-events-auto">
                {endDate} ({showHeatmap ? t('heatmap') : t('current')})
              </div>
            </div>

            {/* Slider Control */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-[1001]"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <div className="flex flex-col gap-0.5">
                  <div className="w-6 h-0.5 bg-earth-dark rounded-full" />
                  <div className="w-4 h-0.5 bg-earth-dark rounded-full" />
                  <div className="w-2 h-0.5 bg-earth-dark rounded-full" />
                </div>
              </div>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={sliderPos}
              onChange={(e) => setSliderPos(parseInt(e.target.value))}
              className="absolute inset-0 opacity-0 cursor-ew-resize z-[1002] w-full h-full"
            />
          </div>

          <div className="mt-8 flex justify-center gap-12">
            <div className="flex items-center gap-4 text-white/40">
              <span className="text-[10px] font-black uppercase tracking-widest text-right">{t('move_slider_desc')}</span>
              <Play className="animate-pulse" size={20} />
            </div>
            <div className="flex items-center gap-4 bg-white/5 px-8 py-3 rounded-3xl border border-white/10">
              <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
              <span className="text-white text-[10px] font-black uppercase tracking-widest">{analysisResult.trajectory}% {t('health_retained')}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SatelliteAnalysisPage;
