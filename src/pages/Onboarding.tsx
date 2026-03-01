import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Plus, X, Heart, Sparkles } from 'lucide-react';

const STEPS = [
  { title: '👋 Welcome', subtitle: "Let's set up your daily tracker" },
  { title: '📊 Metrics to Track', subtitle: 'Add the things you want to monitor daily' },
  { title: '💊 Medications', subtitle: 'Your regular daily medications' },
  { title: '📋 Daily Routine', subtitle: 'Tasks you do every day' },
  { title: '🔥 Flare Medications', subtitle: 'Extra meds when things get tough' },
  { title: '🛌 Flare Routine', subtitle: 'What changes during a flare?' },
  { title: '🎉 All Set!', subtitle: "You're ready to go" },
];

interface MetricEntry {
  id: string;
  name: string;
  metricType: 'scale' | 'boolean';
  unit: string;
  min: number;
  max: number;
  baseline: number;
  baselineBoolean: boolean;
  higherIsWorse: boolean;
  yesIsGood: boolean;
}

const SUGGESTED_METRICS: Omit<MetricEntry, 'id'>[] = [
  { name: 'Sleep Quality', metricType: 'scale', unit: '/10', min: 0, max: 10, baseline: 7, baselineBoolean: true, higherIsWorse: false, yesIsGood: true },
  { name: 'Pain Level', metricType: 'scale', unit: '/10', min: 0, max: 10, baseline: 2, baselineBoolean: true, higherIsWorse: true, yesIsGood: true },
  { name: 'Energy', metricType: 'scale', unit: '/10', min: 0, max: 10, baseline: 7, baselineBoolean: true, higherIsWorse: false, yesIsGood: true },
  { name: 'Food Intake', metricType: 'scale', unit: '/10', min: 0, max: 10, baseline: 7, baselineBoolean: true, higherIsWorse: false, yesIsGood: true },
  { name: 'Mood', metricType: 'scale', unit: '/10', min: 0, max: 10, baseline: 7, baselineBoolean: true, higherIsWorse: false, yesIsGood: true },
  { name: 'Nausea', metricType: 'boolean', unit: '', min: 0, max: 1, baseline: 0, baselineBoolean: false, higherIsWorse: true, yesIsGood: false },
  { name: 'Exercised', metricType: 'boolean', unit: '', min: 0, max: 1, baseline: 1, baselineBoolean: true, higherIsWorse: false, yesIsGood: true },
  { name: 'Headache', metricType: 'boolean', unit: '', min: 0, max: 1, baseline: 0, baselineBoolean: false, higherIsWorse: true, yesIsGood: false },
];

const ROUTINE_CATEGORIES = [
  { id: 'medications', label: '💊 Medications' },
  { id: 'care', label: '🧡 Care & Therapy' },
  { id: 'nutrition', label: '🥤 Food & Hydration' },
  { id: 'school', label: '📚 School & Work' },
  { id: 'admin', label: '📋 Admin' },
];

