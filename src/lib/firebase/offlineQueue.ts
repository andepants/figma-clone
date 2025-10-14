/**
 * Offline Operation Queue
 *
 * Queues Firebase operations while offline and executes them when connection
 * is restored. Prevents data loss during network interruptions.
 */

/**
 * Queued operation interface
 */
interface QueuedOperation {
  id: string
  fn: () => Promise<void>
  description: string
  timestamp: number
  retries: number
}

/**
 * Maximum queue size to prevent memory issues
 */
const MAX_QUEUE_SIZE = 100

/**
 * Maximum retries for a single operation
 */
const MAX_RETRIES = 3

/**
 * Operation queue
 */
let queue: QueuedOperation[] = []

/**
 * Whether the queue is currently being processed
 */
let isProcessing = false

/**
 * Offline/online listeners
 */
let hasListeners = false

/**
 * Queue an operation to be executed when online
 *
 * @param fn - Async function to execute
 * @param description - Human-readable description for logging
 * @returns Operation ID
 *
 * @example
 * ```typescript
 * queueOperation(
 *   () => addCanvasObject('main', newRect),
 *   'Create rectangle'
 * );
 * ```
 */
export function queueOperation(
  fn: () => Promise<void>,
  description: string
): string {
  const operationId = `op-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

  // Check queue size limit
  if (queue.length >= MAX_QUEUE_SIZE) {
    console.warn('Operation queue is full, removing oldest operation')
    queue.shift()
  }

  const operation: QueuedOperation = {
    id: operationId,
    fn,
    description,
    timestamp: Date.now(),
    retries: 0,
  }

  queue.push(operation)

  // Set up listeners if not already done
  if (!hasListeners) {
    setupListeners()
  }

  // Try to process queue if online
  if (navigator.onLine) {
    processQueue()
  }

  return operationId
}

/**
 * Execute a function, queuing it if offline
 *
 * @param fn - Async function to execute
 * @param description - Human-readable description
 * @returns Promise that resolves when executed (immediately if online, later if offline)
 *
 * @example
 * ```typescript
 * await executeOrQueue(
 *   () => removeCanvasObject('main', objectId),
 *   'Delete object'
 * );
 * ```
 */
export async function executeOrQueue(
  fn: () => Promise<void>,
  description: string
): Promise<void> {
  if (navigator.onLine) {
    // Online: execute immediately
    try {
      await fn()
    } catch (error) {
      // If execution fails, queue it for retry
      console.error(`Failed to execute ${description}, queuing for retry:`, error)
      queueOperation(fn, description)
      throw error
    }
  } else {
    // Offline: queue for later
    queueOperation(fn, description)
  }
}

/**
 * Process all queued operations
 *
 * Executes operations in FIFO order. Failed operations are retried up to
 * MAX_RETRIES times. Operations that exceed max retries are discarded.
 */
async function processQueue(): Promise<void> {
  // Prevent concurrent processing
  if (isProcessing || queue.length === 0) {
    return
  }

  isProcessing = true

  // Process operations in order
  while (queue.length > 0) {
    // Check if we went offline during processing
    if (!navigator.onLine) {
      isProcessing = false
      return
    }

    const operation = queue[0]

    try {
      await operation.fn()

      // Remove successfully executed operation
      queue.shift()
    } catch (error) {
      console.error(`✗ Failed to execute queued operation: ${operation.description}`, error)

      operation.retries++

      if (operation.retries >= MAX_RETRIES) {
        console.error(`Operation exceeded max retries, discarding: ${operation.description}`)
        queue.shift()
      } else {
        // Move to end of queue for retry
        queue.shift()
        queue.push(operation)

        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * operation.retries))
      }
    }
  }

  isProcessing = false
}

/**
 * Set up online/offline event listeners
 */
function setupListeners(): void {
  if (hasListeners) {
    return
  }

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  hasListeners = true
}

/**
 * Handle online event
 */
function handleOnline(): void {
  processQueue()
}

/**
 * Handle offline event
 */
function handleOffline(): void {
  // Queue operations when offline
}

/**
 * Get current queue status
 *
 * @returns Queue information
 */
export function getQueueStatus(): {
  size: number
  isProcessing: boolean
  operations: Array<{ id: string; description: string; retries: number }>
} {
  return {
    size: queue.length,
    isProcessing,
    operations: queue.map(op => ({
      id: op.id,
      description: op.description,
      retries: op.retries,
    })),
  }
}

/**
 * Clear all queued operations
 *
 * Use with caution - this will discard all pending operations.
 */
export function clearQueue(): void {
  queue = []
}

/**
 * Clean up listeners (call on app unmount)
 */
export function cleanup(): void {
  if (hasListeners) {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
    hasListeners = false
  }
}
