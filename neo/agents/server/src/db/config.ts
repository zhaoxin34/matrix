/**
 * Database Configuration
 *
 * Supports MySQL for production and SQLite for testing.
 * Uses Knex.js for database abstraction.
 */

import type { Knex } from 'knex';

export interface DbConfig {
  client: 'mysql2' | 'better-sqlite3';
  connection: MySqlConnectionConfig | SqliteConnectionConfig;
  useNullAsDefault?: boolean;
  pool?: {
    min?: number;
    max?: number;
  };
}

export interface MySqlConnectionConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export interface SqliteConnectionConfig {
  filename: string;
}

// Default configs
export const mysqlConfig: DbConfig = {
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'neo',
  },
  pool: {
    min: 2,
    max: 10,
  },
};

export const sqliteConfig: DbConfig = {
  client: 'better-sqlite3',
  connection: {
    filename: ':memory:', // In-memory SQLite for testing
  },
  useNullAsDefault: true,
};

// Environment-aware config
export function getDbConfig(): DbConfig {
  if (process.env.NODE_ENV === 'test') {
    return sqliteConfig;
  }
  return mysqlConfig;
}

// Create Knex instance
export function createKnex(config?: DbConfig): Knex {
  const { default: knex } = require('knex');
  return knex(config ?? getDbConfig());
}