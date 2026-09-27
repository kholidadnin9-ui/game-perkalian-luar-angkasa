import { Check, Delete } from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface NumpadProps {
  onDigit: (digit: number) => void;
  onClear: () => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export function Numpad({ onDigit, onClear, onSubmit, disabled = false }: NumpadProps) {
  const press = (action: () => void) => {
    soundEngine.playBlip();
    soundEngine.vibrate(10);
    action();
  };

  return (
    <div className="numpad-grid" role="group" aria-label="Papan angka">
      {[1,2,3,4,5,6,7,8,9].map((digit) => (
        <button key={digit} type="button" disabled={disabled} className="numpad-btn tactile-btn" aria-label={`Angka ${digit}`} onClick={() => press(() => onDigit(digit))}>{digit}</button>
      ))}
      <button type="button" disabled={disabled} className="numpad-btn clear tactile-btn" aria-label="Hapus angka terakhir" title="Hapus (Backspace)" onClick={() => press(onClear)}><Delete /></button>
      <button type="button" disabled={disabled} className="numpad-btn tactile-btn" aria-label="Angka 0" onClick={() => press(() => onDigit(0))}>0</button>
      <button type="button" disabled={disabled} className="numpad-btn enter tactile-btn" aria-label="Periksa jawaban" title="Periksa (Enter)" onClick={() => press(onSubmit)}><Check /></button>
    </div>
  );
}