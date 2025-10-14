/**
 * Collaboration Components - Barrel Export
 *
 * Export all collaboration-related components.
 */

export { Cursor } from './Cursor'
export { SelectionOverlay } from './SelectionOverlay'
export { RemoteResizeOverlay } from './RemoteResizeOverlay'
export { UserAvatar } from './UserAvatar'
export { AvatarStack } from './AvatarStack'
export type { AvatarUser } from './AvatarStack'
export { PresenceDropdown } from './PresenceDropdown'
export type { PresenceUser } from './PresenceDropdown'
// ActiveUsers is deprecated - now integrated into PropertiesPanel as AvatarStack
// DragIndicator is no longer used - objects now move in real-time using drag state positions
