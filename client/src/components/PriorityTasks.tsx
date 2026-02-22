import React from 'react';
import { CheckCircle2, Clock } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface Task {
  id: string;
  task: string;
  category: string;
  base_score: number;
  reason: string;
}

interface PriorityTasksProps {
  tasks: Task[];
}

const PriorityTasks: React.FC<PriorityTasksProps> = ({ tasks }) => {
  const { t } = useLanguage();
  const [completedTaskIds, setCompletedTaskIds] = React.useState<Set<string>>(new Set());

  const toggleTask = (id: string) => {
    setCompletedTaskIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getPriorityInfo = (score: number) => {
    if (score > 0.8) return { label: t('high'), color: 'bg-red-100 text-red-700 border-red-200' };
    if (score > 0.5) return { label: t('medium'), color: 'bg-amber-100 text-amber-700 border-amber-200' };
    return { label: t('low'), color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-earth-dark flex items-center">
          <Clock className="mr-2 text-earth-main" size={20} />
          {t('todays_priorities')}
        </h2>
        <span className="text-xs font-semibold text-earth-light hover:text-earth-main cursor-pointer uppercase tracking-wider flex items-center">
          {t('recent_completed')}: {completedTaskIds.size} {t('tasks')}
        </span>
      </div>

      <div className="flex flex-col space-y-4">
        {tasks.map((task) => {
          const priority = getPriorityInfo(task.base_score);
          const isDone = completedTaskIds.has(task.id);
          return (
            <div
              key={task.id}
              onClick={() => toggleTask(task.id)}
              className={`bg-white rounded-[1.5rem] p-6 border transition-all relative overflow-hidden group cursor-pointer flex flex-col md:flex-row md:items-center gap-6 ${isDone ? 'border-emerald-100 bg-emerald-50/30 opacity-60' : 'border-gray-100 shadow-sm hover:border-earth-main/30'
                }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border-2 transition-all ${isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-200 bg-gray-50'
                }`}>
                {isDone ? <CheckCircle2 size={24} /> : <CheckCircle2 className="text-gray-300" size={24} />}
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase border shadow-sm ${priority.color}`}>
                    {priority.label}
                  </span>
                  <h3 className={`font-bold text-gray-800 text-lg transition-colors ${isDone ? 'line-through text-gray-400' : 'group-hover:text-earth-main'}`}>
                    {task.task}
                  </h3>
                </div>
                {!isDone && <p className="text-sm text-gray-500 line-clamp-2">{task.reason}</p>}
              </div>

              <div className="flex flex-col items-end shrink-0 gap-2">
                <span className="text-xs font-black text-earth-main bg-earth-light/10 px-3 py-1 rounded-full uppercase tracking-tighter">
                  {task.category}
                </span>
                <span className="text-[10px] font-bold text-gray-400">
                  {Math.round(task.base_score * 100)}% {t('match')}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PriorityTasks;
