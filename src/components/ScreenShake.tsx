import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

interface ScreenShakeProps {
  intensity: number;
  settingsMultiplier: number;
  children: ReactNode;
}

export function ScreenShake({ intensity, settingsMultiplier, children }: ScreenShakeProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const remainingRef = useRef(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!intensity || !settingsMultiplier) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    remainingRef.current = Math.min(19, intensity * settingsMultiplier * 3);
    if (wrapperRef.current) wrapperRef.current.style.willChange = 'transform';
    if (frameRef.current !== null) return;

    const animate = () => {
      const element = wrapperRef.current;
      const strength = remainingRef.current;
      if (!element || strength < .3) {
        if (element) { element.style.transform = ''; element.style.willChange = ''; }
        frameRef.current = null;
        remainingRef.current = 0;
        return;
      }
      const x = (Math.random() - .5) * strength;
      const y = (Math.random() - .5) * strength;
      element.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      remainingRef.current *= .83;
      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
  }, [intensity, settingsMultiplier]);

  useEffect(() => () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
  }, []);

  return <div ref={wrapperRef} className="min-h-[100svh] w-full">{children}</div>;
}