export type GameMode = 'blitz' | 'meteor' | 'sprint' | 'dojo';

export type InputMode = 'numpad' | 'choice';

export interface Question {
  id: string;
  a: number;
  b: number;
  answer: number;
  choices: number[];
  createdAt: number;
}

export interface MeteorItem {
  id: string;
  a: number;
  b: number;
  answer: number;
  x: number; // 10% to 90%
  y: number; // 0% to 100%
  speed: number;
  radius: number;
  color: string;
}

export interface QuestionHistoryItem {
  a: number;
  b: number;
  userAnswer?: number;
  correctAnswer: number;
  correct: boolean;
  responseTimeMs: number;
}

export interface GameStats {
  score: number;
  combo: number;
  maxCombo: number;
  correct: number;
  incorrect: number;
  totalAnswered: number;
  startTime: number;
  endTime?: number;
  history: QuestionHistoryItem[];
}

export interface HighScoreItem {
  id: string;
  mode: GameMode;
  score: number;
  timeSeconds?: number;
  accuracy: number;
  maxCombo: number;
  date: string;
  playerName: string;
  tablesSummary: string;
}

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  volume: number; // 0 - 1
  screenShake: number; // 0 (off), 0.5 (medium), 1 (high)
  inputMode: InputMode;
  grade: number; // Elementary-school grade 1 - 6
  selectedTables: number[]; // e.g. [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
}

export interface TableMasteryCell {
  a: number;
  b: number;
  attempts: number;
  correct: number;
  avgTimeMs: number;
}
