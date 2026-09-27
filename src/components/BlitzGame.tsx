import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Clock, Flame, Star } from 'lucide-react';
import { Question, GameStats, InputMode } from '../types/game';
import { generateQuestion, recordMasteryResult } from '../utils/mathQuestions';
import { soundEngine } from '../utils/audio';
import { particleEngine } from '../utils/particleSystem';
import { Numpad } from './Numpad';
import { ChoiceButtons } from './ChoiceButtons';

interface BlitzGameProps {
  allowedTables: number[];
  inputMode: InputMode;
  isPaused?: boolean;
  onGameOver: (stats: GameStats) => void;
  onPause: () => void;
  triggerScreenShake: (intensity: number) => void;
  onScoreUpdate?: (score: number, combo: number) => void;
}

export const BlitzGame: React.FC<BlitzGameProps> = ({
  allowedTables,
  inputMode,
  isPaused = false,
  onGameOver,
  onPause,
  triggerScreenShake,
  onScoreUpdate,
}) => {
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [currentInput, setCurrentInput] = useState('');
  const [activeQuestion, setActiveQuestion] = useState<Question>(() =>
    generateQuestion(allowedTables)
  );
  const [feedbackState, setFeedbackState] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [powerUpActive, setPowerUpActive] = useState<{ type: string; title: string } | null>(null);

  // References for mutable game loop tracking
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
  const lockedRef = useRef(false);
  const endedRef = useRef(false);
  const pausedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (isPaused) pausedAtRef.current = Date.now();
    else if (pausedAtRef.current !== null) {
      const pauseLength = Date.now() - pausedAtRef.current;
      statsRef.current.startTime += pauseLength;
      questionStartTimeRef.current += pauseLength;
      pausedAtRef.current = null;
    }
  }, [isPaused]);

  // Calculate multiplier based on combo
  const getMultiplier = (c: number) => {
    if (c >= 12) return 5;
    if (c >= 8) return 4;
    if (c >= 5) return 3;
    if (c >= 3) return 2;
    return 1;
  };

  const currentMultiplier = getMultiplier(combo);
  const isFever = combo >= 8;

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

    let animationFrameId: number;
    const loop = () => {
      if (canvas) {
        particleEngine.render(canvas.width, canvas.height);
      }
      animationFrameId = requestAnimationFrame(loop);
    };
    animationFrameId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Timer Tick (seconds countdown), pauses when isPaused is true
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused]);

  useEffect(() => {
    if (timeLeft !== 0 || endedRef.current) return;
    endedRef.current = true;
    statsRef.current.endTime = Date.now();
    onGameOver({ ...statsRef.current });
  }, [timeLeft, onGameOver]);

  // Handle Answer Verification
  const submitAnswer = useCallback(
    (answeredValue: number) => {
      if (lockedRef.current || isPaused || timeLeft <= 0) return;
      lockedRef.current = true;
      const responseTime = Date.now() - questionStartTimeRef.current;
      const isCorrect = answeredValue === activeQuestion.answer;

      // Track Mastery
      recordMasteryResult(activeQuestion.a, activeQuestion.b, isCorrect, responseTime);

      statsRef.current.totalAnswered += 1;
      statsRef.current.history.push({
        a: activeQuestion.a,
        b: activeQuestion.b,
        userAnswer: answeredValue,
        correctAnswer: activeQuestion.answer,
        correct: isCorrect,
        responseTimeMs: responseTime,
      });

      const canvas = canvasRef.current;
      const centerX = canvas ? canvas.width / 2 : 200;
      const centerY = canvas ? canvas.height * 0.48 : 150;

      if (isCorrect) {
        // CORRECT HIT!
        const newCombo = combo + 1;
        const newMaxCombo = Math.max(maxCombo, newCombo);
        setCombo(newCombo);
        setMaxCombo(newMaxCombo);
        statsRef.current.combo = newCombo;
        statsRef.current.maxCombo = newMaxCombo;
        statsRef.current.correct += 1;

        // Scoring: Base 100 * Multiplier + speed bonus
        const speedBonus = Math.max(0, Math.floor((3000 - responseTime) / 25));
        const pts = (100 + speedBonus) * getMultiplier(newCombo);
        const newScore = score + pts;
        setScore(newScore);
        statsRef.current.score = newScore;
        if (onScoreUpdate) onScoreUpdate(newScore, newCombo);

        // Screen Shake & Sound & Haptic
        triggerScreenShake(newCombo > 6 ? 4 : 2);
        soundEngine.playCorrect(newCombo);
        soundEngine.vibrate(newCombo % 5 === 0 ? [30, 40, 30] : 20);

        // Particle Burst
        const particleColors =
          newCombo >= 8
            ? ['#e24ab0', '#1182cd', '#f4a126', '#9e5ad9']
            : ['#e9aa21', '#1285cc', '#ce6cba', '#27ae80'];

        particleEngine.burst(centerX, centerY, particleColors, newCombo >= 8 ? 40 : 25);
        particleEngine.addFloatingText(
          centerX + (Math.random() - 0.5) * 40,
          centerY - 10,
          `+${pts}${newCombo > 2 ? ` (×${getMultiplier(newCombo)})` : ''}`,
          newCombo >= 8 ? '#ae459d' : '#1866b7',
          newCombo >= 8 ? 28 : 22
        );

        // Fever mode / Streak rewards
        if (newCombo === 5) {
          setTimeLeft((t) => t + 2);
          particleEngine.addFloatingText(centerX, centerY - 45, '+2 DETIK!', '#facc15', 26);
        } else if (newCombo === 10) {
          setTimeLeft((t) => t + 3);
          particleEngine.addFloatingText(centerX, centerY - 45, 'HEBAT! +3 DETIK!', '#f43f5e', 30);
        }

        // Random Power-up trigger (every 8 answers or streak)
        if (newCombo > 0 && newCombo % 8 === 0 && Math.random() > 0.4) {
          setPowerUpActive({ type: 'freeze', title: 'BONUS WAKTU +3 DETIK!' });
          setTimeLeft((t) => t + 3);
          soundEngine.playPowerUp();
          setTimeout(() => setPowerUpActive(null), 2500);
        }

        setFeedbackState('correct');
      } else {
        // INCORRECT HIT
        setCombo(0);
        statsRef.current.combo = 0;
        statsRef.current.incorrect += 1;
        if (onScoreUpdate) onScoreUpdate(score, 0);

        triggerScreenShake(5);
        soundEngine.playIncorrect();
        soundEngine.vibrate([60, 40, 60]);

        particleEngine.burst(centerX, centerY, ['#ef4444', '#f87171', '#991b1b'], 15);
        particleEngine.addFloatingText(centerX, centerY, 'AYO COBA LAGI!', '#ef4444', 24);

        setFeedbackState('wrong');
      }

      // Transition to next question
      setCurrentInput('');
      setTimeout(() => {
        setFeedbackState('idle');
        setActiveQuestion(
          generateQuestion(allowedTables, { a: activeQuestion.a, b: activeQuestion.b })
        );
        questionStartTimeRef.current = pausedAtRef.current ?? Date.now();
        lockedRef.current = false;
      }, isCorrect ? 320 : 850);
    },
    [activeQuestion, combo, maxCombo, score, allowedTables, triggerScreenShake, isPaused, timeLeft, onScoreUpdate]
  );

  // Keypad Handlers
  const handleDigit = (digit: number) => {
    const next = currentInput + String(digit);
    if (next.length > 3) return;
    setCurrentInput(next);

    const val = parseInt(next, 10);
    // Instant auto-submit if number matches answer length or exact answer
    if (val === activeQuestion.answer) {
      submitAnswer(val);
    } else if (
      String(activeQuestion.answer).length === next.length &&
      val !== activeQuestion.answer
    ) {
      // Direct mismatch after reaching expected number of digits
      submitAnswer(val);
    }
  };

  const handleClear = () => {
    setCurrentInput((prev) => prev.slice(0, -1));
  };

  const handleManualSubmit = () => {
    if (!currentInput) return;
    submitAnswer(parseInt(currentInput, 10));
  };

  // Keyboard Global Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPaused) return;
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        onPause();
        return;
      }

      if (lockedRef.current) return;

      // In Multiple Choice mode: keys 1, 2, 3, 4 trigger choices
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

      // Top row & Numpad number keys 0-9
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

  return (
    <div ref={containerRef} className={`play-shell ${isFever ? 'fever-border' : ''}`}>
      <canvas ref={canvasRef} />

      <div className="game-hud">
        <div className="hud-item">
          <span className="hud-label flex items-center gap-1"><Clock size={13} /> Waktu</span>
          <strong className={`hud-value ${timeLeft <= 10 ? 'warn' : ''}`}>{timeLeft} dtk</strong>
        </div>
        <div className="hud-item center">
          <span className="hud-label flex items-center gap-1"><Flame size={13} /> Runtutan</span>
          <strong className="hud-value pink">{combo} <span className="text-sm">(×{currentMultiplier})</span></strong>
        </div>
        <div className="hud-item right">
          <span className="hud-label flex items-center gap-1"><Star size={13} /> Skor</span>
          <strong className="hud-value gold">{score.toLocaleString('id-ID')}</strong>
        </div>
      </div>

      {powerUpActive && <div className="absolute top-[88px] left-1/2 -translate-x-1/2 z-20 rounded-full border-[3px] border-[#e99a17] bg-[#ffeb66] px-4 py-1.5 text-[#174684] font-arcade font-bold text-sm whitespace-nowrap animate-pop">{powerUpActive.title}</div>}

      <div className="game-middle">
        <span className="game-overline"><Star size={17} fill="#ffcd37" color="#e79a18" /> {isFever ? 'MODE BINTANG! TERUSKAN!' : 'Berapa hasilnya?'}</span>
        <div key={activeQuestion.id} className={`question-surface ${feedbackState === 'correct' ? 'is-correct' : feedbackState === 'wrong' ? 'is-wrong' : ''}`}>
          <span className="question-number">{activeQuestion.a}</span>
          <span className="question-symbol">×</span>
          <span className="question-number">{activeQuestion.b}</span>
          <span className="question-symbol">=</span>
          <span className="answer-window">{feedbackState !== 'idle' ? activeQuestion.answer : currentInput || '?'}</span>
        </div>
        <div className={`feedback-line ${feedbackState === 'correct' ? 'good' : feedbackState === 'wrong' ? 'bad' : ''}`} role="status" aria-live="polite">
          {feedbackState === 'correct' ? 'Hebat! Jawabanmu benar!' : feedbackState === 'wrong' ? `Belum tepat. Jawabannya ${activeQuestion.answer}` : inputMode === 'choice' ? 'Ketuk jawaban atau tekan angka 1-4' : 'Ketik jawaban dengan papan angka'}
        </div>
        <div className="w-full max-w-[510px] h-3 rounded-full bg-[#cce9fb] overflow-hidden mt-2" aria-label={`Sisa waktu ${timeLeft} detik`}>
          <div className="h-full rounded-full bg-gradient-to-r from-[#51d6ee] to-[#1585dc] transition-[width] duration-1000" style={{ width: `${Math.min(100, timeLeft / 60 * 100)}%` }} />
        </div>
      </div>

      <div className="control-area">
        {inputMode === 'choice' ? <ChoiceButtons choices={activeQuestion.choices} onSelect={submitAnswer} disabled={isPaused || feedbackState !== 'idle'} /> : <Numpad onDigit={handleDigit} onClear={handleClear} onSubmit={handleManualSubmit} disabled={isPaused || feedbackState !== 'idle'} />}
      </div>
    </div>
  );
};
