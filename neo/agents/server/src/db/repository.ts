/**
 * Session Repository
 *
 * Database operations for sessions and messages.
 */

import type { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';
import { tableNames, type SessionRow, type MessageRow } from './schema.js';

export interface CreateSessionInput {
  id?: string;
  userId?: string;
  workerId?: number;
  cwd?: string;
  modelId?: string;
  thinkingLevel?: string;
}

export interface UpdateSessionInput {
  workerId?: number;
  modelId?: string;
  thinkingLevel?: string;
  status?: 'idle' | 'active' | 'paused' | 'terminated';
}

export interface CreateMessageInput {
  sessionId: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  id?: string;
}

/**
 * Session Repository
 */
export class SessionRepository {
  constructor(private knex: Knex) {}

  /**
   * Create a new session
   */
  async create(input: CreateSessionInput = {}): Promise<SessionRow> {
    const id = input.id ?? uuidv4();
    const now = new Date();

    await this.knex(tableNames.sessions).insert({
      id,
      user_id: input.userId ?? null,
      worker_id: input.workerId ?? null,
      cwd: input.cwd ?? '/tmp',
      model_id: input.modelId ?? null,
      thinking_level: input.thinkingLevel ?? 'medium',
      status: 'idle',
      created_at: now,
      updated_at: now,
      last_active_at: now,
    });

    const session = await this.getById(id);
    if (!session) throw new Error('Failed to create session');
    return session;
  }

  /**
   * Get session by ID
   */
  async getById(id: string): Promise<SessionRow | null> {
    const row = await this.knex(tableNames.sessions).where({ id }).first();
    return row ?? null;
  }

  /**
   * Get all sessions
   */
  async getAll(): Promise<SessionRow[]> {
    return this.knex(tableNames.sessions).orderBy('created_at', 'desc');
  }

  /**
   * Get sessions by status
   */
  async getByStatus(status: SessionRow['status']): Promise<SessionRow[]> {
    return this.knex(tableNames.sessions).where({ status }).orderBy('created_at', 'desc');
  }

  /**
   * Get sessions by user
   */
  async getByUserId(userId: string): Promise<SessionRow[]> {
    return this.knex(tableNames.sessions).where({ user_id: userId }).orderBy('created_at', 'desc');
  }

  /**
   * Update session
   */
  async update(id: string, input: UpdateSessionInput): Promise<SessionRow | null> {
    const updates: Record<string, unknown> = {
      updated_at: new Date(),
      last_active_at: new Date(),
    };

    if (input.workerId !== undefined) updates.worker_id = input.workerId;
    if (input.modelId !== undefined) updates.model_id = input.modelId;
    if (input.thinkingLevel !== undefined) updates.thinking_level = input.thinkingLevel;
    if (input.status !== undefined) updates.status = input.status;

    await this.knex(tableNames.sessions).where({ id }).update(updates);

    return this.getById(id);
  }

  /**
   * Update last active timestamp
   */
  async touch(id: string): Promise<void> {
    await this.knex(tableNames.sessions).where({ id }).update({
      last_active_at: new Date(),
    });
  }

  /**
   * Delete session
   */
  async delete(id: string): Promise<boolean> {
    const deleted = await this.knex(tableNames.sessions).where({ id }).delete();
    return deleted > 0;
  }

  /**
   * Get active session count
   */
  async getActiveCount(): Promise<number> {
    const result = await this.knex(tableNames.sessions)
      .whereIn('status', ['active', 'paused'])
      .count('* as count')
      .first();
    return Number(result?.count ?? 0);
  }
}

/**
 * Message Repository
 */
export class MessageRepository {
  constructor(private knex: Knex) {}

  /**
   * Create a new message
   */
  async create(input: CreateMessageInput): Promise<MessageRow> {
    const id = input.id ?? uuidv4();
    const now = new Date();

    await this.knex(tableNames.messages).insert({
      id,
      session_id: input.sessionId,
      role: input.role,
      content: input.content,
      created_at: now,
    });

    const message = await this.getById(id);
    if (!message) throw new Error('Failed to create message');
    return message;
  }

  /**
   * Get message by ID
   */
  async getById(id: string): Promise<MessageRow | null> {
    const row = await this.knex(tableNames.messages).where({ id }).first();
    return row ?? null;
  }

  /**
   * Get messages by session
   */
  async getBySessionId(sessionId: string): Promise<MessageRow[]> {
    return this.knex(tableNames.messages)
      .where({ session_id: sessionId })
      .orderBy('created_at', 'asc');
  }

  /**
   * Get message count for session
   */
  async getCountBySessionId(sessionId: string): Promise<number> {
    const result = await this.knex(tableNames.messages)
      .where({ session_id: sessionId })
      .count('* as count')
      .first();
    return Number(result?.count ?? 0);
  }

  /**
   * Delete messages by session
   */
  async deleteBySessionId(sessionId: string): Promise<number> {
    const deleted = await this.knex(tableNames.messages)
      .where({ session_id: sessionId })
      .delete();
    return deleted;
  }
}

/**
 * Combined Repository
 */
export class DatabaseRepository {
  sessions: SessionRepository;
  messages: MessageRepository;

  constructor(knex: Knex) {
    this.sessions = new SessionRepository(knex);
    this.messages = new MessageRepository(knex);
  }
}