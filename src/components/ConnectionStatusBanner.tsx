import type { ConnectionStatus } from '@/types';

interface ConnectionStatusBannerProps {
  status: ConnectionStatus;
}

export function ConnectionStatusBanner({ status }: ConnectionStatusBannerProps) {
  return (
    <div className={`connection-status ${status}`}>
      {status === 'connecting' && 'Connecting...'}
      {status === 'connected' && 'Connected'}
      {status === 'disconnected' && 'Disconnected'}
    </div>
  );
}
