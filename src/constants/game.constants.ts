/**
 * Game Constants
 * Single source of truth for all game-related constants
 */

import type { Board, GameState } from '@/types';

// Board Configuration
export const BOARD_ROWS = 6;
export const BOARD_COLS = 7;

// Timing
export const MATCHMAKING_TIMEOUT = 10; // seconds
export const RECONNECTION_TIMEOUT = 30; // seconds

// WebSocket Configuration
export const WEBSOCKET_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
export const MAX_RECONNECT_ATTEMPTS = 5;
export const RECONNECT_BASE_DELAY = 2000; // milliseconds

// Initial States
export const INITIAL_BOARD: Board = Array(BOARD_ROWS)
  .fill(null)
  .map(() => Array(BOARD_COLS).fill(null));

export const INITIAL_GAME_STATE: GameState = {
  gameId: null,
  yourColor: null,
  currentPlayer: 'red',
  board: INITIAL_BOARD,
  opponent: null,
  winner: null,
};

// Player Colors
export const PLAYER_COLORS = {
  RED: 'red' as const,
  YELLOW: 'yellow' as const,
};

// Game Messages
export const GAME_MESSAGES = {
  WAITING: 'Finding Opponent...',
  YOUR_TURN: 'Your Turn! 🎯',
  OPPONENT_TURN: "Opponent's Turn...",
  WIN: 'You Win! 🎉',
  LOSE: 'You Lose 😔',
  DRAW: "It's a Draw! 🤝",
  BOT_NAME: '🤖 Bot',
} as const;

// Session Storage Keys
export const STORAGE_KEYS = {
  GAME_ID: 'gameId',
  USERNAME: 'username',
} as const;
