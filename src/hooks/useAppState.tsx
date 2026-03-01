import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

export type Mode = 'normal' | 'flare';

export interface MetricValue {
  name: string;
  value: number | boolean;
  metricType: 'scale' | 'boolean';
}

export interface LogEntry {
  _id?: string;
  time: Date;
  metrics: MetricValue[];
  note?: string;
}

export interface UserMetric {
  _id?: string;
  name: string;
  metricType: 'scale' | 'boolean';
  unit: string;
  min: number;
  max: number;
  baseline?: number;
  baselineBoolean?: boolean;
  hasBaseline: boolean;
  higherIsWorse: boolean;
  yesIsGood: boolean;
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

export interface UserData {
  _id?: string;
  childName: string;
  condition?: string;
  caregiverName?: string;
  mode: Mode;
  isFlareEnabled: boolean;
  isCheckinNow: boolean;
  lastCheckinTime?: Date;
  metrics: UserMetric[];
  medications: Array<{ _id?: string; name: string; dose: string; time: string }>;
  routineTasks: Array<{ _id?: string; name: string; category: string; time: string }>;
  flareMeds: Array<{ _id?: string; name: string; dose: string; time: string }>;
  flareTasks: Array<{ _id?: string; name: string; category: string; time: string }>;
  logs: LogEntry[];
}

interface AppState {
  mode: Mode;
  setMode: (mode: Mode) => void;
  toggleMode: () => void;
  isCheckinNow: boolean;
  setIsCheckinNow: (value: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  baseline: Baseline;
  logs: LogEntry[];
  addLog: (metrics: MetricValue[], note?: string) => Promise<void>;
  tasks: RoutineTask[];
  toggleTask: (id: string) => void;
  lastLogTime: Date | null;
  userData: UserData | null;
  loadUserData: () => Promise<void>;
  completedTaskIds: Set<string>;
}

const defaultBaseline: Baseline = { sleep: 7, pain: 2, mobility: 7, intake: 7, mood: 7 };

// Build tasks from user data based on mode
function buildTasksFromUserData(userData: UserData | null, mode: Mode): RoutineTask[] {
  if (!userData) return [];
  
  const tasks: RoutineTask[] = [];
  
  if (mode === 'normal') {
    // Add regular medications
    userData.medications?.forEach((med, idx) => {
      tasks.push({
        id: med._id || `med-${idx}`,
        name: `${med.name} (${med.dose})`,
        category: 'medications',
        timeWindow: med.time,
        completed: false,
        isFlareOnly: false,
      });
    });
    
    // Add routine tasks
    userData.routineTasks?.forEach((task, idx) => {
      tasks.push({
        id: task._id || `task-${idx}`,
        name: task.name,
        category: (task.category as RoutineTask['category']) || 'care',
        timeWindow: task.time,
        completed: false,
        isFlareOnly: false,
      });
    });
  } else {
    // Flare mode - add flare medications
    userData.flareMeds?.forEach((med, idx) => {
      tasks.push({
        id: med._id || `flare-med-${idx}`,
        name: `${med.name} (${med.dose})`,
        category: 'medications',
        timeWindow: med.time,
        completed: false,
        isFlareOnly: true,
      });
    });
    
    // Add flare tasks
    userData.flareTasks?.forEach((task, idx) => {
      tasks.push({
        id: task._id || `flare-task-${idx}`,
        name: task.name,
        category: (task.category as RoutineTask['category']) || 'care',
        timeWindow: task.time,
        completed: false,
        isFlareOnly: true,
      });
    });
  }
  
  return tasks;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<Mode>('normal');
  const [isCheckinNow, setIsCheckinNowState] = useState(false);
  const [activeTab, setActiveTab] = useState('routine');
  const [baseline] = useState<Baseline>(defaultBaseline);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());

  const lastLogTime = logs.length > 0 ? new Date(logs[logs.length - 1].time) : null;

  // Build tasks dynamically from userData and mode
  const tasks = React.useMemo(() => {
    const builtTasks = buildTasksFromUserData(userData, mode);
    // Apply completed status from completedTaskIds
    return builtTasks.map(t => ({
      ...t,
      completed: completedTaskIds.has(t.id),
    }));
  }, [userData, mode, completedTaskIds]);

  const loadUserData = useCallback(async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    
    try {
      const response = await fetch(`http://localhost:3001/api/users/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
        // Set mode based on isFlareEnabled field
        setModeState(data.isFlareEnabled ? 'flare' : 'normal');
        setIsCheckinNowState(data.isCheckinNow || false);
        // Load logs from user data
        if (data.logs && Array.isArray(data.logs)) {
          setLogs(data.logs);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }, []);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const setMode = useCallback(async (newMode: Mode) => {
    setModeState(newMode);
    // Reset completed tasks when switching modes
    setCompletedTaskIds(new Set());
    const userId = localStorage.getItem('userId');
    if (userId) {
      try {
        await fetch(`http://localhost:3001/api/users/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: newMode }),
        });
      } catch (error) {
        console.error('Error updating mode:', error);
      }
    }
  }, []);

  const toggleMode = useCallback(() => {
    const newMode = mode === 'normal' ? 'flare' : 'normal';
    setMode(newMode);
  }, [mode, setMode]);

  const setIsCheckinNow = useCallback(async (value: boolean) => {
    setIsCheckinNowState(value);
    const userId = localStorage.getItem('userId');
    if (userId) {
      try {
        await fetch(`http://localhost:3001/api/users/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isCheckinNow: value, lastCheckinTime: value ? undefined : new Date() }),
        });
      } catch (error) {
        console.error('Error updating checkin status:', error);
      }
    }
  }, []);

  const addLog = useCallback(async (metrics: MetricValue[], note?: string) => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    
    try {
      const response = await fetch(`http://localhost:3001/api/users/${userId}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics, note }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setLogs(prev => [...prev, data.log]);
        setIsCheckinNowState(false);
        
        // Update flare mode based on check-in results
        if (data.isFlareEnabled) {
          setMode('flare');
        } else {
          setMode('normal');
        }
        
        // Update userData
        setUserData(prev => prev ? { ...prev, isFlareEnabled: data.isFlareEnabled } : prev);
      }
    } catch (error) {
      console.error('Error adding log:', error);
    }
  }, []);

  const toggleTask = useCallback((id: string) => {
    setCompletedTaskIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  return (
    <AppContext.Provider value={{ 
      mode, 
      setMode, 
      toggleMode,
      isCheckinNow, 
      setIsCheckinNow, 
      activeTab, 
      setActiveTab, 
      baseline, 
      logs, 
      addLog, 
      tasks, 
      toggleTask, 
      lastLogTime,
      userData,
      loadUserData,
      completedTaskIds
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within AppProvider');
  return ctx;
}
