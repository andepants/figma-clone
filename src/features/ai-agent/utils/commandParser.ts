/**
 * Command Parser Utility
 *
 * Parses AI agent commands (e.g., /icon, /feature) and provides
 * autocomplete suggestions as user types. Supports fuzzy matching
 * for better UX (e.g., "/ic" matches "/icon").
 *
 * Command syntax: /command description
 * Example: /icon a coffee cup
 *
 * @see src/features/ai-agent/components/ChatInput.tsx (usage)
 * @see src/features/ai-agent/components/CommandAutocomplete.tsx (display)
 */

/**
 * Available AI commands
 * Each command includes the trigger, description, and example usage
 */
export const AI_COMMANDS = [
  {
    command: '/icon',
    description: 'Generate iOS & Android app icons',
    example: '/icon a coffee cup',
    category: 'Image Generation',
  },
  {
    command: '/feature',
    description: 'Generate Android feature graphic',
    example: '/feature fitness app with running theme',
    category: 'Image Generation',
  },
  {
    command: '/crop-appicon',
    description: 'Crop and clean app icon from DALL-E image',
    example: '/crop-appicon',
    category: 'Image Processing',
  },
] as const;

/**
 * Type for command object
 */
export type AICommand = typeof AI_COMMANDS[number];

/**
 * Check if input starts with command prefix
 *
 * Quick check to determine if autocomplete should be shown.
 * Used to avoid unnecessary filtering when user isn't typing a command.
 *
 * @param input - Current input value
 * @returns true if input starts with "/"
 *
 * @example
 * hasCommandPrefix('/icon') // true
 * hasCommandPrefix('create a square') // false
 * hasCommandPrefix(' /icon') // false (whitespace before /)
 */
export function hasCommandPrefix(input: string): boolean {
  return input.trim().startsWith('/');
}

/**
 * Get command suggestions based on current input
 *
 * Supports fuzzy matching: "/ic" will match "/icon"
 * Returns empty array if no match or if command already complete
 *
 * @param input - Current input value
 * @param isPlayground - Whether user is in public playground (disables image gen commands)
 * @returns Array of matching commands with disabled state, empty if no matches
 *
 * @example
 * getCommandSuggestions('/') // Returns all commands
 * getCommandSuggestions('/ic') // Returns [/icon]
 * getCommandSuggestions('/icon') // Returns [/icon]
 * getCommandSuggestions('/icon coffee') // Returns [] (command complete)
 * getCommandSuggestions('/icon', true) // Returns [/icon] with disabled: true
 */
export function getCommandSuggestions(
  input: string,
  isPlayground = false
): Array<AICommand & { disabled?: boolean; disabledReason?: string }> {
  if (!hasCommandPrefix(input)) {
    return [];
  }

  const trimmed = input.trim().toLowerCase();

  // If input has space, command is complete (user is typing description)
  if (trimmed.includes(' ')) {
    return [];
  }

  // Match commands that start with the input
  const matches = AI_COMMANDS.filter(cmd =>
    cmd.command.toLowerCase().startsWith(trimmed)
  );

  // Mark image generation commands as disabled in playground
  if (isPlayground) {
    return matches.map(cmd => ({
      ...cmd,
      disabled: cmd.category === 'Image Generation',
      disabledReason: cmd.category === 'Image Generation'
        ? 'Disabled in playground. Create your own project to use this.'
        : undefined,
    }));
  }

  return matches;
}

/**
 * Parse command and description from input
 *
 * Extracts the command (e.g., "/icon") and description (e.g., "coffee cup")
 * from user input. Validates that command exists in AI_COMMANDS.
 *
 * Some commands (like /crop-appicon) don't require descriptions.
 *
 * @param input - Complete user input
 * @returns Object with command and description, or null if invalid
 *
 * @example
 * parseCommand('/icon coffee cup')
 * // Returns: { command: '/icon', description: 'coffee cup' }
 *
 * parseCommand('/crop-appicon')
 * // Returns: { command: '/crop-appicon', description: '' }
 *
 * parseCommand('/invalid test')
 * // Returns: null (command not recognized)
 *
 * parseCommand('/icon')
 * // Returns: null (no description provided for command that requires it)
 */
export function parseCommand(input: string): {
  command: string;
  description: string;
  commandObj: AICommand;
} | null {
  const trimmed = input.trim();

  // Must start with /
  if (!hasCommandPrefix(trimmed)) {
    return null;
  }

  // Split on first space
  const spaceIndex = trimmed.indexOf(' ');

  let command: string;
  let description: string;

  if (spaceIndex === -1) {
    // No space found - command only, no description
    command = trimmed.toLowerCase();
    description = '';
  } else {
    command = trimmed.substring(0, spaceIndex).toLowerCase();
    description = trimmed.substring(spaceIndex + 1).trim();
  }

  // Validate command exists
  const commandObj = AI_COMMANDS.find(cmd => cmd.command === command);

  if (!commandObj) {
    return null;
  }

  // Commands in 'Image Processing' category don't require descriptions
  // Commands in other categories require descriptions
  const requiresDescription = commandObj.category !== 'Image Processing';

  if (requiresDescription && (!description || description.length === 0)) {
    return null;
  }

  return {
    command,
    description,
    commandObj,
  };
}

/**
 * Get command by exact match
 *
 * Helper to retrieve full command object by command string.
 * Useful for displaying help or examples.
 *
 * @param command - Command string (e.g., "/icon")
 * @returns Command object or undefined
 */
export function getCommand(command: string): AICommand | undefined {
  return AI_COMMANDS.find(cmd => cmd.command === command);
}
