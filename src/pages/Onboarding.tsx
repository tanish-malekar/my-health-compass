import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Plus, X, Heart, Sparkles, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
];

interface MedEntry { id: string; name: string; dose: string; time: string; }
interface TaskEntry { id: string; name: string; category: string; time: string; }

export default function Onboarding() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const STEPS = [
    { title: `👋 ${t('onboarding.steps.welcome')}`, subtitle: t('onboarding.steps.letsSetUp') },
    { title: `💊 ${t('onboarding.steps.medications')}`, subtitle: t('onboarding.steps.regularDailyMeds') },
    { title: `📋 ${t('onboarding.steps.dailyRoutine')}`, subtitle: t('onboarding.steps.tasksEveryDay') },
    { title: `🔥 ${t('onboarding.steps.flareMedications')}`, subtitle: t('onboarding.steps.extraMeds') },
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

  // Step 1: Medications
  const [medications, setMedications] = useState<MedEntry[]>([{ id: '1', name: '', dose: '', time: 'Morning' }]);

  // Step 2: Daily routine
  const [routineTasks, setRoutineTasks] = useState<TaskEntry[]>([{ id: '1', name: '', category: 'care', time: '' }]);

  // Step 3: Flare medications
  const [flareMeds, setFlareMeds] = useState<MedEntry[]>([{ id: '1', name: '', dose: '', time: 'As needed' }]);

  const next = async () => {
    // After step 0, create user and call generate-questions API
    if (step === 0 && !userId) {
      if (!childName.trim() || !condition.trim() || !caregiverName.trim()) {
        alert('Please fill in all fields');
        return;
      }
      setIsCreatingUser(true);
      try {
        // Create user first
        const createResponse = await fetch('http://localhost:3001/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            childName,
            condition,
            caregiverName,
            metrics: [],
            medications: [],
            routineTasks: [],
            flareMeds: [],
            completed: false,
          }),
        });
        if (!createResponse.ok) throw new Error('Failed to create user');
        const savedUser = await createResponse.json();
        setUserId(savedUser._id);
        localStorage.setItem('userId', savedUser._id);

        // Call generate-questions API to auto-fill metrics
        fetch('http://localhost:8001/generate-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: savedUser._id,
            disease_name: condition,
          }),
        });

        setIsCreatingUser(false);
        setStep(s => Math.min(s + 1, STEPS.length - 1));
      } catch (error) {
        console.error('Error creating user:', error);
        setIsCreatingUser(false);
        alert('Failed to create user. Please try again.');
      }
    } else {
      setStep(s => Math.min(s + 1, STEPS.length - 1));
    }
  };
  const back = () => setStep(s => Math.max(s - 1, 0));

  const finish = async () => {
    if (!userId) {
      console.error('No user ID found');
      navigate('/');
      return;
    }

    const updateData = {
      medications: medications.filter(m => m.name.trim()),
      routineTasks: routineTasks.filter(t => t.name.trim()),
      flareMeds: flareMeds.filter(m => m.name.trim()),
      completed: true,
    };

    try {
      console.log('Updating user data...', updateData);
      const response = await fetch(`http://localhost:3001/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error('Failed to update data');
      }

      localStorage.setItem('onboarding', JSON.stringify({ ...updateData, childName, condition, caregiverName }));
      navigate('/');
    } catch (error) {
      console.error('Error updating user data:', error);
      navigate('/');
    }
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

      case 1: // Regular medications
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{t('onboarding.medications.addRegularMeds', { name: childName || t('common.yourChild') })}</p>
            {renderMedList(medications, setMedications)}
          </div>
        );

      case 2: // Daily routine
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{t('onboarding.tasks.addDailyTasks', { name: childName || t('common.yourChild') })}</p>
            {renderTaskList(routineTasks, setRoutineTasks)}
          </div>
        );

      case 3: // Flare medications
        return (
          <div className="space-y-4">
            <div className="bg-destructive/10 rounded-xl p-3 text-sm text-destructive font-medium">
              🔥 {t('onboarding.flareMeds.extraMedsNotice')}
            </div>
            <p className="text-sm text-muted-foreground">{t('onboarding.flareMeds.addRescueMeds')}</p>
            {renderMedList(flareMeds, setFlareMeds)}
          </div>
        );

      case 4: // Done
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
              <p className="text-xs text-muted-foreground">{t('onboarding.complete.dailyMedications', { count: medications.filter(m => m.name.trim()).length })}</p>
              <p className="text-xs text-muted-foreground">{t('onboarding.complete.dailyTasks', { count: routineTasks.filter(t => t.name.trim()).length })}</p>
              <p className="text-xs text-muted-foreground">{t('onboarding.complete.flareMedications', { count: flareMeds.filter(m => m.name.trim()).length })}</p>
            </div>
          </div>
        );
    }
  };

  const currentLanguage = languages.find(l => l.code === i18n.language) || languages[0];

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
  };

  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto bg-background">
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b px-4 py-3.5">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight text-foreground">☀️ {t('onboarding.navigation.setup')}</h1>
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 rounded-full hover:bg-secondary transition-colors text-muted-foreground flex items-center gap-1">
                  <Globe size={18} />
                  <span className="text-xs">{currentLanguage.flag}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={i18n.language === lang.code ? 'bg-accent' : ''}
                  >
                    <span className="mr-2">{lang.flag}</span>
                    {lang.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <span className="text-sm text-muted-foreground font-semibold">{step + 1} / {STEPS.length}</span>
          </div>
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
