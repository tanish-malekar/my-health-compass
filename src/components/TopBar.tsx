import { useAppState, Mode } from '@/hooks/useAppState';
import { Settings, Share2, Globe } from 'lucide-react';
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

export default function TopBar() {
  const { mode } = useAppState();
  const { t, i18n } = useTranslation();

  const modeConfig: Record<Mode, { label: string; emoji: string; class: string }> = {
    normal: { label: t('modes.normal'), emoji: '🌿', class: 'bg-primary/10 text-primary' },
    flare: { label: t('modes.flare'), emoji: '🔥', class: 'bg-destructive/10 text-destructive' },
  };

  const cfg = modeConfig[mode];
  const currentLanguage = languages.find(l => l.code === i18n.language) || languages[0];

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
  };

  return (
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b px-4 py-3.5 flex items-center justify-between">
      <h1 className="text-lg font-bold tracking-tight text-foreground">🩵 Helios</h1>
      <div className={`${cfg.class} px-3.5 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2 transition-colors`}>
        <span>{cfg.emoji}</span>
        {cfg.label}
      </div>
      <div className="flex items-center gap-1">
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
