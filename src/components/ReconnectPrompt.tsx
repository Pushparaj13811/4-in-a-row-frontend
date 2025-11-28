import { STORAGE_KEYS } from '@/constants/game.constants';
import { sessionStorage as storage } from '@/utils/game.utils';

interface ReconnectPromptProps {
  onReconnect: () => void;
  onNewGame: () => void;
}

export function ReconnectPrompt({ onReconnect, onNewGame }: ReconnectPromptProps) {
  const username = storage.get(STORAGE_KEYS.USERNAME);

  return (
    <div className="reconnect-prompt">
      <div className="reconnect-content">
        <h3>Connection Lost</h3>
        <p>Your game session is still active.</p>
        <p className="reconnect-username">Playing as: <strong>{username}</strong></p>
        <div className="reconnect-actions">
          <button onClick={onReconnect} className="btn-primary">
            Rejoin Game
          </button>
          <button onClick={onNewGame} className="btn-secondary">
            New Game
          </button>
        </div>
      </div>
    </div>
  );
}
