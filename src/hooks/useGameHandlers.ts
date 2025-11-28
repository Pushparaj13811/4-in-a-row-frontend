import { useCallback } from 'react';
import { wsService } from '@/services/websocket';
import { validateUsername } from '@/utils/game.utils';
import type { GameState, ConnectionStatus } from '@/types';
import { WEBSOCKET_URL } from '@/constants/game.constants';

interface UseGameHandlersProps {
  gameState: GameState;
  usernameInput: string;
  username: string;
  connectionStatus: ConnectionStatus;
  isJoining: boolean;
  opponentDisconnected: boolean;
  setUsername: (username: string) => void;
  setIsJoining: (isJoining: boolean) => void;
  showError: (message: string, duration?: number) => void;
  resetGameState: () => void;
  saveGameSession: (gameId: string, username: string) => void;
  setShowReconnectPrompt: (show: boolean) => void;
}

export function useGameHandlers({
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
}: UseGameHandlersProps) {

  const handleLogin = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    if (isJoining) {
      showError('Already joining a game...', 3000);
      return;
    }

    const validation = validateUsername(usernameInput);
    if (!validation.valid) {
      showError(validation.error || 'Invalid username', 5000);
      return;
    }

    if (connectionStatus !== 'connected') {
      showError('Not connected to server', 5000);
      return;
    }

    const trimmedUsername = usernameInput.trim();
    setUsername(trimmedUsername);
    setIsJoining(true);
    wsService.joinGame(trimmedUsername);
  }, [usernameInput, isJoining, connectionStatus, setUsername, setIsJoining, showError]);

  const handleColumnClick = useCallback((column: number) => {
    if (opponentDisconnected) {
      showError('Cannot make moves while opponent is disconnected', 3000);
      return;
    }

    if (gameState.gameId && gameState.yourColor === gameState.currentPlayer && !gameState.winner) {
      wsService.makeMove(gameState.gameId, column);
    }
  }, [gameState, opponentDisconnected, showError]);

  const handleManualReconnect = useCallback(() => {
    const savedGameId = sessionStorage.getItem('gameId');
    const savedUsername = sessionStorage.getItem('username');

    if (savedGameId && savedUsername) {
      setShowReconnectPrompt(false);
      setIsJoining(false);

      if (wsService.isConnected()) {
        wsService.rejoinGame(savedUsername, savedGameId);
      } else {
        wsService.connect(WEBSOCKET_URL).then(() => {
          wsService.rejoinGame(savedUsername, savedGameId);
        }).catch(() => {
          showError('Failed to reconnect to server', 5000);
          setShowReconnectPrompt(true);
        });
      }
    }
  }, [setShowReconnectPrompt, setIsJoining, showError]);

  const handlePlayAgain = useCallback(() => {
    resetGameState();
    setIsJoining(true);
    setShowReconnectPrompt(false);
    saveGameSession('', username); // Keep username

    if (username && connectionStatus === 'connected') {
      wsService.joinGame(username);
    }
  }, [username, connectionStatus, resetGameState, setIsJoining, setShowReconnectPrompt, saveGameSession]);

  const handleExitGame = useCallback(() => {
    if (username) {
      wsService.leaveGame(username);
    }
    resetGameState();
    setUsername('');
    setIsJoining(false);
    setShowReconnectPrompt(false);
  }, [username, resetGameState, setUsername, setIsJoining, setShowReconnectPrompt]);

  return {
    handleLogin,
    handleColumnClick,
    handleManualReconnect,
    handlePlayAgain,
    handleExitGame,
  };
}
