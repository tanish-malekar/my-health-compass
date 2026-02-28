import { useState } from 'react';
import { useAppState } from '@/hooks/useAppState';
import { formatDistanceToNow } from 'date-fns';
import { Clock, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

type Screen = 'idle' | 'checkin' | 'result';

const sliderLabels: { key: string; label: string; emoji: string }[] = [
  { key: 'sleep', label: 'Sleep quality', emoji: '😴' },
  { key: 'pain', label: 'Pain level', emoji: '🩹' },
  { key: 'mobility', label: 'Mobility / Energy', emoji: '🏃' },
  { key: 'intake', label: 'Food / Fluid intake', emoji: '🥤' },
  { key: 'mood', label: 'Mood', emoji: '😊' },
];

export default function LogTab() {
  const { addLog, lastLogTime, mode, logs, baseline, detectMode, setActiveTab } = useAppState();
  const [screen, setScreen] = useState<Screen>('idle');
  const [values, setValues] = useState({ sleep: 7, pain: 2, mobility: 7, intake: 7, mood: 7 });
  const [flags, setFlags] = useState({ newSymptom: false, unableToEat: false, severePain: false });
  const [note, setNote] = useState('');
  const [lastResult, setLastResult] = useState<{ mode: string; entry: any } | null>(null);

  const handleSave = () => {
    const entry = { ...values, ...flags, note: note || undefined };
    const detectedMode = detectMode(entry);
    addLog(entry);
    setLastResult({ mode: detectedMode, entry });
    setScreen('result');
  };

  const resetAndNew = () => {
    setValues({ sleep: 7, pain: 2, mobility: 7, intake: 7, mood: 7 });
    setFlags({ newSymptom: false, unableToEat: false, severePain: false });
    setNote('');
    setScreen('idle');
    setLastResult(null);
  };

  if (screen === 'idle') {
    return (
      <div className="animate-slide-up flex flex-col items-center justify-center py-12 space-y-6">
        <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center">
          <Clock size={32} className="text-muted-foreground" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-lg font-medium">Ready to check in</p>
          <p className="text-sm text-muted-foreground">
            {lastLogTime
              ? `Last logged ${formatDistanceToNow(lastLogTime, { addSuffix: true })}`
              : 'No entries yet'}
          </p>
          {mode === 'green' && <p className="text-sm text-primary">Baseline stable</p>}
        </div>
        <button
          onClick={() => setScreen('checkin')}
          className="bg-primary text-primary-foreground rounded-xl px-8 py-3 font-medium text-base hover:opacity-90 transition-opacity"
        >
          Log Now
        </button>
      </div>
    );
  }

  if (screen === 'checkin') {
    return (
      <div className="animate-slide-up space-y-5 pb-4">
        <div className="bg-card rounded-xl border p-4">
          <h2 className="text-base font-semibold mb-4">Quick Check-In</h2>
          <div className="space-y-5">
            {sliderLabels.map(({ key, label, emoji }) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{emoji} {label}</span>
                  <span className="text-sm font-semibold text-primary">{(values as any)[key]}</span>
                </div>
                <Slider
                  value={[(values as any)[key]]}
                  onValueChange={([v]) => setValues(prev => ({ ...prev, [key]: v }))}
                  max={10}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl border p-4 space-y-3">
          <h3 className="text-sm font-semibold">Red Flag Checks</h3>
          {[
            { key: 'newSymptom', label: 'New or worsening symptom?' },
            { key: 'unableToEat', label: 'Unable to eat or drink?' },
            { key: 'severePain', label: 'Severe pain not relieved?' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFlags(prev => ({ ...prev, [key]: !(prev as any)[key] }))}
              className={`w-full flex items-center justify-between rounded-lg px-4 py-3 border transition-colors ${
                (flags as any)[key] ? 'bg-mode-red-bg border-mode-red text-mode-red' : 'bg-secondary/50 hover:bg-secondary'
              }`}
            >
              <span className="text-sm font-medium">{label}</span>
              <span className="text-sm font-semibold">{(flags as any)[key] ? 'YES' : 'No'}</span>
            </button>
          ))}
        </div>

        <div className="bg-card rounded-xl border p-4">
          <label className="text-sm font-medium block mb-2">Notes (optional)</label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="How are you feeling?"
            className="w-full bg-secondary/50 rounded-lg p-3 text-sm resize-none h-20 border-0 focus:ring-2 focus:ring-primary/20 outline-none"
          />
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-medium text-base hover:opacity-90 transition-opacity"
        >
          Save Check-In
        </button>
      </div>
    );
  }

  // Result screen
  const resultMode = lastResult?.mode || 'green';
  return (
    <div className="animate-slide-up flex flex-col items-center py-12 space-y-6">
      {resultMode === 'green' && (
        <>
          <div className="w-20 h-20 rounded-full mode-green flex items-center justify-center">
            <CheckCircle2 size={36} />
          </div>
          <div className="text-center space-y-1">
            <p className="text-lg font-semibold text-primary">No flare signals detected</p>
            <p className="text-sm text-muted-foreground">Everything looks stable. Keep it up!</p>
          </div>
        </>
      )}
      {resultMode === 'yellow' && (
        <>
          <div className="w-20 h-20 rounded-full mode-yellow flex items-center justify-center">
            <AlertTriangle size={36} />
          </div>
          <div className="text-center space-y-2">
            <p className="text-lg font-semibold text-mode-yellow">Changes above baseline</p>
            <div className="bg-card rounded-lg border p-3 text-sm space-y-1 text-left">
              {lastResult?.entry.pain > baseline.pain + 1 && <p>Pain ↑ {baseline.pain} → {lastResult.entry.pain}</p>}
              {lastResult?.entry.sleep < baseline.sleep - 1 && <p>Sleep ↓ from baseline</p>}
            </div>
            <button
              onClick={() => { setActiveTab('routine'); resetAndNew(); }}
              className="mode-yellow px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 mx-auto"
            >
              View Flare Plan <ArrowRight size={14} />
            </button>
          </div>
        </>
      )}
      {resultMode === 'red' && (
        <>
          <div className="w-20 h-20 rounded-full mode-red flex items-center justify-center animate-pulse-soft">
            <AlertTriangle size={36} />
          </div>
          <div className="text-center space-y-2">
            <p className="text-lg font-semibold text-mode-red">High concern detected</p>
            <p className="text-sm text-muted-foreground">Red flags identified. Consider contacting your clinician.</p>
            <button
              onClick={() => { setActiveTab('summary'); resetAndNew(); }}
              className="mode-red px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 mx-auto"
            >
              View Clinician Summary <ArrowRight size={14} />
            </button>
          </div>
        </>
      )}
      <button
        onClick={resetAndNew}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Done
      </button>
    </div>
  );
}
