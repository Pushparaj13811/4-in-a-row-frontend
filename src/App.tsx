import { useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { ConnectionStatusBanner } from '@/components/ConnectionStatusBanner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { ReconnectPrompt } from '@/components/ReconnectPrompt';
import { ExitConfirmDialog } from '@/components/ExitConfirmDialog';
import { LoadingFallback } from '@/components/LoadingFallback';
import { wsService } from '@/services/websocket';

// Lazy load heavy components for code splitting
const Leaderboard = lazy(() => import('@/components/Leaderboard').then(m => ({ default: m.Leaderboard })));
const LoginScreen = lazy(() => import('@/components/screens').then(m => ({ default: m.LoginScreen })));
const WaitingScreen = lazy(() => import('@/components/screens').then(m => ({ default: m.WaitingScreen })));
const PlayingScreen = lazy(() => import('@/components/screens').then(m => ({ default: m.PlayingScreen })));
const FinishedScreen = lazy(() => import('@/components/screens').then(m => ({ default: m.FinishedScreen })));
import {
  useGameState,
  useUIState,
  useOpponentDisconnect,
  useReconnection,
  useGameHandlers,
  useWebSocketMessages,
} from '@/hooks';
import { WEBSOCKET_URL, STORAGE_KEYS } from '@/constants/game.constants';
import { sessionStorage as storage } from '@/utils/game.utils';
import './App.css';

function App() {
  // Custom hooks for state management
  const { gameState, setGameState, updateGameState, resetGameState, saveGameSession } = useGameState();
  const {
    screen,
    setScreen,
    username,
    setUsername,
    usernameInput,
    setUsernameInput,
    errorMessage,
    showError,
    clearError,
    waitingTimeLeft,
    setWaitingTimeLeft,
    showLeaderboard,
    setShowLeaderboard,
    leaderboardData,
    setLeaderboardData,
    connectionStatus,
    setConnectionStatus,
    isJoining,
    setIsJoining,
    showReconnectPrompt,
    setShowReconnectPrompt,
    showExitConfirm,
    setShowExitConfirm,
  } = useUIState();

  const {
    opponentDisconnected,
    reconnectTimeLeft,
    startDisconnectTimer,
    clearDisconnect,
  } = useOpponentDisconnect();

  const {
    wasDisconnectedRef,
    attemptReconnect,
    resetReconnectAttempts,
    markAsDisconnected,
    clearDisconnectFlag,
    cleanupReconnect,
  } = useReconnection(setShowReconnectPrompt);

  // WebSocket message handler
  const { handleMessage } = useWebSocketMessages({
    setScreen,
    setGameState,
    updateGameState,
    setWaitingTimeLeft,
    setIsJoining,
    setShowReconnectPrompt,
    setLeaderboardData,
    showError,
    clearError,
    startDisconnectTimer,
    clearDisconnect,
    resetGameState,
    saveGameSession,
    resetReconnectAttempts,
    clearDisconnectFlag,
  });

  // Game action handlers
  const {
    handleLogin,
    handleColumnClick,
    handleManualReconnect,
    handlePlayAgain,
    handleExitGame,
  } = useGameHandlers({
    gameState,
    usernameInput,
    username,
    connectionStatus,
    isJoining,
    opponentDisconnected,
    setUsername,
    setIsJoining,
    showError,
    resetGameState,
    saveGameSession,
    setShowReconnectPrompt,
  });

  // Refs for timers
  const waitingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle connection state changes
  const handleConnectionChange = useCallback((connected: boolean) => {
    if (connected) {
      setConnectionStatus('connected');
      clearError();

      const savedGameId = storage.get(STORAGE_KEYS.GAME_ID);
      const savedUsername = storage.get(STORAGE_KEYS.USERNAME);

      if (savedGameId && savedUsername && wasDisconnectedRef.current) {
        console.log('🔄 Connection restored, attempting to rejoin game...');
        resetReconnectAttempts();
        attemptReconnect();
      }
    } else {
      setConnectionStatus('disconnected');

      const savedGameId = storage.get(STORAGE_KEYS.GAME_ID);
      if (savedGameId && screen === 'playing') {
        markAsDisconnected();
        setTimeout(() => {
          setShowReconnectPrompt(true);
        }, 3000);
      }
    }
  }, [screen, attemptReconnect, resetReconnectAttempts, markAsDisconnected, setConnectionStatus, clearError, setShowReconnectPrompt]);

  // Connect to WebSocket on mount
  useEffect(() => {
    let isSubscribed = true;

    setConnectionStatus('connecting');
    clearError();

    const unsubscribeConnection = wsService.onConnectionChange((connected) => {
      if (!isSubscribed) return;
      handleConnectionChange(connected);
    });

    const unsubscribeMessage = wsService.onMessage((message) => {
      if (!isSubscribed) return;
      handleMessage(message);
    });

    // Check if already connected
    if (wsService.isConnected()) {
      setConnectionStatus('connected');

      const savedGameId = storage.get(STORAGE_KEYS.GAME_ID);
      const savedUsername = storage.get(STORAGE_KEYS.USERNAME);
      if (savedGameId && savedUsername && screen === 'login') {
        console.log('🔄 Detected page refresh with active game session, attempting rejoin...');
        setUsername(savedUsername);
        markAsDisconnected();
        wsService.rejoinGame(savedUsername, savedGameId);
      }
    } else {
      wsService
        .connect(WEBSOCKET_URL)
        .then(() => {
          if (!isSubscribed) return;
          setConnectionStatus('connected');
          clearError();

          const savedGameId = storage.get(STORAGE_KEYS.GAME_ID);
          const savedUsername = storage.get(STORAGE_KEYS.USERNAME);
          if (savedGameId && savedUsername && screen === 'login') {
            console.log('🔄 Detected page refresh with active game session, attempting rejoin...');
            setUsername(savedUsername);
            markAsDisconnected();
            wsService.rejoinGame(savedUsername, savedGameId);
          }
        })
        .catch((error) => {
          if (!isSubscribed) return;
          console.error('Failed to connect:', error);
          setConnectionStatus('disconnected');
          showError('Failed to connect to game server');
        });
    }

    return () => {
      isSubscribed = false;
      unsubscribeMessage();
      unsubscribeConnection();
      cleanupReconnect();
      if (waitingTimerRef.current) {
        clearInterval(waitingTimerRef.current);
      }
    };
  }, [handleMessage, handleConnectionChange, markAsDisconnected, setUsername, setConnectionStatus, clearError, showError, cleanupReconnect]);

  // Waiting timer countdown
  useEffect(() => {
    if (screen === 'waiting' && waitingTimeLeft > 0) {
      const timer = setInterval(() => {
        setWaitingTimeLeft((prev) => {
          if (prev <= 1) return 0;
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [screen, waitingTimeLeft, setWaitingTimeLeft]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // ESC to close leaderboard
      if (e.key === 'Escape' && showLeaderboard) {
        setShowLeaderboard(false);
      }

      // L key to toggle leaderboard
      if (e.key === 'l' || e.key === 'L') {
        if (!showLeaderboard) {
          wsService.getLeaderboard();
        }
        setShowLeaderboard(!showLeaderboard);
      }

      // Number keys 1-7 for column selection during game
      if (screen === 'playing' && gameState.yourColor === gameState.currentPlayer && !gameState.winner) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 7) {
          handleColumnClick(num - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showLeaderboard, screen, gameState, handleColumnClick, setShowLeaderboard]);

  // Handler functions
  const handleLeaderboardToggle = useCallback(() => {
    if (!showLeaderboard) {
      wsService.getLeaderboard();
    }
    setShowLeaderboard(!showLeaderboard);
  }, [showLeaderboard, setShowLeaderboard]);

  const handleShowExitConfirm = useCallback(() => {
    if (screen === 'playing' || screen === 'waiting') {
      setShowExitConfirm(true);
    } else {
      handleExitGame();
    }
  }, [screen, handleExitGame, setShowExitConfirm]);

  const confirmExit = useCallback(() => {
    if (waitingTimerRef.current) {
      clearInterval(waitingTimerRef.current);
    }
    handleExitGame();
    setShowExitConfirm(false);
  }, [handleExitGame, setShowExitConfirm]);

  const cancelExit = useCallback(() => {
    setShowExitConfirm(false);
  }, [setShowExitConfirm]);

  return (
    <div className="app">
      <ConnectionStatusBanner status={connectionStatus} />

      {showReconnectPrompt && (
        <ReconnectPrompt
          onReconnect={handleManualReconnect}
          onNewGame={confirmExit}
        />
      )}

      {showExitConfirm && (
        <ExitConfirmDialog
          screen={screen}
          onConfirm={confirmExit}
          onCancel={cancelExit}
        />
      )}

      <ErrorMessage message={errorMessage} />

      <Suspense fallback={<LoadingFallback />}>
        {screen === 'login' && (
          <LoginScreen
            usernameInput={usernameInput}
            setUsernameInput={setUsernameInput}
            connectionStatus={connectionStatus}
            isJoining={isJoining}
            onLogin={handleLogin}
            onShowLeaderboard={handleLeaderboardToggle}
          />
        )}

        {screen === 'waiting' && (
          <WaitingScreen
            username={username}
            waitingTimeLeft={waitingTimeLeft}
            onCancel={handleShowExitConfirm}
          />
        )}

        {screen === 'playing' && (
          <PlayingScreen
            username={username}
            gameState={gameState}
            opponentDisconnected={opponentDisconnected}
            reconnectTimeLeft={reconnectTimeLeft}
            onColumnClick={handleColumnClick}
            onExitGame={handleShowExitConfirm}
            onShowLeaderboard={handleLeaderboardToggle}
          />
        )}

        {screen === 'finished' && (
          <FinishedScreen
            gameState={gameState}
            onPlayAgain={handlePlayAgain}
            onShowLeaderboard={handleLeaderboardToggle}
            onBackToLogin={confirmExit}
          />
        )}
      </Suspense>

      {showLeaderboard && (
        <Suspense fallback={<LoadingFallback />}>
          <Leaderboard
            data={leaderboardData}
            onClose={() => setShowLeaderboard(false)}
          />
        </Suspense>
      )}
    </div>
  );
}

export default App;
