import { useEffect, useState } from 'react';
import { Keyboard, Music2, RefreshCcw, Sparkles, Volume2, VolumeX, X } from 'lucide-react';
import type { GameSettings, InputMode } from '../types/game';
import { soundEngine } from '../utils/audio';
import { resetMasteryData } from '../utils/mathQuestions';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onClose: () => void;
}

export function SettingsModal({ settings, onUpdateSettings, onClose }: SettingsModalProps) {
  const [resetDone, setResetDone] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); onClose(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const update = (next: Partial<GameSettings>) => { soundEngine.playBlip(); onUpdateSettings(next); };
  const selectInput = (inputMode: InputMode) => update({ inputMode });

  return (
    <div className="space-overlay" role="dialog" aria-modal="true" aria-label="Pengaturan permainan">
      <div className="space-dialog">
        <div className="flex items-start justify-between gap-3 mb-5"><div><h2 className="dialog-title !text-left">Pengaturan</h2><p className="text-sm font-bold text-[#6686a7]">Sesuaikan petualanganmu</p></div><button type="button" className="dialog-close tactile-btn" aria-label="Tutup pengaturan" onClick={onClose}><X /></button></div>

        <div className="space-y-3">
          <div className="dialog-section flex items-center justify-between gap-3"><div className="flex items-center gap-3">{settings.soundEnabled ? <Volume2 color="#128cd2" /> : <VolumeX color="#879bb0" />}<div><strong className="block font-arcade text-lg">Efek Suara</strong><span className="text-xs font-bold text-[#8196ad]">Bunyi saat menjawab soal</span></div></div><button type="button" onClick={() => { soundEngine.setSoundEnabled(!settings.soundEnabled); onUpdateSettings({ soundEnabled: !settings.soundEnabled }); }} aria-label={settings.soundEnabled ? 'Matikan efek suara' : 'Hidupkan efek suara'} aria-pressed={settings.soundEnabled} className={`w-14 h-8 rounded-full p-1 transition-colors flex-none ${settings.soundEnabled ? 'bg-[#43c7ed]' : 'bg-[#b6cbd9]'}`}><span className={`block w-6 h-6 bg-white rounded-full shadow transition-transform ${settings.soundEnabled ? 'translate-x-6' : ''}`} /></button></div>
          <div className="dialog-section flex items-center justify-between gap-3"><div className="flex items-center gap-3"><Music2 color="#bd66cb" /><div><strong className="block font-arcade text-lg">Musik Latar</strong><span className="text-xs font-bold text-[#8196ad]">Irama luar angkasa</span></div></div><button type="button" onClick={() => { soundEngine.setMusicEnabled(!settings.musicEnabled); onUpdateSettings({ musicEnabled: !settings.musicEnabled }); }} aria-label={settings.musicEnabled ? 'Matikan musik' : 'Hidupkan musik'} aria-pressed={settings.musicEnabled} className={`w-14 h-8 rounded-full p-1 transition-colors flex-none ${settings.musicEnabled ? 'bg-[#ad7cdd]' : 'bg-[#b6cbd9]'}`}><span className={`block w-6 h-6 bg-white rounded-full shadow transition-transform ${settings.musicEnabled ? 'translate-x-6' : ''}`} /></button></div>

          <div className="dialog-section"><div className="flex gap-2 items-center mb-2"><Sparkles color="#efad31" size={21} /><strong className="font-arcade text-lg">Goyangan Layar</strong></div><div className="grid grid-cols-3 gap-2">{[{ name: 'Mati', value: 0 }, { name: 'Sedikit', value: .5 }, { name: 'Seru!', value: 1 }].map(({ name, value }) => <button key={value} type="button" className={`setup-chip tactile-btn ${settings.screenShake === value ? 'active' : ''}`} onClick={() => update({ screenShake: value })}>{name}</button>)}</div></div>

          <div className="dialog-section"><div className="flex gap-2 items-center mb-2"><Keyboard color="#168ad2" size={21} /><strong className="font-arcade text-lg">Cara Menjawab</strong></div><div className="grid grid-cols-2 gap-2"><button type="button" className={`setup-chip tactile-btn !px-2 ${settings.inputMode === 'choice' ? 'active' : ''}`} onClick={() => selectInput('choice')}>Pilih Jawaban</button><button type="button" className={`setup-chip tactile-btn !px-2 ${settings.inputMode === 'numpad' ? 'active' : ''}`} onClick={() => selectInput('numpad')}>Ketik Angka</button></div></div>

          <div className="dialog-section flex items-center justify-between gap-3"><div><strong className="font-arcade text-base">Ulangi Peta Belajar</strong><p className="text-xs font-bold text-[#8398ac]">Hapus perkembangan latihan</p></div><button type="button" className="secondary-action tactile-btn !min-h-[38px]" onClick={() => { resetMasteryData(); window.dispatchEvent(new Event('math-blitz-mastery-reset')); soundEngine.playPowerUp(); setResetDone(true); window.setTimeout(() => setResetDone(false), 2000); }}><RefreshCcw size={15} /> {resetDone ? 'Selesai' : 'Hapus'}</button></div>
        </div>
        <p className="text-xs font-bold text-center text-[#7995ad] mt-5">Keyboard: angka 1-4 untuk memilih · Esc untuk jeda · Spasi untuk main lagi</p>
      </div>
    </div>
  );
}