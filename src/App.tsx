import { useState, useEffect, useCallback, useRef } from 'react';
import { Board } from '@/components/Board';
import { Leaderboard } from '@/components/Leaderboard';
import { wsService } from '@/services/websocket';
import type {
  ServerMessage,
  GameScreen,
  GameState,
  LeaderboardPlayer,
  ConnectionStatus,
} from '@/types';
import {
  WEBSOCKET_URL,
  INITIAL_GAME_STATE,
  STORAGE_KEYS,
  MATCHMAKING_TIMEOUT,
} from '@/constants/game.constants';
import {
  getResultMessage,
  getResultClass,
  getOpponentName,
  getOppositeColor,
  validateUsername,
  sessionStorage as storage,
} from '@/utils/game.utils';
import './App.css';

function App() {
  // UI state
  const [screen, setScreen] = useState<GameScreen>('login');
  const [username, setUsername] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [waitingTimeLeft, setWaitingTimeLeft] = useState(MATCHMAKING_TIMEOUT);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardPlayer[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [isJoining, setIsJoining] = useState(false);
  const [showReconnectPrompt, setShowReconnectPrompt] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);
  const [reconnectTimeLeft, setReconnectTimeLeft] = useState(30);

  // Game state
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);

  // Refs for auto-reconnect and waiting timer
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const waitingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const wasDisconnectedRef = useRef(false); // Track if we were disconnected from active game

  // Handle WebSocket messages
  const handleMessage = useCallback((message: ServerMessage) => {
    console.log('Received message:', message);

    switch (message.type) {
      case 'waiting':
        // Clear any old session data when entering matchmaking
        storage.remove(STORAGE_KEYS.GAME_ID);
        storage.remove(STORAGE_KEYS.USERNAME);
        wasDisconnectedRef.current = false;

        setScreen('waiting');
        setWaitingTimeLeft(message.timeLeft);
        setIsJoining(false);
        break;

      case 'gameStart':
        // Clear waiting timer
        if (waitingTimerRef.current) {
          clearInterval(waitingTimerRef.current);
        }

        setGameState({
          gameId: message.gameId,
          yourColor: message.yourColor,
          currentPlayer: message.currentPlayer,
          board: message.board,
          opponent: message.opponent,
          winner: null,
        });
        setScreen('playing');
        setIsJoining(false);
        setShowReconnectPrompt(false);
        setOpponentDisconnected(false);
        reconnectAttemptsRef.current = 0;
        wasDisconnectedRef.current = false;

        // Save session for reconnection (only after game has actually started)
        storage.save(STORAGE_KEYS.GAME_ID, message.gameId);
        setUsername((currentUsername) => {
          storage.save(STORAGE_KEYS.USERNAME, currentUsername);
          return currentUsername;
        });
        break;

      case 'move':
        setGameState((prev) => ({
          ...prev,
          board: message.board,
          currentPlayer: message.currentPlayer,
          winner: message.winner,
        }));
        // Clear opponent disconnected state when receiving a move (opponent has reconnected)
        setOpponentDisconnected(false);
        if (message.winner) {
          setScreen('finished');
          wasDisconnectedRef.current = false; // Game ended normally, not a disconnect
          // Clear session when game ends
          storage.remove(STORAGE_KEYS.GAME_ID);
          storage.remove(STORAGE_KEYS.USERNAME);
        }
        break;

      case 'rejoinSuccess':
        setGameState({
          gameId: message.gameId,
          yourColor: message.yourColor,
          currentPlayer: message.currentPlayer,
          board: message.board,
          opponent: message.opponent || null,
          winner: null,
        });
        setScreen('playing');
        setShowReconnectPrompt(false);
        setOpponentDisconnected(false);
        setErrorMessage('');
        reconnectAttemptsRef.current = 0;
        break;

      case 'leaderboard':
        setLeaderboardData(message.data);
        break;

      case 'error':
        setErrorMessage(message.message);
        setIsJoining(false);
        setTimeout(() => setErrorMessage(''), 5000);
        break;

      case 'opponentDisconnected':
        setOpponentDisconnected(true);
        setReconnectTimeLeft(30);
        setErrorMessage('');
        break;

      case 'opponentLeft':
        // Opponent didn't reconnect in time - game is forfeited
        setOpponentDisconnected(false);
        setGameState((prev) => ({
          ...prev,
          winner: message.winner,
        }));
        setScreen('finished');
        wasDisconnectedRef.current = false;
        // Clear session when game ends
        storage.remove(STORAGE_KEYS.GAME_ID);
        storage.remove(STORAGE_KEYS.USERNAME);
        break;
    }
  }, []);

  // Auto-reconnect logic
  const attemptReconnect = useCallback(() => {
    const savedGameId = storage.get(STORAGE_KEYS.GAME_ID);
    const savedUsername = storage.get(STORAGE_KEYS.USERNAME);

    if (savedGameId && savedUsername && reconnectAttemptsRef.current < maxReconnectAttempts) {
      reconnectAttemptsRef.current += 1;
      console.log(`🔄 Auto-reconnect attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`);

      wsService.rejoinGame(savedUsername, savedGameId);

      // If still not reconnected, try again
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectTimeoutRef.current = setTimeout(() => {
          attemptReconnect();
        }, 2000); // Try every 2 seconds
      } else {
        setShowReconnectPrompt(true);
      }
    } else if (savedGameId && savedUsername) {
      setShowReconnectPrompt(true);
    }
  }, []);

  // Handle connection state changes
  const handleConnectionChange = useCallback((connected: boolean) => {
    if (connected) {
      setConnectionStatus('connected');
      setErrorMessage('');

      // Auto-reconnect ONLY if we were previously disconnected from an active game
      const savedGameId = storage.get(STORAGE_KEYS.GAME_ID);
      const savedUsername = storage.get(STORAGE_KEYS.USERNAME);

      if (savedGameId && savedUsername && wasDisconnectedRef.current) {
        console.log('🔄 Connection restored, attempting to rejoin game...');
        reconnectAttemptsRef.current = 0;
        attemptReconnect();
      }
    } else {
      setConnectionStatus('disconnected');

      // If we were in a game, mark as disconnected and show reconnect prompt after a delay
      const savedGameId = storage.get(STORAGE_KEYS.GAME_ID);
      if (savedGameId && screen === 'playing') {
        wasDisconnectedRef.current = true; // Mark that we were disconnected from active game
        reconnectTimeoutRef.current = setTimeout(() => {
          setShowReconnectPrompt(true);
        }, 3000);
      }
    }
  }, [screen, attemptReconnect]);

  // Connect to WebSocket on mount - ONLY ONCE
  useEffect(() => {
    let isSubscribed = true;

    setConnectionStatus('connecting');
    setErrorMessage('');

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

      // Check if we need to rejoin (only if we were disconnected from an active game)
      // This only happens on page refresh, not during normal app flow
      const savedGameId = storage.get(STORAGE_KEYS.GAME_ID);
      const savedUsername = storage.get(STORAGE_KEYS.USERNAME);
      if (savedGameId && savedUsername && screen === 'login') {
        // This must be a page refresh during an active game
        console.log('🔄 Detected page refresh with active game session, attempting rejoin...');
        setUsername(savedUsername);
        wasDisconnectedRef.current = true;
        wsService.rejoinGame(savedUsername, savedGameId);
      }
    } else {
      wsService
        .connect(WEBSOCKET_URL)
        .then(() => {
          if (!isSubscribed) return;
          setConnectionStatus('connected');
          setErrorMessage('');

          // Check if we need to rejoin (only if we were disconnected from an active game)
          // This only happens on page refresh, not during normal app flow
          const savedGameId = storage.get(STORAGE_KEYS.GAME_ID);
          const savedUsername = storage.get(STORAGE_KEYS.USERNAME);
          if (savedGameId && savedUsername && screen === 'login') {
            // This must be a page refresh during an active game
            console.log('🔄 Detected page refresh with active game session, attempting rejoin...');
            setUsername(savedUsername);
            wasDisconnectedRef.current = true;
            wsService.rejoinGame(savedUsername, savedGameId);
          }
        })
        .catch((error) => {
          if (!isSubscribed) return;
          console.error('Failed to connect:', error);
          setConnectionStatus('disconnected');
          setErrorMessage('Failed to connect to game server');
        });
    }

    return () => {
      isSubscribed = false;
      unsubscribeMessage();
      unsubscribeConnection();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (waitingTimerRef.current) {
        clearInterval(waitingTimerRef.current);
      }
    };
  }, [handleMessage, handleConnectionChange]);

  // Waiting timer countdown
  useEffect(() => {
    if (screen === 'waiting' && waitingTimeLeft > 0) {
      const timer = setInterval(() => {
        setWaitingTimeLeft((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [screen, waitingTimeLeft]);

  // Opponent reconnection countdown timer
  useEffect(() => {
    if (opponentDisconnected && reconnectTimeLeft > 0) {
      const timer = setInterval(() => {
        setReconnectTimeLeft((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [opponentDisconnected, reconnectTimeLeft]);

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
  }, [showLeaderboard, screen, gameState]);

  // Handle login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (isJoining) {
      setErrorMessage('Already joining a game...');
      return;
    }

    const validation = validateUsername(usernameInput);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid username');
      return;
    }

    if (connectionStatus !== 'connected') {
      setErrorMessage('Not connected to server');
      return;
    }

    const trimmedUsername = usernameInput.trim();
    setUsername(trimmedUsername);
    setIsJoining(true);
    wsService.joinGame(trimmedUsername);
    setErrorMessage('');
  };

  // Handle manual reconnect
  const handleManualReconnect = () => {
    const savedGameId = storage.get(STORAGE_KEYS.GAME_ID);
    const savedUsername = storage.get(STORAGE_KEYS.USERNAME);

    if (savedGameId && savedUsername) {
      setShowReconnectPrompt(false);
      setErrorMessage('');
      reconnectAttemptsRef.current = 0;

      if (wsService.isConnected()) {
        wsService.rejoinGame(savedUsername, savedGameId);
      } else {
        setConnectionStatus('connecting');
        wsService.connect(WEBSOCKET_URL).then(() => {
          wsService.rejoinGame(savedUsername, savedGameId);
        }).catch(() => {
          setErrorMessage('Failed to reconnect to server');
          setShowReconnectPrompt(true);
        });
      }
    }
  };

  // Handle column click
  const handleColumnClick = (column: number) => {
    // Don't allow moves if opponent is disconnected or if it's not your turn
    if (opponentDisconnected) {
      setErrorMessage('Cannot make moves while opponent is disconnected');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    if (gameState.gameId && gameState.yourColor === gameState.currentPlayer && !gameState.winner) {
      wsService.makeMove(gameState.gameId, column);
    }
  };

  // Handle leaderboard toggle
  const handleLeaderboardToggle = () => {
    if (!showLeaderboard) {
      wsService.getLeaderboard();
    }
    setShowLeaderboard(!showLeaderboard);
  };

  // Handle exit game - show confirmation
  const handleExitGame = () => {
    if (screen === 'playing' || screen === 'waiting') {
      setShowExitConfirm(true);
    } else {
      confirmExit();
    }
  };

  // Confirm exit and go to login
  const confirmExit = () => {
    // Clear waiting timer
    if (waitingTimerRef.current) {
      clearInterval(waitingTimerRef.current);
    }

    // Notify backend that user is leaving
    if (username) {
      wsService.leaveGame(username);
    }

    setScreen('login');
    setUsernameInput('');
    setUsername('');
    setGameState(INITIAL_GAME_STATE);
    setIsJoining(false);
    setErrorMessage('');
    setShowReconnectPrompt(false);
    setShowExitConfirm(false);
    wasDisconnectedRef.current = false; // Reset disconnection flag
    storage.remove(STORAGE_KEYS.GAME_ID);
    storage.remove(STORAGE_KEYS.USERNAME);
  };

  // Cancel exit
  const cancelExit = () => {
    setShowExitConfirm(false);
  };

  // Handle play again (from finished screen - rejoin matchmaking with same username)
  const handlePlayAgain = () => {
    // Clear waiting timer if any
    if (waitingTimerRef.current) {
      clearInterval(waitingTimerRef.current);
    }

    // Reset game state but keep username
    setGameState(INITIAL_GAME_STATE);
    setIsJoining(true);
    setErrorMessage('');
    setShowReconnectPrompt(false);
    setShowExitConfirm(false);
    wasDisconnectedRef.current = false;

    // Clear session storage (old game is over)
    storage.remove(STORAGE_KEYS.GAME_ID);
    // Keep username in storage for potential reconnection
    storage.save(STORAGE_KEYS.USERNAME, username);

    // Join matchmaking with existing username
    if (username && connectionStatus === 'connected') {
      wsService.joinGame(username);
    }
  };

  // Render different screens
  const renderLoginScreen = () => (
    <div className="screen login-screen">
      <div className="logo-container">
        <h1 className="game-title">4 in a Row</h1>
        <p className="game-subtitle">Real-time Multiplayer Connect Four</p>
      </div>

      <form onSubmit={handleLogin} className="login-form">
        <div className="input-group">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            placeholder="Enter your username"
            maxLength={20}
            autoFocus
            disabled={connectionStatus !== 'connected' || isJoining}
          />
        </div>
        <button
          type="submit"
          className="btn-primary"
          disabled={connectionStatus !== 'connected' || isJoining}
        >
          {isJoining ? 'Joining...' : connectionStatus === 'connected' ? 'Join Game' : 'Connecting...'}
        </button>
      </form>

      <button onClick={handleLeaderboardToggle} className="btn-secondary">
        View Leaderboard (L)
      </button>

      <div className="game-info">
        <h3>How to Play</h3>
        <ul>
          <li>Connect 4 discs vertically, horizontally, or diagonally to win</li>
          <li>You'll be matched with another player or a bot</li>
          <li>Click columns or press 1-7 to drop discs</li>
          <li>Press L to view leaderboard, ESC to close</li>
        </ul>
      </div>
    </div>
  );

  const renderWaitingScreen = () => (
    <div className="screen waiting-screen">
      <h1>Finding Opponent...</h1>
      <div className="waiting-animation">
        <div className="spinner"></div>
      </div>
      <p className="waiting-text">
        {waitingTimeLeft > 0
          ? `Waiting for another player... (${waitingTimeLeft}s)`
          : 'Starting game with bot...'}
      </p>
      <p className="username-display">Playing as: <strong>{username}</strong></p>

      <button onClick={handleExitGame} className="btn-secondary" style={{ marginTop: '2rem' }}>
        Cancel
      </button>
    </div>
  );

  const renderPlayingScreen = () => {
    const isYourTurn = gameState.yourColor === gameState.currentPlayer;
    const opponentName = getOpponentName(gameState.opponent);
    const opponentColor = gameState.yourColor ? getOppositeColor(gameState.yourColor) : null;

    return (
      <div className="screen playing-screen">
        {/* Opponent disconnect notification */}
        {opponentDisconnected && (
          <div className="opponent-disconnect-banner">
            <span className="disconnect-icon">⚠️</span>
            <div className="disconnect-content">
              <span className="disconnect-title">Opponent Disconnected</span>
              <span className="disconnect-timer">
                {reconnectTimeLeft > 0 ? (
                  <>
                    <span className="timer-icon">⏱️</span>
                    <span className="timer-value">{reconnectTimeLeft}s</span>
                    <span className="timer-label">to reconnect</span>
                  </>
                ) : (
                  <span className="timer-expired">Waiting for server...</span>
                )}
              </span>
            </div>
          </div>
        )}

        <div className="game-header">
          <div className="player-info">
            <div className={`player-card ${gameState.yourColor || ''}`}>
              <span className="player-name">{username}</span>
              <span className="player-color">({gameState.yourColor})</span>
            </div>
            <div className="vs-divider">VS</div>
            <div className={`player-card ${opponentColor || ''} ${opponentDisconnected ? 'disconnected' : ''}`}>
              <span className="player-name">{opponentName}</span>
              <span className="player-color">({opponentColor})</span>
              {opponentDisconnected && <span className="disconnect-badge">Disconnected</span>}
            </div>
          </div>

          <div className="turn-indicator">
            {opponentDisconnected ? (
              <span className="waiting-reconnect">Waiting for opponent...</span>
            ) : isYourTurn ? (
              <span className="your-turn">Your Turn</span>
            ) : (
              <span className="opponent-turn">Opponent's Turn</span>
            )}
          </div>
        </div>

        <Board
          board={gameState.board}
          onColumnClick={handleColumnClick}
          currentPlayer={gameState.currentPlayer}
          yourColor={gameState.yourColor}
          winner={gameState.winner}
        />

        <div className="keyboard-hint">Press 1-7 to select column</div>

        <div className="game-actions">
          <button onClick={handleExitGame} className="btn-secondary">
            Leave Game
          </button>
          <button onClick={handleLeaderboardToggle} className="btn-secondary">
            Leaderboard (L)
          </button>
        </div>
      </div>
    );
  };

  const renderFinishedScreen = () => {
    const resultMessage = getResultMessage(gameState.winner, gameState.yourColor);
    const resultClass = getResultClass(gameState.winner, gameState.yourColor);

    return (
      <div className="screen finished-screen">
        <div className={`result-banner ${resultClass}`}>
          <h1>{resultMessage}</h1>
        </div>

        <Board
          board={gameState.board}
          onColumnClick={() => {}}
          currentPlayer={gameState.currentPlayer}
          yourColor={gameState.yourColor}
          winner={gameState.winner}
        />

        <div className="game-actions">
          <button onClick={handlePlayAgain} className="btn-primary">
            Play Again
          </button>
          <button onClick={handleLeaderboardToggle} className="btn-secondary">
            Leaderboard (L)
          </button>
          <button onClick={confirmExit} className="btn-secondary">
            Back to Login
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="app">
      {/* Connection status indicator */}
      <div className={`connection-status ${connectionStatus}`}>
        {connectionStatus === 'connecting' && 'Connecting...'}
        {connectionStatus === 'connected' && 'Connected'}
        {connectionStatus === 'disconnected' && 'Disconnected'}
      </div>

      {/* Reconnect prompt */}
      {showReconnectPrompt && (
        <div className="reconnect-prompt">
          <div className="reconnect-content">
            <h3>Connection Lost</h3>
            <p>Your game session is still active.</p>
            <p className="reconnect-username">Playing as: <strong>{storage.get(STORAGE_KEYS.USERNAME)}</strong></p>
            <div className="reconnect-actions">
              <button onClick={handleManualReconnect} className="btn-primary">
                Rejoin Game
              </button>
              <button onClick={confirmExit} className="btn-secondary">
                New Game
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit confirmation dialog */}
      {showExitConfirm && (
        <div className="reconnect-prompt">
          <div className="reconnect-content">
            <h3>Leave Game?</h3>
            <p>Are you sure you want to leave this game?</p>
            <p style={{ color: '#94A3B8', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              {screen === 'playing' ? 'The game will end and you will lose.' : 'You will stop searching for an opponent.'}
            </p>
            <div className="reconnect-actions">
              <button onClick={confirmExit} className="btn-primary">
                Yes, Leave
              </button>
              <button onClick={cancelExit} className="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {errorMessage && (
        <div className="error-message">
          {errorMessage}
        </div>
      )}

      {/* Main content */}
      {screen === 'login' && renderLoginScreen()}
      {screen === 'waiting' && renderWaitingScreen()}
      {screen === 'playing' && renderPlayingScreen()}
      {screen === 'finished' && renderFinishedScreen()}

      {/* Leaderboard modal */}
      {showLeaderboard && (
        <Leaderboard
          data={leaderboardData}
          onClose={() => setShowLeaderboard(false)}
        />
      )}
    </div>
  );
}

export default App;
