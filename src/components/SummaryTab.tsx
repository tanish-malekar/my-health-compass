import { useState, useMemo } from 'react';
import { useAppState } from '@/hooks/useAppState';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, subDays, isAfter } from 'date-fns';
import { Copy, Download, FileText } from 'lucide-react';

type TimeFilter = '24h' | '7d' | '30d';

export default function SummaryTab() {
  const { logs, baseline } = useAppState();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('7d');
  const [showExport, setShowExport] = useState(false);

  const cutoff = useMemo(() => {
    const now = new Date();
    if (timeFilter === '24h') return subDays(now, 1);
    if (timeFilter === '7d') return subDays(now, 7);
    return subDays(now, 30);
  }, [timeFilter]);

  const filtered = useMemo(() => logs.filter(l => isAfter(l.timestamp, cutoff)), [logs, cutoff]);

  const chartData = useMemo(() =>
    filtered.map(l => ({
      date: format(l.timestamp, timeFilter === '24h' ? 'HH:mm' : 'MMM d'),
      Sleep: l.sleep, Pain: l.pain, Mobility: l.mobility, Intake: l.intake, Mood: l.mood,
    })), [filtered, timeFilter]);

  const recentAvg = useMemo(() => {
    if (filtered.length === 0) return null;
    const avg = (key: 'sleep' | 'pain' | 'mobility' | 'intake' | 'mood') =>
      Math.round(filtered.reduce((a, l) => a + l[key], 0) / filtered.length * 10) / 10;
    return { sleep: avg('sleep'), pain: avg('pain'), mobility: avg('mobility'), intake: avg('intake'), mood: avg('mood') };
  }, [filtered]);

  const generateClinicianSummary = () => {
    if (!recentAvg) return '';
    const lines = [
      `Patient Symptom Summary — ${format(new Date(), 'MMM d, yyyy')}`,
      `Period: ${timeFilter === '24h' ? 'Last 24 hours' : timeFilter === '7d' ? 'Last 7 days' : 'Last 30 days'}`,
      `Entries: ${filtered.length}`, '',
      'A. Change Snapshot',
      `  Sleep: ${recentAvg.sleep}/10 (baseline ${baseline.sleep})  ${recentAvg.sleep < baseline.sleep - 1 ? '↓ BELOW BASELINE' : 'within range'}`,
      `  Pain: ${recentAvg.pain}/10 (baseline ${baseline.pain})  ${recentAvg.pain > baseline.pain + 1 ? '↑ ABOVE BASELINE' : 'within range'}`,
      `  Mobility: ${recentAvg.mobility}/10 (baseline ${baseline.mobility})  ${recentAvg.mobility < baseline.mobility - 1 ? '↓ BELOW BASELINE' : 'within range'}`,
      `  Intake: ${recentAvg.intake}/10 (baseline ${baseline.intake})`,
      `  Mood: ${recentAvg.mood}/10 (baseline ${baseline.mood})`, '',
      'B. Red Flags Observed',
      ...filtered.filter(l => l.severePain || l.newSymptom || l.unableToEat).map(l =>
        `  ${format(l.timestamp, 'MMM d HH:mm')}: ${[l.severePain && 'Severe pain', l.newSymptom && 'New symptom', l.unableToEat && 'Unable to eat'].filter(Boolean).join(', ')}`
      ),
      filtered.every(l => !l.severePain && !l.newSymptom && !l.unableToEat) ? '  None observed' : '', '',
      'C. Caregiver Questions',
      '  - Could these changes indicate a need for medication adjustment?',
      '  - What changes should we consider for the care plan?',
      '  - When should we escalate to urgent care?', '',
      'Caregiver-reported data only. No medication changes suggested.',
    ];
    return lines.join('\n');
  };

  const copyToClipboard = () => navigator.clipboard.writeText(generateClinicianSummary());

  return (
    <div className="animate-slide-up space-y-4 pb-4">
      {/* Time Filter */}
      <div className="flex gap-2 bg-secondary/50 rounded-2xl p-1.5">
        {(['24h', '7d', '30d'] as TimeFilter[]).map(tf => (
          <button
            key={tf}
            onClick={() => setTimeFilter(tf)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              timeFilter === tf ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tf === '24h' ? 'Today' : tf === '7d' ? 'This Week' : 'This Month'}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-card rounded-2xl border p-4 shadow-sm">
        <h3 className="text-sm font-bold mb-4">📊 Your Trends</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="Sleep" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Pain" stroke="hsl(var(--chart-5))" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Mobility" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Intake" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Mood" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insight Card */}
      {recentAvg && (
        <div className="bg-card rounded-2xl border p-4 shadow-sm">
          <h3 className="text-sm font-bold mb-3">📋 Compared to Your Baseline</h3>
          <div className="space-y-2">
            {[
              { label: '😴 Sleep', current: recentAvg.sleep, base: baseline.sleep, invert: false },
              { label: '🩹 Pain', current: recentAvg.pain, base: baseline.pain, invert: true },
              { label: '🏃 Energy', current: recentAvg.mobility, base: baseline.mobility, invert: false },
              { label: '🥤 Intake', current: recentAvg.intake, base: baseline.intake, invert: false },
              { label: '😊 Mood', current: recentAvg.mood, base: baseline.mood, invert: false },
            ].map(item => {
              const diff = item.current - item.base;
              const concern = item.invert ? diff > 1 : diff < -1;
              return (
                <div key={item.label} className="flex items-center justify-between py-2 px-3 bg-secondary/30 rounded-xl">
                  <span className="text-sm font-medium">{item.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">usual {item.base}</span>
                    <span className={`text-sm font-bold ${concern ? 'text-mode-red' : 'text-primary'}`}>
                      {item.current}
                      {diff !== 0 && <span className="text-xs ml-1">{diff > 0 ? '↑' : '↓'}{Math.abs(Math.round(diff * 10) / 10)}</span>}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Clinician Export */}
      <div className="bg-card rounded-2xl border overflow-hidden shadow-sm">
        <button
          onClick={() => setShowExport(!showExport)}
          className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-secondary/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-primary" />
            <span className="text-sm font-bold">Share with Care Team</span>
          </div>
          <span className="text-xs text-muted-foreground font-medium">{showExport ? 'Hide' : 'Show'}</span>
        </button>
        {showExport && (
          <div className="px-4 pb-4 space-y-3 border-t">
            <pre className="text-xs bg-secondary/50 rounded-xl p-3 overflow-auto max-h-64 whitespace-pre-wrap mt-3 text-foreground/80">
              {generateClinicianSummary()}
            </pre>
            <div className="flex gap-2">
              <button onClick={copyToClipboard} className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-primary-foreground rounded-xl py-3 text-sm font-bold hover:opacity-90 transition-opacity">
                <Copy size={14} /> Copy Message
              </button>
              <button className="flex items-center justify-center gap-1.5 bg-secondary text-secondary-foreground rounded-xl px-4 py-3 text-sm font-bold hover:opacity-90 transition-opacity">
                <Download size={14} />
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
              Caregiver-reported data only. No medication changes suggested.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
