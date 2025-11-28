/**
 * Types Index
 * Central export point for all application types
 * Single source of truth for type definitions
 */

// Export all game types
export type {
  PlayerColor,
  CellState,
  Board,
  Winner,
  GameScreen,
  GameState,
  LeaderboardPlayer,
  ConnectionStatus,
} from './game.types';

// Export all WebSocket types
export type {
  GameStartMessage,
  MoveMessage,
  WaitingMessage,
  LeaderboardMessage,
  ErrorMessage,
  RejoinSuccessMessage,
  OpponentDisconnectedMessage,
  OpponentLeftMessage,
  ServerMessage,
  JoinMessage,
  MakeMoveMessage,
  GetLeaderboardMessage,
  RejoinMessage,
  ClientMessage,
} from './websocket.types';
