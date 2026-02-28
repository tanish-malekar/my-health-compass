import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Plus, X, Heart, Sparkles } from 'lucide-react';

const STEPS = [
  { title: '👋 Welcome', subtitle: "Let's set up your daily tracker" },
  { title: '📊 What to Track', subtitle: 'Pick the symptoms and areas to monitor' },
  { title: '📏 Your Baseline', subtitle: 'How are things on a normal day?' },
  { title: '💊 Medications', subtitle: 'Your regular daily medications' },
  { title: '📋 Daily Routine', subtitle: 'Tasks you do every day' },
  { title: '🔥 Flare Medications', subtitle: 'Extra meds when things get tough' },
  { title: '🛌 Flare Routine', subtitle: 'What changes during a flare?' },
  { title: '🎉 All Set!', subtitle: "You're ready to go" },
];

const DEFAULT_TRACKERS = [
  { id: 'sleep', label: '😴 Sleep Quality', emoji: '😴', checked: true },
  { id: 'pain', label: '🩹 Pain Level', emoji: '🩹', checked: true },
  { id: 'mobility', label: '🏃 Energy / Mobility', emoji: '🏃', checked: true },
  { id: 'intake', label: '🥤 Food & Drink Intake', emoji: '🥤', checked: true },
  { id: 'mood', label: '😊 Mood', emoji: '😊', checked: true },
  { id: 'fatigue', label: '🥱 Fatigue', emoji: '🥱', checked: false },
  { id: 'nausea', label: '🤢 Nausea', emoji: '🤢', checked: false },
  { id: 'headache', label: '🤕 Headache', emoji: '🤕', checked: false },
];

const ROUTINE_CATEGORIES = [
  { id: 'medications', label: '💊 Medications', emoji: '💊' },
  { id: 'care', label: '🧡 Care & Therapy', emoji: '🧡' },
  { id: 'nutrition', label: '🥤 Food & Hydration', emoji: '🥤' },
  { id: 'school', label: '📚 School & Work', emoji: '📚' },
  { id: 'admin', label: '📋 Admin', emoji: '📋' },
];

