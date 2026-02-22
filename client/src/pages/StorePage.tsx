import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ChevronDown, ShoppingBag, Store, Package, Plus, X,
  IndianRupee, Weight, Wheat, MapPin, Search, Filter, Star,
  TrendingUp, Eye, Phone, Trash2, CheckCircle2,
  User, Camera, Sparkles, ArrowRight, Loader2
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

type UserMode = 'seller' | 'buyer';

interface CropListing {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  pricePerUnit: string;
  description: string;
  location: string;
  image: string | null;
  category: string;
  createdAt: Date;
  sellerName: string;
  rating: number;
  views: number;
}

const CROP_CATEGORIES = [
  'Cereals', 'Pulses', 'Vegetables', 'Fruits', 'Spices', 'Oilseeds', 'Cash Crops', 'Other'
];

const UNITS = ['kg', 'quintal', 'ton', 'dozen', 'piece'];

// Sample marketplace data
const SAMPLE_LISTINGS: CropListing[] = [
  {
    id: '1', name: 'Organic Basmati Rice', quantity: '500', unit: 'kg',
    pricePerUnit: '85', description: 'Premium grade organic basmati rice from Punjab fields. Aged for 2 years for perfect aroma.',
    location: 'Ludhiana, Punjab', image: null, category: 'Cereals',
    createdAt: new Date('2026-02-20'), sellerName: 'Harpreet Singh', rating: 4.8, views: 234,
  },
  {
    id: '2', name: 'Fresh Alphonso Mangoes', quantity: '200', unit: 'dozen',
    pricePerUnit: '1200', description: 'Hapus mangoes directly from Ratnagiri. No chemicals, naturally ripened.',
    location: 'Ratnagiri, Maharashtra', image: null, category: 'Fruits',
    createdAt: new Date('2026-02-21'), sellerName: 'Ramesh Patil', rating: 4.9, views: 512,
  },
  {
    id: '3', name: 'Yellow Toor Dal', quantity: '1000', unit: 'kg',
    pricePerUnit: '120', description: 'Clean and polished toor dal. High protein content, farm-fresh quality.',
    location: 'Nagpur, Maharashtra', image: null, category: 'Pulses',
    createdAt: new Date('2026-02-19'), sellerName: 'Sanjay Deshmukh', rating: 4.5, views: 178,
  },
  {
    id: '4', name: 'Kashmir Saffron (Kesar)', quantity: '5', unit: 'kg',
    pricePerUnit: '245000', description: 'Grade-1 Kashmiri saffron. ISO 3632 certified. Direct from Pampore.',
    location: 'Pampore, Kashmir', image: null, category: 'Spices',
    createdAt: new Date('2026-02-18'), sellerName: 'Abdul Rashid', rating: 5.0, views: 891,
  },
  {
    id: '5', name: 'Organic Groundnut Oil', quantity: '300', unit: 'kg',
    pricePerUnit: '180', description: 'Cold-pressed groundnut oil. No preservatives, traditional wood-press extraction.',
    location: 'Junagadh, Gujarat', image: null, category: 'Oilseeds',
    createdAt: new Date('2026-02-22'), sellerName: 'Bhavesh Patel', rating: 4.7, views: 345,
  },
  {
    id: '6', name: 'Fresh Green Chillies', quantity: '100', unit: 'kg',
    pricePerUnit: '60', description: 'Guntur variety green chillies. Perfect spice level for cooking.',
    location: 'Guntur, Andhra Pradesh', image: null, category: 'Vegetables',
    createdAt: new Date('2026-02-22'), sellerName: 'Lakshmi Devi', rating: 4.3, views: 156,
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  'Cereals': 'from-amber-500 to-yellow-500',
  'Pulses': 'from-orange-500 to-red-400',
  'Vegetables': 'from-green-500 to-emerald-500',
  'Fruits': 'from-pink-500 to-rose-500',
  'Spices': 'from-red-600 to-orange-500',
  'Oilseeds': 'from-yellow-600 to-amber-500',
  'Cash Crops': 'from-teal-500 to-cyan-500',
  'Other': 'from-gray-500 to-slate-500',
};

const CATEGORY_ICONS: Record<string, string> = {
  'Cereals': '🌾', 'Pulses': '🫘', 'Vegetables': '🥬', 'Fruits': '🍎',
  'Spices': '🌶️', 'Oilseeds': '🥜', 'Cash Crops': '🌿', 'Other': '📦',
};

// ── Crop price prediction database (₹ per kg) ──
interface PricePrediction {
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
  confidence: number;
  source: string;
}

const CROP_PRICE_DB: Record<string, { base: number; min: number; max: number; trend: 'up' | 'down' | 'stable'; trendPct: number }> = {
  'rice': { base: 42, min: 35, max: 85, trend: 'stable', trendPct: 2.1 },
  'basmati': { base: 80, min: 65, max: 120, trend: 'up', trendPct: 8.5 },
  'wheat': { base: 28, min: 22, max: 38, trend: 'up', trendPct: 5.3 },
  'maize': { base: 22, min: 18, max: 30, trend: 'stable', trendPct: 1.8 },
  'corn': { base: 22, min: 18, max: 30, trend: 'stable', trendPct: 1.8 },
  'jowar': { base: 32, min: 25, max: 42, trend: 'up', trendPct: 4.2 },
  'bajra': { base: 26, min: 20, max: 35, trend: 'stable', trendPct: 2.5 },
  'ragi': { base: 38, min: 30, max: 55, trend: 'up', trendPct: 6.1 },
  'toor': { base: 110, min: 85, max: 150, trend: 'up', trendPct: 7.2 },
  'dal': { base: 100, min: 75, max: 140, trend: 'up', trendPct: 6.8 },
  'chana': { base: 65, min: 50, max: 90, trend: 'stable', trendPct: 3.1 },
  'moong': { base: 95, min: 75, max: 130, trend: 'up', trendPct: 5.5 },
  'urad': { base: 105, min: 80, max: 145, trend: 'up', trendPct: 4.9 },
  'masoor': { base: 72, min: 55, max: 95, trend: 'stable', trendPct: 2.3 },
  'soybean': { base: 48, min: 38, max: 65, trend: 'down', trendPct: 3.2 },
  'groundnut': { base: 65, min: 50, max: 90, trend: 'up', trendPct: 4.7 },
  'mustard': { base: 58, min: 45, max: 78, trend: 'stable', trendPct: 2.9 },
  'sunflower': { base: 62, min: 48, max: 82, trend: 'up', trendPct: 5.1 },
  'cotton': { base: 68, min: 55, max: 85, trend: 'up', trendPct: 9.3 },
  'sugarcane': { base: 3.5, min: 2.8, max: 4.5, trend: 'stable', trendPct: 1.5 },
  'jute': { base: 52, min: 40, max: 68, trend: 'down', trendPct: 2.1 },
  'tea': { base: 220, min: 150, max: 350, trend: 'up', trendPct: 6.4 },
  'coffee': { base: 350, min: 250, max: 500, trend: 'up', trendPct: 11.2 },
  'pepper': { base: 450, min: 350, max: 600, trend: 'up', trendPct: 8.8 },
  'cardamom': { base: 1800, min: 1200, max: 2800, trend: 'up', trendPct: 12.5 },
  'turmeric': { base: 95, min: 70, max: 140, trend: 'up', trendPct: 7.6 },
  'ginger': { base: 55, min: 35, max: 85, trend: 'down', trendPct: 4.3 },
  'chilli': { base: 120, min: 60, max: 200, trend: 'up', trendPct: 15.2 },
  'onion': { base: 25, min: 12, max: 60, trend: 'down', trendPct: 8.5 },
  'potato': { base: 18, min: 10, max: 35, trend: 'stable', trendPct: 3.8 },
  'tomato': { base: 30, min: 10, max: 80, trend: 'up', trendPct: 22.0 },
  'mango': { base: 80, min: 40, max: 200, trend: 'up', trendPct: 10.5 },
  'alphonso': { base: 180, min: 120, max: 300, trend: 'up', trendPct: 12.0 },
  'banana': { base: 25, min: 15, max: 45, trend: 'stable', trendPct: 2.2 },
  'apple': { base: 120, min: 80, max: 200, trend: 'stable', trendPct: 3.5 },
  'orange': { base: 40, min: 25, max: 65, trend: 'stable', trendPct: 2.8 },
  'coconut': { base: 22, min: 15, max: 35, trend: 'up', trendPct: 5.9 },
  'saffron': { base: 250000, min: 180000, max: 350000, trend: 'up', trendPct: 6.7 },
  'kesar': { base: 250000, min: 180000, max: 350000, trend: 'up', trendPct: 6.7 },
  'cashew': { base: 750, min: 550, max: 1100, trend: 'up', trendPct: 7.3 },
};

// Regional price multipliers
const REGION_MULTIPLIERS: Record<string, number> = {
  'punjab': 1.05, 'haryana': 1.03, 'uttar pradesh': 0.95, 'up': 0.95,
  'madhya pradesh': 0.92, 'mp': 0.92, 'maharashtra': 1.08, 'karnataka': 1.02,
  'tamil nadu': 1.04, 'kerala': 1.12, 'andhra pradesh': 0.98, 'ap': 0.98,
  'telangana': 1.01, 'gujarat': 1.06, 'rajasthan': 0.94, 'bihar': 0.88,
  'west bengal': 0.96, 'odisha': 0.90, 'assam': 0.93, 'kashmir': 1.15,
  'himachal': 1.10, 'delhi': 1.18, 'mumbai': 1.20, 'bangalore': 1.12,
  'chennai': 1.08, 'kolkata': 1.05, 'hyderabad': 1.06, 'lucknow': 0.97,
  'jaipur': 0.98, 'ludhiana': 1.06, 'nagpur': 1.02, 'pune': 1.10,
  'ratnagiri': 1.08, 'guntur': 0.96, 'junagadh': 1.04, 'pampore': 1.15,
};

function predictCropPrice(cropName: string, location: string, category: string): PricePrediction | null {
  if (!cropName || cropName.length < 2) return null;

  const nameLower = cropName.toLowerCase();
  const locLower = location.toLowerCase();

  // Find best matching crop from DB
  let matched: typeof CROP_PRICE_DB[string] | null = null;
  let matchedKey = '';
  for (const key of Object.keys(CROP_PRICE_DB)) {
    if (nameLower.includes(key) || key.includes(nameLower)) {
      matched = CROP_PRICE_DB[key];
      matchedKey = key;
      break;
    }
  }

  // Fallback: generate from category
  if (!matched) {
    const catDefaults: Record<string, typeof CROP_PRICE_DB[string]> = {
      'Cereals': { base: 35, min: 20, max: 60, trend: 'stable', trendPct: 3.0 },
      'Pulses': { base: 90, min: 60, max: 130, trend: 'up', trendPct: 5.5 },
      'Vegetables': { base: 30, min: 15, max: 70, trend: 'stable', trendPct: 8.0 },
      'Fruits': { base: 60, min: 30, max: 150, trend: 'up', trendPct: 6.0 },
      'Spices': { base: 200, min: 100, max: 500, trend: 'up', trendPct: 7.5 },
      'Oilseeds': { base: 55, min: 40, max: 80, trend: 'stable', trendPct: 4.0 },
      'Cash Crops': { base: 50, min: 30, max: 80, trend: 'up', trendPct: 5.0 },
      'Other': { base: 40, min: 20, max: 70, trend: 'stable', trendPct: 3.5 },
    };
    matched = catDefaults[category] || catDefaults['Other'];
    matchedKey = category.toLowerCase();
  }

  // Apply regional multiplier
  let regionMult = 1.0;
  for (const [region, mult] of Object.entries(REGION_MULTIPLIERS)) {
    if (locLower.includes(region)) {
      regionMult = mult;
      break;
    }
  }

  const minPrice = Math.round(matched.min * regionMult);
  const maxPrice = Math.round(matched.max * regionMult);
  const avgPrice = Math.round(matched.base * regionMult);
  const confidence = matchedKey && nameLower.includes(matchedKey) ? 92 : 78;

  return {
    minPrice, maxPrice, avgPrice,
    trend: matched.trend,
    trendPercent: matched.trendPct,
    confidence,
    source: location ? `${location} Mandi` : 'your location avg',
  };
}

const StorePage: React.FC = () => {
  const { t } = useLanguage();
  const [mode, setMode] = useState<UserMode>('buyer');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [myListings, setMyListings] = useState<CropListing[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [detectedLocation, setDetectedLocation] = useState<string>('');

  // Detect current location on mount
  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`
          );
          const data = await res.json();
          const addr = data?.address;
          const city = addr?.city || addr?.town || addr?.village || addr?.county || addr?.state_district || '';
          const state = addr?.state || '';
          const loc = [city, state].filter(Boolean).join(', ');
          if (loc) {
            setDetectedLocation(loc);
          }
        } catch (err) {
          console.warn('Reverse geocoding failed:', err);
        }
      },
      (err) => console.warn('Geolocation error:', err),
      { timeout: 10000 }
    );
  }, []);

  // Form state — auto-fill location when detected
  const [formData, setFormData] = useState({
    name: '', quantity: '', unit: 'kg', pricePerUnit: '', description: '',
    location: '', category: 'Cereals', image: null as string | null,
  });

  // Update location in form when detected location arrives (only if still empty)
  useEffect(() => {
    if (detectedLocation && !formData.location) {
      setFormData(prev => ({ ...prev, location: detectedLocation }));
    }
  }, [detectedLocation]);

  // Price prediction state
  const [pricePrediction, setPricePrediction] = useState<PricePrediction | null>(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const predictionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced price prediction
  const debouncedPredict = useCallback((name: string, location: string, category: string) => {
    if (predictionTimerRef.current) clearTimeout(predictionTimerRef.current);
    if (!name || name.length < 2) {
      setPricePrediction(null);
      setPredictionLoading(false);
      return;
    }
    setPredictionLoading(true);
    predictionTimerRef.current = setTimeout(() => {
      const prediction = predictCropPrice(name, location, category);
      setPricePrediction(prediction);
      setPredictionLoading(false);
    }, 600);
  }, []);

  // Trigger prediction when crop name, location, or category changes
  useEffect(() => {
    debouncedPredict(formData.name, formData.location, formData.category);
    return () => { if (predictionTimerRef.current) clearTimeout(predictionTimerRef.current); };
  }, [formData.name, formData.location, formData.category, debouncedPredict]);

  const handleModeSwitch = (newMode: UserMode) => {
    setMode(newMode);
    setDropdownOpen(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, image: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitListing = (e: React.FormEvent) => {
    e.preventDefault();
    const newListing: CropListing = {
      id: Date.now().toString(),
      ...formData,
      createdAt: new Date(),
      sellerName: 'You',
      rating: 0,
      views: 0,
    };
    setMyListings(prev => [newListing, ...prev]);
    setFormData({ name: '', quantity: '', unit: 'kg', pricePerUnit: '', description: '', location: detectedLocation, category: 'Cereals', image: null });
    setShowAddForm(false);
  };

  const handleDeleteListing = (id: string) => {
    setMyListings(prev => prev.filter(l => l.id !== id));
  };

  // Combine seller's listings with sample marketplace data for the buyer view
  const allListings = [...myListings, ...SAMPLE_LISTINGS];

  const filteredListings = allListings.filter(listing => {
    const matchesSearch = listing.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || listing.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('en-IN').format(Number(price));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 animate-in fade-in duration-700">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6">

        {/* Header with Mode Dropdown */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            {/* Mode Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl px-5 py-3 shadow-sm hover:shadow-md transition-all duration-200 min-w-[180px]"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${mode === 'seller'
                  ? 'bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/30'
                  : 'bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/30'
                  }`}>
                  {mode === 'seller' ? <Store size={18} className="text-white" /> : <ShoppingBag size={18} className="text-white" />}
                </div>
                <div className="text-left flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{t('store_mode')}</p>
                  <p className="font-bold text-gray-900 text-sm">
                    {mode === 'seller' ? t('seller') : t('buyer')}
                  </p>
                </div>
                <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                  <button
                    onClick={() => handleModeSwitch('buyer')}
                    className={`w-full flex items-center gap-3 px-5 py-3.5 transition-all ${mode === 'buyer' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'
                      }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                      <ShoppingBag size={16} className="text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm">{t('buyer')}</p>
                      <p className="text-[10px] text-gray-400 font-medium">{t('buyer_desc')}</p>
                    </div>
                    {mode === 'buyer' && <CheckCircle2 size={16} className="ml-auto text-blue-500" />}
                  </button>
                  <div className="h-px bg-gray-100" />
                  <button
                    onClick={() => handleModeSwitch('seller')}
                    className={`w-full flex items-center gap-3 px-5 py-3.5 transition-all ${mode === 'seller' ? 'bg-orange-50 text-orange-700' : 'hover:bg-gray-50 text-gray-700'
                      }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                      <Store size={16} className="text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm">{t('seller')}</p>
                      <p className="text-[10px] text-gray-400 font-medium">{t('seller_desc')}</p>
                    </div>
                    {mode === 'seller' && <CheckCircle2 size={16} className="ml-auto text-orange-500" />}
                  </button>
                </div>
              )}
            </div>

            {/* Page Title */}
            <div>
              <h1 className="text-2xl font-black text-gray-900">
                {mode === 'seller' ? t('crop_sell') : t('crop_marketplace')}
              </h1>
              <p className="text-sm text-gray-500 font-medium">
                {mode === 'seller' ? t('crop_sell_desc') : t('crop_marketplace_desc')}
              </p>
            </div>
          </div>

          {/* Action Button */}
          {mode === 'seller' && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold px-6 py-3 rounded-2xl shadow-lg shadow-orange-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-orange-500/30 hover:-translate-y-0.5"
            >
              <Plus size={18} />
              {t('add_listing')}
            </button>
          )}
        </div>

        {/* ===== SELLER MODE ===== */}
        {mode === 'seller' && (
          <div className="space-y-8">
            {/* Seller Stats Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {[
                { icon: Package, label: t('active_listings'), value: myListings.length.toString(), color: 'from-orange-500 to-amber-500', shadow: 'shadow-orange-500/20' },
                { icon: Eye, label: t('total_views'), value: myListings.reduce((a, b) => a + b.views, 0).toString(), color: 'from-blue-500 to-indigo-500', shadow: 'shadow-blue-500/20' },
                { icon: TrendingUp, label: t('total_revenue'), value: '₹0', color: 'from-green-500 to-emerald-500', shadow: 'shadow-green-500/20' },
                { icon: Star, label: t('avg_rating'), value: '—', color: 'from-amber-500 to-yellow-500', shadow: 'shadow-amber-500/20' },
              ].map((stat, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 hover:shadow-md transition-all duration-200">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg ${stat.shadow}`}>
                    <stat.icon size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{stat.label}</p>
                    <p className="text-xl font-black text-gray-900">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Listing Form (Modal-style overlay) */}
            {showAddForm && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-xl font-black text-gray-900">{t('add_new_crop')}</h2>
                        <p className="text-sm text-gray-500 font-medium">{t('add_new_crop_desc')}</p>
                      </div>
                      <button onClick={() => setShowAddForm(false)} className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                        <X size={18} />
                      </button>
                    </div>

                    <form onSubmit={handleSubmitListing} className="space-y-5">
                      {/* Image Upload */}
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center cursor-pointer hover:border-orange-300 hover:bg-orange-50/30 transition-all duration-200 group"
                      >
                        {formData.image ? (
                          <div className="relative">
                            <img src={formData.image} alt="Crop" className="max-h-40 mx-auto rounded-xl object-cover" />
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setFormData(prev => ({ ...prev, image: null })); }}
                              className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="w-14 h-14 bg-gray-100 group-hover:bg-orange-100 rounded-2xl mx-auto flex items-center justify-center transition-colors">
                              <Camera size={24} className="text-gray-400 group-hover:text-orange-500 transition-colors" />
                            </div>
                            <p className="text-sm font-bold text-gray-600">{t('upload_crop_image')}</p>
                            <p className="text-xs text-gray-400">{t('upload_image_hint')}</p>
                          </div>
                        )}
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </div>

                      {/* Crop Name & Category */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">{t('crop_name')}</label>
                          <input
                            type="text" required value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder={t('crop_name_placeholder')}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">{t('category')}</label>
                          <select
                            value={formData.category}
                            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition-all"
                          >
                            {CROP_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                          </select>
                        </div>
                      </div>

                      {/* Predicted Price Banner */}
                      {predictionLoading && formData.name.length >= 2 && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4 flex items-center gap-3 animate-in fade-in duration-300">
                          <Loader2 size={18} className="text-blue-500 animate-spin" />
                          <p className="text-sm text-blue-600 font-medium">{t('predicting_price')}</p>
                        </div>
                      )}

                      {!predictionLoading && pricePrediction && (
                        <div className="bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 border border-green-200 rounded-2xl overflow-hidden animate-in slide-in-from-top-2 fade-in duration-500">
                          <div className="px-5 py-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm shadow-green-500/30">
                                  <Sparkles size={14} className="text-white" />
                                </div>
                                <div>
                                  <p className="text-xs font-black text-green-800 uppercase tracking-wider">{t('predicted_price')}</p>
                                  <p className="text-[10px] text-green-600/70 font-medium">{pricePrediction.source} • {pricePrediction.confidence}% {t('confidence')}</p>
                                </div>
                              </div>
                              <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg ${pricePrediction.trend === 'up' ? 'bg-green-100 text-green-700' :
                                pricePrediction.trend === 'down' ? 'bg-red-100 text-red-600' :
                                  'bg-gray-100 text-gray-600'
                                }`}>
                                <TrendingUp size={12} className={pricePrediction.trend === 'down' ? 'rotate-180' : pricePrediction.trend === 'stable' ? 'rotate-0 opacity-50' : ''} />
                                {pricePrediction.trend === 'up' ? '+' : pricePrediction.trend === 'down' ? '-' : ''}{pricePrediction.trendPercent}%
                              </div>
                            </div>

                            <div className="flex items-end gap-4">
                              {/* Price Range */}
                              <div className="flex-1">
                                <div className="flex items-baseline gap-1 mb-2">
                                  <span className="text-3xl font-black text-green-700">₹{new Intl.NumberFormat('en-IN').format(pricePrediction.avgPrice)}</span>
                                  <span className="text-sm text-green-600/60 font-medium">/{formData.unit}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-2 bg-green-100 rounded-full overflow-hidden relative">
                                    <div
                                      className="absolute h-full bg-gradient-to-r from-red-400 via-yellow-400 to-green-500 rounded-full"
                                      style={{ width: '100%' }}
                                    />
                                    <div
                                      className="absolute h-full w-1 bg-green-800 rounded-full"
                                      style={{ left: `${((pricePrediction.avgPrice - pricePrediction.minPrice) / (pricePrediction.maxPrice - pricePrediction.minPrice)) * 100}%` }}
                                    />
                                  </div>
                                </div>
                                <div className="flex justify-between mt-1">
                                  <span className="text-[10px] text-green-600/60 font-bold">₹{new Intl.NumberFormat('en-IN').format(pricePrediction.minPrice)}</span>
                                  <span className="text-[10px] text-green-600/60 font-bold">₹{new Intl.NumberFormat('en-IN').format(pricePrediction.maxPrice)}</span>
                                </div>
                              </div>

                              {/* Use Price Button */}
                              <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, pricePerUnit: pricePrediction.avgPrice.toString() }))}
                                className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-green-600/25 transition-all duration-200 hover:shadow-lg whitespace-nowrap"
                              >
                                {t('use_this_price')}
                                <ArrowRight size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Quantity & Price */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">{t('quantity')}</label>
                          <input
                            type="number" required value={formData.quantity} min="1"
                            onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                            placeholder="e.g. 500"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">{t('unit')}</label>
                          <select
                            value={formData.unit}
                            onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition-all"
                          >
                            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">{t('price_per_unit')}</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                            <input
                              type="number" required value={formData.pricePerUnit} min="1"
                              onChange={(e) => setFormData(prev => ({ ...prev, pricePerUnit: e.target.value }))}
                              placeholder="e.g. 85"
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition-all"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Location */}
                      <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">{t('your_location')}</label>
                        <div className="relative">
                          <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text" required value={formData.location}
                            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                            placeholder={t('location_placeholder')}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition-all"
                          />
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">{t('description')}</label>
                        <textarea
                          value={formData.description} rows={3}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          placeholder={t('description_placeholder')}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition-all resize-none"
                        />
                      </div>

                      {/* Submit */}
                      <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-500/25 transition-all duration-200 flex items-center justify-center gap-2 text-base"
                      >
                        <CheckCircle2 size={20} />
                        {t('publish_listing')}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* My Listings */}
            <div>
              <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                <Package size={20} className="text-orange-500" />
                {t('my_listings')}
              </h2>

              {myListings.length === 0 ? (
                <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">
                  <div className="w-20 h-20 bg-orange-50 rounded-3xl mx-auto mb-4 flex items-center justify-center">
                    <Wheat size={36} className="text-orange-400" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">{t('no_listings_yet')}</h3>
                  <p className="text-sm text-gray-500 font-medium mb-6 max-w-sm mx-auto">{t('no_listings_desc')}</p>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-orange-500/20 hover:shadow-xl transition-all"
                  >
                    <Plus size={16} />
                    {t('add_first_crop')}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myListings.map(listing => (
                    <div key={listing.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-200 group">
                      {/* Card Header */}
                      <div className={`h-2 bg-gradient-to-r ${CATEGORY_COLORS[listing.category] || 'from-gray-400 to-gray-500'}`} />
                      <div className="p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl">{CATEGORY_ICONS[listing.category] || '📦'}</span>
                          <div className="flex gap-1">
                            <button onClick={() => handleDeleteListing(listing.id)} className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        <h3 className="font-bold text-gray-900">{listing.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <MapPin size={12} /> {listing.location}
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                          <span className="font-black text-green-700">₹{formatPrice(listing.pricePerUnit)}/{listing.unit}</span>
                          <span className="text-xs text-gray-400 font-medium">{listing.quantity} {listing.unit}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== BUYER MODE ===== */}
        {mode === 'buyer' && (
          <div className="space-y-6">
            {/* Search & Filter Bar */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-4 shadow-sm">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('search_crops')}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedCategory('All')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedCategory === 'All'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  {t('all')}
                </button>
                {CROP_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${selectedCategory === cat
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    {CATEGORY_ICONS[cat]} {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Marketplace Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: t('total_listings_market'), value: allListings.length.toString(), icon: Package, color: 'text-blue-600 bg-blue-50' },
                { label: t('categories_available'), value: new Set(allListings.map(l => l.category)).size.toString(), icon: Filter, color: 'text-purple-600 bg-purple-50' },
                { label: t('verified_sellers'), value: (new Set(allListings.map(l => l.sellerName)).size).toString(), icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
                { label: t('avg_market_rating'), value: '4.7', icon: Star, color: 'text-amber-600 bg-amber-50' },
              ].map((stat, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                    <stat.icon size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{stat.label}</p>
                    <p className="text-lg font-black text-gray-900">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Crop Listings Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredListings.map(listing => (
                <div key={listing.id} className="bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer">
                  {/* Category Gradient Strip */}
                  <div className={`h-1.5 bg-gradient-to-r ${CATEGORY_COLORS[listing.category]}`} />

                  <div className="p-6 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${CATEGORY_COLORS[listing.category]} flex items-center justify-center text-2xl shadow-sm`}>
                          {CATEGORY_ICONS[listing.category]}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 leading-tight">{listing.name}</h3>
                          <p className="text-xs text-gray-400 font-medium flex items-center gap-1 mt-0.5">
                            <MapPin size={10} /> {listing.location}
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded-lg text-xs font-bold">
                        <Star size={10} className="fill-amber-500 text-amber-500" /> {listing.rating}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-gray-500 font-medium leading-relaxed line-clamp-2">{listing.description}</p>

                    {/* Details Row */}
                    <div className="flex items-center gap-3 text-xs">
                      <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2.5 py-1 rounded-lg font-bold">
                        <Weight size={10} /> {listing.quantity} {listing.unit}
                      </span>
                      <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg font-medium">
                        <Eye size={10} /> {listing.views}
                      </span>
                    </div>

                    {/* Price & Action */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div>
                        <p className="text-xs text-gray-400 font-medium">{t('price')}</p>
                        <p className="text-xl font-black text-green-700 flex items-center">
                          <IndianRupee size={16} className="mr-0.5" />
                          {formatPrice(listing.pricePerUnit)}
                          <span className="text-xs font-medium text-gray-400 ml-1">/{listing.unit}</span>
                        </p>
                      </div>
                      <button className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-green-500/20 transition-all duration-200 text-xs hover:shadow-xl">
                        <Phone size={14} />
                        {t('contact_seller')}
                      </button>
                    </div>

                    {/* Seller Info */}
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                        <User size={12} className="text-white" />
                      </div>
                      <span className="text-xs font-bold text-gray-700">{listing.sellerName}</span>
                      <span className="text-[10px] text-gray-400 ml-auto">{listing.createdAt.toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* No results */}
            {filteredListings.length === 0 && (
              <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">
                <div className="w-20 h-20 bg-blue-50 rounded-3xl mx-auto mb-4 flex items-center justify-center">
                  <Search size={36} className="text-blue-300" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{t('no_crops_found')}</h3>
                <p className="text-sm text-gray-500 font-medium">{t('no_crops_found_desc')}</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default StorePage;
