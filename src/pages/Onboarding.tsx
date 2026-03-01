import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Plus, X, Heart, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface MetricEntry {
  id: string;
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

const SUGGESTED_METRICS: Omit<MetricEntry, 'id'>[] = [
  { name: 'Sleep Quality', metricType: 'scale', unit: '/10', min: 0, max: 10, baseline: 7, hasBaseline: true, higherIsWorse: false, yesIsGood: true },
  { name: 'Pain Level', metricType: 'scale', unit: '/10', min: 0, max: 10, baseline: 2, hasBaseline: true, higherIsWorse: true, yesIsGood: true },
  { name: 'Energy', metricType: 'scale', unit: '/10', min: 0, max: 10, baseline: 7, hasBaseline: true, higherIsWorse: false, yesIsGood: true },
  { name: 'Food Intake', metricType: 'scale', unit: '/10', min: 0, max: 10, baseline: 7, hasBaseline: true, higherIsWorse: false, yesIsGood: true },
  { name: 'Mood', metricType: 'scale', unit: '/10', min: 0, max: 10, baseline: 7, hasBaseline: true, higherIsWorse: false, yesIsGood: true },
  { name: 'Nausea', metricType: 'boolean', unit: '', min: 0, max: 1, baselineBoolean: false, hasBaseline: true, higherIsWorse: true, yesIsGood: false },
  { name: 'Exercised', metricType: 'boolean', unit: '', min: 0, max: 1, baselineBoolean: true, hasBaseline: true, higherIsWorse: false, yesIsGood: true },
  { name: 'Headache', metricType: 'boolean', unit: '', min: 0, max: 1, baselineBoolean: false, hasBaseline: true, higherIsWorse: true, yesIsGood: false },
];

interface MedEntry { id: string; name: string; dose: string; time: string; }
interface TaskEntry { id: string; name: string; category: string; time: string; }

export default function Onboarding() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [step, setStep] = useState(0);

  const STEPS = [
    { title: `👋 ${t('onboarding.steps.welcome')}`, subtitle: t('onboarding.steps.letsSetUp') },
    { title: `📊 ${t('onboarding.steps.metricsToTrack')}`, subtitle: t('onboarding.steps.addThingsToMonitor') },
    { title: `💊 ${t('onboarding.steps.medications')}`, subtitle: t('onboarding.steps.regularDailyMeds') },
    { title: `📋 ${t('onboarding.steps.dailyRoutine')}`, subtitle: t('onboarding.steps.tasksEveryDay') },
    { title: `🔥 ${t('onboarding.steps.flareMedications')}`, subtitle: t('onboarding.steps.extraMeds') },
    { title: `🛏 ${t('onboarding.steps.flareRoutine')}`, subtitle: t('onboarding.steps.whatChangesDuringFlare') },
    { title: `🎉 ${t('onboarding.steps.allSet')}`, subtitle: t('onboarding.steps.readyToGo') },
  ];

  const ROUTINE_CATEGORIES = [
    { id: 'medications', label: `💊 ${t('categories.medications')}` },
    { id: 'care', label: `🧡 ${t('categories.care')}` },
    { id: 'nutrition', label: `🧃 ${t('categories.nutrition')}` },
    { id: 'school', label: `📚 ${t('categories.school')}` },
    { id: 'admin', label: `📋 ${t('categories.admin')}` },
  ];

  // Step 0: Profile
  const [childName, setChildName] = useState('');
  const [condition, setCondition] = useState('');
  const [caregiverName, setCaregiverName] = useState('');

  // Step 1: Dynamic metrics
  const [metrics, setMetrics] = useState<MetricEntry[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMetric, setNewMetric] = useState<Omit<MetricEntry, 'id'>>({ name: '', metricType: 'scale', unit: '/10', min: 0, max: 10, baseline: 5, baselineBoolean: true, hasBaseline: false, higherIsWorse: false, yesIsGood: true });

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
    // Only include baseline values if hasBaseline is true
    const metricToAdd: MetricEntry = {
      ...newMetric,
      id: Date.now().toString(),
      baseline: newMetric.hasBaseline ? newMetric.baseline : undefined,
      baselineBoolean: newMetric.hasBaseline ? newMetric.baselineBoolean : undefined,
    };
    setMetrics([...metrics, metricToAdd]);
    setNewMetric({ name: '', metricType: 'scale', unit: '/10', min: 0, max: 10, baseline: 5, baselineBoolean: true, hasBaseline: false, higherIsWorse: false, yesIsGood: true });
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
              <span className="text-sm font-semibold text-muted-foreground">{t('onboarding.medications.medication')} {i + 1}</span>
              {list.length > 1 && (
                <button onClick={() => removeMed(list, setList, med.id)} className="text-muted-foreground hover:text-destructive transition-colors"><X size={16} /></button>
              )}
            </div>
            <Input placeholder={t('onboarding.medications.medicationName')} value={med.name} onChange={e => updateMed(list, setList, med.id, 'name', e.target.value)} className="bg-secondary/50" />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder={t('onboarding.medications.dose')} value={med.dose} onChange={e => updateMed(list, setList, med.id, 'dose', e.target.value)} className="bg-secondary/50" />
              <select value={med.time} onChange={e => updateMed(list, setList, med.id, 'time', e.target.value)} className="rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm">
                <option value="Morning">{t('onboarding.medications.morning')}</option>
                <option value="Afternoon">{t('onboarding.medications.afternoon')}</option>
                <option value="Evening">{t('onboarding.medications.evening')}</option>
                <option value="Bedtime">{t('onboarding.medications.bedtime')}</option>
                <option value="As needed">{t('onboarding.medications.asNeeded')}</option>
              </select>
            </div>
          </CardContent>
        </Card>
      ))}
      <Button variant="outline" onClick={() => addMed(list, setList)} className="w-full border-dashed"><Plus size={16} /> {t('onboarding.medications.addMedication')}</Button>
    </div>
  );

  const renderTaskList = (list: TaskEntry[], setList: React.Dispatch<React.SetStateAction<TaskEntry[]>>) => (
    <div className="space-y-3">
      {list.map((task, i) => (
        <Card key={task.id} className="border-border/60">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-muted-foreground">{t('onboarding.tasks.task')} {i + 1}</span>
              {list.length > 1 && (
                <button onClick={() => removeTask(list, setList, task.id)} className="text-muted-foreground hover:text-destructive transition-colors"><X size={16} /></button>
              )}
            </div>
            <Input placeholder={t('onboarding.tasks.taskNamePlaceholder')} value={task.name} onChange={e => updateTask(list, setList, task.id, 'name', e.target.value)} className="bg-secondary/50" />
            <div className="grid grid-cols-2 gap-2">
              <select value={task.category} onChange={e => updateTask(list, setList, task.id, 'category', e.target.value)} className="rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm">
                {ROUTINE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
              <Input placeholder={t('onboarding.tasks.timePlaceholder')} value={task.time} onChange={e => updateTask(list, setList, task.id, 'time', e.target.value)} className="bg-secondary/50" />
            </div>
          </CardContent>
        </Card>
      ))}
      <Button variant="outline" onClick={() => addTask(list, setList)} className="w-full border-dashed"><Plus size={16} /> {t('onboarding.tasks.addTask')}</Button>
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
              <h2 className="text-xl font-bold text-foreground">{t('onboarding.welcome.title')} ☀️</h2>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                {t('onboarding.welcome.description')}
              </p>
            </div>
            <div className="space-y-3 text-left">
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">{t('onboarding.welcome.childName')}</label>
                <Input placeholder={t('onboarding.welcome.childNamePlaceholder')} value={childName} onChange={e => setChildName(e.target.value)} className="bg-secondary/50" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">{t('onboarding.welcome.condition')}</label>
                <Input placeholder={t('onboarding.welcome.conditionPlaceholder')} value={condition} onChange={e => setCondition(e.target.value)} className="bg-secondary/50" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">{t('onboarding.welcome.caregiverName')}</label>
                <Input placeholder={t('onboarding.welcome.caregiverNamePlaceholder')} value={caregiverName} onChange={e => setCaregiverName(e.target.value)} className="bg-secondary/50" />
              </div>
            </div>
          </div>
        );

      case 1: // Dynamic metrics
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('onboarding.metrics.addMetricsDescription')}
            </p>

            {/* Suggested quick-adds */}
            {SUGGESTED_METRICS.filter(s => !metrics.some(m => m.name === s.name)).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">💡 {t('onboarding.metrics.quickAddSuggestions')}</p>
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
                            <span className="text-xs text-muted-foreground ml-2">({t('onboarding.metrics.yesNo')})</span>
                          )}
                        </div>
                        <button onClick={() => removeMetric(m.id)} className="text-muted-foreground hover:text-destructive transition-colors"><X size={16} /></button>
                      </div>
                      <div className="flex items-center gap-1">
                        {m.metricType === 'scale' ? (
                          <span className="text-xs text-muted-foreground px-1">{m.higherIsWorse ? `✓ ${t('onboarding.metrics.higherWorse')}` : `✓ ${t('onboarding.metrics.higherBetter')}`}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground px-1">{m.yesIsGood ? `✓ ${t('onboarding.metrics.yesGood')}` : `✓ ${t('onboarding.metrics.yesBad')}`}</span>
                        )}
                      </div>
                      {m.metricType === 'scale' ? (
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-semibold text-muted-foreground">{t('onboarding.metrics.baselineNormalDay')}</label>
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
                            <label className="text-xs font-semibold text-muted-foreground">{t('onboarding.metrics.baselineNormalDay')}</label>
                            <span className="text-sm font-bold text-primary">{m.baselineBoolean ? t('log.yes') : t('log.no')}</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => updateMetricBaselineBoolean(m.id, true)}
                              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${m.baselineBoolean ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
                            >{t('log.yes')}</button>
                            <button
                              onClick={() => updateMetricBaselineBoolean(m.id, false)}
                              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${!m.baselineBoolean ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
                            >{t('log.no')}</button>
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
                  <p className="text-sm font-semibold">{t('onboarding.metrics.newMetric')}</p>
                  <Input placeholder={t('onboarding.metrics.metricNamePlaceholder')} value={newMetric.name} onChange={e => setNewMetric({ ...newMetric, name: e.target.value })} className="bg-background" />
                  
                  {/* Metric Type Selector */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setNewMetric({ ...newMetric, metricType: 'scale' })}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${newMetric.metricType === 'scale' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
                    >📊 {t('onboarding.metrics.scale')}</button>
                    <button
                      onClick={() => setNewMetric({ ...newMetric, metricType: 'boolean' })}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${newMetric.metricType === 'boolean' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
                    >✓ {t('onboarding.metrics.yesNo')}</button>
                  </div>

                  {newMetric.metricType === 'scale' ? (
                    <>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">{t('onboarding.metrics.unit')}</label>
                          <Input placeholder={t('onboarding.metrics.unitPlaceholder')} value={newMetric.unit} onChange={e => setNewMetric({ ...newMetric, unit: e.target.value })} className="bg-background" />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">{t('onboarding.metrics.min')}</label>
                          <Input type="number" value={newMetric.min} onChange={e => setNewMetric({ ...newMetric, min: Number(e.target.value) })} className="bg-background" />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">{t('onboarding.metrics.max')}</label>
                          <Input type="number" value={newMetric.max} onChange={e => setNewMetric({ ...newMetric, max: Number(e.target.value) })} className="bg-background" />
                        </div>
                      </div>
                      <button
                        onClick={() => setNewMetric({ ...newMetric, higherIsWorse: !newMetric.higherIsWorse })}
                        className={`w-full text-left text-sm p-3 rounded-xl border transition-all ${
                          newMetric.higherIsWorse ? 'bg-destructive/10 border-destructive/30' : 'bg-primary/10 border-primary/30'
                        }`}
                      >
                        {newMetric.higherIsWorse ? `📈 ${t('onboarding.metrics.higherValueWorse')}` : `📈 ${t('onboarding.metrics.higherValueBetter')}`}
                        <span className="text-xs text-muted-foreground block mt-0.5">{t('onboarding.metrics.tapToToggle')}</span>
                      </button>
                      <button
                        onClick={() => setNewMetric({ ...newMetric, hasBaseline: !newMetric.hasBaseline })}
                        className={`w-full text-left text-sm p-3 rounded-xl border transition-all ${
                          newMetric.hasBaseline ? 'bg-primary/10 border-primary/30' : 'bg-secondary border-transparent'
                        }`}
                      >
                        {newMetric.hasBaseline ? `📊 ${t('onboarding.metrics.baselineEnabled')}` : `📊 ${t('onboarding.metrics.addBaselineOptional')}`}
                        <span className="text-xs text-muted-foreground block mt-0.5">{t('onboarding.metrics.tapToToggle')}</span>
                      </button>
                      {newMetric.hasBaseline && (
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-semibold text-muted-foreground">{t('onboarding.metrics.baselineValue')}</label>
                            <span className="text-sm font-bold text-primary">{newMetric.baseline}{newMetric.unit}</span>
                          </div>
                          <Slider value={[newMetric.baseline ?? newMetric.min]} min={newMetric.min} max={newMetric.max} step={1} onValueChange={([v]) => setNewMetric({ ...newMetric, baseline: v })} />
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setNewMetric({ ...newMetric, yesIsGood: !newMetric.yesIsGood })}
                        className={`w-full text-left text-sm p-3 rounded-xl border transition-all ${
                          newMetric.yesIsGood ? 'bg-primary/10 border-primary/30' : 'bg-destructive/10 border-destructive/30'
                        }`}
                      >
                        {newMetric.yesIsGood ? `✓ ${t('onboarding.metrics.yesGood')}` : `✗ ${t('onboarding.metrics.yesBad')}`}
                        <span className="text-xs text-muted-foreground block mt-0.5">{t('onboarding.metrics.tapToToggle')}</span>
                      </button>
                      <button
                        onClick={() => setNewMetric({ ...newMetric, hasBaseline: !newMetric.hasBaseline })}
                        className={`w-full text-left text-sm p-3 rounded-xl border transition-all ${
                          newMetric.hasBaseline ? 'bg-primary/10 border-primary/30' : 'bg-secondary border-transparent'
                        }`}
                      >
                        {newMetric.hasBaseline ? '📊 Baseline enabled' : '📊 Add baseline value (optional)'}
                        <span className="text-xs text-muted-foreground block mt-0.5">Tap to {newMetric.hasBaseline ? 'disable' : 'enable'}</span>
                      </button>
                      {newMetric.hasBaseline && (
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-semibold text-muted-foreground">{t('onboarding.metrics.baselineNormalDay')}</label>
                            <span className="text-sm font-bold text-primary">{newMetric.baselineBoolean ? t('log.yes') : t('log.no')}</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setNewMetric({ ...newMetric, baselineBoolean: true })}
                              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${newMetric.baselineBoolean ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
                            >{t('log.yes')}</button>
                            <button
                              onClick={() => setNewMetric({ ...newMetric, baselineBoolean: false })}
                              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${!newMetric.baselineBoolean ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
                            >{t('log.no')}</button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowAddForm(false)} className="flex-1">{t('onboarding.metrics.cancel')}</Button>
                    <Button onClick={addMetric} className="flex-1" disabled={!newMetric.name.trim()}>{t('onboarding.metrics.addMetric')}</Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Button variant="outline" onClick={() => setShowAddForm(true)} className="w-full border-dashed">
                <Plus size={16} /> {t('onboarding.metrics.addCustomMetric')}
              </Button>
            )}

            {metrics.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">
                {t('onboarding.metrics.addAtLeastOne')} ☝️
              </p>
            )}
          </div>
        );

      case 2: // Regular medications
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{t('onboarding.medications.addRegularMeds', { name: childName || t('common.yourChild') })}</p>
            {renderMedList(medications, setMedications)}
          </div>
        );

      case 3: // Daily routine
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{t('onboarding.tasks.addDailyTasks', { name: childName || t('common.yourChild') })}</p>
            {renderTaskList(routineTasks, setRoutineTasks)}
          </div>
        );

      case 4: // Flare medications
        return (
          <div className="space-y-4">
            <div className="bg-destructive/10 rounded-xl p-3 text-sm text-destructive font-medium">
              🔥 {t('onboarding.flareMeds.extraMedsNotice')}
            </div>
            <p className="text-sm text-muted-foreground">{t('onboarding.flareMeds.addRescueMeds')}</p>
            {renderMedList(flareMeds, setFlareMeds)}
          </div>
        );

      case 5: // Flare routine
        return (
          <div className="space-y-4">
            <div className="bg-destructive/10 rounded-xl p-3 text-sm text-destructive font-medium">
              🔥 {t('onboarding.flareRoutine.flareTasksNotice', { name: childName || t('common.yourChild') })}
            </div>
            <p className="text-sm text-muted-foreground">{t('onboarding.flareRoutine.modifiedActivities')}</p>
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
              <h2 className="text-xl font-bold text-foreground">{t('onboarding.complete.title')} 🎉</h2>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                {t('onboarding.complete.trackerReady', { name: childName || t('common.yourChild') })}
              </p>
            </div>
            <div className="bg-card rounded-2xl border p-4 text-left space-y-2">
              <p className="text-sm font-semibold">📊 {t('onboarding.complete.summary')}</p>
              <p className="text-xs text-muted-foreground">{t('onboarding.complete.trackingMetrics', { count: metrics.length })}</p>
              {metrics.map(m => (
                <p key={m.id} className="text-xs text-muted-foreground">• {m.name} — {t('log.baseline')} {m.baseline}{m.unit}</p>
              ))}
              <p className="text-xs text-muted-foreground mt-1">{t('onboarding.complete.dailyMedications', { count: medications.filter(m => m.name.trim()).length })}</p>
              <p className="text-xs text-muted-foreground">{t('onboarding.complete.dailyTasks', { count: routineTasks.filter(t => t.name.trim()).length })}</p>
              <p className="text-xs text-muted-foreground">{t('onboarding.complete.flareMedications', { count: flareMeds.filter(m => m.name.trim()).length })}</p>
              <p className="text-xs text-muted-foreground">{t('onboarding.complete.flareTasks', { count: flareTasks.filter(t => t.name.trim()).length })}</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto bg-background">
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b px-4 py-3.5">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight text-foreground">☀️ {t('onboarding.navigation.setup')}</h1>
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
            <Button variant="outline" onClick={back} className="flex-1"><ChevronLeft size={16} /> {t('onboarding.navigation.back')}</Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button onClick={next} className="flex-1">{t('onboarding.navigation.next')} <ChevronRight size={16} /></Button>
          ) : (
            <Button onClick={finish} className="flex-1">{t('onboarding.navigation.letsGo')} 🚀</Button>
          )}
        </div>
      </div>
    </div>
  );
}
