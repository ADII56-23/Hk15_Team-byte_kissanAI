import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sprout,
  CloudRain,
  BrainCircuit,
  ArrowRight,
  CheckCircle,
  ShieldCheck,
  Wheat,
  Twitter,
  Linkedin,
  Facebook
} from 'lucide-react';
import { motion } from 'framer-motion';
import AuthModal from '../components/AuthModal';
import { useLanguage } from '../contexts/LanguageContext';

const LandingPage: React.FC = () => {
  const { t } = useLanguage();
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);

  return (
    <div className="bg-white text-earth-dark overflow-x-hidden font-sans">
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-gray-100 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="bg-earth-main p-2 rounded-lg">
            <Sprout size={24} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">FarmCopilot AI</span>
        </div>
        <div className="hidden md:flex items-center space-x-8 text-sm font-semibold">
          <a href="#features" className="hover:text-earth-main transition-colors">{t('features')}</a>
          <Link to="/kisaan" className="hover:text-earth-main transition-colors text-earth-sand">{t('kisaan_ai')}</Link>
          <Link to="/why-ai" className="hover:text-earth-main transition-colors">{t('why_ai')}</Link>
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="bg-earth-dark text-white px-6 py-2.5 rounded-full hover:bg-earth-main transition-all shadow-md hover:shadow-lg"
          >
            {t('login')}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-40 min-h-[90vh] flex items-center overflow-hidden">
        {/* Full Background Image */}
        <div className="absolute inset-0 z-0 ">
          <img
            src="/farm-hero.avif"
            alt="Farm background"
            className="w-full h-full object-cover object-center"
          />
          {/* Dark gradient overlay — centered layout friendly */}
          <div className="absolute inset-0 bg-black/55" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm text-emerald-300 px-4 py-1.5 rounded-full text-xs font-bold mb-6 border border-white/20 uppercase tracking-wider">
              <BrainCircuit size={14} />
              <span>{t('next_gen_agri')}</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6 text-white drop-shadow-lg">
              {t('hero_title')}
            </h1>
            <p className="text-lg text-white/80 mb-10 max-w-2xl leading-relaxed mx-auto">
              {t('hero_desc')}
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center">
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-green-800 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-green-700 transition-all flex items-center justify-center group shadow-2xl shadow-green-900/40"
              >
                {t('get_started_today')}
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="border-2 border-white/40 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white/10 backdrop-blur-sm transition-all shadow-lg">
                {t('watch_demo')}
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Vision Statement Section */}
      <section className="bg-white py-24 px-6 border-b border-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="text-2xl md:text-3xl font-medium text-gray-700 leading-relaxed tracking-tight"
          >
            {t('vision_statement')}
          </motion.p>
          <div className="mt-12 flex justify-center">
            <div className="w-16 h-1.5 bg-earth-sand rounded-full opacity-30" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white border-y border-gray-50 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">{t('one_platform_control')}</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">{t('one_platform_desc')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Wheat, title: t('predictive_analysis'), desc: t('historical_perf_desc'), path: '/analytics' },
              { icon: CheckCircle, title: t('smart_planner'), desc: t('smart_planner_desc'), path: '/tasks' },
              { icon: Wheat, title: t('kisaan_ai'), desc: t('crop_recomm_desc'), path: '/kisaan' },
              { icon: ShieldCheck, title: t('risk_guard'), desc: t('risk_guard_desc'), path: '/dashboard' }
            ].map((feature, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -10 }}
                className="bg-gray-50 p-8 rounded-3xl border border-gray-100 hover:border-earth-main transition-all group cursor-pointer"
              >
                <div className="bg-white w-14 h-14 rounded-2xl shadow-sm flex items-center justify-center mb-6 group-hover:bg-earth-main group-hover:text-white transition-colors">
                  <feature.icon size={28} />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-500 text-sm mb-6 leading-relaxed">{feature.desc}</p>
                <Link to={feature.path} className="text-earth-main font-bold text-sm flex items-center hover:underline">
                  {t('explore_feature')} <ArrowRight size={16} className="ml-1" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-earth-dark py-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-12 text-center text-white">
          <div>
            <p className="text-4xl md:text-5xl font-bold text-earth-sand mb-2">25%</p>
            <p className="text-sm uppercase tracking-widest text-earth-light">{t('water_savings')}</p>
          </div>
          <div>
            <p className="text-4xl md:text-5xl font-bold text-earth-sand mb-2">15k+</p>
            <p className="text-sm uppercase tracking-widest text-earth-light">{t('active_acres')}</p>
          </div>
          <div>
            <p className="text-4xl md:text-5xl font-bold text-earth-sand mb-2">98%</p>
            <p className="text-sm uppercase tracking-widest text-earth-light">{t('decision_confidence')}</p>
          </div>
          <div>
            <p className="text-4xl md:text-5xl font-bold text-earth-sand mb-2">2.4x</p>
            <p className="text-sm uppercase tracking-widest text-earth-light">{t('yield_density')}</p>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-24 px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto bg-earth-beige rounded-[3rem] p-12 md:p-20 relative text-center">
          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-bold mb-8">{t('ready_transform_farm')}</h2>
            <p className="text-xl text-gray-700 mb-10 max-w-2xl mx-auto">{t('join_thousands_progressive')}</p>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="bg-earth-dark text-white px-10 py-5 rounded-full font-bold text-xl hover:bg-earth-main transition-all inline-flex items-center shadow-2xl"
            >
              {t('enter_ops_center')}
              <ArrowRight className="ml-2" />
            </button>
          </div>
          <Sprout className="absolute -bottom-10 -right-10 text-earth-main/10" size={300} />
          <CloudRain className="absolute -top-10 -left-10 text-earth-main/10" size={200} />
        </div>
      </section>

      <footer className="py-20 px-6 border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Logo and Socials Column */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-8">
                <div className="bg-earth-main p-2 rounded-lg">
                  <Sprout size={24} className="text-white" />
                </div>
                <span className="text-2xl font-black tracking-tighter text-earth-dark uppercase">FarmCopilot</span>
              </div>
            </div>
            <div className="flex space-x-5 text-gray-400">
              <a href="#" className="hover:text-earth-main transition-colors"><Twitter size={20} /></a>
              <a href="#" className="hover:text-earth-main transition-colors"><Linkedin size={20} /></a>
              <a href="#" className="hover:text-earth-main transition-colors"><Facebook size={20} /></a>
            </div>
          </div>

          {/* Product Column */}
          <div>
            <h4 className="font-bold text-gray-900 mb-6 uppercase tracking-wider text-xs">{t('product')}</h4>
            <ul className="space-y-4 text-sm font-medium text-gray-500">
              <li><Link to="/dashboard" className="hover:text-earth-main transition-colors">{t('dashboard')}</Link></li>
              <li><Link to="/analytics" className="hover:text-earth-main transition-colors">{t('yield_analysis')}</Link></li>
              <li><Link to="/tasks" className="hover:text-earth-main transition-colors">{t('task_planner')}</Link></li>
              <li><Link to="/kisaan" className="hover:text-earth-main transition-colors text-earth-sand">{t('kisaan_ai')}</Link></li>
              <li><a href="#" className="hover:text-earth-main transition-colors">{t('learn')}</a></li>
              <li><a href="#" className="hover:text-earth-main transition-colors">{t('discussions')}</a></li>
            </ul>
          </div>

          {/* Documentation Column */}
          <div>
            <h4 className="font-bold text-gray-900 mb-6 uppercase tracking-wider text-xs">{t('documentation')}</h4>
            <ul className="space-y-4 text-sm font-medium text-gray-500">
              <li><a href="#" className="hover:text-earth-main transition-colors">{t('user_guide')}</a></li>
              <li><a href="#" className="hover:text-earth-main transition-colors">{t('api_docs')}</a></li>
              <li><a href="#" className="hover:text-earth-main transition-colors">{t('models')}</a></li>

              <li><a href="#" className="hover:text-earth-main transition-colors">{t('public_dataset')}</a></li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="font-bold text-gray-900 mb-6 uppercase tracking-wider text-xs">{t('company')}</h4>
            <ul className="space-y-4 text-sm font-medium text-gray-500">
              <li><a href="#" className="hover:text-earth-main transition-colors">{t('our_team')}</a></li>
              <li><a href="#" className="hover:text-earth-main transition-colors">{t('contact_us')}</a></li>
              <li><a href="#" className="hover:text-earth-main transition-colors">{t('host_research')}</a></li>
              <li><a href="#" className="hover:text-earth-main transition-colors">{t('terms_privacy')}</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
