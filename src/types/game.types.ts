/**
 * Game Types
 * Single source of truth for all game-related type definitions
 */

// Player and Board Types
export type PlayerColor = 'red' | 'yellow';
export type CellState = PlayerColor | null;
export type Board = CellState[][];
export type Winner = PlayerColor | 'draw' | null;

// Game Screen States
export type GameScreen = 'login' | 'waiting' | 'playing' | 'finished';

// Game State
export interface GameState {
  gameId: string | null;
  yourColor: PlayerColor | null;
  currentPlayer: PlayerColor;
  board: Board;
  opponent: string | null;
  winner: Winner;
}

// Leaderboard Types
export interface LeaderboardPlayer {
  username: string;
  wins: number;
  losses: number;
  draws: number;
  total_games: number;
}

// Connection Status
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';
