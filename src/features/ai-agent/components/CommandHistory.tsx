/**
 * CommandHistory Component
 *
 * Displays history of AI commands with their status and results.
 * Shows last 50 commands, color-coded by status (success/error/pending).
 */

import { useState } from 'react';
import { useAIStore } from '@/stores';
import { History, X, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Format timestamp to readable time
 * @param {number} timestamp - Milliseconds since epoch
 * @returns {string} Formatted time string
 */
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return date.toLocaleDateString();
}

/**
 * Command history panel component
 * Toggleable panel showing all past AI commands
 * @returns {JSX.Element} Command history panel
 */
export function CommandHistory() {
  const { commandHistory, clearHistory } = useAIStore();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed right-4 bottom-20 z-40">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'p-3 bg-white border rounded-lg shadow transition-all',
          'hover:shadow-lg hover:bg-gray-50',
          isOpen && 'bg-gray-100'
        )}
        title="AI Command History"
      >
        <History className="w-5 h-5 text-gray-700" />
        {commandHistory.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {commandHistory.length}
          </span>
        )}
      </button>

      {/* History Panel */}
      {isOpen && (
        <div className="absolute bottom-14 right-0 w-96 max-h-[32rem] bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-800">
                AI Command History
              </h3>
            </div>
            <div className="flex items-center gap-1">
              {commandHistory.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm('Clear all command history?')) {
                      clearHistory();
                    }
                  }}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  title="Clear History"
                >
                  <Trash2 className="w-4 h-4 text-gray-600" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                title="Close"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Command List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {commandHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                <History className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No commands yet</p>
                <p className="text-xs mt-1">
                  Use the AI input to create canvas objects
                </p>
              </div>
            ) : (
              commandHistory.map((cmd) => (
                <div
                  key={cmd.id}
                  className={cn(
                    'p-3 rounded-lg border text-xs transition-all',
                    cmd.status === 'success' &&
                      'bg-green-50 border-green-200',
                    cmd.status === 'error' &&
                      'bg-red-50 border-red-200',
                    cmd.status === 'pending' &&
                      'bg-gray-50 border-gray-200 animate-pulse'
                  )}
                >
                  {/* Command Text */}
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-medium text-gray-900 flex-1">
                      {cmd.command}
                    </p>
                    <span
                      className={cn(
                        'text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded flex-shrink-0',
                        cmd.status === 'success' &&
                          'bg-green-100 text-green-700',
                        cmd.status === 'error' &&
                          'bg-red-100 text-red-700',
                        cmd.status === 'pending' &&
                          'bg-gray-200 text-gray-600'
                      )}
                    >
                      {cmd.status}
                    </span>
                  </div>

                  {/* Response/Error */}
                  {cmd.response && (
                    <p className="text-green-700 mt-1 leading-relaxed">
                      {cmd.response}
                    </p>
                  )}
                  {cmd.error && (
                    <p className="text-red-700 mt-1 leading-relaxed">
                      {cmd.error}
                    </p>
                  )}

                  {/* Timestamp */}
                  <p className="text-gray-500 text-[10px] mt-2">
                    {formatTime(cmd.timestamp)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
