import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, CheckCircle2, MapPin, ChevronDown, X, CalendarDays, RefreshCcw, Sparkles } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

// Shape of what TaskPlanner saves to localStorage
interface SavedTaskPlan {
  day_wise_plan: {
    day_number: number;
    day_label: string;
    focus: string;
    tasks: string[];
    priority: 'High' | 'Medium' | 'Low';
    tips: string;
  }[];
  crop: string;
  location: string;
  growth_stage: string;
  plot_name?: string;
  saved_at: string;
}

const WeeklyPlannerPage: React.FC = () => {
  const { t, language } = useLanguage();
  const [savedPlan, setSavedPlan] = useState<SavedTaskPlan | null>(null);
  const [taskCompletedDays, setTaskCompletedDays] = useState<Record<number, boolean>>({});
  const [taskCompletedItems, setTaskCompletedItems] = useState<Record<string, boolean>>({});
  const [expandedDays, setExpandedDays] = useState<Record<number, boolean>>({ 1: true });
  const [isPlanningNextWeek, setIsPlanningNextWeek] = useState(false);

  // 1. Load data from localStorage on mount
  useEffect(() => {
    // Load the plan itself
    const rawPlan = localStorage.getItem('task_planner_week');
    if (rawPlan) {
      try {
        const parsed = JSON.parse(rawPlan);
        setSavedPlan(parsed);
      } catch (e) { console.error("Error parsing plan:", e); }
    }

    // Load completed tasks state
    const rawCompleted = localStorage.getItem('weekly_planner_completed_tasks');
    if (rawCompleted) {
      try {
        const parsedItems = JSON.parse(rawCompleted);
        setTaskCompletedItems(parsedItems);

        // Derive completed days from items if we have a plan
        if (rawPlan) {
          const plan = JSON.parse(rawPlan);
          const completedDays: Record<number, boolean> = {};
          plan.day_wise_plan.forEach((day: SavedTaskPlan['day_wise_plan'][0]) => {
            const allDone = day.tasks.every((_: string, i: number) => parsedItems[`${day.day_number}-${i}`]);
            completedDays[day.day_number] = allDone;
          });
          setTaskCompletedDays(completedDays);
        }
      } catch (e) { console.error("Error parsing completed tasks:", e); }
    }
  }, []);

  // 2. Persist taskCompletedItems whenever they change
  useEffect(() => {
    if (Object.keys(taskCompletedItems).length > 0) {
      localStorage.setItem('weekly_planner_completed_tasks', JSON.stringify(taskCompletedItems));
    }
  }, [taskCompletedItems]);

  const toggleDayExpand = (dayNum: number) => {
    setExpandedDays(prev => ({ ...prev, [dayNum]: !prev[dayNum] }));
  };

  const toggleDayComplete = (dayNum: number, tasks: string[]) => {
    const allDone = tasks.every((_, i) => taskCompletedItems[`${dayNum}-${i}`]);
    const nextItems = { ...taskCompletedItems };
    tasks.forEach((_, i) => { nextItems[`${dayNum}-${i}`] = !allDone; });
    setTaskCompletedItems(nextItems);
    setTaskCompletedDays(prev => ({ ...prev, [dayNum]: !allDone }));
  };

  const toggleTaskItem = (dayNum: number, taskIdx: number, totalTasks: number) => {
    const key = `${dayNum}-${taskIdx}`;
    const nextItems = { ...taskCompletedItems, [key]: !taskCompletedItems[key] };
    setTaskCompletedItems(nextItems);

    const allDone = Array.from({ length: totalTasks }, (_, i) => nextItems[`${dayNum}-${i}`]).every(Boolean);
    setTaskCompletedDays(d => ({ ...d, [dayNum]: allDone }));
  };

  const planNextWeek = async () => {
    if (!savedPlan) return;
    setIsPlanningNextWeek(true);

    try {
      // Get full parameters from task_planner_state
      const rawState = localStorage.getItem('task_planner_state');
      let params = {
        crop_type: savedPlan.crop,
        location: savedPlan.location,
        growth_stage: savedPlan.growth_stage,
        field_size: 10,
        labor_available: 5,
        available_equipments: [] as string[],
        budget_constraints: 'Normal',
        language: language.name
      };

      if (rawState) {
        const state = JSON.parse(rawState);
        params = {
          ...params,
          ...state.formData,
          field_size: parseFloat(state.formData.field_size) || 10,
          labor_available: parseInt(state.formData.labor_available) || 5,
          available_equipments: state.formData.equipments?.split(',').map((s: string) => s.trim()).filter(Boolean) || []
        };
      }

      const res = await axios.post('http://localhost:8000/farm-analysis', params);
      const newPlan = res.data;

      const payload = {
        day_wise_plan: newPlan.day_wise_plan,
        crop: params.crop_type,
        location: params.location,
        growth_stage: params.growth_stage,
        plot_name: savedPlan.plot_name,
        saved_at: new Date().toISOString()
      };

      localStorage.setItem('task_planner_week', JSON.stringify(payload));
      localStorage.removeItem('weekly_planner_completed_tasks');

      setSavedPlan(payload);
      setTaskCompletedItems({});
      setTaskCompletedDays({});
      setExpandedDays({ 1: true });

      // Update task_planner_state as well to keep in sync
      if (rawState) {
        const state = JSON.parse(rawState);
        localStorage.setItem('task_planner_state', JSON.stringify({
          ...state,
          analysis: newPlan
        }));
      }

    } catch (err) {
      console.error(err);
      alert('Failed to generate next week plan. Please check your connection.');
    } finally {
      setIsPlanningNextWeek(false);
    }
  };

  const clearSavedPlan = () => {
    localStorage.removeItem('task_planner_week');
    localStorage.removeItem('weekly_planner_completed_tasks');
    setSavedPlan(null);
    setTaskCompletedDays({});
    setTaskCompletedItems({});
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* ── Page Header ── */}
      <div>
        <h1 className="text-4xl font-black text-earth-dark tracking-tighter flex items-center gap-3">
          <Calendar className="text-earth-main" size={40} />
          {t('weekly_planner')}
        </h1>
        <p className="text-gray-500 font-medium mt-2">
          {t('weekly_planner_desc')}
        </p>
      </div>

      {savedPlan ? (
        <div className="space-y-4">

          {/* ── Banner ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-earth-dark to-earth-main p-5 rounded-[2rem] text-white shadow-xl">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center shrink-0">
                <CalendarDays size={20} />
              </div>
              <div>
                <p className="font-black text-base tracking-tight">
                  {t('7_day_plan')} — {savedPlan.crop}
                  {savedPlan.plot_name ? ` · ${savedPlan.plot_name}` : ''}
                </p>
                <p className="text-white/70 text-xs font-medium mt-0.5">
                  <MapPin size={11} className="inline mr-1" />
                  {savedPlan.location} · {savedPlan.growth_stage} stage
                  &nbsp;·&nbsp;{t('saved_on')} {new Date(savedPlan.saved_at).toLocaleDateString(language.code, { day: 'numeric', month: 'short' })}
                </p>
              </div>
            </div>
            <button
              onClick={clearSavedPlan}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shrink-0 border border-white/20"
            >
              <X size={13} />
              {t('clear_plan')}
            </button>
          </div>

          {/* ── Progress Bar & Completion ── */}
          {(() => {
            const total = savedPlan.day_wise_plan.reduce((acc, d) => acc + d.tasks.length, 0);
            const done = Object.values(taskCompletedItems).filter(Boolean).length;
            const pct = total ? Math.round((done / total) * 100) : 0;
            const doneDays = Object.values(taskCompletedDays).filter(Boolean).length;
            const isFullyCompleted = pct === 100;

            return (
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest text-gray-400 mb-2">
                      <span>{t('weekly_progress')}</span>
                      <span className="text-earth-main">{done}/{total} {t('tasks')} · {doneDays}/7 {t('days_done')}</span>
                    </div>
                    <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-earth-main rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-2xl font-black text-earth-main shrink-0">{pct}%</span>
                </div>

                {isFullyCompleted && (
                  <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-[2.5rem] text-center space-y-4 animate-in zoom-in-95 duration-500 shadow-lg shadow-emerald-500/5">
                    <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-200">
                      <CheckCircle2 size={32} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-emerald-900">{t('tasks_completed')}</h3>
                      <p className="text-emerald-700/70 font-medium">{t('ready_next_cycle')}</p>
                    </div>
                    <button
                      onClick={planNextWeek}
                      disabled={isPlanningNextWeek}
                      className="inline-flex items-center gap-2 bg-earth-main text-white px-8 py-4 rounded-2xl font-black hover:bg-earth-dark transition-all shadow-xl shadow-earth-main/20 disabled:opacity-50"
                    >
                      {isPlanningNextWeek ? (
                        <>
                          <RefreshCcw className="animate-spin" size={20} />
                          {t('generating_plan')}
                        </>
                      ) : (
                        <>
                          <Sparkles size={20} />
                          {t('plan_next_week')}
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── Day Cards ── */}
          <div className="space-y-3">
            {savedPlan.day_wise_plan.map((day) => {
              const isExpanded = !!expandedDays[day.day_number];
              const isDayDone = !!taskCompletedDays[day.day_number];
              const priorityStyle = ({
                High: { badge: 'bg-red-50 text-red-600', dot: 'bg-red-500', border: 'border-l-red-400' },
                Medium: { badge: 'bg-amber-50 text-amber-600', dot: 'bg-amber-500', border: 'border-l-amber-400' },
                Low: { badge: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-500', border: 'border-l-emerald-400' },
              } as Record<string, { badge: string; dot: string; border: string }>)[day.priority] ?? {
                badge: 'bg-amber-50 text-amber-600', dot: 'bg-amber-500', border: 'border-l-amber-400'
              };

              return (
                <div
                  key={day.day_number}
                  className={`bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all border-l-[6px] ${isDayDone ? 'border-l-emerald-500 opacity-75' : priorityStyle.border
                    } overflow-hidden`}
                >
                  {/* Day Header — always visible */}
                  <div className="flex items-center gap-4 p-5">

                    {/* Day badge */}
                    <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 transition-all ${isDayDone ? 'bg-emerald-500 text-white' : 'bg-earth-main/10 text-earth-main'
                      }`}>
                      {isDayDone ? (
                        <CheckCircle2 size={22} />
                      ) : (
                        <>
                          <span className="text-[9px] font-black uppercase leading-none">{t('day')}</span>
                          <span className="text-xl font-black leading-tight">{day.day_number}</span>
                        </>
                      )}
                    </div>

                    {/* Label & focus */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-black text-sm ${isDayDone ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                        {day.day_label}
                      </p>
                      <p className="text-xs text-gray-400 font-medium mt-0.5 truncate">{day.focus}</p>
                    </div>

                    {/* Priority + Mark Done + Chevron */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`hidden sm:flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${priorityStyle.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${priorityStyle.dot}`} />
                        {day.priority}
                      </span>

                      <button
                        onClick={(e) => { e.stopPropagation(); toggleDayComplete(day.day_number, day.tasks); }}
                        className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-wide px-3 py-1.5 rounded-xl transition-all border ${isDayDone
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          : 'bg-white text-gray-400 border-gray-200 hover:border-earth-main hover:text-earth-main'
                          }`}
                      >
                        <CheckCircle2 size={13} />
                        <span className="hidden sm:inline">{isDayDone ? t('done') : t('mark_done')}</span>
                      </button>

                      <button
                        onClick={() => toggleDayExpand(day.day_number)}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-earth-main transition-colors"
                      >
                        <ChevronDown
                          size={16}
                          className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Expanded task list */}
                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-gray-50 pt-3 space-y-2">
                      {day.tasks.map((task, i) => {
                        const key = `${day.day_number}-${i}`;
                        const done = !!taskCompletedItems[key];
                        return (
                          <div
                            key={i}
                            onClick={() => toggleTaskItem(day.day_number, i, day.tasks.length)}
                            className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${done
                              ? 'bg-emerald-50 border-emerald-100 opacity-70'
                              : 'bg-gray-50 border-gray-100 hover:border-earth-main hover:bg-white hover:shadow-sm'
                              }`}
                          >
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border-2 transition-all ${done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-200 bg-white'
                              }`}>
                              {done && <CheckCircle2 size={14} />}
                            </div>
                            <span className={`text-sm font-medium leading-snug flex-1 ${done ? 'line-through text-gray-400' : 'text-gray-700'
                              }`}>
                              {task}
                            </span>
                            {done && (
                              <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                                {t('done')}
                              </span>
                            )}
                          </div>
                        );
                      })}

                      {day.tips && (
                        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl mt-1">
                          <span className="text-amber-500 shrink-0 mt-0.5">💡</span>
                          <p className="text-xs font-medium text-amber-700 leading-snug">{day.tips}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      ) : (
        /* ── Empty State ── */
        <div className="flex flex-col items-center justify-center py-28 bg-white rounded-[2.5rem] border border-dashed border-gray-200 shadow-sm text-center space-y-5">
          <div className="w-20 h-20 bg-earth-main/10 rounded-3xl flex items-center justify-center">
            <CalendarDays size={36} className="text-earth-main" />
          </div>
          <div>
            <h3 className="text-xl font-black text-earth-dark mb-2">{t('no_plan_saved')}</h3>
            <p className="text-gray-400 font-medium max-w-sm leading-relaxed">
              {t('no_plan_desc')}
            </p>
          </div>
        </div>
      )}

    </div>
  );
};

export default WeeklyPlannerPage;
