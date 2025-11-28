import type { ConnectionStatus } from '@/types';

interface LoginScreenProps {
  usernameInput: string;
  setUsernameInput: (value: string) => void;
  connectionStatus: ConnectionStatus;
  isJoining: boolean;
  onLogin: (e: React.FormEvent) => void;
  onShowLeaderboard: () => void;
}

export function LoginScreen({
  usernameInput,
  setUsernameInput,
  connectionStatus,
  isJoining,
  onLogin,
  onShowLeaderboard,
}: LoginScreenProps) {
  return (
    <div className="screen login-screen">
      <div className="logo-container">
        <h1 className="game-title">4 in a Row</h1>
        <p className="game-subtitle">Real-time Multiplayer Connect Four</p>
      </div>

      <form onSubmit={onLogin} className="login-form">
        <div className="input-group">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            placeholder="Enter your username"
            maxLength={20}
            autoFocus
            disabled={connectionStatus !== 'connected' || isJoining}
          />
        </div>
        <button
          type="submit"
          className="btn-primary"
          disabled={connectionStatus !== 'connected' || isJoining}
        >
          {isJoining ? 'Joining...' : connectionStatus === 'connected' ? 'Join Game' : 'Connecting...'}
        </button>
      </form>

      <button onClick={onShowLeaderboard} className="btn-secondary">
        View Leaderboard (L)
      </button>

      <div className="game-info">
        <h3>How to Play</h3>
        <ul>
          <li>Connect 4 discs vertically, horizontally, or diagonally to win</li>
          <li>You'll be matched with another player or a bot</li>
          <li>Click columns or press 1-7 to drop discs</li>
          <li>Press L to view leaderboard, ESC to close</li>
        </ul>
      </div>
    </div>
  );
}
