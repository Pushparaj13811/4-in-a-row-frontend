import { useState, useCallback } from 'react';
import type { GameScreen, ConnectionStatus, LeaderboardPlayer } from '@/types';
import { MATCHMAKING_TIMEOUT } from '@/constants/game.constants';

export function useUIState() {
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

  const showError = useCallback((message: string, duration = 5000) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(''), duration);
  }, []);

  const clearError = useCallback(() => {
    setErrorMessage('');
  }, []);

  return {
    screen,
    setScreen,
    username,
    setUsername,
    usernameInput,
    setUsernameInput,
    errorMessage,
    setErrorMessage,
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
  };
}
