import { Board } from '@/components/Board';
import type { GameState } from '@/types';
import { getOpponentName, getOppositeColor } from '@/utils/game.utils';

interface PlayingScreenProps {
  username: string;
  gameState: GameState;
  opponentDisconnected: boolean;
  reconnectTimeLeft: number;
  onColumnClick: (column: number) => void;
  onExitGame: () => void;
  onShowLeaderboard: () => void;
}

export function PlayingScreen({
  username,
  gameState,
  opponentDisconnected,
  reconnectTimeLeft,
  onColumnClick,
  onExitGame,
  onShowLeaderboard,
}: PlayingScreenProps) {
  const isYourTurn = gameState.yourColor === gameState.currentPlayer;
  const opponentName = getOpponentName(gameState.opponent);
  const opponentColor = gameState.yourColor ? getOppositeColor(gameState.yourColor) : null;

  return (
    <div className="screen playing-screen">
      {/* Opponent disconnect notification */}
      {opponentDisconnected && (
        <div className="opponent-disconnect-banner">
          <span className="disconnect-icon">⚠️</span>
          <div className="disconnect-content">
            <span className="disconnect-title">Opponent Disconnected</span>
            <span className="disconnect-timer">
              {reconnectTimeLeft > 0 ? (
                <>
                  <span className="timer-icon">⏱️</span>
                  <span className="timer-value">{reconnectTimeLeft}s</span>
                  <span className="timer-label">to reconnect</span>
                </>
              ) : (
                <span className="timer-expired">Waiting for server...</span>
              )}
            </span>
          </div>
        </div>
      )}

      <div className="game-header">
        <div className="player-info">
          <div className={`player-card ${gameState.yourColor || ''}`}>
            <span className="player-name">{username}</span>
            <span className="player-color">({gameState.yourColor})</span>
          </div>
          <div className="vs-divider">VS</div>
          <div className={`player-card ${opponentColor || ''} ${opponentDisconnected ? 'disconnected' : ''}`}>
            <span className="player-name">{opponentName}</span>
            <span className="player-color">({opponentColor})</span>
            {opponentDisconnected && <span className="disconnect-badge">Disconnected</span>}
          </div>
        </div>

        <div className="turn-indicator">
          {opponentDisconnected ? (
            <span className="waiting-reconnect">Waiting for opponent...</span>
          ) : isYourTurn ? (
            <span className="your-turn">Your Turn</span>
          ) : (
            <span className="opponent-turn">Opponent's Turn</span>
          )}
        </div>
      </div>

      <Board
        board={gameState.board}
        onColumnClick={onColumnClick}
        currentPlayer={gameState.currentPlayer}
        yourColor={gameState.yourColor}
        winner={gameState.winner}
      />

      <div className="keyboard-hint">Press 1-7 to select column</div>

      <div className="game-actions">
        <button onClick={onExitGame} className="btn-secondary">
          Leave Game
        </button>
        <button onClick={onShowLeaderboard} className="btn-secondary">
          Leaderboard (L)
        </button>
      </div>
    </div>
  );
}
