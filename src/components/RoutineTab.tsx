import { useAppState } from '@/hooks/useAppState';
import { Check, Clock, AlertTriangle, Sparkles, Flame } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const categoryOrder = ['medications', 'care', 'nutrition', 'school', 'admin'];

export default function RoutineTab() {
  const { mode, toggleMode, tasks, toggleTask, isCheckinNow, setActiveTab, userData } = useAppState();
  const { t } = useTranslation();

  const categoryLabels: Record<string, string> = {
    medications: `💊 ${t('categories.medications')}`,
    care: `🧡 ${t('categories.care')}`,
    nutrition: `🥤 ${t('categories.nutrition')}`,
    school: `📚 ${t('categories.school')}`,
    admin: `📋 ${t('categories.admin')}`,
  };

  // All tasks are already filtered by mode in useAppState
  const grouped = categoryOrder
    .map(cat => ({ cat, items: tasks.filter(t => t.category === cat) }))
    .filter(g => g.items.length > 0);

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const childName = userData?.childName || t('common.yourChild');

  return (
    <div className="animate-slide-up space-y-4 pb-4">
      {/* Mode Toggle & Status Banner */}
      {mode === 'normal' ? (
        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-primary" />
              <p className="font-bold text-primary">{t('routine.feelingGood')} 🌟</p>
            </div>
            <button
              onClick={toggleMode}
              className="flex items-center gap-1.5 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-xl px-3 py-1.5 text-sm font-semibold transition-colors"
            >
              <Flame size={14} /> {t('routine.switchToFlare')}
            </button>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {t('routine.havingGoodDay', { name: childName })}
          </p>
        </div>
      ) : (
        <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-destructive" />
              <p className="font-bold text-destructive">{t('routine.flareMode')} 🔥</p>
            </div>
            <button
              onClick={toggleMode}
              className="flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl px-3 py-1.5 text-sm font-semibold transition-colors"
            >
              <Sparkles size={14} /> {t('routine.backToNormal')}
            </button>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {t('routine.extraCareTasks')}
          </p>
        </div>
      )}

      {/* Check-in Section */}
      <div className="bg-card rounded-2xl p-4 border shadow-sm">
        {isCheckinNow ? (
          <>
            <h3 className="text-sm font-bold mb-2">⏰ {t('routine.timeToCheckIn')}</h3>
            <p className="text-sm text-muted-foreground mb-3">
              {t('routine.letsSeHow', { name: childName })}
            </p>
            <button
              onClick={() => setActiveTab('log')}
              className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-bold text-sm hover:opacity-90 transition-opacity"
            >
              📝 {t('routine.checkInNow')}
            </button>
          </>
        ) : (
          <>
            <h3 className="text-sm font-bold mb-2">✅ {t('routine.youreAllCaughtUp')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('routine.allGoodWithLogging')}
            </p>
          </>
        )}
      </div>

      {/* Progress */}
      <div className="bg-card rounded-2xl p-4 border shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold">{t('routine.todaysToDo')}</span>
          <span className="text-sm text-muted-foreground font-semibold">{completedCount}/{totalCount} ✨</span>
        </div>
        <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        {progress === 100 && (
          <p className="text-xs text-primary font-semibold mt-2">{t('routine.allDoneForToday')} 🎉</p>
        )}
      </div>

      {/* Checklist */}
      <div className="space-y-3">
        {grouped.length === 0 ? (
          <div className="bg-card rounded-2xl p-6 border shadow-sm text-center">
            <p className="text-muted-foreground text-sm">
              {mode === 'normal' 
                ? t('routine.noTasksNormal')
                : t('routine.noTasksFlare')}
            </p>
          </div>
        ) : (
          grouped.map(({ cat, items }) => (
            <div key={cat} className="bg-card rounded-2xl border overflow-hidden shadow-sm">
              <h3 className="text-sm font-bold px-4 py-3 bg-secondary/30">{categoryLabels[cat]}</h3>
              <div className="divide-y divide-border/50">
                {items.map(task => (
                  <button
                    key={task.id}
                    onClick={() => toggleTask(task.id)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/30 transition-colors text-left"
                  >
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                      task.completed ? 'bg-primary border-primary scale-110' : 'border-muted-foreground/30'
                    }`}>
                      {task.completed && <Check size={14} className="text-primary-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {task.name}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock size={10} /> {task.timeWindow}
                      </p>
                    </div>
                    {!task.completed && (
                      <span className="text-xs bg-accent text-accent-foreground rounded-full px-3 py-1 font-semibold shrink-0">
                        {t('routine.done')} ✓
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
