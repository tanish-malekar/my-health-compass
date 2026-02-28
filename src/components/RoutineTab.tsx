import { useAppState } from '@/hooks/useAppState';
import { Check, Clock, AlertTriangle, Phone, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const categoryLabels: Record<string, string> = {
  medications: '💊 Medications',
  care: '🩺 Care / Therapy',
  nutrition: '🥗 Nutrition / Hydration',
  school: '📚 School / Work',
  admin: '📋 Admin',
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

  return (
    <div className="animate-slide-up space-y-4 pb-4">
      {/* Status Banner */}
      {mode === 'green' && (
        <div className="mode-green rounded-xl p-4">
          <p className="font-medium">Baseline looks stable.</p>
          <p className="text-sm opacity-80 mt-0.5">
            {lastLogTime
              ? `Last check-in ${formatDistanceToNow(lastLogTime, { addSuffix: true })}`
              : 'No check-ins yet'}
          </p>
        </div>
      )}

      {mode === 'yellow' && (
        <div className="mode-yellow rounded-xl p-4">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle size={18} /> Watch Mode Active
          </div>
          <p className="text-sm opacity-80 mt-1">Symptoms above baseline. Monitor closely.</p>
        </div>
      )}

      {mode === 'red' && (
        <div className="mode-red rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle size={18} /> Flare Mode Activated
          </div>
          <p className="text-sm opacity-80">High concern detected. Review changes below.</p>
          {latest && (
            <div className="bg-card/20 rounded-lg p-3 space-y-1 text-sm">
              <p className="font-medium">What Changed</p>
              {latest.pain > baseline.pain + 1 && (
                <p>Pain ↑ {baseline.pain} → {latest.pain}</p>
              )}
              {latest.sleep < baseline.sleep - 1 && (
                <p>Sleep ↓ {Math.round((1 - latest.sleep / baseline.sleep) * 100)}%</p>
              )}
              {latest.mobility < baseline.mobility - 1 && (
                <p>Mobility ↓ {baseline.mobility} → {latest.mobility}</p>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 bg-card/20 hover:bg-card/30 transition-colors rounded-lg px-3 py-2 text-sm font-medium">
              <Phone size={14} /> Call Clinic
            </button>
            <button className="flex items-center gap-1.5 bg-card/20 hover:bg-card/30 transition-colors rounded-lg px-3 py-2 text-sm font-medium">
              <FileText size={14} /> Copy Summary
            </button>
          </div>
        </div>
      )}

      {/* Progress */}
      <div className="bg-card rounded-xl p-4 border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Today's Progress</span>
          <span className="text-sm text-muted-foreground">{completedCount}/{totalCount}</span>
        </div>
        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Quick View Card */}
      {latest && (
        <div className="bg-card rounded-xl p-4 border">
          <h3 className="text-sm font-medium mb-3">Quick View</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Sleep', value: latest.sleep, base: baseline.sleep },
              { label: 'Pain', value: latest.pain, base: baseline.pain, invert: true },
              { label: 'Mobility', value: latest.mobility, base: baseline.mobility },
              { label: 'Intake', value: latest.intake, base: baseline.intake },
            ].map(item => {
              const diff = item.invert ? item.value - item.base : item.base - item.value;
              const color = diff > 1 ? 'text-mode-red' : diff > 0 ? 'text-mode-yellow' : 'text-primary';
              return (
                <div key={item.label} className="bg-secondary/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className={`text-xl font-semibold ${color}`}>{item.value}<span className="text-xs text-muted-foreground">/10</span></p>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => setActiveTab('log')}
            className="w-full mt-3 bg-primary text-primary-foreground rounded-lg py-2.5 font-medium text-sm hover:opacity-90 transition-opacity"
          >
            Log Now
          </button>
        </div>
      )}

      {/* Checklist */}
      <div className="space-y-3">
        {grouped.map(({ cat, items }) => (
          <div key={cat} className="bg-card rounded-xl border overflow-hidden">
            <h3 className="text-sm font-medium px-4 py-3 bg-secondary/30">{categoryLabels[cat]}</h3>
            <div className="divide-y">
              {items.map(task => (
                <button
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors text-left"
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                    task.completed ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                  }`}>
                    {task.completed && <Check size={12} className="text-primary-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {task.name}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock size={10} /> {task.timeWindow}
                    </p>
                  </div>
                  {!task.completed && (
                    <span className="text-xs bg-primary/10 text-primary rounded-md px-2 py-1 font-medium shrink-0">
                      Mark done
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
