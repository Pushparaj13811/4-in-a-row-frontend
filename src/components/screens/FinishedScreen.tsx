import { Board } from '@/components/Board';
import type { GameState } from '@/types';
import { getResultMessage, getResultClass } from '@/utils/game.utils';

interface FinishedScreenProps {
  gameState: GameState;
  onPlayAgain: () => void;
  onShowLeaderboard: () => void;
  onBackToLogin: () => void;
}

export function FinishedScreen({
  gameState,
  onPlayAgain,
  onShowLeaderboard,
  onBackToLogin,
}: FinishedScreenProps) {
  const resultMessage = getResultMessage(gameState.winner, gameState.yourColor);
  const resultClass = getResultClass(gameState.winner, gameState.yourColor);

  return (
    <div className="screen finished-screen">
      <div className={`result-banner ${resultClass}`}>
        <h1>{resultMessage}</h1>
      </div>

      <Board
        board={gameState.board}
        onColumnClick={() => {}}
        currentPlayer={gameState.currentPlayer}
        yourColor={gameState.yourColor}
        winner={gameState.winner}
      />

      <div className="game-actions">
        <button onClick={onPlayAgain} className="btn-primary">
          Play Again
        </button>
        <button onClick={onShowLeaderboard} className="btn-secondary">
          Leaderboard (L)
        </button>
        <button onClick={onBackToLogin} className="btn-secondary">
          Back to Login
        </button>
      </div>
    </div>
  );
}
