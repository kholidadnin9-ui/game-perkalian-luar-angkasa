import { useEffect, useState } from 'react';
import { Medal, Trash2, Trophy, X } from 'lucide-react';
import type { GameMode, HighScoreItem } from '../types/game';
import { soundEngine } from '../utils/audio';
import { StarArt } from './SpaceArt';

interface HighScoreModalProps {
  onClose: () => void;
  getScoresByMode: (mode: GameMode) => HighScoreItem[];
  onClearScores: () => void;
}

const tabs: { mode: GameMode; name: string }[] = [
  { mode: 'blitz', name: 'Main Kilat' },
  { mode: 'meteor', name: 'Misi Meteor' },
  { mode: 'sprint', name: 'Balap Angka' },
];

export function HighScoreModal({ onClose, getScoresByMode, onClearScores }: HighScoreModalProps) {
  const [activeTab, setActiveTab] = useState<GameMode>('blitz');
  const [confirmClear, setConfirmClear] = useState(false);
  const scores = getScoresByMode(activeTab).slice(0, 10);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); onClose(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="space-overlay" role="dialog" aria-modal="true" aria-label="Papan juara">
      <div className="space-dialog wide-dialog">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2"><Trophy size={38} fill="#ffd34d" color="#e5981b" /><div><h2 className="dialog-title !text-left">Papan Juara</h2><p className="text-sm text-[#6583a6] font-bold">Rekor tersimpan di perangkat ini</p></div></div>
          <button type="button" className="dialog-close tactile-btn" onClick={onClose} aria-label="Tutup papan juara"><X /></button>
        </div>

        <div className="grid grid-cols-3 gap-2 my-5" role="tablist" aria-label="Mode permainan">
          {tabs.map(({ mode, name }) => <button key={mode} type="button" role="tab" aria-selected={activeTab === mode} className={`setup-chip tactile-btn !px-1 !min-h-[45px] text-xs sm:text-sm ${activeTab === mode ? 'active' : ''}`} onClick={() => { soundEngine.playBlip(); setActiveTab(mode); }}>{name}</button>)}
        </div>

        <div className="min-h-[180px] max-h-[47svh] overflow-y-auto space-y-2 pr-1">
          {scores.length === 0 ? <div className="text-center py-7"><StarArt className="w-16 h-16 mx-auto mb-2 animate-float" /><strong className="block text-[#1456a7] font-arcade text-xl">Belum ada rekor!</strong><p className="text-[#6686a9] font-bold text-sm">Main sekarang dan jadi juara pertama.</p></div> : scores.map((item, index) => (
            <div key={item.id} className={`flex items-center justify-between gap-2 p-3 rounded-[17px] border-[2px] ${index === 0 ? 'bg-[#fff8cc] border-[#ffd362]' : 'bg-white border-[#d0ecff]'}`}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 flex-none text-center">{index < 3 ? <Medal className="w-7 h-7" fill={index === 0 ? '#ffd149' : index === 1 ? '#b9d0e5' : '#dbaa81'} color={index === 0 ? '#e49c27' : '#7698bb'} /> : <strong className="font-arcade text-[#6587ae]">{index + 1}.</strong>}</div>
                <div className="min-w-0"><strong className="font-arcade text-base sm:text-lg text-[#12458f] truncate block">{item.playerName}</strong><span className="text-xs text-[#7490aa] font-bold">{new Date(`${item.date}T12:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} · {item.accuracy}% benar</span></div>
              </div>
              <strong className="font-arcade text-lg sm:text-xl text-[#e59a1d] whitespace-nowrap">{activeTab === 'sprint' ? `${item.timeSeconds?.toFixed(2) || '0.00'} dtk` : item.score.toLocaleString('id-ID')}</strong>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between gap-2">
          {confirmClear ? <div className="flex items-center gap-2 flex-wrap"><span className="text-xs font-bold text-[#dc5767]">Hapus semua rekor?</span><button type="button" className="secondary-action tactile-btn !text-[#c74054] !min-h-[36px]" onClick={() => { onClearScores(); setConfirmClear(false); }}>Ya, hapus</button><button type="button" className="text-xs font-bold text-[#6587a8]" onClick={() => setConfirmClear(false)}>Batal</button></div> : <button type="button" onClick={() => setConfirmClear(true)} className="text-xs font-bold text-[#8197ae] hover:text-[#e25867] inline-flex items-center gap-1"><Trash2 size={15} /> Hapus rekor</button>}
          <button type="button" className="secondary-action tactile-btn" onClick={onClose}>Tutup</button>
        </div>
      </div>
    </div>
  );
}