import { useState, useCallback } from 'react';
import type { GameState } from '@/types';
import { INITIAL_GAME_STATE, STORAGE_KEYS } from '@/constants/game.constants';
import { sessionStorage as storage } from '@/utils/game.utils';

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);

  const updateGameState = useCallback((updates: Partial<GameState>) => {
    setGameState((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetGameState = useCallback(() => {
    setGameState(INITIAL_GAME_STATE);
    storage.remove(STORAGE_KEYS.GAME_ID);
    storage.remove(STORAGE_KEYS.USERNAME);
  }, []);

  const saveGameSession = useCallback((gameId: string, username: string) => {
    storage.save(STORAGE_KEYS.GAME_ID, gameId);
    storage.save(STORAGE_KEYS.USERNAME, username);
  }, []);

  return {
    gameState,
    setGameState,
    updateGameState,
    resetGameState,
    saveGameSession,
  };
}
