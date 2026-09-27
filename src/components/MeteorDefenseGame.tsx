import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Heart, Shield, Star } from 'lucide-react';
import type { GameStats, InputMode, MeteorItem } from '../types/game';
import { generateChoices, generateQuestion, recordMasteryResult } from '../utils/mathQuestions';
import { soundEngine } from '../utils/audio';
import { particleEngine } from '../utils/particleSystem';
import { Numpad } from './Numpad';
import { ChoiceButtons } from './ChoiceButtons';

interface MeteorDefenseProps {
  allowedTables: number[];
  inputMode: InputMode;
  isPaused?: boolean;
  onGameOver: (stats: GameStats) => void;
  onPause: () => void;
  triggerScreenShake: (intensity: number) => void;
  onScoreUpdate?: (score: number, combo: number) => void;
}

interface Laser { x1: number; y1: number; x2: number; y2: number; alpha: number }

export function MeteorDefenseGame({ allowedTables, inputMode, isPaused = false, onGameOver, onPause, triggerScreenShake, onScoreUpdate }: MeteorDefenseProps) {
  const [lives, setLives] = useState(3);
  const [wave, setWave] = useState(1);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [currentInput, setCurrentInput] = useState('');
  const [inputLocked, setInputLocked] = useState(false);
  const [meteors, setMeteors] = useState<MeteorItem[]>([]);
  const [message, setMessage] = useState('Jawab soal pada meteor untuk menyelamatkan planet!');

  const statsRef = useRef<GameStats>({ score: 0, combo: 0, maxCombo: 0, correct: 0, incorrect: 0, totalAnswered: 0, startTime: Date.now(), history: [] });
  const meteorsRef = useRef<MeteorItem[]>([]);
  const birthRef = useRef(new Map<string, number>());
  const meteorElementsRef = useRef(new Map<string, HTMLDivElement>());
  const lasersRef = useRef<Laser[]>([]);
  const arenaRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const waveRef = useRef(1);
  const livesRef = useRef(3);
  const pausedRef = useRef(isPaused);
  const endedRef = useRef(false);
  const inputLockRef = useRef(false);
  const pausedAtRef = useRef<number | null>(null);
  pausedRef.current = isPaused;

  useEffect(() => {
    if (isPaused) pausedAtRef.current = Date.now();
    else if (pausedAtRef.current !== null) {
      const pauseLength = Date.now() - pausedAtRef.current;
      statsRef.current.startTime += pauseLength;
      birthRef.current.forEach((value, key) => birthRef.current.set(key, value + pauseLength));
      pausedAtRef.current = null;
    }
  }, [isPaused]);

  const spawnMeteor = useCallback(() => {
    if (meteorsRef.current.length >= 2 || endedRef.current) return;
    const question = generateQuestion(allowedTables);
    const meteor: MeteorItem = {
      id: question.id,
      a: question.a,
      b: question.b,
      answer: question.answer,
      x: 17 + Math.random() * 66,
      y: 7,
      speed: Math.min(.32, .125 + (waveRef.current - 1) * .026),
      radius: 38,
      color: '#ffb84d',
    };
    birthRef.current.set(meteor.id, Date.now());
    meteorsRef.current.push(meteor);
    setMeteors([...meteorsRef.current]);
  }, [allowedTables]);

  // Move only the meteor DOM transforms in the 60fps loop; React rerenders on spawn/hit, not each frame.
  useEffect(() => {
    const canvas = canvasRef.current;
    const arena = arenaRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !arena || !ctx) return;
    particleEngine.init(ctx);
    particleEngine.clear();

    const resize = () => {
      canvas.width = arena.clientWidth;
      canvas.height = arena.clientHeight;
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(arena);

    let frame = 0;
    let lastTime = performance.now();
    let lastSpawn = lastTime;
    if (meteorsRef.current.length === 0) spawnMeteor();

    const animate = (now: number) => {
      const delta = Math.min(now - lastTime, 40);
      lastTime = now;
      if (pausedRef.current) lastSpawn += delta;
      if (!pausedRef.current && !endedRef.current) {
        if (now - lastSpawn >= Math.max(1600, 3600 - waveRef.current * 220)) {
          spawnMeteor();
          lastSpawn = now;
        }

        const landed: MeteorItem[] = [];
        for (const meteor of meteorsRef.current) {
          meteor.y += meteor.speed * (delta / 16.67);
          if (meteor.y >= 88) landed.push(meteor);
          else {
            const element = meteorElementsRef.current.get(meteor.id);
            if (element) element.style.transform = `translate3d(-50%, -50%, 0) translateY(${meteor.y * canvas.height / 100}px)`;
          }
        }

        if (landed.length) {
          const ids = new Set(landed.map((m) => m.id));
          meteorsRef.current = meteorsRef.current.filter((m) => !ids.has(m.id));
          setMeteors([...meteorsRef.current]);
          livesRef.current = Math.max(0, livesRef.current - landed.length);
          setLives(livesRef.current);
          statsRef.current.combo = 0;
          setCombo(0);
          onScoreUpdate?.(statsRef.current.score, 0);
          triggerScreenShake(6);
          soundEngine.playExplosion();
          soundEngine.vibrate([60, 40, 60]);
          setMessage('Ups! Meteor mengenai pelindung!');

          landed.forEach((meteor) => {
            const age = Date.now() - (birthRef.current.get(meteor.id) || Date.now());
            recordMasteryResult(meteor.a, meteor.b, false, age);
            birthRef.current.delete(meteor.id);
            statsRef.current.incorrect++;
            statsRef.current.totalAnswered++;
            statsRef.current.history.push({ a: meteor.a, b: meteor.b, correctAnswer: meteor.answer, correct: false, responseTimeMs: age });
            particleEngine.burst(meteor.x / 100 * canvas.width, .85 * canvas.height, ['#ffdd50', '#ff773f', '#ffffff'], 28);
          });

          if (livesRef.current <= 0) {
            endedRef.current = true;
            statsRef.current.endTime = Date.now();
            onGameOver({ ...statsRef.current });
          }
        }

        // Particle engine clears the canvas, so laser beams are drawn afterwards.
        particleEngine.render(canvas.width, canvas.height);
        for (let i = lasersRef.current.length - 1; i >= 0; i--) {
          const laser = lasersRef.current[i];
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(laser.x1, laser.y1);
          ctx.lineTo(laser.x2, laser.y2);
          ctx.lineWidth = 5;
          ctx.strokeStyle = '#8cfbff';
          ctx.shadowColor = '#23dfff';
          ctx.shadowBlur = 16;
          ctx.globalAlpha = laser.alpha;
          ctx.stroke();
          ctx.restore();
          laser.alpha -= .11;
          if (laser.alpha <= 0) lasersRef.current.splice(i, 1);
        }
      }
      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [spawnMeteor, onGameOver, triggerScreenShake, onScoreUpdate]);

  const activeTarget = meteors.reduce<MeteorItem | null>((lowest, meteor) => !lowest || meteor.y > lowest.y ? meteor : lowest, null);
  const choices = useMemo(() => activeTarget ? generateChoices(activeTarget.a, activeTarget.b) : [], [activeTarget?.id]);

  const submitAnswer = useCallback((value: number) => {
    if (pausedRef.current || endedRef.current || inputLockRef.current) return;
    const targets = [...meteorsRef.current].sort((a, b) => b.y - a.y);
    if (!targets.length) return;
    inputLockRef.current = true;
    setInputLocked(true);
    setCurrentInput('');
    const hit = targets.find((meteor) => meteor.answer === value);
    if (hit) {
      const canvas = canvasRef.current;
      const x = (hit.x / 100) * (canvas?.width || 400);
      const y = (hit.y / 100) * (canvas?.height || 300);
      const age = Date.now() - (birthRef.current.get(hit.id) || Date.now());
      recordMasteryResult(hit.a, hit.b, true, age);
      birthRef.current.delete(hit.id);
      statsRef.current.totalAnswered++;
      statsRef.current.correct++;
      statsRef.current.combo++;
      statsRef.current.maxCombo = Math.max(statsRef.current.maxCombo, statsRef.current.combo);
      statsRef.current.history.push({ a: hit.a, b: hit.b, userAnswer: value, correctAnswer: hit.answer, correct: true, responseTimeMs: age });
      const points = (150 + waveRef.current * 50) * Math.min(4, Math.floor(statsRef.current.combo / 3) + 1);
      statsRef.current.score += points;
      setScore(statsRef.current.score);
      setCombo(statsRef.current.combo);
      onScoreUpdate?.(statsRef.current.score, statsRef.current.combo);
      meteorsRef.current = meteorsRef.current.filter((meteor) => meteor.id !== hit.id);
      setMeteors([...meteorsRef.current]);
      if (meteorsRef.current.length === 0) {
        window.setTimeout(() => { if (!pausedRef.current && !endedRef.current) spawnMeteor(); }, 350);
      }
      lasersRef.current.push({ x1: (canvas?.width || 400) / 2, y1: (canvas?.height || 300) * .91, x2: x, y2: y, alpha: 1 });
      particleEngine.burst(x, y, ['#ffdc52', '#74eeff', '#ffffff'], 32);
      particleEngine.addFloatingText(x, y - 20, `+${points}`, '#fff174', 22);
      soundEngine.playLaser();
      soundEngine.playCorrect(statsRef.current.combo);
      soundEngine.vibrate(20);
      triggerScreenShake(3);
      setMessage('Tepat! Meteor berhasil dihentikan!');
      if (statsRef.current.correct % 6 === 0) {
        waveRef.current++;
        setWave(waveRef.current);
        soundEngine.playPowerUp();
        particleEngine.addFloatingText((canvas?.width || 400) / 2, (canvas?.height || 300) * .42, 'LEVEL NAIK!', '#ffe35a', 26);
      }
    } else {
      const target = targets[0];
      const age = Date.now() - (birthRef.current.get(target.id) || Date.now());
      recordMasteryResult(target.a, target.b, false, age);
      statsRef.current.totalAnswered++;
      statsRef.current.incorrect++;
      statsRef.current.combo = 0;
      statsRef.current.history.push({ a: target.a, b: target.b, userAnswer: value, correctAnswer: target.answer, correct: false, responseTimeMs: age });
      setCombo(0);
      onScoreUpdate?.(statsRef.current.score, 0);
      soundEngine.playIncorrect();
      soundEngine.vibrate(35);
      triggerScreenShake(2);
      setMessage(`Belum tepat! ${target.a} × ${target.b} = ${target.answer}`);
    }
    window.setTimeout(() => { inputLockRef.current = false; setInputLocked(false); }, hit ? 180 : 650);
  }, [onScoreUpdate, triggerScreenShake, spawnMeteor]);

  const handleDigit = (digit: number) => {
    if (inputLockRef.current || isPaused) return;
    const next = (currentInput + String(digit)).slice(0, 3);
    setCurrentInput(next);
    const value = Number(next);
    if (meteorsRef.current.some((meteor) => meteor.answer === value)) submitAnswer(value);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isPaused) return;
      if (event.key === 'Escape' || event.key.toLowerCase() === 'p') { event.preventDefault(); onPause(); return; }
      if (inputLockRef.current) return;
      if (inputMode === 'choice' && /^[1-4]$/.test(event.key)) {
        event.preventDefault();
        const answer = choices[Number(event.key) - 1];
        if (answer !== undefined) submitAnswer(answer);
      } else if (/^[0-9]$/.test(event.key)) { event.preventDefault(); handleDigit(Number(event.key)); }
      else if (event.key === 'Backspace') { event.preventDefault(); setCurrentInput((s) => s.slice(0, -1)); }
      else if (event.key === 'Enter' && currentInput) { event.preventDefault(); submitAnswer(Number(currentInput)); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [choices, currentInput, inputMode, isPaused, onPause, submitAnswer]);

  return (
    <div className="play-shell">
      <div className="game-hud">
        <div className="hud-item"><span className="hud-label flex items-center gap-1"><Heart size={13} /> Nyawa</span><strong className="hud-value" style={{ color: '#e95470' }}>{Array.from({ length: 3 }, (_, i) => <Heart key={i} size={20} className="inline-block mr-0.5" fill={i < lives ? '#f06876' : 'none'} color={i < lives ? '#d84862' : '#b5c9d8'} />)}</strong></div>
        <div className="hud-item center"><span className="hud-label flex items-center gap-1"><Shield size={13} /> Level</span><strong className="hud-value">{wave}</strong></div>
        <div className="hud-item right"><span className="hud-label flex items-center gap-1"><Star size={13} /> Skor</span><strong className="hud-value gold">{score.toLocaleString('id-ID')}</strong></div>
      </div>

      <div ref={arenaRef} className="meteor-arena" aria-label="Arena meteor yang jatuh">
        <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none' }} />
        {meteors.map((meteor) => (
          <div key={meteor.id} ref={(element) => { if (element) meteorElementsRef.current.set(meteor.id, element); else meteorElementsRef.current.delete(meteor.id); }} className="meteor-orb" style={{ left: `${meteor.x}%`, top: 0, transform: `translate3d(-50%, -50%, 0) translateY(${meteor.y * (arenaRef.current?.clientHeight || 300) / 100}px)` }}>
            <span>{meteor.a} × {meteor.b}</span>
            <small>meteor</small>
          </div>
        ))}
        <div className="shield-line" /><div className="meteor-cannon" />
        {currentInput && <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-[5] rounded-full border-2 border-[#7ae5ff] bg-[#effcff] px-3 py-1 text-[#1656ad] font-arcade font-bold">{currentInput}</div>}
      </div>

      <div className="relative z-10 min-h-[24px] text-center text-[#3170ae] font-bold text-sm" role="status" aria-live="polite">{message}{combo >= 3 && <span className="ml-1 text-[#dc65ab]"> Runtutan {combo}!</span>}</div>
      <div className="control-area">
        {inputMode === 'choice' ? <ChoiceButtons choices={choices} onSelect={submitAnswer} disabled={isPaused || !activeTarget || inputLocked} /> : <Numpad onDigit={handleDigit} onClear={() => setCurrentInput((s) => s.slice(0, -1))} onSubmit={() => currentInput && submitAnswer(Number(currentInput))} disabled={isPaused || !activeTarget || inputLocked} />}
      </div>
    </div>
  );
}