import { Question, TableMasteryCell } from '../types/game';

const MASTERY_STORAGE_KEY = 'math_blitz_mastery_v1';

/**
 * Generate plausible distractor answers for multiple choice
 */
export function generateChoices(a: number, b: number): number[] {
  const answer = a * b;
  const set = new Set<number>();
  set.add(answer);

  // Common mistake candidates:
  const candidates: number[] = [
    // Off by a or b
    answer + a,
    answer - a,
    answer + b,
    answer - b,
    // Close neighboring facts
    (a + 1) * b,
    Math.max(1, (a - 1)) * b,
    a * (b + 1),
    a * Math.max(1, (b - 1)),
    // Addition mistake
    a + b,
    // Off by 2, 10, or small variation
    answer + 2,
    answer - 2,
    answer + 10,
    answer - 10,
  ];

  // Shuffle candidates
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  for (const c of candidates) {
    if (c > 0 && c <= 110 && !set.has(c)) {
      set.add(c);
      if (set.size === 4) break;
    }
  }

  // Fallback if not enough unique options
  let offset = 1;
  while (set.size < 4) {
    const fallback1 = answer + offset;
    const fallback2 = Math.max(1, answer - offset);
    if (!set.has(fallback1)) set.add(fallback1);
    if (set.size < 4 && !set.has(fallback2)) set.add(fallback2);
    offset++;
  }

  const choices = Array.from(set);
  // Fisher-Yates shuffle choices
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }

  return choices;
}

/**
 * Generate a new random multiplication question from allowed tables (1 to 10)
 */
export function generateQuestion(
  allowedTables: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  lastQuestion?: { a: number; b: number }
): Question {
  const tables = allowedTables.length > 0 ? allowedTables : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  
  let a: number;
  let b: number;
  let attempts = 0;

  do {
    // Pick table from allowed
    a = tables[Math.floor(Math.random() * tables.length)];
    // Multiplied by 1..10
    b = Math.floor(Math.random() * 10) + 1;
    attempts++;
  } while (
    lastQuestion &&
    attempts < 10 &&
    ((a === lastQuestion.a && b === lastQuestion.b) || (a === lastQuestion.b && b === lastQuestion.a))
  );

  // 50% chance to flip order for variety (e.g. 7 x 4 vs 4 x 7)
  if (Math.random() > 0.5) {
    const temp = a;
    a = b;
    b = temp;
  }

  const answer = a * b;
  const choices = generateChoices(a, b);

  return {
    id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    a,
    b,
    answer,
    choices,
    createdAt: Date.now(),
  };
}

/**
 * Mastery persistence for 10x10 Dojo Heatmap
 */
export function getMasteryData(): Record<string, TableMasteryCell> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(MASTERY_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function recordMasteryResult(a: number, b: number, correct: boolean, timeMs: number) {
  if (typeof window === 'undefined') return;
  try {
    const data = getMasteryData();
    // Normalize key so 6x7 and 7x6 both contribute
    const min = Math.min(a, b);
    const max = Math.max(a, b);
    const key = `${min}x${max}`;

    const prev = data[key] || {
      a: min,
      b: max,
      attempts: 0,
      correct: 0,
      avgTimeMs: 0,
    };

    const newAttempts = prev.attempts + 1;
    const newCorrect = prev.correct + (correct ? 1 : 0);
    const newAvgTime = Math.round(
      (prev.avgTimeMs * prev.attempts + timeMs) / newAttempts
    );

    data[key] = {
      a: min,
      b: max,
      attempts: newAttempts,
      correct: newCorrect,
      avgTimeMs: newAvgTime,
    };

    localStorage.setItem(MASTERY_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Local storage full or unavailable
  }
}

export function resetMasteryData() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(MASTERY_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

/**
 * Grade evaluation based on performance
 */
export function calculateGrade(accuracy: number, total: number, score: number = 0) {
  if (total < 5 && score < 1000) {
    return { rank: 'C', title: 'Calon Juara', color: '#198bd2' };
  }
  if (accuracy >= 95 && total >= 25) {
    return { rank: 'SSS', title: 'Bintang Matematika', color: '#eaa022' };
  }
  if (accuracy >= 90 && total >= 20) {
    return { rank: 'SS', title: 'Juara Perkalian', color: '#c665bb' };
  }
  if (accuracy >= 85 && total >= 18) {
    return { rank: 'S', title: 'Penjelajah Hebat', color: '#148fc8' };
  }
  if (accuracy >= 75 && total >= 12) {
    return { rank: 'A', title: 'Jago Angka', color: '#17ae6a' };
  }
  if (accuracy >= 60) {
    return { rank: 'B', title: 'Terus Semangat', color: '#9868dc' };
  }
  return { rank: 'C', title: 'Calon Juara', color: '#198bd2' };
}
