import { Home, Pause, Play, Settings, Trophy, Volume2, VolumeX } from 'lucide-react';
import type { GameMode } from '../types/game';

interface HeaderProps {
  gameMode?: GameMode | null;
  isPlaying?: boolean;
  isPaused?: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onTogglePause?: () => void;
  onOpenSettings: () => void;
  onOpenHighScores: () => void;
  onGoHome?: () => void;
}

const modeNames: Record<GameMode, string> = {
  blitz: 'Main Kilat',
  meteor: 'Misi Meteor',
  sprint: 'Balap Angka',
  dojo: 'Peta Perkalian',
};

export function Header({ gameMode, isPlaying, isPaused, soundEnabled, onToggleSound, onTogglePause, onOpenSettings, onOpenHighScores, onGoHome }: HeaderProps) {
  return (
    <header className="game-topbar relative z-20">
      <button type="button" onClick={onGoHome} className="game-brand tactile-btn" aria-label="Kembali ke menu utama" title="Kembali ke menu utama">
        <span className="game-brand-mark">×</span>
        <span className="brand-name">Misi Perkalian</span>
        <Home className="w-4 h-4 ml-1 opacity-80" aria-hidden="true" />
      </button>
      <div className="topbar-actions">
        {gameMode && <span className="hidden lg:inline-block text-white font-arcade font-bold text-lg mr-2" style={{ textShadow: '0 2px 2px #06377c' }}>{modeNames[gameMode]}</span>}
        <button type="button" className="topbar-button tactile-btn" onClick={onToggleSound} aria-label={soundEnabled ? 'Matikan suara' : 'Hidupkan suara'} title={soundEnabled ? 'Matikan suara' : 'Hidupkan suara'}>
          {soundEnabled ? <Volume2 /> : <VolumeX />}
        </button>
        <button type="button" className="topbar-button tactile-btn" onClick={onOpenHighScores} aria-label="Papan juara" title="Papan juara"><Trophy /></button>
        <button type="button" className="topbar-button tactile-btn" onClick={onOpenSettings} aria-label="Pengaturan" title="Pengaturan"><Settings /></button>
        {isPlaying && onTogglePause && (
          <button type="button" className="topbar-button pause-button tactile-btn" onClick={onTogglePause} aria-label={isPaused ? 'Lanjutkan permainan' : 'Jeda permainan'} title="Jeda (Esc / P)">
            {isPaused ? <Play /> : <Pause />}<span>{isPaused ? 'Lanjut' : 'Jeda'}</span>
          </button>
        )}
      </div>
    </header>
  );
}