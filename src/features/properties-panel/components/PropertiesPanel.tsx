/**
 * Properties Panel Component
 *
 * Main container for the properties panel.
 * Shows property sections for the selected shape.
 * Displays active users presence at the top.
 */

import { Square, Circle as CircleIcon, Type, Minus } from 'lucide-react';
import { useSelectedShape } from '../hooks/useSelectedShape';
import { getSectionVisibility } from '../utils/section-visibility';
import { PositionSection } from './PositionSection';
import { RotationSection } from './RotationSection';
import { LayoutSection } from './LayoutSection';
import { TypographySection } from './TypographySection';
import { AppearanceSection } from './AppearanceSection';
import { FillSection } from './FillSection';
import { StrokeSection } from './StrokeSection';
import { PageSection } from './PageSection';
import { ZoomDropdown } from './ZoomDropdown';
import { AvatarStack, PresenceDropdown, type PresenceUser } from '@/features/collaboration/components';
import { usePresence } from '@/features/collaboration/hooks';
import { useAuth } from '@/features/auth/hooks';

/**
 * PropertiesPanel Component
 *
 * Fixed right sidebar that displays property controls for the selected shape.
 * Shows different sections based on the shape type.
 * Shows presence avatars at the top.
 * Shows empty state when nothing is selected.
 *
 * @example
 * ```tsx
 * <PropertiesPanel />
 * ```
 */
export function PropertiesPanel() {
  const shape = useSelectedShape();
  const visibility = getSectionVisibility(shape);

  // Get presence data
  const onlineUsers = usePresence('main');
  const { currentUser } = useAuth();

  // Map users to PresenceUser format with current user flag
  const presenceUsers: PresenceUser[] = onlineUsers.map(user => ({
    userId: user.userId,
    username: user.username || 'Anonymous',
    color: user.color,
    isCurrentUser: user.userId === currentUser?.uid,
  }));

  // Empty state - no selection
  if (!shape) {
    return (
      <div className="flex flex-col h-full">
        {/* Presence Section */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-3 py-2 z-20 flex items-center justify-between">
          <span className="text-[11px] text-gray-500">Active</span>
          {presenceUsers.length > 0 && (
            <PresenceDropdown
              users={presenceUsers}
              trigger={<AvatarStack users={presenceUsers} maxVisible={3} size="sm" />}
            />
          )}
        </div>

        {/* Zoom Section */}
        <div className="border-b border-gray-200 px-3 py-2 flex items-center justify-between">
          <span className="text-[11px] text-gray-500">Zoom</span>
          <ZoomDropdown />
        </div>

        {/* Page Section */}
        <PageSection />

        {/* Spacer to push content to top */}
        <div className="flex-1" />
      </div>
    );
  }

  // Get shape icon
  function getShapeIcon() {
    if (!shape) return null;
    switch (shape.type) {
      case 'rectangle':
        return <Square className="w-3.5 h-3.5 text-gray-600" />;
      case 'circle':
        return <CircleIcon className="w-3.5 h-3.5 text-gray-600" />;
      case 'text':
        return <Type className="w-3.5 h-3.5 text-gray-600" />;
      case 'line':
        return <Minus className="w-3.5 h-3.5 text-gray-600" />;
      default:
        return null;
    }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Presence Section - Always visible at top */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-3 py-2 z-20 flex items-center justify-between">
        <span className="text-[11px] text-gray-500">Active</span>
        {presenceUsers.length > 0 && (
          <PresenceDropdown
            users={presenceUsers}
            trigger={<AvatarStack users={presenceUsers} maxVisible={3} size="sm" />}
          />
        )}
      </div>

      {/* Shape Header - Sticks below presence */}
      <div className="sticky top-[40px] bg-white border-b border-gray-200 px-3 py-2 z-10">
        <div className="flex items-center gap-1.5">
          {getShapeIcon()}
          <span className="font-medium text-xs capitalize">{shape.type}</span>
        </div>
      </div>

      {/* Property Sections - conditionally rendered based on shape type */}
      <div className="divide-y divide-gray-200">
        {visibility.position && <PositionSection />}
        {visibility.rotation && <RotationSection />}
        {visibility.layout && <LayoutSection />}
        {visibility.text && <TypographySection />}
        {visibility.appearance && <AppearanceSection />}
        {visibility.fill && <FillSection />}
        {visibility.stroke && <StrokeSection />}
      </div>
    </div>
  );
}
