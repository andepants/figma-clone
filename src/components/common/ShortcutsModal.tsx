/**
 * Keyboard Shortcuts Help Modal
 *
 * Displays all available keyboard shortcuts organized by category.
 * Fully accessible with keyboard navigation and screen reader support.
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { KEYBOARD_SHORTCUTS } from '@/constants';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Shortcuts Modal Component
 *
 * Displays keyboard shortcuts in an accessible dialog.
 * Groups shortcuts by category (Tools, Edit, Canvas, Help).
 *
 * @param {boolean} isOpen - Whether modal is open
 * @param {function} onClose - Callback to close modal
 *
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 * return <ShortcutsModal isOpen={isOpen} onClose={() => setIsOpen(false)} />;
 * ```
 */
export function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  // Group shortcuts by category
  const categories = ['Tools', 'Edit', 'Canvas', 'Help'] as const;

  const shortcutsByCategory = categories.map(category => ({
    category,
    shortcuts: KEYBOARD_SHORTCUTS.filter(s => s.category === category && !s.disabled),
  }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Use these shortcuts to work faster on the canvas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {shortcutsByCategory.map(({ category, shortcuts }) => (
            shortcuts.length > 0 && (
              <div key={category}>
                <h3 className="text-sm font-semibold text-neutral-900 mb-3">
                  {category}
                </h3>
                <div className="space-y-2">
                  {shortcuts.map((shortcut, index) => (
                    <div
                      key={`${category}-${index}`}
                      className="flex items-center justify-between gap-4"
                    >
                      <span className="text-sm text-neutral-600">
                        {shortcut.action}
                      </span>
                      <kbd className="inline-flex items-center justify-center rounded bg-neutral-100 px-2 py-1 text-xs font-mono text-neutral-700 border border-neutral-200">
                        {shortcut.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
