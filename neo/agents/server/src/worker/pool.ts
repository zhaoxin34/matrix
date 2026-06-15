/**
 * Worker Pool Management
 *
 * Manages a pool of Worker threads for handling multiple agent sessions.
 */

import { EventEmitter } from 'events';
import { createLogger } from '../utils/logger.js';

// ========== Types ==========

export type WorkerStatus = 'idle' | 'busy' | 'terminating';

export interface WorkerInfo {
  id: number;
  status: WorkerStatus;
  sessionId: string | null;
  createdAt: Date;
  lastUsedAt: Date;
}

export interface PoolOptions {
  /** Number of workers in the pool */
  poolSize?: number;
  /** Maximum number of waiting requests when pool is full (0 = reject) */
  maxWaiting?: number;
  /** Worker script path */
  workerScript?: string;
  /** Idle timeout in ms (0 = no timeout) */
  idleTimeout?: number;
}

export interface PoolStats {
  total: number;
  available: number;
  busy: number;
  waiting: number;
  totalSessions: number;
}

// ========== Errors ==========

export class WorkerPoolError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = 'WorkerPoolError';
  }
}

// ========== Worker Pool ==========

export interface WorkerPool {
  acquire(sessionId: string): Promise<number>;
  release(workerId: number): void;
  terminate(workerId: number): void;
  destroy(): void;
  getWorkers(): WorkerInfo[];
  getAvailableCount(): number;
  getStats(): PoolStats;
  on(event: 'worker:ready' | 'worker:error' | 'worker:event', handler: (...args: unknown[]) => void): void;
  off(event: 'worker:ready' | 'worker:error' | 'worker:event', handler: (...args: unknown[]) => void): void;
}

/**
 * Create a worker pool
 *
 * Note: This is a mock implementation for testing purposes.
 * The actual implementation would use Node.js Worker threads.
 */
