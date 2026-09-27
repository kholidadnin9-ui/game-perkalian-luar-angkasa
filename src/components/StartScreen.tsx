import { useState } from 'react';
import { ChevronDown, Settings, SlidersHorizontal, Trophy, Volume2, VolumeX } from 'lucide-react';
import type { GameMode, InputMode } from '../types/game';
import { soundEngine } from '../utils/audio';
import { BookArt, MeteorArt, PlanetArt, StarArt, TrophyArt } from './SpaceArt';

interface StartScreenProps {
  onStartGame: (mode: GameMode) => void;
  grade: number;
  onSelectGrade: (grade: number) => void;
  selectedTables: number[];
  onToggleTable: (num: number) => void;
  onSetPresetTables: (tables: number[]) => void;
  inputMode: InputMode;
  onSetInputMode: (mode: InputMode) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenHighScores: () => void;
  onOpenSettings: () => void;
}

const modes: {
  id: GameMode;
  color: string;
  title: [string, string];
  detail: string;
  art: typeof BookArt;
}[] = [
  { id: 'blitz', color: 'orange', title: ['Main', 'Kilat'], detail: '60 detik seru!', art: BookArt },
  { id: 'meteor', color: 'green', title: ['Misi', 'Meteor'], detail: 'Lindungi planetmu', art: MeteorArt },
  { id: 'sprint', color: 'purple', title: ['Balap', 'Angka'], detail: '25 soal cepat', art: TrophyArt },
  { id: 'dojo', color: 'blue', title: ['Peta', 'Perkalian'], detail: 'Latihan 1 sampai 10', art: PlanetArt },
];

export function StartScreen({
  onStartGame,
  grade,
  onSelectGrade,
  selectedTables,
  onToggleTable,
  onSetPresetTables,
  inputMode,
  onSetInputMode,
  soundEnabled,
  onToggleSound,
  onOpenHighScores,
  onOpenSettings,
}: StartScreenProps) {
  const [showSetup, setShowSetup] = useState(false);

  const launch = (mode: GameMode) => {
    soundEngine.playBlip();
    soundEngine.vibrate(20);
    onStartGame(mode);
  };

  return (
    <div className="home-scene">
      <div className="home-tools" aria-label="Pengaturan cepat">
        <button type="button" className="round-tool tactile-btn" aria-label={soundEnabled ? 'Matikan suara' : 'Hidupkan suara'} title={soundEnabled ? 'Matikan suara' : 'Hidupkan suara'} onClick={onToggleSound}>
          {soundEnabled ? <Volume2 /> : <VolumeX />}
        </button>
        <button type="button" className="round-tool tactile-btn" aria-label="Buka pengaturan" title="Pengaturan" onClick={onOpenSettings}>
          <Settings />
        </button>
      </div>

      <div className="logo-area animate-pop">
        <div className="logo-plate">
          <StarArt className="logo-star left twinkle" />
          <h1>Misi Perkalian</h1>
          <StarArt className="logo-star right twinkle" style={{ animationDelay: '-1s' }} />
          <div className="logo-ribbon">Petualangan Angka 1-10</div>
        </div>
        <label className="grade-select-wrap" title="Pilih kelasmu">
          <span>Kelas</span>
          <select value={grade} aria-label="Pilih kelas SD" onChange={(event) => {
            soundEngine.playBlip();
            onSelectGrade(Number(event.target.value));
          }}>
            {[1, 2, 3, 4, 5, 6].map((number) => <option key={number} value={number}>{number}</option>)}
          </select>
          <ChevronDown aria-hidden="true" />
          <span>SD</span>
        </label>
        <p className="creator-credit">Created by: Widodo, Guru SD</p>
      </div>

      <p className="intro-strip animate-pop" style={{ animationDelay: '.08s' }}>
        <StarArt />
        <span>Ayo bermain sambil jago perkalian!</span>
        <StarArt />
      </p>

      <section className="mode-frame animate-pop" aria-label="Pilih permainan" style={{ animationDelay: '.13s' }}>
        <div className="mode-grid">
          {modes.map(({ id, color, title, detail, art: Art }) => (
            <button key={id} type="button" className={`mode-card ${color} tactile-btn`} onClick={() => launch(id)} aria-label={`Main ${title.join(' ')}. ${detail}`}>
              <Art className="mode-card-art" />
              <span className="mode-card-title">{title[0]}<br />{title[1]}</span>
              <span className="mode-card-sub">{detail}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="home-footer animate-pop" style={{ animationDelay: '.2s' }}>
        <button type="button" className="footer-button secondary tactile-btn" onClick={() => {
          soundEngine.playBlip();
          setShowSetup((open) => !open);
        }} aria-expanded={showSetup} aria-controls="latihan-options">
          <SlidersHorizontal aria-hidden="true" /> Atur Latihan
        </button>
        <p className="motto-ribbon">Belajar angka, raih bintang!</p>
        <button type="button" className="footer-button tactile-btn" onClick={onOpenHighScores}>
          <Trophy aria-hidden="true" /> Papan Juara
        </button>
      </div>

      {showSetup && (
        <section id="latihan-options" className="setup-panel" aria-label="Atur latihan perkalian">
          <h2>Atur petualanganmu</h2>
          <p className="text-sm font-bold text-[#6685ac] mb-4">Pilih perkalian yang ingin kamu latih. Minimal satu angka harus dipilih.</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { label: 'Semua 1-10', values: [1,2,3,4,5,6,7,8,9,10] },
              { label: 'Mudah 1-5', values: [1,2,3,4,5] },
              { label: 'Hebat 6-10', values: [6,7,8,9,10] },
              { label: 'Tantangan 7-9', values: [7,8,9] },
            ].map(({ label, values }) => (
              <button key={label} type="button" className={`setup-chip tactile-btn ${selectedTables.length === values.length && selectedTables.every((n) => values.includes(n)) ? 'active' : ''}`} onClick={() => onSetPresetTables(values)}>{label}</button>
            ))}
          </div>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 mb-5">
            {[1,2,3,4,5,6,7,8,9,10].map((n) => (
              <button key={n} type="button" className={`table-button tactile-btn ${selectedTables.includes(n) ? 'active' : ''}`} aria-pressed={selectedTables.includes(n)} onClick={() => { soundEngine.playBlip(); onToggleTable(n); }}>{n}×</button>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-[#d5efff] pt-4">
            <div><strong className="text-[#1453a3] font-arcade text-lg">Cara menjawab</strong><p className="text-sm text-[#6685ac] font-bold">Ketuk pilihan atau ketik jawaban sendiri.</p></div>
            <div className="flex gap-2">
              <button type="button" className={`setup-chip tactile-btn ${inputMode === 'choice' ? 'active' : ''}`} onClick={() => { soundEngine.playBlip(); onSetInputMode('choice'); }}>Pilih Jawaban</button>
              <button type="button" className={`setup-chip tactile-btn ${inputMode === 'numpad' ? 'active' : ''}`} onClick={() => { soundEngine.playBlip(); onSetInputMode('numpad'); }}>Ketik Angka</button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}