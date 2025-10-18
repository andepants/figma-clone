/**
 * ChatMessage Component
 *
 * Individual message bubble showing command, status, and response.
 * Color-coded by status (success=green, error=red, pending=gray).
 */

import type { AICommand } from '@/stores/aiStore';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  command: AICommand;
}

/**
 * Format timestamp to relative time
 */
function formatTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return new Date(timestamp).toLocaleDateString();
}

/**
 * Individual chat message component
 * @param {AICommand} command - Command to display
 * @returns {JSX.Element} Message bubble
 */
export function ChatMessage({ command }: ChatMessageProps) {
  return (
    <div
      className={cn(
        'p-3 rounded-lg text-sm space-y-2',
        command.status === 'success' && 'bg-green-50 border border-green-200',
        command.status === 'error' && 'bg-red-50 border border-red-200',
        command.status === 'pending' && 'bg-gray-50 border border-gray-200'
      )}
    >
      {/* User Command */}
      <div className="flex items-start gap-2">
        <div className="flex-1 font-medium text-gray-900">
          {command.command}
        </div>
        {/* Status Icon */}
        {command.status === 'success' && (
          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
        )}
        {command.status === 'error' && (
          <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
        )}
        {command.status === 'pending' && (
          <Loader2 className="w-4 h-4 text-gray-600 animate-spin flex-shrink-0" />
        )}
      </div>

      {/* AI Response */}
      {command.response && (
        <div className="text-green-700 text-xs leading-relaxed whitespace-pre-wrap">
          {command.response}
        </div>
      )}

      {/* Error Message */}
      {command.error && (
        <div className="text-red-700 text-xs leading-relaxed">
          {command.error}
        </div>
      )}

      {/* Timestamp */}
      <div className="text-gray-500 text-xs">
        {formatTime(command.timestamp)}
      </div>
    </div>
  );
}
