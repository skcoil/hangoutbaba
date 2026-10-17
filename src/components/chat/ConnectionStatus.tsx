'use client';
import { ConnectionStatus as CS } from '@/hooks/useSocket';

export function ConnectionStatus({ status }: { status: CS }) {
  const config = {
    connected: { dot: 'bg-green-400', text: 'Connected', color: 'text-green-600' },
    connecting: { dot: 'bg-yellow-400 animate-pulse', text: 'Connecting...', color: 'text-yellow-600' },
    disconnected: { dot: 'bg-gray-400', text: 'Disconnected', color: 'text-gray-500' },
    error: { dot: 'bg-red-400', text: 'Reconnecting...', color: 'text-red-500' },
  }[status];

  return (
    <div className={`flex items-center gap-1.5 text-xs font-medium ${config.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{config.text}</span>
    </div>
  );
}
