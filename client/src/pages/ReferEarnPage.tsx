import React, { useState } from 'react';
import { Gift, Copy, Check, Share2, Coins, Zap, IndianRupee, Sparkles, Users, CreditCard } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const REFERRAL_CODE = 'FARM' + Math.random().toString(36).slice(2, 7).toUpperCase();
const BASE_LINK = `https://farmcopilot.ai/join?ref=${REFERRAL_CODE}`;

const ReferEarnPage: React.FC = () => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(BASE_LINK);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnWhatsApp = () => {
    const text = encodeURIComponent(`${t('whatsapp_share_text')} ${BASE_LINK}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-in fade-in duration-700">
      <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-gray-100">
        <div className="md:flex">
          {/* Image Section */}
          <div className="md:w-1/2 relative h-64 md:h-auto">
            <img
              src="/refer-farmer.png"
              alt="Farmer using app"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>

          {/* Content Section */}
          <div className="md:w-1/2 p-10 flex flex-col justify-center space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
                <Gift size={14} />
                {t('referral_program')}
              </div>
              <h1 className="text-3xl font-black text-gray-900 leading-tight">
                {t('refer_earn_title')}
              </h1>
              <p className="text-gray-500 font-medium">
                {t('refer_earn_desc')}
              </p>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">{t('unique_link')}</label>
              <div className="flex bg-gray-50 border border-gray-200 rounded-2xl p-2">
                <input
                  type="text"
                  readOnly
                  value={BASE_LINK}
                  className="bg-transparent flex-1 px-4 py-2 text-sm text-gray-600 focus:outline-none font-medium truncate"
                />
                <button
                  onClick={handleCopy}
                  className={`px-6 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${copied ? 'bg-green-700 text-white' : 'bg-white text-green-700 border border-green-100 shadow-sm hover:bg-green-50'
                    }`}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? t('copied') : t('copy')}
                </button>
              </div>
            </div>

            <button
              onClick={shareOnWhatsApp}
              className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-green-500/20"
            >
              <Share2 size={20} />
              {t('share_on_whatsapp')}
            </button>
          </div>
        </div>
      </div>

      {/* How It Works Steps */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: t('share_link'), desc: t('share_link_desc') },
          { title: t('friend_joins'), desc: t('friend_joins_desc') },
          { title: t('earn_credits'), desc: t('earn_credits_desc') }
        ].map((item, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-gray-50 text-center space-y-2">
            <div className="w-10 h-10 bg-green-50 text-green-700 rounded-full flex items-center justify-center mx-auto font-black text-xs border border-green-100">
              {i + 1}
            </div>
            <h3 className="font-bold text-gray-900">{item.title}</h3>
            <p className="text-xs text-gray-500 font-medium">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Credits System Section */}
      <div className="mt-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-3">
            <Coins size={14} />
            {t('credits_system')}
          </div>
          <h2 className="text-2xl font-black text-gray-900">{t('how_credits_work')}</h2>
          <p className="text-gray-500 font-medium mt-2 max-w-lg mx-auto">{t('credits_system_desc')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Earn 100 Credits Card */}
          <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-3xl border border-green-100 text-center space-y-3 overflow-hidden group hover:shadow-lg hover:shadow-green-100/50 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-200/20 rounded-full -translate-y-8 translate-x-8" />
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-green-500/30">
              <Users size={24} />
            </div>
            <div className="text-4xl font-black text-green-700">+100</div>
            <h3 className="font-bold text-gray-900 text-lg">{t('credits_per_referral')}</h3>
            <p className="text-xs text-gray-500 font-medium leading-relaxed">{t('credits_per_referral_desc')}</p>
          </div>

          {/* 2 Credits Per Request Card */}
          <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-3xl border border-blue-100 text-center space-y-3 overflow-hidden group hover:shadow-lg hover:shadow-blue-100/50 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-200/20 rounded-full -translate-y-8 translate-x-8" />
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-500/30">
              <Zap size={24} />
            </div>
            <div className="text-4xl font-black text-blue-700">2</div>
            <h3 className="font-bold text-gray-900 text-lg">{t('credits_per_request')}</h3>
            <p className="text-xs text-gray-500 font-medium leading-relaxed">{t('credits_per_request_desc')}</p>
          </div>

          {/* 1 Rupee = 1 Credit Card */}
          <div className="relative bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-3xl border border-amber-100 text-center space-y-3 overflow-hidden group hover:shadow-lg hover:shadow-amber-100/50 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-200/20 rounded-full -translate-y-8 translate-x-8" />
            <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-amber-500/30">
              <IndianRupee size={24} />
            </div>
            <div className="text-4xl font-black text-amber-700">₹1 = 1</div>
            <h3 className="font-bold text-gray-900 text-lg">{t('rupee_equals_credit')}</h3>
            <p className="text-xs text-gray-500 font-medium leading-relaxed">{t('rupee_equals_credit_desc')}</p>
          </div>
        </div>

        {/* Highlight Banner */}
        <div className="mt-8 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvc3ZnPg==')] opacity-50" />
          <div className="relative flex flex-col md:flex-row items-center gap-6">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0">
              <Sparkles size={32} className="text-yellow-300" />
            </div>
            <div className="text-center md:text-left flex-1">
              <h3 className="text-xl font-black mb-1">{t('credit_summary_title')}</h3>
              <p className="text-white/80 text-sm font-medium leading-relaxed">{t('credit_summary_desc')}</p>
            </div>
            <div className="flex items-center gap-3 bg-white/15 backdrop-blur-sm rounded-2xl px-6 py-3 flex-shrink-0">
              <CreditCard size={20} />
              <span className="font-black text-lg">{t('credit_value')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferEarnPage;
