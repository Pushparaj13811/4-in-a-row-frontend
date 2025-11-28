import { useCallback } from 'react';
import type { ServerMessage, GameState, LeaderboardPlayer, GameScreen } from '@/types';
import { STORAGE_KEYS } from '@/constants/game.constants';
import { sessionStorage as storage } from '@/utils/game.utils';

interface UseWebSocketMessagesProps {
  setScreen: (screen: GameScreen) => void;
  setGameState: (state: GameState) => void;
  updateGameState: (updates: Partial<GameState>) => void;
  setWaitingTimeLeft: (time: number) => void;
  setIsJoining: (isJoining: boolean) => void;
  setShowReconnectPrompt: (show: boolean) => void;
  setLeaderboardData: (data: LeaderboardPlayer[]) => void;
  showError: (message: string, duration?: number) => void;
  clearError: () => void;
  startDisconnectTimer: () => void;
  clearDisconnect: () => void;
  resetGameState: () => void;
  saveGameSession: (gameId: string, username: string) => void;
  resetReconnectAttempts: () => void;
  clearDisconnectFlag: () => void;
}

export function useWebSocketMessages({
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
}: UseWebSocketMessagesProps) {

  const handleMessage = useCallback((message: ServerMessage) => {
    console.log('Received message:', message);

    switch (message.type) {
      case 'waiting':
        storage.remove(STORAGE_KEYS.GAME_ID);
        storage.remove(STORAGE_KEYS.USERNAME);
        clearDisconnectFlag();
        setScreen('waiting');
        setWaitingTimeLeft(message.timeLeft);
        setIsJoining(false);
        break;

      case 'gameStart':
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
        clearDisconnect();
        resetReconnectAttempts();
        clearDisconnectFlag();
        saveGameSession(message.gameId, '');
        break;

      case 'move':
        updateGameState({
          board: message.board,
          currentPlayer: message.currentPlayer,
          winner: message.winner,
        });
        clearDisconnect();
        if (message.winner) {
          setScreen('finished');
          clearDisconnectFlag();
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
        clearDisconnect();
        clearError();
        resetReconnectAttempts();
        break;

      case 'leaderboard':
        setLeaderboardData(message.data);
        break;

      case 'error':
        showError(message.message, 5000);
        setIsJoining(false);
        break;

      case 'opponentDisconnected':
        startDisconnectTimer();
        clearError();
        break;

      case 'opponentLeft':
        clearDisconnect();
        updateGameState({ winner: message.winner });
        setScreen('finished');
        clearDisconnectFlag();
        break;
    }
  }, [
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
  ]);

  return { handleMessage };
}
