import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, Grid3X3, Star, X } from 'lucide-react';
import { getMasteryData, recordMasteryResult } from '../utils/mathQuestions';
import { soundEngine } from '../utils/audio';
import { Numpad } from './Numpad';

interface TableDojoProps {
  onBack: () => void;
  triggerScreenShake: (intensity: number) => void;
  isBlocked?: boolean;
}

const numbers = [1,2,3,4,5,6,7,8,9,10];

export function TableDojo({ onBack, triggerScreenShake, isBlocked = false }: TableDojoProps) {
  const [masteryMap, setMasteryMap] = useState(() => getMasteryData());
  const [selectedCell, setSelectedCell] = useState<{ a: number; b: number } | null>(null);
  const [currentInput, setCurrentInput] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (feedbackTimerRef.current !== null) clearTimeout(feedbackTimerRef.current);
  }, []);

  useEffect(() => {
    const onReset = () => setMasteryMap(getMasteryData());
    window.addEventListener('math-blitz-mastery-reset', onReset);
    return () => window.removeEventListener('math-blitz-mastery-reset', onReset);
  }, []);

  let mastered = 0;
  let attempted = 0;
  for (const row of numbers) for (const col of numbers) {
    const cell = masteryMap[`${Math.min(row, col)}x${Math.max(row, col)}`];
    if (cell?.attempts) {
      attempted++;
      if (cell.attempts >= 2 && cell.correct / cell.attempts >= .85) mastered++;
    }
  }

  const cellLevel = (row: number, col: number) => {
    const cell = masteryMap[`${Math.min(row, col)}x${Math.max(row, col)}`];
    if (!cell?.attempts) return 'new';
    if (cell.attempts >= 2 && cell.correct / cell.attempts >= .85) return 'mastered';
    if (cell.correct / cell.attempts >= .6) return 'practice';
    return 'retry';
  };

  const checkAnswer = (answer: number) => {
    if (!selectedCell || feedback) return;
    const correct = answer === selectedCell.a * selectedCell.b;
    soundEngine.vibrate(correct ? 15 : 35);
    if (correct) soundEngine.playCorrect(3);
    else soundEngine.playIncorrect();
    triggerScreenShake(correct ? 2 : 3);
    recordMasteryResult(selectedCell.a, selectedCell.b, correct, 1000);
    setMasteryMap(getMasteryData());
    setFeedback(correct ? 'correct' : 'wrong');
    feedbackTimerRef.current = window.setTimeout(() => { setFeedback(null); setCurrentInput(''); feedbackTimerRef.current = null; }, correct ? 560 : 950);
  };

  const handleDigit = (digit: number) => {
    if (!selectedCell || feedback) return;
    const next = (currentInput + digit).slice(0, 3);
    setCurrentInput(next);
    const answer = selectedCell.a * selectedCell.b;
    if (Number(next) === answer || next.length === String(answer).length) checkAnswer(Number(next));
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (isBlocked) return;
      if (event.key === 'Escape') { setSelectedCell(null); return; }
      if (!selectedCell || feedback) return;
      if (/^[0-9]$/.test(event.key)) { event.preventDefault(); handleDigit(Number(event.key)); }
      else if (event.key === 'Backspace') { event.preventDefault(); setCurrentInput((input) => input.slice(0, -1)); }
      else if (event.key === 'Enter' && currentInput) { event.preventDefault(); checkAnswer(Number(currentInput)); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedCell, currentInput, feedback, isBlocked]);

  return (
    <div className="w-full max-w-[1010px] mx-auto px-1 sm:px-4 py-3 sm:py-6">
      <div className="flex items-center justify-between gap-3 mb-5">
        <button type="button" className="footer-button secondary tactile-btn !min-h-[44px] !text-sm" onClick={onBack}><ArrowLeft size={19} /> Menu Utama</button>
        <span className="rounded-full bg-[#fff4b9] border-[3px] border-[#ffcd48] px-3 py-1.5 text-[#1654a1] font-arcade font-bold text-sm sm:text-lg flex items-center gap-1"><Star size={18} fill="#ffc52e" color="#e6a123" /> {mastered}/100 mahir</span>
      </div>

      <div className="text-center text-white mb-5" style={{ textShadow: '0 3px 0 #103c8e' }}>
        <span className="game-overline"><Grid3X3 size={17} /> Ayo latihan</span>
        <h2 className="font-arcade font-bold text-3xl sm:text-5xl mt-2">Peta Perkalian</h2>
        <p className="text-base sm:text-lg font-bold mt-1">Sentuh kotak mana saja, lalu jawab soal perkaliannya!</p>
      </div>

      <section className="mode-frame !max-w-[850px] mx-auto" aria-label="Peta perkalian satu sampai sepuluh">
        <div className="flex justify-between flex-wrap gap-2 items-center mb-3 px-2">
          <strong className="font-arcade text-[#1555a5] text-lg">Pilih angka untuk berlatih</strong>
          <span className="text-[#6480a2] font-extrabold text-sm">{attempted} dari 100 kotak dicoba</span>
        </div>
        <div className="overflow-x-auto pb-1">
          <div className="grid grid-cols-11 gap-1 sm:gap-1.5 min-w-[310px]">
            <div className="dojo-head">×</div>
            {numbers.map((col) => <div className="dojo-head" key={`col${col}`}>{col}</div>)}
            {numbers.map((row) => (
              <div className="contents" key={`row${row}`}>
                <div className="dojo-head">{row}</div>
                {numbers.map((col) => (
                  <button key={`${row}-${col}`} type="button" onClick={() => {
                    if (feedbackTimerRef.current !== null) clearTimeout(feedbackTimerRef.current);
                    soundEngine.playBlip();
                    setSelectedCell({ a: row, b: col });
                    setCurrentInput('');
                    setFeedback(null);
                  }} className={`dojo-cell ${cellLevel(row,col)} tactile-btn ${selectedCell?.a === row && selectedCell.b === col ? 'selected' : ''}`} aria-label={`${row} kali ${col}, latihan. Hasil ${row * col}`} title={`${row} × ${col} = ${row * col}`}>
                    {row * col}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-1.5 mt-4 text-xs sm:text-sm text-[#4975a3] font-bold">
          <span><i className="dojo-dot mastered" /> Sudah mahir</span><span><i className="dojo-dot practice" /> Terus latihan</span><span><i className="dojo-dot retry" /> Coba lagi</span><span><i className="dojo-dot new" /> Belum dicoba</span>
        </div>
      </section>

      {selectedCell && (
        <section className="space-dialog !max-w-[440px] mx-auto mt-6" aria-label="Latihan soal">
          <div className="flex items-center justify-between mb-2"><strong className="font-arcade text-xl text-[#1453a0]">Ayo jawab!</strong><button type="button" className="dialog-close" onClick={() => setSelectedCell(null)} aria-label="Tutup latihan"><X /></button></div>
          <div className={`question-surface !min-h-[110px] !mt-0 !mb-2 ${feedback === 'correct' ? 'is-correct' : feedback === 'wrong' ? 'is-wrong' : ''}`}>
            <span className="question-number !text-[38px]">{selectedCell.a}</span><span className="question-symbol !text-[35px]">×</span><span className="question-number !text-[38px]">{selectedCell.b}</span><span className="question-symbol !text-[35px]">=</span>
            <span className="answer-window !min-w-[55px] !min-h-[52px] !text-[34px]">{feedback === 'correct' ? <CheckCircle2 className="text-[#2fc974]" size={32} /> : feedback === 'wrong' ? selectedCell.a * selectedCell.b : currentInput || '?'}</span>
          </div>
          <p className={`feedback-line ${feedback === 'correct' ? 'good' : feedback === 'wrong' ? 'bad' : ''}`} role="status">{feedback === 'correct' ? 'Benar! Hebat sekali!' : feedback === 'wrong' ? `Jawabannya ${selectedCell.a * selectedCell.b}. Coba lagi, ya!` : 'Ketik jawabannya di bawah ini'}</p>
          <Numpad onDigit={handleDigit} onClear={() => setCurrentInput((input) => input.slice(0, -1))} onSubmit={() => currentInput && checkAnswer(Number(currentInput))} disabled={!!feedback || isBlocked} />
        </section>
      )}
    </div>
  );
}