import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Plus, X, Heart, Sparkles, Loader2 } from 'lucide-react';

const STEPS = [
  { title: '👋 Welcome', subtitle: "Let's set up your daily tracker" },
  { title: '💊 Medications', subtitle: 'Your regular daily medications' },
  { title: '📋 Daily Routine', subtitle: 'Tasks you do every day' },
  { title: '🔥 Flare Medications', subtitle: 'Extra meds when things get tough' },
  { title: '🎉 All Set!', subtitle: "You're ready to go" },
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
  const [userId, setUserId] = useState<string | null>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

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
        await fetch('http://localhost:8001/generate-questions', {
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
              <h2 className="text-xl font-bold text-foreground">Welcome to Helios 🩵</h2>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                We'll help you track daily health, manage routines, and catch flares early. Let's set things up in just a few steps!
              </p>
            </div>
            <div className="space-y-3 text-left">
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Patients's Name</label>
                <Input placeholder="e.g. Emma" value={childName} onChange={e => setChildName(e.target.value)} className="bg-secondary/50" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Condition / Disease</label>
                <Input placeholder="e.g. JIA, Crohn's, Lupus" value={condition} onChange={e => setCondition(e.target.value)} className="bg-secondary/50" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Caregiver</label>
                <Input placeholder="e.g. Sarah" value={caregiverName} onChange={e => setCaregiverName(e.target.value)} className="bg-secondary/50" />
              </div>
            </div>
          </div>
        );

      case 1: // Regular medications
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Add {childName || 'your child'}'s regular daily medications. Skip if none right now.</p>
            {renderMedList(medications, setMedications)}
          </div>
        );

      case 2: // Daily routine
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Add daily tasks like meals, therapy, school, or anything {childName || 'your child'} does every day.</p>
            {renderTaskList(routineTasks, setRoutineTasks)}
          </div>
        );

      case 3: // Flare medications
        return (
          <div className="space-y-4">
            <div className="bg-destructive/10 rounded-xl p-3 text-sm text-destructive font-medium">
              🔥 These are <strong>extra medications</strong> only used during flares or bad days.
            </div>
            <p className="text-sm text-muted-foreground">Add any rescue or as-needed medications prescribed for flare-ups.</p>
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
              <h2 className="text-xl font-bold text-foreground">You're all set! 🎉</h2>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                {childName ? `${childName}'s` : 'Your'} tracker is ready. You can always update settings later.
              </p>
            </div>
            <div className="bg-card rounded-2xl border p-4 text-left space-y-2">
              <p className="text-sm font-semibold">📊 Summary</p>
              <p className="text-xs text-muted-foreground">Condition: {condition}</p>
              <p className="text-xs text-muted-foreground">{medications.filter(m => m.name.trim()).length} daily medications</p>
              <p className="text-xs text-muted-foreground">{routineTasks.filter(t => t.name.trim()).length} daily tasks</p>
              <p className="text-xs text-muted-foreground">{flareMeds.filter(m => m.name.trim()).length} flare medications</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto bg-background">
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b px-4 py-3.5">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight text-foreground">🩵 Helios Setup</h1>
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
            <Button variant="outline" onClick={back} className="flex-1" disabled={isCreatingUser}><ChevronLeft size={16} /> Back</Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button onClick={next} className="flex-1" disabled={isCreatingUser}>
              {isCreatingUser ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Setting up...
                </>
              ) : (
                <>
                  Next <ChevronRight size={16} />
                </>
              )}
            </Button>
          ) : (
            <Button onClick={finish} className="flex-1">Let's Go! 🚀</Button>
          )}
        </div>
      </div>
    </div>
  );
}
