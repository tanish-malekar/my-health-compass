import { useAppState, Mode } from '@/hooks/useAppState';
import { Settings, Share2 } from 'lucide-react';

const modeConfig: Record<Mode, { label: string; emoji: string; class: string; dotClass: string }> = {
  green: { label: 'Feeling Good', emoji: '🌿', class: 'mode-green', dotClass: 'mode-green-dot' },
  yellow: { label: 'Keep Watch', emoji: '🌤️', class: 'mode-yellow', dotClass: 'mode-yellow-dot' },
  red: { label: 'Need Support', emoji: '❤️‍🩹', class: 'mode-red', dotClass: 'mode-red-dot' },
};

export default function TopBar() {
  const { mode } = useAppState();
  const cfg = modeConfig[mode];

  return (
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b px-4 py-3.5 flex items-center justify-between">
      <h1 className="text-lg font-bold tracking-tight text-foreground">🩵 MyDay</h1>
      <div className={`${cfg.class} px-3.5 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2 transition-colors`}>
        <span>{cfg.emoji}</span>
        {cfg.label}
      </div>
      <div className="flex items-center gap-1">
        <button className="p-2 rounded-full hover:bg-secondary transition-colors text-muted-foreground">
          <Share2 size={18} />
        </button>
        <button className="p-2 rounded-full hover:bg-secondary transition-colors text-muted-foreground">
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
}
