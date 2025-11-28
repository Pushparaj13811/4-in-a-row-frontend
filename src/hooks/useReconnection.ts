import { useRef, useCallback } from 'react';
import { wsService } from '@/services/websocket';
import { STORAGE_KEYS } from '@/constants/game.constants';
import { sessionStorage as storage } from '@/utils/game.utils';

const MAX_RECONNECT_ATTEMPTS = 5;

export function useReconnection(
  setShowReconnectPrompt: (show: boolean) => void
) {
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wasDisconnectedRef = useRef(false);

  const attemptReconnect = useCallback(() => {
    const savedGameId = storage.get(STORAGE_KEYS.GAME_ID);
    const savedUsername = storage.get(STORAGE_KEYS.USERNAME);

    if (savedGameId && savedUsername && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttemptsRef.current += 1;
      console.log(`🔄 Auto-reconnect attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS}`);

      wsService.rejoinGame(savedUsername, savedGameId);

      // If still not reconnected, try again
      if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectTimeoutRef.current = setTimeout(() => {
          attemptReconnect();
        }, 2000);
      } else {
        setShowReconnectPrompt(true);
      }
    } else if (savedGameId && savedUsername) {
      setShowReconnectPrompt(true);
    }
  }, [setShowReconnectPrompt]);

  const resetReconnectAttempts = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
  }, []);

  const markAsDisconnected = useCallback(() => {
    wasDisconnectedRef.current = true;
  }, []);

  const clearDisconnectFlag = useCallback(() => {
    wasDisconnectedRef.current = false;
  }, []);

  const cleanupReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
  }, []);

  return {
    wasDisconnectedRef,
    attemptReconnect,
    resetReconnectAttempts,
    markAsDisconnected,
    clearDisconnectFlag,
    cleanupReconnect,
  };
}
