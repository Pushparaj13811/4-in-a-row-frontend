interface WaitingScreenProps {
  username: string;
  waitingTimeLeft: number;
  onCancel: () => void;
}

export function WaitingScreen({ username, waitingTimeLeft, onCancel }: WaitingScreenProps) {
  return (
    <div className="screen waiting-screen">
      <h1>Finding Opponent...</h1>
      <div className="waiting-animation">
        <div className="spinner"></div>
      </div>
      <p className="waiting-text">
        {waitingTimeLeft > 0
          ? `Waiting for another player... (${waitingTimeLeft}s)`
          : 'Starting game with bot...'}
      </p>
      <p className="username-display">Playing as: <strong>{username}</strong></p>

      <button onClick={onCancel} className="btn-secondary" style={{ marginTop: '2rem' }}>
        Cancel
      </button>
    </div>
  );
}
