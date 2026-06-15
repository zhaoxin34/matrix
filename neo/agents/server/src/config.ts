/**
 * Application configuration
 */

export interface ServerConfig {
  host: string;
  port: number;
  workerPoolSize: number;
  db: DatabaseConfig;
  logLevel: string;
  agent: AgentConfig;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export interface AgentConfig {
  defaultCwd: string;
  defaultModel?: string;
  tools: string[];
}

const DEFAULT_CONFIG: ServerConfig = {
  host: '0.0.0.0',
  port: 8080,
  workerPoolSize: 4,
  db: {
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: 'root', // Override with DB_PASSWORD env var
    database: 'pi_agent',
  },
  logLevel: 'INFO',
  agent: {
    defaultCwd: '/tmp',
    tools: ['read', 'bash', 'edit', 'write'],
  },
};

let currentConfig: ServerConfig = { ...DEFAULT_CONFIG };

export function getConfig(): ServerConfig {
  return currentConfig;
}

export function setConfig(config: Partial<ServerConfig>): void {
  currentConfig = deepMerge(currentConfig, config);
}

export function resetConfig(): void {
  currentConfig = { ...DEFAULT_CONFIG };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deepMerge(target: any, source: any): any {
  if (typeof source !== 'object' || source === null || Array.isArray(source)) {
    return source;
  }
  const result = { ...target };
  for (const key of Object.keys(source)) {
    const sourceValue = source[key];
    const targetValue = target[key];
    if (sourceValue !== undefined && typeof sourceValue === 'object' && !Array.isArray(sourceValue) && sourceValue !== null && typeof targetValue === 'object' && targetValue !== null && !Array.isArray(targetValue)) {
      result[key] = deepMerge(targetValue, sourceValue);
    } else if (sourceValue !== undefined) {
      result[key] = sourceValue;
    }
  }
  return result;
}

export function loadConfigFromEnv(): void {
  const envConfig: Partial<ServerConfig> = {};
  if (process.env.HOST) envConfig.host = process.env.HOST;
  if (process.env.PORT) envConfig.port = parseInt(process.env.PORT, 10);
  if (process.env.WORKER_POOL_SIZE) envConfig.workerPoolSize = parseInt(process.env.WORKER_POOL_SIZE, 10);
  if (process.env.LOG_LEVEL) envConfig.logLevel = process.env.LOG_LEVEL;
  if (Object.keys(envConfig).length > 0) setConfig(envConfig);
}