import { Droplets, Users, ShieldAlert, TrendingDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface FarmStatusProps {
  moisture: number;
  labor: number;
  urgency: string;
  field_size: number;
  growth_stage: string;
}

const FarmStatus: React.FC<FarmStatusProps> = ({
  moisture,
  labor,
  urgency,
  field_size,
  growth_stage
}) => {
  const { t } = useLanguage();
  // Logic: Equipment Risk
  // If field is large and labor is low, and we are in critical stage (sowing/flowering), risk is high.
  const calculateEquipmentRisk = () => {
    const criticalStages = ['sowing', 'flowering', 'fruiting'];
    const productivityRatio = field_size / (labor || 1); // acres per person

    let risk = t('low');
    let riskDesc = t('maintenance_soon');
    let riskColor = 'text-purple-600';
    let riskBg = 'bg-purple-50';

    if (productivityRatio > 2.5 && criticalStages.includes(growth_stage.toLowerCase())) {
      risk = t('high');
      riskDesc = t('resource_strain');
      riskColor = 'text-red-600';
      riskBg = 'bg-red-50';
    } else if (productivityRatio > 1.5) {
      risk = t('medium');
      riskDesc = t('sub_optimal');
      riskColor = 'text-amber-600';
      riskBg = 'bg-amber-50';
    }

    return { risk, riskDesc, riskColor, riskBg };
  };

  const equipRisk = calculateEquipmentRisk();

  const stats = [
    {
      label: t('soil_moisture'),
      value: `${Math.round(moisture * 100)}%`,
      icon: Droplets,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      desc: moisture < 0.3 ? t('critical_deficit') : moisture < 0.5 ? t('threshold_level') : t('optimal_range')
    },
    {
      label: t('irrigation_urgency'),
      value: urgency === 'High' ? t('high') : urgency === 'Medium' ? t('medium') : t('low'),
      icon: TrendingDown,
      color: urgency === 'High' ? 'text-red-600' : 'text-amber-600',
      bg: urgency === 'High' ? 'bg-red-50' : 'bg-amber-50',
      desc: urgency === 'High' ? t('action_required') : t('monitor_closely')
    },
    {
      label: t('labor_available'),
      value: `${labor} ${t('members')}`,
      icon: Users,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      desc: labor < 3 ? t('staff_shortage') : t('full_team_active')
    },
    {
      label: t('equipment_risk'),
      value: equipRisk.risk,
      icon: ShieldAlert,
      color: equipRisk.riskColor,
      bg: equipRisk.riskBg,
      desc: equipRisk.riskDesc
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-earth-dark flex items-center gap-2">
        {t('farm_status_overview')}
        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full uppercase tracking-tighter">{t('real_time_data')}</span>
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center text-center transition-all hover:shadow-lg hover:-translate-y-1 group">
            <div className={`${stat.bg} ${stat.color} p-4 rounded-2xl mb-4 group-hover:scale-110 transition-transform shadow-inner`}>
              <stat.icon size={28} />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1">{stat.label}</p>
            <p className="text-2xl font-black text-gray-900 mb-1">{stat.value}</p>
            <p className="text-xs font-bold text-gray-400/80">{stat.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};


export default FarmStatus;
