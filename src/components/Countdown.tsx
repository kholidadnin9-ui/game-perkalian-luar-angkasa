import { useEffect, useState } from 'react';
import { soundEngine } from '../utils/audio';
import { StarArt } from './SpaceArt';

interface CountdownProps { onComplete: () => void }

export function Countdown({ onComplete }: CountdownProps) {
  const [count, setCount] = useState<number | string>(3);

  useEffect(() => {
    soundEngine.playCountdown();
    const timers = [
      window.setTimeout(() => { setCount(2); soundEngine.playCountdown(); }, 750),
      window.setTimeout(() => { setCount(1); soundEngine.playCountdown(); }, 1500),
      window.setTimeout(() => { setCount('MULAI!'); soundEngine.playCountdown(true); }, 2250),
      window.setTimeout(onComplete, 2900),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="space-overlay" role="status" aria-live="assertive">
      <div className="space-dialog !w-[340px] !text-center !overflow-visible">
        <StarArt className="w-14 h-14 mx-auto animate-float" />
        <p className="font-arcade font-bold text-xl text-[#1362b7] mt-3">Siap-siap, penjelajah!</p>
        <div key={String(count)} className={`font-arcade font-bold leading-none my-5 animate-pop ${count === 'MULAI!' ? 'text-[53px] text-[#19b67b]' : 'text-[110px] text-[#ffb934]'}`} style={{ textShadow: '0 5px 0 #124892' }}>{count}</div>
        <p className="font-bold text-[#6985a8]">Tunjukkan kehebatanmu!</p>
      </div>
    </div>
  );
}