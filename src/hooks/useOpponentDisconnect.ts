import { useState, useEffect, useCallback } from 'react';

export function useOpponentDisconnect() {
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);
  const [reconnectTimeLeft, setReconnectTimeLeft] = useState(30);

  // Countdown timer for reconnection
  useEffect(() => {
    if (opponentDisconnected && reconnectTimeLeft > 0) {
      const timer = setInterval(() => {
        setReconnectTimeLeft((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [opponentDisconnected, reconnectTimeLeft]);

  const startDisconnectTimer = useCallback(() => {
    setOpponentDisconnected(true);
    setReconnectTimeLeft(30);
  }, []);

  const clearDisconnect = useCallback(() => {
    setOpponentDisconnected(false);
  }, []);

  return {
    opponentDisconnected,
    reconnectTimeLeft,
    startDisconnectTimer,
    clearDisconnect,
  };
}
