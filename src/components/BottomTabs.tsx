import { useAppState } from '@/hooks/useAppState';
import { Home, ClipboardList, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function BottomTabs() {
  const { activeTab, setActiveTab } = useAppState();
  const { t } = useTranslation();

  const tabs = [
    { id: 'routine', label: t('tabs.myDay'), icon: Home },
    { id: 'log', label: t('tabs.checkIn'), icon: ClipboardList },
    { id: 'summary', label: t('tabs.progress'), icon: BarChart3 },
  ];

  return (
    <nav className="sticky bottom-0 z-50 bg-card/90 backdrop-blur-lg border-t">
      <div className="flex items-center justify-around py-2.5">
        {tabs.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 px-5 py-1.5 rounded-2xl transition-all ${
                active ? 'text-primary bg-accent scale-105' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon size={22} strokeWidth={active ? 2.2 : 1.8} />
              <span className="text-xs font-semibold">{tab.label}</span>
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground text-center pb-2 px-4 leading-tight">
        {t('app.tagline')}
      </p>
    </nav>
  );
}
