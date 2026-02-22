import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Cloud, Sun, RefreshCcw, MapPin, Search, Navigation, Globe, ChevronDown, CheckCircle } from 'lucide-react';
import { useLanguage, languages } from '../contexts/LanguageContext';

const Header: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState(localStorage.getItem('farm_location') || 'Ludhiana');
  const [searchInput, setSearchInput] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const fetchWeather = useCallback(async (loc: string = location) => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:8000/weather?q=${loc}`);
      if (res.data.error) throw new Error(res.data.error);
      setWeather(res.data);
      localStorage.setItem('farm_location', loc);
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('locationChanged', { detail: loc }));
    } catch (e) {
      console.error('Header Weather Error:', e);
    } finally {
      setLoading(false);
    }
  }, [location]);

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(() => fetchWeather(), 600000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  // Handle autocomplete fetch
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (searchInput.length >= 3 && showSuggestions) {
        try {
          const res = await axios.get(`http://localhost:8000/location-suggestions?q=${searchInput}`);
          setSuggestions(res.data);
        } catch (e) {
          console.error(e);
        }
      } else {
        setSuggestions([]);
      }
    }, 200);

    return () => clearTimeout(handler);
  }, [searchInput, showSuggestions]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setLocation(searchInput);
      fetchWeather(searchInput);
      setShowSearch(false);
      setSearchInput('');
    }
  };

  const detectLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const res = await axios.get(`http://localhost:8000/weather?lat=${latitude}&lon=${longitude}`);
            setWeather(res.data);
            const city = res.data.location.split(',')[0];
            setLocation(city);
            localStorage.setItem('farm_location', city);
            window.dispatchEvent(new CustomEvent('locationChanged', { detail: city }));
          } catch (e) {
            console.error(e);
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          console.error('Geolocation Error:', error);
          setLoading(false);
          alert(t('could_not_detect_location'));
        }
      );
    }
  };

  return (
    <header className="bg-white px-8 py-5 flex justify-between items-center border-b border-gray-100 z-10 sticky top-0">
      <div className="flex items-center space-x-4">
        <h2 className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px]">
          {t('operations')} / <span className="text-earth-dark">{t('global_dashboard')}</span>
        </h2>

        <div className="h-4 w-px bg-gray-200 mx-2" />

        <div className="flex items-center space-x-2 text-earth-main font-bold text-xs uppercase tracking-wider">
          <MapPin size={14} />
          <span>{location}</span>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Search size={14} className="text-gray-400" />
          </button>
        </div>

        {showSearch && (
          <div className="relative">
            <form onSubmit={handleSearch} className="flex items-center animate-in fade-in slide-in-from-left-2 duration-300">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder={t('enter_city')}
                className="bg-gray-50 border border-gray-200 rounded-l-lg px-3 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-earth-main w-40"
                autoFocus
              />
              <button type="submit" className="bg-earth-main text-white px-3 py-1 rounded-r-lg text-xs font-bold transition-all hover:bg-earth-dark">
                {t('go')}
              </button>
            </form>

            {/* Autocomplete List */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-lg shadow-xl z-50 overflow-hidden min-w-[200px] animate-in fade-in zoom-in-95 duration-200">
                {suggestions.map((loc) => (
                  <button
                    key={loc.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault(); // Prevent input blur immediately
                      setLocation(loc.name);
                      fetchWeather(loc.name);
                      setSearchInput('');
                      setShowSearch(false);
                      setShowSuggestions(false);
                    }}
                    className="w-full text-left px-3 py-2 text-[10px] font-bold text-gray-700 hover:bg-gray-50 transition-colors flex flex-col border-b border-gray-50 last:border-0"
                  >
                    <span className="text-earth-dark font-black">{loc.name}</span>
                    <span className="text-gray-400 capitalize">{loc.region}, {loc.country}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center space-x-6">
        <div className="relative">
          <button
            onClick={() => setShowLangDropdown(!showLangDropdown)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-earth-dark text-white text-[10px] font-black uppercase tracking-widest hover:bg-earth-main transition-all shadow-sm"
          >
            <Globe size={14} />
            <span className="hidden sm:inline">{language.native}</span>
            <ChevronDown size={14} className={`transition-transform duration-300 ${showLangDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showLangDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-200">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang);
                    setShowLangDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-colors flex items-center justify-between ${language.code === lang.code ? 'text-earth-main bg-earth-main/5' : 'text-gray-600'}`}
                >
                  <span>{lang.native}</span>
                  {language.code === lang.code && <CheckCircle size={14} />}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={detectLocation}
          className="flex items-center space-x-2 text-earth-dark/60 hover:text-earth-main transition-colors text-xs font-bold uppercase tracking-wider group"
          title={t('detect_location')}
        >
          <Navigation size={14} className="group-hover:animate-pulse" />
          <span></span>
        </button>

        <div className="flex items-center space-x-4 bg-earth-main/10 px-4 py-2 rounded-full border border-earth-light/20 min-w-[180px] justify-center shadow-sm">
          {loading ? (
            <RefreshCcw size={14} className="animate-spin text-earth-main" />
          ) : (
            <>
              <div className="flex items-center space-x-2 text-earth-dark">
                <Sun size={18} className="text-orange-500" />
                <span className="text-sm font-black whitespace-nowrap">
                  {weather?.current.temp ?? '--'}°C
                </span>
              </div>
              <div className="w-px h-4 bg-gray-200" />
              <div className="flex items-center space-x-2 text-earth-dark">
                <Cloud size={18} className="text-blue-500" />
                <span className="text-sm font-black whitespace-nowrap">
                  {weather?.forecast.rain_sum ?? '0'} mm
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
