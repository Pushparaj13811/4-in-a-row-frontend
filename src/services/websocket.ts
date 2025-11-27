/**
 * WebSocket Service
 * Handles WebSocket connection and message communication with the game server
 */

import type { ServerMessage } from '@/types';
import { MAX_RECONNECT_ATTEMPTS, RECONNECT_BASE_DELAY } from '@/constants/game.constants';

export class WebSocketService {
  private ws: WebSocket | null = null;
  private messageHandlers: ((message: ServerMessage) => void)[] = [];
  private connectionHandlers: ((connected: boolean) => void)[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = MAX_RECONNECT_ATTEMPTS;
  private url: string | null = null;

  connect(url: string): Promise<void> {
    this.url = url; // Store URL for reconnection
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          console.log('✅ Connected to game server');
          this.reconnectAttempts = 0;
          // Notify connection handlers
          this.connectionHandlers.forEach((handler) => handler(true));
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: ServerMessage = JSON.parse(event.data);
            this.messageHandlers.forEach((handler) => handler(message));
          } catch (error) {
            console.error('Failed to parse message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('🔌 Disconnected from server');
          // Notify connection handlers
          this.connectionHandlers.forEach((handler) => handler(false));
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.url) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

      setTimeout(() => {
        if (this.url) {
          this.connect(this.url).catch(console.error);
        }
      }, RECONNECT_BASE_DELAY * this.reconnectAttempts);
    }
  }

  send(message: object): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  onMessage(handler: (message: ServerMessage) => void): () => void {
    this.messageHandlers.push(handler);

    // Return unsubscribe function
    return () => {
      this.messageHandlers = this.messageHandlers.filter((h) => h !== handler);
    };
  }

  onConnectionChange(handler: (connected: boolean) => void): () => void {
    this.connectionHandlers.push(handler);

    // Return unsubscribe function
    return () => {
      this.connectionHandlers = this.connectionHandlers.filter((h) => h !== handler);
    };
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.messageHandlers = [];
    this.connectionHandlers = [];
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  joinGame(username: string): void {
    this.send({ type: 'join', username });
  }

  makeMove(gameId: string, column: number): void {
    this.send({ type: 'move', gameId, column });
  }

  getLeaderboard(): void {
    this.send({ type: 'getLeaderboard' });
  }

  rejoinGame(username: string, gameId: string): void {
    this.send({ type: 'rejoin', username, gameId });
  }

  leaveGame(username: string): void {
    this.send({ type: 'leave', username });
  }
}

export const wsService = new WebSocketService();
