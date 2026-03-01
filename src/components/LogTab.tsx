import { useState, useEffect } from 'react';
import { useAppState, MetricValue } from '@/hooks/useAppState';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle2, ArrowRight, Heart, Pill } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { useTranslation } from 'react-i18next';

type Screen = 'idle' | 'checkin' | 'result';

export default function LogTab() {
  const { addLog, lastLogTime, mode, setActiveTab, userData } = useAppState();
  const { t } = useTranslation();
  const [screen, setScreen] = useState<Screen>('idle');
  const [metricValues, setMetricValues] = useState<Record<string, number | boolean>>({});
  const [medicationValues, setMedicationValues] = useState<Record<string, boolean>>({});
  const [note, setNote] = useState('');

  const childName = userData?.childName || t('common.yourChild');
  const userMetrics = userData?.metrics || [];
  const userMedications = userData?.medications || [];

  // Helper to get default value for a metric
  const getDefaultValue = (metric: typeof userMetrics[0]): number | boolean => {
    if (metric.type === 'boolean') {
      return metric.hasBaseline && metric.baselineBoolean !== undefined ? metric.baselineBoolean : false;
    } else {
      return metric.hasBaseline && metric.baseline !== undefined ? metric.baseline : Math.floor((metric.min + metric.max) / 2);
    }
  };

  // Initialize metric values when userData loads
  useEffect(() => {
    if (userMetrics.length > 0) {
      const initialValues: Record<string, number | boolean> = {};
      userMetrics.forEach(metric => {
        initialValues[metric.name] = getDefaultValue(metric);
      });
      setMetricValues(initialValues);
    }
    if (userMedications.length > 0) {
      const initialMedValues: Record<string, boolean> = {};
      userMedications.forEach(med => {
        initialMedValues[med.name] = false;
      });
      setMedicationValues(initialMedValues);
    }
  }, [userMetrics, userMedications]);

  const handleSave = async () => {
    const metrics: MetricValue[] = userMetrics.map(metric => ({
      name: metric.name,
      value: metricValues[metric.name] ?? getDefaultValue(metric),
      type: metric.type,
    }));

    // Add medication entries to metrics
    userMedications.forEach(med => {
      metrics.push({
        name: med.name,
        value: medicationValues[med.name] ?? false,
        type: 'boolean',
      });
    });

    await addLog(metrics, note || undefined);
    setScreen('result');
  };

  const resetAndNew = () => {
    const initialValues: Record<string, number | boolean> = {};
    userMetrics.forEach(metric => {
      initialValues[metric.name] = getDefaultValue(metric);
    });
    setMetricValues(initialValues);
    const initialMedValues: Record<string, boolean> = {};
    userMedications.forEach(med => {
      initialMedValues[med.name] = false;
    });
    setMedicationValues(initialMedValues);
    setNote('');
    setScreen('idle');
  };

  const updateMetricValue = (name: string, value: number | boolean) => {
    setMetricValues(prev => ({ ...prev, [name]: value }));
  };

  const updateMedicationValue = (name: string, value: boolean) => {
    setMedicationValues(prev => ({ ...prev, [name]: value }));
  };

  if (screen === 'idle') {
    return (
      <div className="animate-slide-up flex flex-col items-center justify-center py-16 space-y-6">
        <div className="w-24 h-24 rounded-full bg-accent flex items-center justify-center">
          <Heart size={40} className="text-primary" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-xl font-bold">{t('log.readyForCheckIn')} 💛</p>
          <p className="text-sm text-muted-foreground">
            {lastLogTime
              ? t('log.lastOneWas', { time: formatDistanceToNow(lastLogTime, { addSuffix: true }) })
              : t('log.firstCheckIn')}
          </p>
          {mode === 'normal' && <p className="text-sm text-primary font-medium">{t('log.lookingStable')} 🌿</p>}
          {mode === 'flare' && <p className="text-sm text-destructive font-medium">{t('log.trackingFlare')} 🔥</p>}
        </div>
        {userMetrics.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center px-8">
            {t('log.noMetricsSetUp')}
          </p>
        ) : (
          <button
            onClick={() => setScreen('checkin')}
            className="bg-primary text-primary-foreground rounded-2xl px-10 py-3.5 font-bold text-base hover:opacity-90 transition-opacity shadow-sm"
          >
            📝 {t('log.letsGo')}
          </button>
        )}
      </div>
    );
  }

  if (screen === 'checkin') {
    return (
      <div className="animate-slide-up space-y-5 pb-4">
        <div className="bg-card rounded-2xl border p-5 shadow-sm">
          <h2 className="text-base font-bold mb-1">{t('log.quickCheckIn')} 💬</h2>
          <p className="text-xs text-muted-foreground mb-5">
            {t('log.metricsToTrack', { count: userMetrics.length, seconds: Math.max(20, userMetrics.length * 5) })}
          </p>
          <div className="space-y-6">
            {userMetrics.map((metric) => (
              <div key={metric.name}>
                {metric.type === 'scale' ? (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">{metric.name}</span>
                      <span className="text-sm font-bold text-primary bg-accent rounded-full w-8 h-8 flex items-center justify-center">
                        {metricValues[metric.name] ?? getDefaultValue(metric)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{metric.min}</span>
                      <Slider
                        value={[Number(metricValues[metric.name] ?? getDefaultValue(metric))]}
                        onValueChange={([v]) => updateMetricValue(metric.name, v)}
                        max={metric.max}
                        min={metric.min}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-xs text-muted-foreground">{metric.max}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">{metric.name}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateMetricValue(metric.name, true)}
                        className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                          metricValues[metric.name] === true 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                        }`}
                      >
                        {t('log.yes')}
                      </button>
                      <button
                        onClick={() => updateMetricValue(metric.name, false)}
                        className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                          metricValues[metric.name] === false 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                        }`}
                      >
                        {t('log.no')}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {userMedications.length > 0 && (
          <div className="bg-card rounded-2xl border p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Pill size={18} className="text-primary" />
              <h2 className="text-base font-bold">Medications 💊</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Did you take these today?</p>
            <div className="space-y-4">
              {userMedications.map((med) => (
                <div key={med.name}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-sm font-semibold">{med.name}</span>
                      {med.dose && <span className="text-xs text-muted-foreground ml-2">({med.dose})</span>}
                    </div>
                    {med.time && <span className="text-xs text-muted-foreground">{med.time}</span>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateMedicationValue(med.name, true)}
                      className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                        medicationValues[med.name] === true 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                      }`}
                    >
                      ✓ Yes
                    </button>
                    <button
                      onClick={() => updateMedicationValue(med.name, false)}
                      className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                        medicationValues[med.name] === false 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                      }`}
                    >
                      ✗ No
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-card rounded-2xl border p-5 shadow-sm">
          <label className="text-sm font-bold block mb-2">{t('log.anythingElse')} 💭</label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder={t('log.howAreYouFeeling')}
            className="w-full bg-secondary/50 rounded-xl p-3 text-sm resize-none h-20 border-0 focus:ring-2 focus:ring-primary/20 outline-none"
          />
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-primary text-primary-foreground rounded-2xl py-3.5 font-bold text-base hover:opacity-90 transition-opacity shadow-sm"
        >
          ✅ {t('log.saveCheckIn')}
        </button>
      </div>
    );
  }

  // Result screen
  return (
    <div className="animate-slide-up flex flex-col items-center py-16 space-y-6">
      <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
        <CheckCircle2 size={40} className="text-primary" />
      </div>
      <div className="text-center space-y-2">
        <p className="text-xl font-bold text-primary">{t('log.checkInSaved')} 🌟</p>
        <p className="text-sm text-muted-foreground">
          {t('log.greatJob', { name: childName })}
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => { setActiveTab('routine'); resetAndNew(); }}
          className="bg-secondary text-foreground px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-1.5"
        >
          {t('log.goToMyDay')} <ArrowRight size={14} />
        </button>
        <button
          onClick={resetAndNew}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium px-4 py-2.5"
        >
          {t('log.done')} 👋
        </button>
      </div>
    </div>
  );
}
