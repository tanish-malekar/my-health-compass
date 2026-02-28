import { useState } from 'react';
import { useAppState } from '@/hooks/useAppState';
import { formatDistanceToNow } from 'date-fns';
import { Clock, AlertTriangle, CheckCircle2, ArrowRight, Heart } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

type Screen = 'idle' | 'checkin' | 'result';

const sliderLabels: { key: string; label: string; emoji: string }[] = [
  { key: 'sleep', label: 'How did you sleep?', emoji: '😴' },
  { key: 'pain', label: 'How\'s your pain?', emoji: '🩹' },
  { key: 'mobility', label: 'Energy & movement', emoji: '🏃' },
  { key: 'intake', label: 'Eating & drinking', emoji: '🥤' },
  { key: 'mood', label: 'How\'s your mood?', emoji: '😊' },
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
      <div className="animate-slide-up flex flex-col items-center justify-center py-16 space-y-6">
        <div className="w-24 h-24 rounded-full bg-accent flex items-center justify-center">
          <Heart size={40} className="text-primary" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-xl font-bold">Ready for a check-in? 💛</p>
          <p className="text-sm text-muted-foreground">
            {lastLogTime
              ? `Last one was ${formatDistanceToNow(lastLogTime, { addSuffix: true })}`
              : 'This will be your first one!'}
          </p>
          {mode === 'green' && <p className="text-sm text-primary font-medium">Things are looking stable 🌿</p>}
        </div>
        <button
          onClick={() => setScreen('checkin')}
          className="bg-primary text-primary-foreground rounded-2xl px-10 py-3.5 font-bold text-base hover:opacity-90 transition-opacity shadow-sm"
        >
          📝 Let's Go
        </button>
      </div>
    );
  }

  if (screen === 'checkin') {
    return (
      <div className="animate-slide-up space-y-5 pb-4">
        <div className="bg-card rounded-2xl border p-5 shadow-sm">
          <h2 className="text-base font-bold mb-1">Quick Check-In 💬</h2>
          <p className="text-xs text-muted-foreground mb-5">Slide each one — takes about 20 seconds!</p>
          <div className="space-y-6">
            {sliderLabels.map(({ key, label, emoji }) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold">{emoji} {label}</span>
                  <span className="text-sm font-bold text-primary bg-accent rounded-full w-8 h-8 flex items-center justify-center">{(values as any)[key]}</span>
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

        <div className="bg-card rounded-2xl border p-5 space-y-3 shadow-sm">
          <h3 className="text-sm font-bold">Anything concerning? 🚩</h3>
          <p className="text-xs text-muted-foreground">Tap if yes — this helps your care team.</p>
          {[
            { key: 'newSymptom', label: 'Something new or getting worse?' },
            { key: 'unableToEat', label: 'Hard to eat or drink?' },
            { key: 'severePain', label: 'Pain that won\'t go away?' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFlags(prev => ({ ...prev, [key]: !(prev as any)[key] }))}
              className={`w-full flex items-center justify-between rounded-xl px-4 py-3.5 border-2 transition-all ${
                (flags as any)[key] ? 'bg-mode-red-bg border-mode-red text-mode-red' : 'bg-secondary/50 border-transparent hover:bg-secondary'
              }`}
            >
              <span className="text-sm font-semibold">{label}</span>
              <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${(flags as any)[key] ? 'bg-mode-red text-white' : 'bg-muted text-muted-foreground'}`}>{(flags as any)[key] ? 'YES' : 'No'}</span>
            </button>
          ))}
        </div>

        <div className="bg-card rounded-2xl border p-5 shadow-sm">
          <label className="text-sm font-bold block mb-2">Anything else to share? 💭</label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="How are you feeling today?"
            className="w-full bg-secondary/50 rounded-xl p-3 text-sm resize-none h-20 border-0 focus:ring-2 focus:ring-primary/20 outline-none"
          />
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-primary text-primary-foreground rounded-2xl py-3.5 font-bold text-base hover:opacity-90 transition-opacity shadow-sm"
        >
          ✅ Save Check-In
        </button>
      </div>
    );
  }

  // Result screen
  const resultMode = lastResult?.mode || 'green';
  return (
    <div className="animate-slide-up flex flex-col items-center py-16 space-y-6">
      {resultMode === 'green' && (
        <>
          <div className="w-24 h-24 rounded-full mode-green flex items-center justify-center">
            <CheckCircle2 size={40} />
          </div>
          <div className="text-center space-y-2">
            <p className="text-xl font-bold text-primary">Looking good! 🌟</p>
            <p className="text-sm text-muted-foreground">Everything seems stable. Keep being awesome!</p>
          </div>
        </>
      )}
      {resultMode === 'yellow' && (
        <>
          <div className="w-24 h-24 rounded-full mode-yellow flex items-center justify-center">
            <AlertTriangle size={40} />
          </div>
          <div className="text-center space-y-3">
            <p className="text-xl font-bold text-mode-yellow">A few things shifted 🌤️</p>
            <div className="bg-card rounded-xl border p-3 text-sm space-y-1 text-left">
              {lastResult?.entry.pain > baseline.pain + 1 && <p>Pain went up: {baseline.pain} → {lastResult.entry.pain}</p>}
              {lastResult?.entry.sleep < baseline.sleep - 1 && <p>Sleep was lower than usual</p>}
            </div>
            <button
              onClick={() => { setActiveTab('routine'); resetAndNew(); }}
              className="mode-yellow px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-1.5 mx-auto"
            >
              See what to do <ArrowRight size={14} />
            </button>
          </div>
        </>
      )}
      {resultMode === 'red' && (
        <>
          <div className="w-24 h-24 rounded-full mode-red flex items-center justify-center animate-pulse-soft">
            <AlertTriangle size={40} />
          </div>
          <div className="text-center space-y-3">
            <p className="text-xl font-bold text-mode-red">Let's get you some help ❤️‍🩹</p>
            <p className="text-sm text-muted-foreground">Some things need attention. It's a good idea to reach out to your care team.</p>
            <button
              onClick={() => { setActiveTab('summary'); resetAndNew(); }}
              className="mode-red px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-1.5 mx-auto"
            >
              Share with care team <ArrowRight size={14} />
            </button>
          </div>
        </>
      )}
      <button
        onClick={resetAndNew}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
      >
        All done 👋
      </button>
    </div>
  );
}
