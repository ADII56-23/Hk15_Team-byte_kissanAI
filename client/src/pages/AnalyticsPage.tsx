import React from 'react';
import ForecastChart from '../components/ForecastChart';
import { TrendingUp, Calendar, Download } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const AnalyticsPage: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-earth-dark">{t('predictive_analysis')}</h1>
          <p className="text-gray-500">{t('historical_perf_desc')}</p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm font-bold text-gray-700 flex items-center hover:bg-gray-50 transition-colors">
            <Download size={18} className="mr-2" />
            {t('export_csv')}
          </button>
          <button className="bg-earth-dark text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center hover:bg-earth-main transition-colors">
            <Calendar size={18} className="mr-2" />
            {t('past_30_days')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm col-span-1 md:col-span-2 lg:col-span-3">
          <ForecastChart weekly_rain={[]} moisture={0.4} />
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-6 flex items-center">
            <TrendingUp className="mr-2 text-earth-main" size={20} />
            {t('regional_comparisons')}
          </h3>
          <div className="space-y-6">
            {[
              { name: t('north_sector'), score: 92, trend: '+4%' },
              { name: t('south_valley'), score: 84, trend: '-2%' },
              { name: t('highlands'), score: 89, trend: '+1%' }
            ].map((region, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-bold text-gray-700">{region.name}</span>
                  <span className="text-gray-400 font-medium">{t('efficiency')}: {region.score}%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full relative overflow-hidden">
                  <div className={`h-full bg-earth-main rounded-full`} style={{ width: `${region.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-earth-main p-8 rounded-[2rem] text-white col-span-1 md:col-span-2 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-2xl font-black mb-2">{t('sustainability_report')}</h3>
            <p className="text-earth-light text-sm mb-6">{t('sustainability_desc')}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: t('co2_offset'), value: '420kg' },
              { label: t('fuel_saved'), value: '180L' },
              { label: t('bio_waste'), value: '-12%' },
              { label: t('energy'), value: t('saved') }
            ].map((stat, i) => (
              <div key={i} className="bg-white/10 p-4 rounded-2xl border border-white/10">
                <p className="text-[10px] font-bold uppercase tracking-widest text-earth-light mb-1">{stat.label}</p>
                <p className="text-lg font-bold">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
