import type { GameScreen } from '@/types';

interface ExitConfirmDialogProps {
  screen: GameScreen;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ExitConfirmDialog({ screen, onConfirm, onCancel }: ExitConfirmDialogProps) {
  return (
    <div className="reconnect-prompt">
      <div className="reconnect-content">
        <h3>Leave Game?</h3>
        <p>Are you sure you want to leave this game?</p>
        <p style={{ color: '#94A3B8', fontSize: '0.875rem', marginTop: '0.5rem' }}>
          {screen === 'playing'
            ? 'The game will end and you will lose.'
            : 'You will stop searching for an opponent.'}
        </p>
        <div className="reconnect-actions">
          <button onClick={onConfirm} className="btn-primary">
            Yes, Leave
          </button>
          <button onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
