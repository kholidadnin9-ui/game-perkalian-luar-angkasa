import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { ArrowRight, Home, RotateCcw, Star, Target, Trophy, Zap } from 'lucide-react';
import type { GameMode, GameStats, HighScoreItem } from '../types/game';
import { calculateGrade } from '../utils/mathQuestions';
import { soundEngine } from '../utils/audio';
import { StarArt } from './SpaceArt';

interface GameOverModalProps {
  mode: GameMode;
  stats: GameStats;
  selectedTablesSummary: string;
  onRestart: () => void;
  onGoHome: () => void;
  onOpenHighScores: () => void;
  isHighScore: boolean;
  isOverlayOpen?: boolean;
  onSaveHighScore: (item: Omit<HighScoreItem, 'id' | 'date'>) => void;
}

export function GameOverModal({ mode, stats, selectedTablesSummary, onRestart, onGoHome, onOpenHighScores, isHighScore, isOverlayOpen = false, onSaveHighScore }: GameOverModalProps) {
  const [name, setName] = useState(() => {
    try { return localStorage.getItem('math_blitz_player_name') || 'PENJELAJAH'; }
    catch { return 'PENJELAJAH'; }
  });
  const [saved, setSaved] = useState(false);
  const savedRef = useRef(false);

  const total = stats.totalAnswered;
  const accuracy = total ? Math.round(stats.correct / total * 100) : 0;
  const grade = calculateGrade(accuracy, total, stats.score);
  const durationMs = Math.max(1, (stats.endTime ?? Date.now()) - stats.startTime);
  const durationSeconds = durationMs / 1000;
  const avgTime = stats.history.length ? (stats.history.reduce((sum, item) => sum + item.responseTimeMs, 0) / stats.history.length / 1000).toFixed(1) : '0';
  const missed = Array.from(new Map(stats.history.filter((item) => !item.correct).map((item) => [`${item.a}x${item.b}`, item])).values()).slice(0, 4);

  const saveIfNeeded = () => {
    if (!isHighScore || savedRef.current) return;
    savedRef.current = true;
    const playerName = name.trim().slice(0, 12).toUpperCase() || 'PENJELAJAH';
    try { localStorage.setItem('math_blitz_player_name', playerName); } catch { /* Storage may be disabled. */ }
    onSaveHighScore({
      mode,
      score: mode === 'sprint' ? 0 : stats.score,
      timeSeconds: mode === 'sprint' ? Number(durationSeconds.toFixed(2)) : undefined,
      accuracy,
      maxCombo: stats.maxCombo,
      playerName,
      tablesSummary: selectedTablesSummary,
    });
    setSaved(true);
    soundEngine.playPowerUp();
  };

  useEffect(() => {
    soundEngine.playGameOver();
    if (isHighScore || ['SSS', 'SS', 'S'].includes(grade.rank)) {
      soundEngine.playVictory();
      confetti({ particleCount: 90, spread: 75, origin: { y: .6 }, colors: ['#ffdb3d', '#43dfe9', '#7edc67', '#ff8b90', '#bb85eb'] });
    }
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (isOverlayOpen) return;
      if ((event.target as HTMLElement)?.closest('button, input, select, textarea')) return;
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        saveIfNeeded();
        onRestart();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [name, onRestart, isHighScore, isOverlayOpen]);

  return (
    <div className="space-overlay" role="dialog" aria-modal="true" aria-label="Hasil permainan">
      <div className="space-dialog result-dialog text-center">
        <div className="relative w-fit mx-auto"><StarArt className="w-16 h-16 animate-float" />{isHighScore && <Trophy size={25} className="absolute -right-7 top-2 text-[#e89c21]" fill="#ffdb4c" />}</div>
        <h2 className="dialog-title mt-1">{mode === 'sprint' ? 'Misi Selesai!' : 'Misi Berakhir!'}</h2>
        <p className="dialog-subtitle mt-1">{isHighScore ? 'Wah, kamu masuk papan juara!' : 'Kerja bagus! Yuk coba lagi dan lebih hebat!'}</p>

        <div className="flex items-center justify-center gap-3 my-4">
          <div className="w-16 h-16 grid place-items-center rounded-[20px] border-[4px] bg-white font-arcade font-bold text-2xl" style={{ color: grade.color, borderColor: grade.color, boxShadow: `0 5px 0 ${grade.color}50` }}>{grade.rank}</div>
          <div className="text-left"><span className="text-xs text-[#7a93ab] font-extrabold">PANGKATMU</span><strong className="block font-arcade text-xl" style={{ color: grade.color }}>{grade.title}</strong></div>
        </div>

        <div className="rounded-[23px] bg-[#fff4ba] border-[3px] border-[#ffd35a] py-3 mb-3">
          <span className="block text-[#866632] text-xs font-extrabold">{mode === 'sprint' ? 'WAKTU AKHIR' : 'TOTAL SKOR'}</span>
          <strong className="block font-arcade text-[42px] leading-tight text-[#1258a9]">{mode === 'sprint' ? `${durationSeconds.toFixed(2)} dtk` : stats.score.toLocaleString('id-ID')}</strong>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="dialog-section !p-2"><Target className="w-5 h-5 mx-auto text-[#27a9db]" /><strong className="block font-arcade text-lg text-[#1553a6]">{accuracy}%</strong><span className="block text-[11px] text-[#7e98b3] font-extrabold">BENAR</span></div>
          <div className="dialog-section !p-2"><Zap className="w-5 h-5 mx-auto text-[#d465ba]" /><strong className="block font-arcade text-lg text-[#1553a6]">{stats.maxCombo}×</strong><span className="block text-[11px] text-[#7e98b3] font-extrabold">RUNTUTAN</span></div>
          <div className="dialog-section !p-2"><Star className="w-5 h-5 mx-auto text-[#edac2b]" /><strong className="block font-arcade text-lg text-[#1553a6]">{stats.correct}/{total}</strong><span className="block text-[11px] text-[#7e98b3] font-extrabold">SOAL</span></div>
        </div>
        <p className="text-xs text-[#7892aa] font-bold mb-3">Rata-rata {avgTime} detik per soal</p>

        {missed.length > 0 && <div className="dialog-section text-left !bg-[#fff7f3] !border-[#ffdabd] mb-3"><strong className="font-arcade text-[#d87548]">Yuk, ingat jawaban ini:</strong><div className="flex gap-2 flex-wrap mt-2">{missed.map((fact) => <span key={`${fact.a}-${fact.b}`} className="rounded-full bg-white border border-[#ffcfad] px-2.5 py-1 text-sm text-[#704c3d] font-extrabold">{fact.a} × {fact.b} = <strong className="text-[#138a75]">{fact.correctAnswer}</strong></span>)}</div></div>}

        {isHighScore && !saved && <form className="dialog-section !bg-[#fffbee] !border-[#f9de91] mb-3 text-left" onSubmit={(event) => { event.preventDefault(); saveIfNeeded(); }}><label htmlFor="player-name" className="block font-arcade text-[#966b1c] mb-2">Tulis nama untuk papan juara:</label><div className="flex gap-2"><input id="player-name" value={name} maxLength={12} onChange={(event) => setName(event.target.value)} className="min-w-0 flex-1 bg-white rounded-xl border-2 border-[#efcf7e] px-3 py-2 text-[#164b92] font-bold uppercase" placeholder="Namamu" /><button type="submit" className="secondary-action tactile-btn !bg-[#ffe26a] !border-[#e8b83a] !text-[#86561b]">Simpan</button></div></form>}
        {saved && <p className="text-[#139b6d] font-arcade font-bold mb-3">Nilaimu tersimpan di papan juara!</p>}

        <button type="button" className="primary-action tactile-btn mb-2" onClick={() => { saveIfNeeded(); onRestart(); }}><RotateCcw size={19} /> Main Lagi <ArrowRight size={18} /></button>
        <div className="flex gap-2"><button type="button" className="secondary-action tactile-btn flex-1" onClick={() => { saveIfNeeded(); onOpenHighScores(); }}><Trophy size={17} /> Papan Juara</button><button type="button" className="secondary-action tactile-btn flex-1" onClick={() => { saveIfNeeded(); onGoHome(); }}><Home size={17} /> Menu Utama</button></div>
        <p className="text-[11px] text-[#8ca2b7] font-bold mt-3">Tekan spasi untuk main lagi</p>
      </div>
    </div>
  );
}