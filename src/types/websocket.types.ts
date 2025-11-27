/**
 * WebSocket Message Types
 * Single source of truth for all WebSocket communication types
 */

import type { PlayerColor, Board, Winner } from './game.types';

// Server to Client Messages
export interface GameStartMessage {
  type: 'gameStart';
  gameId: string;
  yourColor: PlayerColor;
  currentPlayer: PlayerColor;
  board: Board;
  opponent: string;
}

export interface MoveMessage {
  type: 'move';
  board: Board;
  currentPlayer: PlayerColor;
  winner: Winner;
}

export interface WaitingMessage {
  type: 'waiting';
  timeLeft: number;
}

export interface LeaderboardMessage {
  type: 'leaderboard';
  data: Array<{
    username: string;
    wins: number;
    losses: number;
    draws: number;
    total_games: number;
  }>;
}

export interface ErrorMessage {
  type: 'error';
  message: string;
}

export interface RejoinSuccessMessage {
  type: 'rejoinSuccess';
  gameId: string;
  yourColor: PlayerColor;
  currentPlayer: PlayerColor;
  board: Board;
  opponent: string | null;
}

export type ServerMessage =
  | GameStartMessage
  | MoveMessage
  | WaitingMessage
  | LeaderboardMessage
  | ErrorMessage
  | RejoinSuccessMessage;

// Client to Server Messages
export interface JoinMessage {
  type: 'join';
  username: string;
}

export interface MakeMoveMessage {
  type: 'move';
  gameId: string;
  column: number;
}

export interface GetLeaderboardMessage {
  type: 'getLeaderboard';
}

export interface RejoinMessage {
  type: 'rejoin';
  username: string;
  gameId: string;
}

export interface LeaveMessage {
  type: 'leave';
  username: string;
}

export type ClientMessage =
  | JoinMessage
  | MakeMoveMessage
  | GetLeaderboardMessage
  | RejoinMessage
  | LeaveMessage;
