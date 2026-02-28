import { useAppState } from '@/hooks/useAppState';
import { Check, Clock, AlertTriangle, Phone, FileText, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const categoryLabels: Record<string, string> = {
  medications: '💊 Medications',
  care: '🧡 Care & Therapy',
  nutrition: '🥤 Food & Hydration',
  school: '📚 School & Work',
  admin: '📋 Appointments',
};

const categoryOrder = ['medications', 'care', 'nutrition', 'school', 'admin'];

export default function RoutineTab() {
  const { mode, tasks, toggleTask, logs, baseline, lastLogTime, setActiveTab } = useAppState();
  const latest = logs[logs.length - 1];

  const visibleTasks = tasks.filter(t => mode !== 'green' || !t.isFlareOnly);
  const grouped = categoryOrder
    .map(cat => ({ cat, items: visibleTasks.filter(t => t.category === cat) }))
    .filter(g => g.items.length > 0);

  const completedCount = visibleTasks.filter(t => t.completed).length;
  const totalCount = visibleTasks.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="animate-slide-up space-y-4 pb-4">
      {/* Greeting Banner */}
      {mode === 'green' && (
        <div className="mode-green rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles size={18} />
            <p className="font-bold">You're doing great! 🌟</p>
          </div>
          <p className="text-sm opacity-80 mt-1">
            {lastLogTime
              ? `Last check-in ${formatDistanceToNow(lastLogTime, { addSuffix: true })}`
              : 'Ready for your first check-in!'}
          </p>
        </div>
      )}

      {mode === 'yellow' && (
        <div className="mode-yellow rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle size={18} /> Let's keep an eye on things 🌤️
          </div>
          <p className="text-sm opacity-80 mt-1">Some things are a bit different from usual. That's okay — we're watching together.</p>
        </div>
      )}

      {mode === 'red' && (
        <div className="mode-red rounded-2xl p-4 space-y-3 shadow-sm">
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle size={18} /> Time to get some help ❤️‍🩹
          </div>
          <p className="text-sm opacity-80">Things feel harder right now. Let's make sure your care team knows.</p>
          {latest && (
            <div className="bg-card/20 rounded-xl p-3 space-y-1 text-sm">
              <p className="font-semibold">What's changed</p>
              {latest.pain > baseline.pain + 1 && (
                <p>Pain went up: {baseline.pain} → {latest.pain}</p>
              )}
              {latest.sleep < baseline.sleep - 1 && (
                <p>Sleep dropped {Math.round((1 - latest.sleep / baseline.sleep) * 100)}%</p>
              )}
              {latest.mobility < baseline.mobility - 1 && (
                <p>Energy/mobility down: {baseline.mobility} → {latest.mobility}</p>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 bg-card/20 hover:bg-card/30 transition-colors rounded-xl px-3 py-2 text-sm font-semibold">
              <Phone size={14} /> Call Clinic
            </button>
            <button className="flex items-center gap-1.5 bg-card/20 hover:bg-card/30 transition-colors rounded-xl px-3 py-2 text-sm font-semibold">
              <FileText size={14} /> Share Summary
            </button>
          </div>
        </div>
      )}

      {/* Progress */}
      <div className="bg-card rounded-2xl p-4 border shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold">Today's To-Do</span>
          <span className="text-sm text-muted-foreground font-semibold">{completedCount}/{totalCount} ✨</span>
        </div>
        <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        {progress === 100 && (
          <p className="text-xs text-primary font-semibold mt-2">All done for today — amazing! 🎉</p>
        )}
      </div>

      {/* Quick View Card */}
      {latest && (
        <div className="bg-card rounded-2xl p-4 border shadow-sm">
          <h3 className="text-sm font-bold mb-3">How you're feeling</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: '😴 Sleep', value: latest.sleep, base: baseline.sleep },
              { label: '🩹 Pain', value: latest.pain, base: baseline.pain, invert: true },
              { label: '🏃 Energy', value: latest.mobility, base: baseline.mobility },
              { label: '🥤 Intake', value: latest.intake, base: baseline.intake },
            ].map(item => {
              const diff = item.invert ? item.value - item.base : item.base - item.value;
              const color = diff > 1 ? 'text-mode-red' : diff > 0 ? 'text-mode-yellow' : 'text-primary';
              return (
                <div key={item.label} className="bg-secondary/50 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground font-medium">{item.label}</p>
                  <p className={`text-2xl font-bold ${color}`}>{item.value}<span className="text-xs text-muted-foreground font-medium">/10</span></p>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => setActiveTab('log')}
            className="w-full mt-3 bg-primary text-primary-foreground rounded-xl py-3 font-bold text-sm hover:opacity-90 transition-opacity"
          >
            📝 Check In Now
          </button>
        </div>
      )}

      {/* Checklist */}
      <div className="space-y-3">
        {grouped.map(({ cat, items }) => (
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
                      Done ✓
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
