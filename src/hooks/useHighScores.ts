import { useState, useEffect, useCallback } from 'react';
import { HighScoreItem, GameMode } from '../types/game';

const HIGH_SCORES_STORAGE_KEY = 'math_blitz_high_scores_v1';

export function useHighScores() {
  const [scores, setScores] = useState<HighScoreItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(HIGH_SCORES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Remove prelaunch demonstration rows if an earlier version saved them.
          return parsed.filter((item: HighScoreItem) => !/^d[1-7]$/.test(item.id));
        }
      }
    } catch {
      // fallback
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(HIGH_SCORES_STORAGE_KEY, JSON.stringify(scores));
    } catch {
      // Ignore storage errors
    }
  }, [scores]);

  const addScore = useCallback((item: Omit<HighScoreItem, 'id' | 'date'>) => {
    const newItem: HighScoreItem = {
      ...item,
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      date: new Date().toISOString().split('T')[0],
    };

    setScores((prev) => {
      return [...prev, newItem];
    });

    return newItem;
  }, []);

  const getScoresByMode = useCallback(
    (mode: GameMode) => {
      const filtered = scores.filter((s) => s.mode === mode);
      if (mode === 'sprint') {
        // Lower time is better
        return filtered.sort((a, b) => (a.timeSeconds || 9999) - (b.timeSeconds || 9999));
      }
      // Higher score is better
      return filtered.sort((a, b) => b.score - a.score);
    },
    [scores]
  );

  const isHighScore = useCallback(
    (mode: GameMode, value: number): boolean => {
      const modeScores = getScoresByMode(mode);
      if (mode !== 'sprint' && value <= 0) return false;
      if (modeScores.length < 5) return true;
      if (mode === 'sprint') {
        // value is time in seconds, lower is better
        return value < (modeScores[4]?.timeSeconds || 9999);
      }
      // value is score, higher is better
      return value > (modeScores[4]?.score || 0);
    },
    [getScoresByMode]
  );

  const clearAllScores = useCallback(() => {
    setScores([]);
    try {
      localStorage.removeItem(HIGH_SCORES_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  return {
    scores,
    addScore,
    getScoresByMode,
    isHighScore,
    clearAllScores,
  };
}