interface MedEntry { id: string; name: string; dose: string; time: string; }
interface TaskEntry { id: string; name: string; category: string; time: string; }

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  // Step 0: Profile
  const [childName, setChildName] = useState('');
  const [condition, setCondition] = useState('');
  const [caregiverName, setCaregiverName] = useState('');

  // Step 1: Dynamic metrics
  const [metrics, setMetrics] = useState<MetricEntry[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMetric, setNewMetric] = useState<Omit<MetricEntry, 'id'>>({ name: '', metricType: 'scale', unit: '/10', min: 0, max: 10, baseline: 5, baselineBoolean: true, higherIsWorse: false, yesIsGood: true });

  // Step 2: Medications
  const [medications, setMedications] = useState<MedEntry[]>([{ id: '1', name: '', dose: '', time: 'Morning' }]);

  // Step 3: Daily routine
  const [routineTasks, setRoutineTasks] = useState<TaskEntry[]>([{ id: '1', name: '', category: 'care', time: '' }]);

  // Step 4: Flare medications
  const [flareMeds, setFlareMeds] = useState<MedEntry[]>([{ id: '1', name: '', dose: '', time: 'As needed' }]);

  // Step 5: Flare routine
  const [flareTasks, setFlareTasks] = useState<TaskEntry[]>([{ id: '1', name: '', category: 'care', time: '' }]);

  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep(s => Math.max(s - 1, 0));

  const finish = async () => {
    const onboardingData = {
      childName, condition, caregiverName,
      metrics,
      medications: medications.filter(m => m.name.trim()),
      routineTasks: routineTasks.filter(t => t.name.trim()),
      flareMeds: flareMeds.filter(m => m.name.trim()),
      flareTasks: flareTasks.filter(t => t.name.trim()),
      completed: true,
    };

    try {
      console.log('Saving onboarding data...', onboardingData);
      const response = await fetch('http://localhost:3001/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(onboardingData),
      });

      if (!response.ok) {
        throw new Error('Failed to save data');
      }

      const savedUser = await response.json();
      localStorage.setItem('onboarding', JSON.stringify(onboardingData));
      localStorage.setItem('userId', savedUser._id);
      navigate('/');
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      // Fallback to localStorage only if API fails
      localStorage.setItem('onboarding', JSON.stringify(onboardingData));
      navigate('/');
    }
  };

  const addMetric = () => {
    if (!newMetric.name.trim()) return;
    setMetrics([...metrics, { ...newMetric, id: Date.now().toString() }]);
    setNewMetric({ name: '', metricType: 'scale', unit: '/10', min: 0, max: 10, baseline: 5, baselineBoolean: true, higherIsWorse: false, yesIsGood: true });
    setShowAddForm(false);
  };

  const addSuggested = (s: Omit<MetricEntry, 'id'>) => {
    if (metrics.some(m => m.name === s.name)) return;
    setMetrics([...metrics, { ...s, id: Date.now().toString() }]);
  };

  const removeMetric = (id: string) => setMetrics(metrics.filter(m => m.id !== id));

  const updateMetricBaseline = (id: string, baseline: number) => {
    setMetrics(metrics.map(m => m.id === id ? { ...m, baseline } : m));
  };

  const updateMetricBaselineBoolean = (id: string, baselineBoolean: boolean) => {
    setMetrics(metrics.map(m => m.id === id ? { ...m, baselineBoolean } : m));
  };

  // Shared helpers for med/task lists
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
                <button onClick={() => removeMed(list, setList, med.id)} className="text-muted-foreground hover:text-destructive transition-colors"><X size={16} /></button>
              )}
            </div>
            <Input placeholder="Medication name" value={med.name} onChange={e => updateMed(list, setList, med.id, 'name', e.target.value)} className="bg-secondary/50" />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Dose (e.g. 5mg)" value={med.dose} onChange={e => updateMed(list, setList, med.id, 'dose', e.target.value)} className="bg-secondary/50" />
              <select value={med.time} onChange={e => updateMed(list, setList, med.id, 'time', e.target.value)} className="rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm">
                <option>Morning</option><option>Afternoon</option><option>Evening</option><option>Bedtime</option><option>As needed</option>
              </select>
            </div>
          </CardContent>
        </Card>
      ))}
      <Button variant="outline" onClick={() => addMed(list, setList)} className="w-full border-dashed"><Plus size={16} /> Add Medication</Button>
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
                <button onClick={() => removeTask(list, setList, task.id)} className="text-muted-foreground hover:text-destructive transition-colors"><X size={16} /></button>
              )}
            </div>
            <Input placeholder="Task name (e.g. Physical therapy)" value={task.name} onChange={e => updateTask(list, setList, task.id, 'name', e.target.value)} className="bg-secondary/50" />
            <div className="grid grid-cols-2 gap-2">
              <select value={task.category} onChange={e => updateTask(list, setList, task.id, 'category', e.target.value)} className="rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm">
                {ROUTINE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
              <Input placeholder="Time (e.g. 8 AM)" value={task.time} onChange={e => updateTask(list, setList, task.id, 'time', e.target.value)} className="bg-secondary/50" />
            </div>
          </CardContent>
        </Card>
      ))}
      <Button variant="outline" onClick={() => addTask(list, setList)} className="w-full border-dashed"><Plus size={16} /> Add Task</Button>
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

      case 1: // Dynamic metrics
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Add metrics you want to track daily. Choose scale (0-10) or yes/no metrics.
            </p>

            {/* Suggested quick-adds */}
            {SUGGESTED_METRICS.filter(s => !metrics.some(m => m.name === s.name)).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">💡 Quick add suggestions</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_METRICS.filter(s => !metrics.some(m => m.name === s.name)).map(s => (
                    <button
                      key={s.name}
                      onClick={() => addSuggested(s)}
                      className={`text-xs font-semibold border rounded-full px-3 py-1.5 hover:opacity-80 transition-colors ${
                        s.metricType === 'boolean' 
                          ? 'bg-secondary/50 text-foreground border-border' 
                          : 'bg-primary/10 text-primary border-primary/20'
                      }`}
                    >
                      + {s.name} {s.metricType === 'boolean' ? '(Y/N)' : ''}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Added metrics with baseline sliders */}
            {metrics.length > 0 && (
              <div className="space-y-3">
                {metrics.map(m => (
                  <Card key={m.id} className="border-border/60">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-bold">{m.name}</span>
                          {m.metricType === 'scale' ? (
                            <span className="text-xs text-muted-foreground ml-2">({m.min}–{m.max} {m.unit})</span>
                          ) : (
                            <span className="text-xs text-muted-foreground ml-2">(Yes/No)</span>
                          )}
                        </div>
                        <button onClick={() => removeMetric(m.id)} className="text-muted-foreground hover:text-destructive transition-colors"><X size={16} /></button>
                      </div>
                      <div className="flex items-center gap-1">
                        {m.metricType === 'scale' ? (
                          <span className="text-xs text-muted-foreground px-1">{m.higherIsWorse ? '✓ Higher = worse' : '✓ Higher = better'}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground px-1">{m.yesIsGood ? '✓ Yes = good' : '✓ Yes = bad'}</span>
                        )}
                      </div>
                      {m.metricType === 'scale' ? (
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-semibold text-muted-foreground">Baseline (normal day)</label>
                            <span className="text-sm font-bold text-primary">{m.baseline}{m.unit}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground w-6">{m.min}</span>
                            <Slider value={[m.baseline]} min={m.min} max={m.max} step={1} onValueChange={([v]) => updateMetricBaseline(m.id, v)} className="flex-1" />
                            <span className="text-xs text-muted-foreground w-6">{m.max}</span>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-semibold text-muted-foreground">Baseline (normal day)</label>
                            <span className="text-sm font-bold text-primary">{m.baselineBoolean ? 'Yes' : 'No'}</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => updateMetricBaselineBoolean(m.id, true)}
                              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${m.baselineBoolean ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
                            >Yes</button>
                            <button
                              onClick={() => updateMetricBaselineBoolean(m.id, false)}
                              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${!m.baselineBoolean ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
                            >No</button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Add custom metric form */}
            {showAddForm ? (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-4 space-y-3">
                  <p className="text-sm font-semibold">New Metric</p>
                  <Input placeholder="Metric name (e.g. Stiffness, Nausea, Steps)" value={newMetric.name} onChange={e => setNewMetric({ ...newMetric, name: e.target.value })} className="bg-background" />
                  
                  {/* Metric Type Selector */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setNewMetric({ ...newMetric, metricType: 'scale' })}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${newMetric.metricType === 'scale' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
                    >📊 Scale (0-10)</button>
                    <button
                      onClick={() => setNewMetric({ ...newMetric, metricType: 'boolean' })}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${newMetric.metricType === 'boolean' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
                    >✓ Yes/No</button>
                  </div>

                  {newMetric.metricType === 'scale' ? (
                    <>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Unit</label>
                          <Input placeholder="/10, hrs, cups" value={newMetric.unit} onChange={e => setNewMetric({ ...newMetric, unit: e.target.value })} className="bg-background" />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Min</label>
                          <Input type="number" value={newMetric.min} onChange={e => setNewMetric({ ...newMetric, min: Number(e.target.value) })} className="bg-background" />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Max</label>
                          <Input type="number" value={newMetric.max} onChange={e => setNewMetric({ ...newMetric, max: Number(e.target.value) })} className="bg-background" />
                        </div>
                      </div>
                      <button
                        onClick={() => setNewMetric({ ...newMetric, higherIsWorse: !newMetric.higherIsWorse })}
                        className={`w-full text-left text-sm p-3 rounded-xl border transition-all ${
                          newMetric.higherIsWorse ? 'bg-destructive/10 border-destructive/30' : 'bg-primary/10 border-primary/30'
                        }`}
                      >
                        {newMetric.higherIsWorse ? '📈 Higher value = worse (e.g. Pain)' : '📈 Higher value = better (e.g. Energy)'}
                        <span className="text-xs text-muted-foreground block mt-0.5">Tap to toggle</span>
                      </button>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-semibold text-muted-foreground">Baseline value</label>
                          <span className="text-sm font-bold text-primary">{newMetric.baseline}{newMetric.unit}</span>
                        </div>
                        <Slider value={[newMetric.baseline]} min={newMetric.min} max={newMetric.max} step={1} onValueChange={([v]) => setNewMetric({ ...newMetric, baseline: v })} />
                      </div>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setNewMetric({ ...newMetric, yesIsGood: !newMetric.yesIsGood })}
                        className={`w-full text-left text-sm p-3 rounded-xl border transition-all ${
                          newMetric.yesIsGood ? 'bg-primary/10 border-primary/30' : 'bg-destructive/10 border-destructive/30'
                        }`}
                      >
                        {newMetric.yesIsGood ? '✓ Yes = good (e.g. Exercised)' : '✗ Yes = bad (e.g. Had headache)'}
                        <span className="text-xs text-muted-foreground block mt-0.5">Tap to toggle</span>
                      </button>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-xs font-semibold text-muted-foreground">Baseline (normal day)</label>
                          <span className="text-sm font-bold text-primary">{newMetric.baselineBoolean ? 'Yes' : 'No'}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setNewMetric({ ...newMetric, baselineBoolean: true })}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${newMetric.baselineBoolean ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
                          >Yes</button>
                          <button
                            onClick={() => setNewMetric({ ...newMetric, baselineBoolean: false })}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${!newMetric.baselineBoolean ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
                          >No</button>
                        </div>
                      </div>
                    </>
                  )}
                  
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowAddForm(false)} className="flex-1">Cancel</Button>
                    <Button onClick={addMetric} className="flex-1" disabled={!newMetric.name.trim()}>Add Metric</Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Button variant="outline" onClick={() => setShowAddForm(true)} className="w-full border-dashed">
                <Plus size={16} /> Add Custom Metric
              </Button>
            )}

            {metrics.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">
                Add at least one metric to track daily ☝️
              </p>
            )}
          </div>
        );

      case 2: // Regular medications
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Add {childName || 'your child'}'s regular daily medications. Skip if none right now.</p>
            {renderMedList(medications, setMedications)}
          </div>
        );

      case 3: // Daily routine
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Add daily tasks like meals, therapy, school, or anything {childName || 'your child'} does every day.</p>
            {renderTaskList(routineTasks, setRoutineTasks)}
          </div>
        );

      case 4: // Flare medications
        return (
          <div className="space-y-4">
            <div className="bg-destructive/10 rounded-xl p-3 text-sm text-destructive font-medium">
              🔥 These are <strong>extra medications</strong> only used during flares or bad days.
            </div>
            <p className="text-sm text-muted-foreground">Add any rescue or as-needed medications prescribed for flare-ups.</p>
            {renderMedList(flareMeds, setFlareMeds)}
          </div>
        );

      case 5: // Flare routine
        return (
          <div className="space-y-4">
            <div className="bg-destructive/10 rounded-xl p-3 text-sm text-destructive font-medium">
              🔥 These tasks appear only when {childName || 'your child'} is in a <strong>flare</strong>.
            </div>
            <p className="text-sm text-muted-foreground">Things like extra rest, school accommodation notes, or modified activities.</p>
            {renderTaskList(flareTasks, setFlareTasks)}
          </div>
        );

      case 6: // Done
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
              <p className="text-xs text-muted-foreground">Tracking {metrics.length} metrics</p>
              {metrics.map(m => (
                <p key={m.id} className="text-xs text-muted-foreground">• {m.name} — baseline {m.baseline}{m.unit}</p>
              ))}
              <p className="text-xs text-muted-foreground mt-1">{medications.filter(m => m.name.trim()).length} daily medications</p>
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
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b px-4 py-3.5">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight text-foreground">🩵 MyDay Setup</h1>
          <span className="text-sm text-muted-foreground font-semibold">{step + 1} / {STEPS.length}</span>
        </div>
        <div className="w-full h-1.5 bg-secondary rounded-full mt-2 overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
      </header>

      <div className="px-4 pt-4 pb-2">
        <h2 className="text-lg font-bold text-foreground">{STEPS[step].title}</h2>
        <p className="text-sm text-muted-foreground">{STEPS[step].subtitle}</p>
      </div>

      <main className="flex-1 overflow-y-auto px-4 pb-32">
        {renderStep()}
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-lg border-t p-4">
        <div className="max-w-lg mx-auto flex gap-3">
          {step > 0 && (
            <Button variant="outline" onClick={back} className="flex-1"><ChevronLeft size={16} /> Back</Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button onClick={next} className="flex-1">Next <ChevronRight size={16} /></Button>
          ) : (
            <Button onClick={finish} className="flex-1">Let's Go! 🚀</Button>
          )}
        </div>
      </div>
    </div>
  );
}
