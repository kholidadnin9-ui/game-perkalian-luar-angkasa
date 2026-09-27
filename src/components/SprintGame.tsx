import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Clock3, Flag, Star } from 'lucide-react';
import { Question, GameStats, InputMode } from '../types/game';
import { generateQuestion, recordMasteryResult } from '../utils/mathQuestions';
import { soundEngine } from '../utils/audio';
import { particleEngine } from '../utils/particleSystem';
import { Numpad } from './Numpad';
import { ChoiceButtons } from './ChoiceButtons';

interface SprintGameProps {
  allowedTables: number[];
  inputMode: InputMode;
  totalQuestions?: number;
  isPaused?: boolean;
  onGameOver: (stats: GameStats) => void;
  onPause: () => void;
  triggerScreenShake: (intensity: number) => void;
  onScoreUpdate?: (score: number, combo: number) => void;
}

export const SprintGame: React.FC<SprintGameProps> = ({
  allowedTables,
  inputMode,
  totalQuestions = 25,
  isPaused = false,
  onGameOver,
  onPause,
  triggerScreenShake,
  onScoreUpdate,
}) => {
  const [currentIdx, setCurrentIdx] = useState(1);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [currentInput, setCurrentInput] = useState('');
  const [feedbackState, setFeedbackState] = useState<'idle' | 'correct' | 'wrong'>('idle');

  const [activeQuestion, setActiveQuestion] = useState<Question>(() =>
    generateQuestion(allowedTables)
  );

  const statsRef = useRef<GameStats>({
    score: 0,
    combo: 0,
    maxCombo: 0,
    correct: 0,
    incorrect: 0,
    totalAnswered: 0,
    startTime: Date.now(),
    history: [],
  });

  const questionStartTimeRef = useRef<number>(Date.now());
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const elapsedRef = useRef(0);
  const lockedRef = useRef(false);
  const completedRef = useRef(false);
  const pausedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (isPaused) pausedAtRef.current = Date.now();
    else if (pausedAtRef.current !== null) {
      questionStartTimeRef.current += Date.now() - pausedAtRef.current;
      pausedAtRef.current = null;
    }
  }, [isPaused]);

  // High resolution stopwatch (pauses when isPaused is true)
  useEffect(() => {
    if (isPaused) return;

    let lastTick = performance.now();
    const interval = setInterval(() => {
      if (completedRef.current) return;
      const now = performance.now();
      const delta = now - lastTick;
      lastTick = now;
      elapsedRef.current += delta;
      setElapsedMs(Math.round(elapsedRef.current));
    }, 40);

    return () => clearInterval(interval);
  }, [isPaused]);

  // Initialize Particle Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    particleEngine.init(ctx);
    particleEngine.clear();

    const resize = () => {
      if (canvas && containerRef.current) {
        canvas.width = containerRef.current.clientWidth;
        canvas.height = containerRef.current.clientHeight;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    let animId: number;
    const loop = () => {
      if (canvas) {
        particleEngine.render(canvas.width, canvas.height);
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  // Handle Answer
  const submitAnswer = useCallback(
    (val: number) => {
      if (lockedRef.current || isPaused || completedRef.current) return;
      lockedRef.current = true;
      const responseTime = Date.now() - questionStartTimeRef.current;
      const isCorrect = val === activeQuestion.answer;

      recordMasteryResult(activeQuestion.a, activeQuestion.b, isCorrect, responseTime);

      statsRef.current.totalAnswered += 1;
      statsRef.current.history.push({
        a: activeQuestion.a,
        b: activeQuestion.b,
        userAnswer: val,
        correctAnswer: activeQuestion.answer,
        correct: isCorrect,
        responseTimeMs: responseTime,
      });

      const canvas = canvasRef.current;
      const centerX = canvas ? canvas.width / 2 : 200;
      const centerY = canvas ? canvas.height * 0.48 : 150;

      if (isCorrect) {
        const newCombo = combo + 1;
        const newMaxCombo = Math.max(maxCombo, newCombo);
        setCombo(newCombo);
        setMaxCombo(newMaxCombo);
        statsRef.current.combo = newCombo;
        statsRef.current.maxCombo = newMaxCombo;
        statsRef.current.correct += 1;
        if (onScoreUpdate) onScoreUpdate(statsRef.current.correct, newCombo);

        triggerScreenShake(2);
        soundEngine.playCorrect(newCombo);
        soundEngine.vibrate(20);

        particleEngine.burst(centerX, centerY, ['#f3ad25', '#1889cc', '#ad63d8'], 20);
        setFeedbackState('correct');
      } else {
        // Wrong answer: +2.0s penalty
        elapsedRef.current += 2000;
        setElapsedMs(Math.round(elapsedRef.current));
        setCombo(0);
        statsRef.current.combo = 0;
        statsRef.current.incorrect += 1;
        if (onScoreUpdate) onScoreUpdate(statsRef.current.correct, 0);

        triggerScreenShake(4);
        soundEngine.playIncorrect();
        soundEngine.vibrate([40, 30, 40]);

        particleEngine.burst(centerX, centerY, ['#ef4444', '#f87171'], 15);
        particleEngine.addFloatingText(centerX, centerY - 20, '+2 DETIK', '#ef4444', 22);
        setFeedbackState('wrong');
      }

      setCurrentInput('');

      // Check if finished totalQuestions
      if (currentIdx >= totalQuestions) {
        completedRef.current = true;
        statsRef.current.startTime = 0;
        statsRef.current.endTime = Math.round(elapsedRef.current);
        setTimeout(() => {
          onGameOver({ ...statsRef.current });
        }, isCorrect ? 400 : 850);
        return;
      }

      setTimeout(() => {
        setFeedbackState('idle');
        setCurrentIdx((prev) => prev + 1);
        setActiveQuestion(
          generateQuestion(allowedTables, { a: activeQuestion.a, b: activeQuestion.b })
        );
        questionStartTimeRef.current = pausedAtRef.current ?? Date.now();
        lockedRef.current = false;
      }, isCorrect ? 320 : 850);
    },
    [activeQuestion, combo, currentIdx, maxCombo, allowedTables, totalQuestions, triggerScreenShake, onGameOver, onScoreUpdate, isPaused]
  );

  // Keypad Handlers
  const handleDigit = (digit: number) => {
    const next = currentInput + String(digit);
    if (next.length > 3) return;
    setCurrentInput(next);

    const val = parseInt(next, 10);
    if (val === activeQuestion.answer) {
      submitAnswer(val);
    } else if (
      String(activeQuestion.answer).length === next.length &&
      val !== activeQuestion.answer
    ) {
      submitAnswer(val);
    }
  };

  const handleClear = () => setCurrentInput((prev) => prev.slice(0, -1));
  const handleManualSubmit = () => {
    if (!currentInput) return;
    submitAnswer(parseInt(currentInput, 10));
  };

  // Keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPaused) return;
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        onPause();
        return;
      }

      if (lockedRef.current) return;

      if (inputMode === 'choice') {
        if (['1', '2', '3', '4'].includes(e.key)) {
          e.preventDefault();
          const idx = parseInt(e.key, 10) - 1;
          if (activeQuestion.choices[idx] !== undefined) {
            submitAnswer(activeQuestion.choices[idx]);
          }
          return;
        }
      }

      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleDigit(parseInt(e.key, 10));
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleClear();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleManualSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeQuestion, currentInput, inputMode, onPause, submitAnswer, isPaused]);

  const elapsedSecFormatted = (elapsedMs / 1000).toFixed(2);
  const progressPercent = Math.round(((currentIdx - 1) / totalQuestions) * 100);

  return (
    <div ref={containerRef} className="play-shell">
      <canvas ref={canvasRef} />
      <div className="game-hud">
        <div className="hud-item"><span className="hud-label flex items-center gap-1"><Clock3 size={13} /> Waktu</span><strong className="hud-value gold">{elapsedSecFormatted} dtk</strong></div>
        <div className="hud-item center"><span className="hud-label flex items-center gap-1"><Star size={13} /> Benar</span><strong className="hud-value pink">{statsRef.current.correct}</strong></div>
        <div className="hud-item right"><span className="hud-label flex items-center gap-1"><Flag size={13} /> Soal</span><strong className="hud-value">{currentIdx}/{totalQuestions}</strong></div>
      </div>

      <div className="w-full h-3 rounded-full bg-[#cce9fb] overflow-hidden relative z-[11]" aria-label={`Soal ${currentIdx} dari ${totalQuestions}`}>
        <div className="h-full rounded-full bg-gradient-to-r from-[#a86be9] to-[#ffcb44] transition-[width] duration-300" style={{ width: `${progressPercent}%` }} />
      </div>

      <div className="game-middle">
        <span className="game-overline"><Flag size={16} color="#e5a024" /> Jawab {totalQuestions} soal secepat mungkin!</span>
        <div key={activeQuestion.id} className={`question-surface ${feedbackState === 'correct' ? 'is-correct' : feedbackState === 'wrong' ? 'is-wrong' : ''}`}>
          <span className="question-number">{activeQuestion.a}</span>
          <span className="question-symbol">×</span>
          <span className="question-number">{activeQuestion.b}</span>
          <span className="question-symbol">=</span>
          <span className="answer-window">{feedbackState !== 'idle' ? activeQuestion.answer : currentInput || '?'}</span>
        </div>
        <div className={`feedback-line ${feedbackState === 'correct' ? 'good' : feedbackState === 'wrong' ? 'bad' : ''}`} role="status" aria-live="polite">
          {feedbackState === 'correct' ? 'Mantap! Lanjut!' : feedbackState === 'wrong' ? `Jawabannya ${activeQuestion.answer}. Tambahan 2 detik!` : inputMode === 'choice' ? 'Ketuk pilihan atau tekan angka 1-4' : 'Ketik jawaban dengan papan angka'}
        </div>
      </div>

      <div className="control-area">
        {inputMode === 'choice' ? <ChoiceButtons choices={activeQuestion.choices} onSelect={submitAnswer} disabled={isPaused || feedbackState !== 'idle'} /> : <Numpad onDigit={handleDigit} onClear={handleClear} onSubmit={handleManualSubmit} disabled={isPaused || feedbackState !== 'idle'} />}
      </div>
    </div>
  );
};
