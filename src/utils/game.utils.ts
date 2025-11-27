/**
 * Game Utilities
 * Reusable helper functions for game logic
 */

import type { Winner, PlayerColor } from '@/types';
import { GAME_MESSAGES } from '@/constants/game.constants';

/**
 * Get the result message based on winner and player color
 */
export const getResultMessage = (winner: Winner, yourColor: PlayerColor | null): string => {
  if (winner === 'draw') {
    return GAME_MESSAGES.DRAW;
  }
  if (winner === yourColor) {
    return GAME_MESSAGES.WIN;
  }
  return GAME_MESSAGES.LOSE;
};

/**
 * Get the result CSS class based on winner and player color
 */
export const getResultClass = (winner: Winner, yourColor: PlayerColor | null): string => {
  if (winner === 'draw') {
    return 'draw';
  }
  if (winner === yourColor) {
    return 'win';
  }
  return 'lose';
};

/**
 * Get opponent display name
 */
export const getOpponentName = (opponent: string | null): string => {
  return opponent === 'bot' ? GAME_MESSAGES.BOT_NAME : opponent || '';
};

/**
 * Get the opposite color of a player
 */
export const getOppositeColor = (color: PlayerColor): PlayerColor => {
  return color === 'red' ? 'yellow' : 'red';
};

/**
 * Format win rate as percentage
 */
export const formatWinRate = (wins: number, totalGames: number): string => {
  if (totalGames === 0) return '0.0';
  return ((wins / totalGames) * 100).toFixed(1);
};

/**
 * Get medal emoji for leaderboard rank
 */
export const getMedalForRank = (rank: number): string => {
  const medals: Record<number, string> = {
    0: '🥇',
    1: '🥈',
    2: '🥉',
  };
  return medals[rank] || '';
};

/**
 * Validate username
 */
export const validateUsername = (username: string): { valid: boolean; error?: string } => {
  const trimmed = username.trim();

  if (!trimmed) {
    return { valid: false, error: 'Please enter a username' };
  }

  if (trimmed.length < 2) {
    return { valid: false, error: 'Username must be at least 2 characters' };
  }

  if (trimmed.length > 20) {
    return { valid: false, error: 'Username must be less than 20 characters' };
  }

  return { valid: true };
};

/**
 * Session storage helpers
 */
export const sessionStorage = {
  save: (key: string, value: string): void => {
    try {
      window.sessionStorage.setItem(key, value);
    } catch (error) {
      console.error('Failed to save to session storage:', error);
    }
  },

  get: (key: string): string | null => {
    try {
      return window.sessionStorage.getItem(key);
    } catch (error) {
      console.error('Failed to get from session storage:', error);
      return null;
    }
  },

  remove: (key: string): void => {
    try {
      window.sessionStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove from session storage:', error);
    }
  },

  clear: (): void => {
    try {
      window.sessionStorage.clear();
    } catch (error) {
      console.error('Failed to clear session storage:', error);
    }
  },
};
