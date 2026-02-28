import { useAppState, Mode } from '@/hooks/useAppState';
import { Settings, Share2 } from 'lucide-react';

const modeConfig: Record<Mode, { label: string; emoji: string; class: string; dotClass: string }> = {
  green: { label: 'Normal', emoji: '🟢', class: 'mode-green', dotClass: 'mode-green-dot' },
  yellow: { label: 'Watch', emoji: '🟡', class: 'mode-yellow', dotClass: 'mode-yellow-dot' },
  red: { label: 'Flare', emoji: '🔴', class: 'mode-red', dotClass: 'mode-red-dot' },
};

export default function TopBar() {
  const { mode } = useAppState();
  const cfg = modeConfig[mode];

  return (
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b px-4 py-3 flex items-center justify-between">
      <h1 className="text-lg font-semibold tracking-tight text-foreground">SymptomTrack</h1>
      <div className={`${cfg.class} px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5 transition-colors`}>
        <span className={`w-2 h-2 rounded-full ${cfg.dotClass}`} />
        {cfg.label}
      </div>
      <div className="flex items-center gap-2">
        <button className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
          <Share2 size={18} />
        </button>
        <button className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
}
