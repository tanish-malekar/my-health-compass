import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type Mode = 'green' | 'yellow' | 'red';

export interface LogEntry {
  id: string;
  timestamp: Date;
  sleep: number;
  pain: number;
  mobility: number;
  intake: number;
  mood: number;
  newSymptom: boolean;
  unableToEat: boolean;
  severePain: boolean;
  note?: string;
  mode: Mode;
}

export interface RoutineTask {
  id: string;
  name: string;
  category: 'medications' | 'care' | 'nutrition' | 'school' | 'admin';
  timeWindow: string;
  completed: boolean;
  isFlareOnly?: boolean;
}

export interface Baseline {
  sleep: number;
  pain: number;
  mobility: number;
  intake: number;
  mood: number;
}

interface AppState {
  mode: Mode;
  setMode: (mode: Mode) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  baseline: Baseline;
  logs: LogEntry[];
  addLog: (entry: Omit<LogEntry, 'id' | 'timestamp' | 'mode'>) => void;
  tasks: RoutineTask[];
  toggleTask: (id: string) => void;
  lastLogTime: Date | null;
  detectMode: (entry: Omit<LogEntry, 'id' | 'timestamp' | 'mode'>) => Mode;
}

const defaultBaseline: Baseline = { sleep: 7, pain: 2, mobility: 7, intake: 7, mood: 7 };

const defaultTasks: RoutineTask[] = [
  { id: '1', name: 'Morning medication', category: 'medications', timeWindow: '7–8 AM', completed: false },
  { id: '2', name: 'Evening medication', category: 'medications', timeWindow: '7–8 PM', completed: false },
  { id: '3', name: 'Physical therapy exercises', category: 'care', timeWindow: '10–11 AM', completed: false },
  { id: '4', name: 'Breakfast', category: 'nutrition', timeWindow: '8–9 AM', completed: false },
  { id: '5', name: 'Lunch', category: 'nutrition', timeWindow: '12–1 PM', completed: false },
  { id: '6', name: 'Dinner', category: 'nutrition', timeWindow: '6–7 PM', completed: false },
  { id: '7', name: 'Hydration check (8 cups)', category: 'nutrition', timeWindow: 'Throughout day', completed: false },
  { id: '8', name: 'School attendance', category: 'school', timeWindow: '8 AM–3 PM', completed: false },
  { id: '9', name: 'Homework', category: 'school', timeWindow: '4–5 PM', completed: false },
  // Flare-only
  { id: 'f1', name: 'Flare medication (as prescribed)', category: 'medications', timeWindow: 'As needed', completed: false, isFlareOnly: true },
  { id: 'f2', name: 'Rest period', category: 'care', timeWindow: 'As needed', completed: false, isFlareOnly: true },
  { id: 'f3', name: 'Send school accommodation note', category: 'admin', timeWindow: 'Morning', completed: false, isFlareOnly: true },
];

// Generate sample history
function generateSampleLogs(): LogEntry[] {
  const logs: LogEntry[] = [];
  const now = new Date();
  for (let i = 30; i >= 1; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(8 + Math.floor(Math.random() * 4), 0, 0, 0);
    const jitter = () => (Math.random() - 0.5) * 2;
    const sleep = Math.max(0, Math.min(10, Math.round(7 + jitter())));
    const pain = Math.max(0, Math.min(10, Math.round(2 + jitter() + (i < 5 ? 2 : 0))));
    const mobility = Math.max(0, Math.min(10, Math.round(7 + jitter() - (i < 5 ? 2 : 0))));
    const intake = Math.max(0, Math.min(10, Math.round(7 + jitter())));
    const mood = Math.max(0, Math.min(10, Math.round(7 + jitter())));
    logs.push({
      id: `sample-${i}`,
      timestamp: d,
      sleep, pain, mobility, intake, mood,
      newSymptom: false,
      unableToEat: false,
      severePain: pain >= 7,
      mode: pain >= 6 ? 'red' : pain >= 4 ? 'yellow' : 'green',
    });
  }
  return logs;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>('green');
  const [activeTab, setActiveTab] = useState('routine');
  const [baseline] = useState<Baseline>(defaultBaseline);
  const [logs, setLogs] = useState<LogEntry[]>(generateSampleLogs());
  const [tasks, setTasks] = useState<RoutineTask[]>(defaultTasks);

  const lastLogTime = logs.length > 0 ? logs[logs.length - 1].timestamp : null;

  const detectMode = useCallback((entry: Omit<LogEntry, 'id' | 'timestamp' | 'mode'>): Mode => {
    if (entry.severePain || entry.unableToEat || entry.newSymptom) return 'red';
    const painDelta = entry.pain - baseline.pain;
    const sleepDelta = baseline.sleep - entry.sleep;
    const mobilityDelta = baseline.mobility - entry.mobility;
    const score = painDelta * 2 + sleepDelta + mobilityDelta;
    if (score >= 6) return 'red';
    if (score >= 3) return 'yellow';
    return 'green';
  }, [baseline]);

  const addLog = useCallback((entry: Omit<LogEntry, 'id' | 'timestamp' | 'mode'>) => {
    const detectedMode = detectMode(entry);
    const newEntry: LogEntry = {
      ...entry,
      id: Date.now().toString(),
      timestamp: new Date(),
      mode: detectedMode,
    };
    setLogs(prev => [...prev, newEntry]);
    setMode(detectedMode);
  }, [detectMode]);

  const toggleTask = useCallback((id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  }, []);

  return (
    <AppContext.Provider value={{ mode, setMode, activeTab, setActiveTab, baseline, logs, addLog, tasks, toggleTask, lastLogTime, detectMode }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within AppProvider');
  return ctx;
}
