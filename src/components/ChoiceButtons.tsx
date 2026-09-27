import { soundEngine } from '../utils/audio';

interface ChoiceButtonsProps {
  choices: number[];
  onSelect: (choice: number) => void;
  disabled?: boolean;
}

export function ChoiceButtons({ choices, onSelect, disabled = false }: ChoiceButtonsProps) {
  return (
    <div className="choice-grid" role="group" aria-label="Pilih jawaban">
      {choices.map((choice, index) => (
        <button key={`${choice}-${index}`} type="button" className="choice-btn tactile-btn" disabled={disabled} onClick={() => {
          soundEngine.playBlip();
          soundEngine.vibrate(12);
          onSelect(choice);
        }} aria-label={`Jawaban ${choice}, tombol ${index + 1}`}>
          <span className="choice-key" aria-hidden="true">{index + 1}</span>
          {choice}
        </button>
      ))}
    </div>
  );
}