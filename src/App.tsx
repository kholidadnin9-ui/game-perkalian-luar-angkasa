import { useState, useEffect, useCallback, useMemo } from 'react';
import { GameMode, GameStats, GameSettings, InputMode } from './types/game';
import { useHighScores } from './hooks/useHighScores';
import { soundEngine } from './utils/audio';

import { ScreenShake } from './components/ScreenShake';
import { Header } from './components/Header';
import { StartScreen } from './components/StartScreen';
import { Countdown } from './components/Countdown';
import { BlitzGame } from './components/BlitzGame';
import { MeteorDefenseGame } from './components/MeteorDefenseGame';
import { SprintGame } from './components/SprintGame';
import { TableDojo } from './components/TableDojo';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { HighScoreModal } from './components/HighScoreModal';
import { SettingsModal } from './components/SettingsModal';

const SETTINGS_KEY = 'math_blitz_settings_v1';

const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  musicEnabled: false,
  volume: 0.7,
  screenShake: 1,
  inputMode: 'choice',
  grade: 2,
  selectedTables: [1, 2, 3, 4, 5],
};

export function App() {
  // Settings with persistent state
  const [settings, setSettings] = useState<GameSettings>(() => {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch {
      // Ignore
    }
    return DEFAULT_SETTINGS;
  });

  // Sync settings with SoundEngine
  useEffect(() => {
    soundEngine.setSoundEnabled(settings.soundEnabled);
    soundEngine.setMusicEnabled(settings.musicEnabled);
    soundEngine.setVolume(settings.volume);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // Ignore
    }
  }, [settings]);

  // Game flow states
  const [currentMode, setCurrentMode] = useState<GameMode | null>(null);
  const [pendingMode, setPendingMode] = useState<GameMode | null>(null);
  const [runId, setRunId] = useState(0);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameOverStats, setGameOverStats] = useState<GameStats | null>(null);
  const [liveScore, setLiveScore] = useState(0);
  const [liveCombo, setLiveCombo] = useState(0);

  // Modals
  const [isHighScoresOpen, setIsHighScoresOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Screen shake intensity
  const [shakeIntensity, setShakeIntensity] = useState(0);

  // High Scores Hook
  const {
    getScoresByMode,
    addScore,
    isHighScore,
    clearAllScores,
  } = useHighScores();

  const triggerScreenShake = useCallback((intensity: number) => {
    setShakeIntensity(intensity);
    setTimeout(() => setShakeIntensity(0), 120);
  }, []);

  const handleScoreUpdate = useCallback((score: number, combo: number) => {
    setLiveScore(score);
    setLiveCombo(combo);
  }, []);

  // Update Settings Helper
  const handleUpdateSettings = useCallback((newSettings: Partial<GameSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  // Toggle Table in selection
  const handleToggleTable = useCallback((num: number) => {
    setSettings((prev) => {
      const current = prev.selectedTables;
      let next: number[];
      if (current.includes(num)) {
        if (current.length === 1) return prev; // Keep at least 1 table
        next = current.filter((t) => t !== num);
      } else {
        next = [...current, num].sort((a, b) => a - b);
      }
      return { ...prev, selectedTables: next };
    });
  }, []);

  const handleSetPresetTables = useCallback((tables: number[]) => {
    soundEngine.playBlip();
    setSettings((prev) => ({ ...prev, selectedTables: tables }));
  }, []);

  const handleSetInputMode = useCallback((mode: InputMode) => {
    setSettings((prev) => ({ ...prev, inputMode: mode }));
  }, []);

  const handleSelectGrade = useCallback((grade: number) => {
    const selectedTables = grade === 1 ? [1, 2, 5] : grade === 2 ? [1, 2, 3, 4, 5] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    setSettings((prev) => ({ ...prev, grade, selectedTables }));
  }, []);

  // Start Game sequence with countdown
  const handleStartGame = useCallback((mode: GameMode) => {
    if (mode === 'dojo') {
      // Dojo doesn't need a countdown, directly open
      setCurrentMode('dojo');
      setIsGameOver(false);
      setIsPaused(false);
      return;
    }

    setLiveScore(0);
    setLiveCombo(0);
    setPendingMode(mode);
    setIsCountingDown(true);
    setIsPaused(false);
    setIsGameOver(false);
  }, []);

  const handleCountdownComplete = useCallback(() => {
    setIsCountingDown(false);
    if (pendingMode) {
      setCurrentMode(pendingMode);
      setPendingMode(null);
    }
  }, [pendingMode]);

  // Restart Current Mode
  const handleRestart = useCallback(() => {
    if (currentMode) {
      setLiveScore(0);
      setLiveCombo(0);
      setGameOverStats(null);
      setIsGameOver(false);
      setIsPaused(false);
      setPendingMode(null);
      setIsCountingDown(false);
      setRunId((id) => id + 1);
    }
  }, [currentMode]);

  // Pause / Resume
  const handleTogglePause = useCallback(() => {
    if (!currentMode || isGameOver || isCountingDown) return;
    setIsPaused((prev) => !prev);
  }, [currentMode, isGameOver, isCountingDown]);

  // Game Over Trigger
  const handleGameOver = useCallback((stats: GameStats) => {
    setGameOverStats(stats);
    setIsGameOver(true);
  }, []);

  // Return to Home
  const handleGoHome = useCallback(() => {
    setCurrentMode(null);
    setPendingMode(null);
    setIsCountingDown(false);
    setIsPaused(false);
    setIsGameOver(false);
    setIsHighScoresOpen(false);
    setIsSettingsOpen(false);
  }, []);

  // Keyboard shortcut for Mute (M key) and Esc
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

      if (e.key === 'm' || e.key === 'M') {
        const next = !settings.soundEnabled;
        soundEngine.setSoundEnabled(next);
        handleUpdateSettings({ soundEnabled: next });
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [settings.soundEnabled, handleUpdateSettings]);

  // Tables summary string for leaderboards
  const selectedTablesSummary = useMemo(() => {
    if (settings.selectedTables.length === 10) return 'Angka 1-10';
    if (settings.selectedTables.length === 5 && settings.selectedTables[0] === 1) return 'Angka 1-5';
    if (settings.selectedTables.length === 5 && settings.selectedTables[0] === 6) return 'Angka 6-10';
    return `Angka ${settings.selectedTables.join(',')}`;
  }, [settings.selectedTables]);

  const isCurrentHighScore = useMemo(() => {
    if (!currentMode || !gameOverStats) return false;
    const value =
      currentMode === 'sprint'
        ? (gameOverStats.endTime ? gameOverStats.endTime - gameOverStats.startTime : 60000) / 1000
        : gameOverStats.score;
    return isHighScore(currentMode, value);
  }, [currentMode, gameOverStats, isHighScore]);

  return (
    <ScreenShake intensity={shakeIntensity} settingsMultiplier={settings.screenShake}>
      <div className="space-page flex flex-col">
        {currentMode && <Header
          gameMode={currentMode}
          isPlaying={!!currentMode && !isGameOver && currentMode !== 'dojo'}
          isPaused={isPaused}
          soundEnabled={settings.soundEnabled}
          onToggleSound={() => {
            const next = !settings.soundEnabled;
            soundEngine.setSoundEnabled(next);
            handleUpdateSettings({ soundEnabled: next });
          }}
          onTogglePause={handleTogglePause}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenHighScores={() => setIsHighScoresOpen(true)}
          onGoHome={handleGoHome}
        />}

        {/* Main Content Viewport */}
        <main className={`relative z-10 flex-1 flex flex-col justify-center items-center ${currentMode ? 'px-3 py-5 sm:py-7' : ''}`}>
          {/* Start Screen */}
          {!currentMode && !isCountingDown && (
            <StartScreen
              onStartGame={handleStartGame}
              grade={settings.grade}
              onSelectGrade={handleSelectGrade}
              selectedTables={settings.selectedTables}
              onToggleTable={handleToggleTable}
              onSetPresetTables={handleSetPresetTables}
              inputMode={settings.inputMode}
              onSetInputMode={handleSetInputMode}
              soundEnabled={settings.soundEnabled}
              onToggleSound={() => {
                const next = !settings.soundEnabled;
                soundEngine.setSoundEnabled(next);
                handleUpdateSettings({ soundEnabled: next });
              }}
              onOpenHighScores={() => setIsHighScoresOpen(true)}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />
          )}

          {/* 3-2-1 GO Countdown Overlay */}
          {isCountingDown && <Countdown onComplete={handleCountdownComplete} />}

          {/* Active Game Mode Screens */}
          {currentMode === 'blitz' && !isCountingDown && (
            <BlitzGame
              key={`blitz-${runId}`}
              allowedTables={settings.selectedTables}
              inputMode={settings.inputMode}
              isPaused={isPaused || isGameOver || isHighScoresOpen || isSettingsOpen}
              onGameOver={handleGameOver}
              onPause={() => setIsPaused(true)}
              triggerScreenShake={triggerScreenShake}
              onScoreUpdate={handleScoreUpdate}
            />
          )}

          {currentMode === 'meteor' && !isCountingDown && (
            <MeteorDefenseGame
              key={`meteor-${runId}`}
              allowedTables={settings.selectedTables}
              inputMode={settings.inputMode}
              isPaused={isPaused || isGameOver || isHighScoresOpen || isSettingsOpen}
              onGameOver={handleGameOver}
              onPause={() => setIsPaused(true)}
              triggerScreenShake={triggerScreenShake}
              onScoreUpdate={handleScoreUpdate}
            />
          )}

          {currentMode === 'sprint' && !isCountingDown && (
            <SprintGame
              key={`sprint-${runId}`}
              allowedTables={settings.selectedTables}
              inputMode={settings.inputMode}
              isPaused={isPaused || isGameOver || isHighScoresOpen || isSettingsOpen}
              totalQuestions={25}
              onGameOver={handleGameOver}
              onPause={() => setIsPaused(true)}
              triggerScreenShake={triggerScreenShake}
              onScoreUpdate={handleScoreUpdate}
            />
          )}

          {currentMode === 'dojo' && (
            <TableDojo
              onBack={handleGoHome}
              triggerScreenShake={triggerScreenShake}
              isBlocked={isHighScoresOpen || isSettingsOpen}
            />
          )}
        </main>

        {/* Pause Modal */}
        {isPaused && !isHighScoresOpen && !isSettingsOpen && (
          <PauseModal
            mode={currentMode}
            onResume={() => setIsPaused(false)}
            onRestart={handleRestart}
            onQuit={handleGoHome}
            soundEnabled={settings.soundEnabled}
            onToggleSound={() => {
              const next = !settings.soundEnabled;
              soundEngine.setSoundEnabled(next);
              handleUpdateSettings({ soundEnabled: next });
            }}
            currentScore={liveScore}
            currentCombo={liveCombo}
          />
        )}

        {/* Game Over Modal */}
        {isGameOver && gameOverStats && currentMode && (
          <GameOverModal
            mode={currentMode}
            stats={gameOverStats}
            selectedTablesSummary={selectedTablesSummary}
            onRestart={handleRestart}
            onGoHome={handleGoHome}
            onOpenHighScores={() => setIsHighScoresOpen(true)}
            isHighScore={isCurrentHighScore}
            isOverlayOpen={isHighScoresOpen || isSettingsOpen}
            onSaveHighScore={addScore}
          />
        )}

        {/* High Scores Modal */}
        {isHighScoresOpen && (
          <HighScoreModal
            onClose={() => setIsHighScoresOpen(false)}
            getScoresByMode={getScoresByMode}
            onClearScores={clearAllScores}
          />
        )}

        {/* Settings Modal */}
        {isSettingsOpen && (
          <SettingsModal
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onClose={() => setIsSettingsOpen(false)}
          />
        )}
      </div>
    </ScreenShake>
  );
}

export default App;