interface MedEntry { id: string; name: string; dose: string; time: string; }
interface TaskEntry { id: string; name: string; category: string; time: string; }

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  // Step 1: Profile
  const [childName, setChildName] = useState('');
  const [condition, setCondition] = useState('');
  const [caregiverName, setCaregiverName] = useState('');

  // Step 2: Trackers
  const [trackers, setTrackers] = useState(DEFAULT_TRACKERS);

  // Step 3: Baselines
  const [baselines, setBaselines] = useState<Record<string, number>>({
    sleep: 7, pain: 2, mobility: 7, intake: 7, mood: 7, fatigue: 3, nausea: 1, headache: 1,
  });

  // Step 4: Medications
  const [medications, setMedications] = useState<MedEntry[]>([
    { id: '1', name: '', dose: '', time: 'Morning' },
  ]);

  // Step 5: Daily routine
  const [routineTasks, setRoutineTasks] = useState<TaskEntry[]>([
    { id: '1', name: '', category: 'care', time: '' },
  ]);

  // Step 6: Flare medications
  const [flareMeds, setFlareMeds] = useState<MedEntry[]>([
    { id: '1', name: '', dose: '', time: 'As needed' },
  ]);

  // Step 7: Flare routine
  const [flareTasks, setFlareTasks] = useState<TaskEntry[]>([
    { id: '1', name: '', category: 'care', time: '' },
  ]);

  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep(s => Math.max(s - 1, 0));

  const finish = () => {
    // Save to localStorage for persistence
    const onboardingData = {
      childName, condition, caregiverName,
      trackers: trackers.filter(t => t.checked).map(t => t.id),
      baselines,
      medications: medications.filter(m => m.name.trim()),
      routineTasks: routineTasks.filter(t => t.name.trim()),
      flareMeds: flareMeds.filter(m => m.name.trim()),
      flareTasks: flareTasks.filter(t => t.name.trim()),
      completed: true,
    };
    localStorage.setItem('onboarding', JSON.stringify(onboardingData));
    navigate('/');
  };

  const activeTrackers = trackers.filter(t => t.checked);

  const addMed = (list: MedEntry[], setList: React.Dispatch<React.SetStateAction<MedEntry[]>>) => {
    setList([...list, { id: Date.now().toString(), name: '', dose: '', time: 'Morning' }]);
  };

  const removeMed = (list: MedEntry[], setList: React.Dispatch<React.SetStateAction<MedEntry[]>>, id: string) => {
    if (list.length > 1) setList(list.filter(m => m.id !== id));
  };

  const updateMed = (list: MedEntry[], setList: React.Dispatch<React.SetStateAction<MedEntry[]>>, id: string, field: keyof MedEntry, value: string) => {
    setList(list.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const addTask = (list: TaskEntry[], setList: React.Dispatch<React.SetStateAction<TaskEntry[]>>) => {
    setList([...list, { id: Date.now().toString(), name: '', category: 'care', time: '' }]);
  };

  const removeTask = (list: TaskEntry[], setList: React.Dispatch<React.SetStateAction<TaskEntry[]>>, id: string) => {
    if (list.length > 1) setList(list.filter(t => t.id !== id));
  };

  const updateTask = (list: TaskEntry[], setList: React.Dispatch<React.SetStateAction<TaskEntry[]>>, id: string, field: keyof TaskEntry, value: string) => {
    setList(list.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const renderMedList = (list: MedEntry[], setList: React.Dispatch<React.SetStateAction<MedEntry[]>>) => (
    <div className="space-y-3">
      {list.map((med, i) => (
        <Card key={med.id} className="border-border/60">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-muted-foreground">Medication {i + 1}</span>
              {list.length > 1 && (
                <button onClick={() => removeMed(list, setList, med.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <X size={16} />
                </button>
              )}
            </div>
            <Input placeholder="Medication name" value={med.name} onChange={e => updateMed(list, setList, med.id, 'name', e.target.value)} className="bg-secondary/50" />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Dose (e.g. 5mg)" value={med.dose} onChange={e => updateMed(list, setList, med.id, 'dose', e.target.value)} className="bg-secondary/50" />
              <select
                value={med.time}
                onChange={e => updateMed(list, setList, med.id, 'time', e.target.value)}
                className="rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm"
              >
                <option>Morning</option>
                <option>Afternoon</option>
                <option>Evening</option>
                <option>Bedtime</option>
                <option>As needed</option>
              </select>
            </div>
          </CardContent>
        </Card>
      ))}
      <Button variant="outline" onClick={() => addMed(list, setList)} className="w-full border-dashed">
        <Plus size={16} /> Add Medication
      </Button>
    </div>
  );

  const renderTaskList = (list: TaskEntry[], setList: React.Dispatch<React.SetStateAction<TaskEntry[]>>) => (
    <div className="space-y-3">
      {list.map((task, i) => (
        <Card key={task.id} className="border-border/60">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-muted-foreground">Task {i + 1}</span>
              {list.length > 1 && (
                <button onClick={() => removeTask(list, setList, task.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <X size={16} />
                </button>
              )}
            </div>
            <Input placeholder="Task name (e.g. Physical therapy)" value={task.name} onChange={e => updateTask(list, setList, task.id, 'name', e.target.value)} className="bg-secondary/50" />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={task.category}
                onChange={e => updateTask(list, setList, task.id, 'category', e.target.value)}
                className="rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm"
              >
                {ROUTINE_CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
              <Input placeholder="Time (e.g. 8 AM)" value={task.time} onChange={e => updateTask(list, setList, task.id, 'time', e.target.value)} className="bg-secondary/50" />
            </div>
          </CardContent>
        </Card>
      ))}
      <Button variant="outline" onClick={() => addTask(list, setList)} className="w-full border-dashed">
        <Plus size={16} /> Add Task
      </Button>
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case 0: // Welcome
        return (
          <div className="space-y-6 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Heart className="text-primary" size={36} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Welcome to MyDay 🩵</h2>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                We'll help you track daily health, manage routines, and catch flares early. Let's set things up in just a few steps!
              </p>
            </div>
            <div className="space-y-3 text-left">
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Child's Name</label>
                <Input placeholder="e.g. Emma" value={childName} onChange={e => setChildName(e.target.value)} className="bg-secondary/50" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Condition / Diagnosis</label>
                <Input placeholder="e.g. JIA, Crohn's, Lupus" value={condition} onChange={e => setCondition(e.target.value)} className="bg-secondary/50" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Your Name (Caregiver)</label>
                <Input placeholder="e.g. Sarah" value={caregiverName} onChange={e => setCaregiverName(e.target.value)} className="bg-secondary/50" />
              </div>
            </div>
          </div>
        );

      case 1: // What to track
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Choose what you'd like to monitor each day. You can always change this later.</p>
            <div className="space-y-2">
              {trackers.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTrackers(trackers.map(tr => tr.id === t.id ? { ...tr, checked: !tr.checked } : tr))}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
                    t.checked
                      ? 'bg-primary/10 border-primary/30 shadow-sm'
                      : 'bg-card border-border hover:border-primary/20'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                    t.checked ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                  }`}>
                    {t.checked && <span className="text-primary-foreground text-xs font-bold">✓</span>}
                  </div>
                  <span className="text-sm font-semibold">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case 2: // Baseline
        return (
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">
              Set {childName || 'your child'}'s typical values on a <strong>normal, good day</strong>. This helps us detect changes.
            </p>
            {activeTrackers.map(t => (
              <div key={t.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold">{t.label}</label>
                  <span className="text-lg font-bold text-primary">{baselines[t.id] ?? 5}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-6">0</span>
                  <Slider
                    value={[baselines[t.id] ?? 5]}
                    max={10}
                    step={1}
                    onValueChange={([v]) => setBaselines({ ...baselines, [t.id]: v })}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground w-6">10</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{t.id === 'pain' || t.id === 'nausea' || t.id === 'headache' || t.id === 'fatigue' ? 'None' : 'Poor'}</span>
                  <span>{t.id === 'pain' || t.id === 'nausea' || t.id === 'headache' || t.id === 'fatigue' ? 'Worst' : 'Great'}</span>
                </div>
              </div>
            ))}
          </div>
        );

      case 3: // Regular medications
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Add {childName || 'your child'}'s regular daily medications. Skip if none right now.
            </p>
            {renderMedList(medications, setMedications)}
          </div>
        );

      case 4: // Daily routine
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Add daily tasks like meals, therapy, school, or anything {childName || 'your child'} does every day.
            </p>
            {renderTaskList(routineTasks, setRoutineTasks)}
          </div>
        );

      case 5: // Flare medications
        return (
          <div className="space-y-4">
            <div className="bg-destructive/10 rounded-xl p-3 text-sm text-destructive font-medium">
              🔥 These are <strong>extra medications</strong> only used during flares or bad days.
            </div>
            <p className="text-sm text-muted-foreground">
              Add any rescue or as-needed medications prescribed for flare-ups.
            </p>
            {renderMedList(flareMeds, setFlareMeds)}
          </div>
        );

      case 6: // Flare routine
        return (
          <div className="space-y-4">
            <div className="bg-destructive/10 rounded-xl p-3 text-sm text-destructive font-medium">
              🔥 These tasks appear only when {childName || 'your child'} is in a <strong>flare</strong>.
            </div>
            <p className="text-sm text-muted-foreground">
              Things like extra rest, school accommodation notes, or modified activities.
            </p>
            {renderTaskList(flareTasks, setFlareTasks)}
          </div>
        );

      case 7: // Done
        return (
          <div className="space-y-6 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Sparkles className="text-primary" size={36} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">You're all set! 🎉</h2>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                {childName ? `${childName}'s` : 'Your'} tracker is ready. You can always update settings later.
              </p>
            </div>
            <div className="bg-card rounded-2xl border p-4 text-left space-y-2">
              <p className="text-sm font-semibold">📊 Summary</p>
              <p className="text-xs text-muted-foreground">Tracking {activeTrackers.length} symptoms</p>
              <p className="text-xs text-muted-foreground">{medications.filter(m => m.name.trim()).length} daily medications</p>
              <p className="text-xs text-muted-foreground">{routineTasks.filter(t => t.name.trim()).length} daily tasks</p>
              <p className="text-xs text-muted-foreground">{flareMeds.filter(m => m.name.trim()).length} flare medications</p>
              <p className="text-xs text-muted-foreground">{flareTasks.filter(t => t.name.trim()).length} flare tasks</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b px-4 py-3.5">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight text-foreground">🩵 MyDay Setup</h1>
          <span className="text-sm text-muted-foreground font-semibold">{step + 1} / {STEPS.length}</span>
        </div>
        {/* Progress bar */}
        <div className="w-full h-1.5 bg-secondary rounded-full mt-2 overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </header>

      {/* Step title */}
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-lg font-bold text-foreground">{STEPS[step].title}</h2>
        <p className="text-sm text-muted-foreground">{STEPS[step].subtitle}</p>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 pb-32">
        {renderStep()}
      </main>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-lg border-t p-4">
        <div className="max-w-lg mx-auto flex gap-3">
          {step > 0 && (
            <Button variant="outline" onClick={back} className="flex-1">
              <ChevronLeft size={16} /> Back
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button onClick={next} className="flex-1">
              Next <ChevronRight size={16} />
            </Button>
          ) : (
            <Button onClick={finish} className="flex-1">
              Let's Go! 🚀
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
