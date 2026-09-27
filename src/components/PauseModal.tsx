import { useEffect } from 'react';
import { Home, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import type { GameMode } from '../types/game';
import { soundEngine } from '../utils/audio';
import { StarArt } from './SpaceArt';

interface PauseModalProps {
  mode?: GameMode | null;
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  currentScore: number;
  currentCombo: number;
}

export function PauseModal({ mode, onResume, onRestart, onQuit, soundEnabled, onToggleSound, currentScore, currentCombo }: PauseModalProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (['Escape', ' ', 'p', 'P'].includes(event.key)) {
        if (event.key === ' ' && (event.target as HTMLElement)?.closest('button, input, select')) return;
        event.preventDefault();
        onResume();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onResume]);

  return (
    <div className="space-overlay" role="dialog" aria-modal="true" aria-label="Permainan dijeda">
      <div className="space-dialog text-center">
        <StarArt className="w-16 h-16 mx-auto animate-float" />
        <h2 className="dialog-title mt-2">Istirahat Sebentar!</h2>
        <p className="dialog-subtitle mt-1">Misi kamu sedang dijeda. Ambil napas, lalu lanjut!</p>

        <div className="grid grid-cols-2 gap-3 my-5">
          <div className="dialog-section"><span className="text-xs font-extrabold text-[#7891ac]">{mode === 'sprint' ? 'SOAL BENAR' : 'SKOR SEKARANG'}</span><strong className="block font-arcade text-2xl text-[#eb9c21]">{currentScore.toLocaleString('id-ID')}</strong></div>
          <div className="dialog-section"><span className="text-xs font-extrabold text-[#7891ac]">RUNTUTAN</span><strong className="block font-arcade text-2xl text-[#c862ba]">{currentCombo} kali</strong></div>
        </div>

        <div className="space-y-2.5">
          <button type="button" className="primary-action tactile-btn" onClick={() => { soundEngine.playBlip(); onResume(); }}><Play size={19} fill="currentColor" /> Lanjut Bermain</button>
          <div className="flex gap-2">
            <button type="button" className="secondary-action tactile-btn flex-1" onClick={() => { soundEngine.playBlip(); onRestart(); }}><RotateCcw size={17} /> Main Lagi</button>
            <button type="button" className="secondary-action tactile-btn flex-1" onClick={() => { soundEngine.playBlip(); onQuit(); }}><Home size={17} /> Menu Utama</button>
          </div>
          <button type="button" className="text-sm text-[#5073a1] font-bold inline-flex items-center gap-1.5 mt-1" onClick={onToggleSound}>{soundEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}{soundEnabled ? 'Suara aktif' : 'Suara mati'}</button>
        </div>
      </div>
    </div>
  );
}