export function createWorkerPool(options: PoolOptions = {}): WorkerPool {
  const poolSize = options.poolSize ?? 4;
  const maxWaiting = options.maxWaiting ?? 10;

  // Validate pool size
  if (poolSize < 1) {
    throw new WorkerPoolError(
      `Invalid pool size: ${poolSize}. Must be >= 1`,
      'INVALID_POOL_SIZE'
    );
  }

  if (maxWaiting < 0) {
    throw new WorkerPoolError(
      `Invalid max waiting: ${maxWaiting}. Must be >= 0`,
      'INVALID_MAX_WAITING'
    );
  }

  const log = createLogger('WorkerPool');
  log.info(`Creating pool with ${poolSize} workers`);

  // Worker state
  const workers: Map<number, WorkerInfo> = new Map();
  const waitingQueue: Array<{ sessionId: string; resolve: (id: number) => void; reject: (e: Error) => void }> = [];

  // Initialize workers
  for (let i = 1; i <= poolSize; i++) {
    workers.set(i, {
      id: i,
      status: 'idle',
      sessionId: null,
      createdAt: new Date(),
      lastUsedAt: new Date(),
    });
  }

  // Event emitter
  const emitter = new EventEmitter();
  emitter.setMaxListeners(100);

  // Pool implementation
  const pool: WorkerPool = {
    /**
     * Acquire an available worker for a session
     */
    async acquire(sessionId: string): Promise<number> {
      log.debug(`Acquiring worker for session: ${sessionId}`);

      // Find an idle worker
      for (const [id, info] of workers) {
        if (info.status === 'idle') {
          info.status = 'busy';
          info.sessionId = sessionId;
          info.lastUsedAt = new Date();
          log.debug(`Worker ${id} assigned to session ${sessionId}`);
          emitter.emit('worker:ready', { workerId: id, sessionId });
          return id;
        }
      }

      // No idle worker available
      if (waitingQueue.length >= maxWaiting) {
        throw new WorkerPoolError(
          `Pool full. ${workers.size} busy, ${waitingQueue.length} waiting, max ${maxWaiting}`,
          'POOL_FULL'
        );
      }

      // Queue the request
      return new Promise<number>((resolve, reject) => {
        waitingQueue.push({ sessionId, resolve, reject });
        log.debug(`Session ${sessionId} queued. ${waitingQueue.length} waiting.`);
      });
    },

    /**
     * Release a worker back to the pool
     */
    release(workerId: number): void {
      const info = workers.get(workerId);
      if (!info) {
        log.warn(`Attempted to release unknown worker: ${workerId}`);
        return;
      }

      log.debug(`Releasing worker ${workerId}, session ${info.sessionId}`);
      info.status = 'idle';
      info.sessionId = null;
      info.lastUsedAt = new Date();

      // Process waiting queue
      if (waitingQueue.length > 0) {
        const waiting = waitingQueue.shift()!;
        info.status = 'busy';
        info.sessionId = waiting.sessionId;
        info.lastUsedAt = new Date();
        waiting.resolve(workerId);
        emitter.emit('worker:ready', { workerId, sessionId: waiting.sessionId });
        log.debug(`Worker ${workerId} assigned to queued session ${waiting.sessionId}`);
      }
    },

    /**
     * Terminate a specific worker
     */
    terminate(workerId: number): void {
      const info = workers.get(workerId);
      if (!info) {
        log.warn(`Attempted to terminate unknown worker: ${workerId}`);
        return;
      }

      log.info(`Terminating worker ${workerId}`);
      info.status = 'terminating';

      // Remove from workers map
      workers.delete(workerId);

      // Reject any waiting requests
      const idx = waitingQueue.findIndex(w => w.sessionId === info.sessionId);
      if (idx >= 0) {
        const waiting = waitingQueue.splice(idx, 1)[0];
        waiting.reject(new WorkerPoolError('Worker terminated', 'WORKER_TERMINATED'));
      }
    },

    /**
     * Destroy the entire pool
     */
    destroy(): void {
      log.info('Destroying pool');

      // Reject all waiting requests
      for (const waiting of waitingQueue) {
        waiting.reject(new WorkerPoolError('Pool destroyed', 'POOL_DESTROYED'));
      }
      waitingQueue.length = 0;

      // Clear workers
      workers.clear();

      // Remove all listeners
      emitter.removeAllListeners();
    },

    /**
     * Get info about all workers
     */
    getWorkers(): WorkerInfo[] {
      return Array.from(workers.values());
    },

    /**
     * Get count of available workers
     */
    getAvailableCount(): number {
      let count = 0;
      for (const info of workers.values()) {
        if (info.status === 'idle') count++;
      }
      return count;
    },

    /**
     * Get pool statistics
     */
    getStats(): PoolStats {
      let busy = 0;
      let idle = 0;

      for (const info of workers.values()) {
        if (info.status === 'busy') busy++;
        else if (info.status === 'idle') idle++;
      }

      return {
        total: workers.size,
        available: idle,
        busy,
        waiting: waitingQueue.length,
        totalSessions: busy,
      };
    },

    /**
     * Subscribe to pool events
     */
    on(event: 'worker:ready' | 'worker:error' | 'worker:event', handler: (...args: unknown[]) => void): void {
      emitter.on(event, handler);
    },

    /**
     * Unsubscribe from pool events
     */
    off(event: 'worker:ready' | 'worker:error' | 'worker:event', handler: (...args: unknown[]) => void): void {
      emitter.off(event, handler);
    },
  };

  return pool;
}

// ========== Factory for actual Worker threads ==========

/**
 * Create a real Worker pool with actual Worker threads
 *
 * Note: Requires CommonJS worker script (see tsconfig.worker.json)
 */
export async function createRealWorkerPool(options: PoolOptions = {}): Promise<WorkerPool> {
  // This would be implemented with actual Worker threads
  // For now, return the mock implementation
  return createWorkerPool(options);
}