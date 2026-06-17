/**
 * WebSocket Server Implementation
 *
 * Handles WebSocket connections, message routing, and session management.
 */

import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '../utils/logger.js';

// ========== Types ==========

export type ConnectionState = 'connecting' | 'connected' | 'authenticated' | 'disconnected' | 'error';

export interface ServerConfig {
  port: number;
  host: string;
  maxConnections?: number;
  pingInterval?: number;
  pingTimeout?: number;
}

export interface WsConnection {
  id: string;
  sessionId: string;
  state: ConnectionState;
  socket: WebSocket;
  send(message: unknown): void;
  sendBatch(messages: unknown[]): void;
  close(code?: number, reason?: string): void;
  onMessage(handler: (message: unknown) => void): () => void;
  onError(handler: (error: Error) => void): () => void;
  onClose(handler: () => void): () => void;
}

export interface WsServer {
  config: ServerConfig;
  getConnectionCount(): number;
  getConnection(id: string): WsConnection | undefined;
  getConnections(): WsConnection[];
  broadcast(message: unknown): void;
  shutdown(): Promise<void>;
}

// ========== Connection Implementation ==========

export function createWsConnection(socket: WebSocket, sessionId: string): WsConnection {
  const log = createLogger('WsConnection');
  const id = uuidv4();

  let state: ConnectionState = 'connected';
  const messageHandlers: Set<(message: unknown) => void> = new Set();
  const errorHandlers: Set<(error: Error) => void> = new Set();
  const closeHandlers: Set<() => void> = new Set();

  // Handle incoming messages
  socket.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      messageHandlers.forEach((handler) => handler(message));
    } catch (err) {
      log.warn('Failed to parse message:', data.toString().substring(0, 100));
      const error = err instanceof Error ? err : new Error('Parse error');
      errorHandlers.forEach((handler) => handler(error));
    }
  });

  // Handle errors
  socket.on('error', (err) => {
    log.error('Socket error:', err);
    state = 'error';
    errorHandlers.forEach((handler) => handler(err as Error));
  });

  // Handle close
  socket.on('close', () => {
    log.debug(`Connection ${id} closed`);
    state = 'disconnected';
    closeHandlers.forEach((handler) => handler());
  });

  const connection: WsConnection = {
    id,
    sessionId,
    get state() {
      return state;
    },
    socket,
    send(message: unknown) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
      }
    },
    sendBatch(messages: unknown[]) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(messages));
      }
    },
    close(code = 1000, reason = 'Normal closure') {
      log.debug(`Closing connection ${id}: ${code} - ${reason}`);
      socket.close(code, reason);
      state = 'disconnected';
    },
    onMessage(handler: (message: unknown) => void) {
      messageHandlers.add(handler);
      return () => messageHandlers.delete(handler);
    },
    onError(handler: (error: Error) => void) {
      errorHandlers.add(handler);
      return () => errorHandlers.delete(handler);
    },
    onClose(handler: () => void) {
      closeHandlers.add(handler);
      return () => closeHandlers.delete(handler);
    },
  };

  return connection;
}

// ========== Server Implementation ==========

export function createWsServer(config: ServerConfig, wss?: WebSocketServer): WsServer {
  const log = createLogger('WsServer');

  // Create WebSocket server if not provided
  const server = wss ?? new WebSocketServer({
    port: config.port,
    host: config.host,
  });

  const connections: Map<string, WsConnection> = new Map();
  const maxConnections = config.maxConnections ?? 100;

  log.info(`WebSocket server created on ${config.host}:${config.port}`);

  // Handle new connections
  server.on('connection', (socket, request) => {
    // Check connection limit
    if (connections.size >= maxConnections) {
      log.warn('Connection rejected: max connections reached');
      socket.close(1013, 'Max connections reached');
      return;
    }

    // Extract session ID from query params or generate new one
    const url = new URL(request.url ?? '/', `http://${request.headers.host}`);
    const sessionId = url.searchParams.get('session');

    // Create connection
    const connection = createWsConnection(socket, sessionId ?? uuidv4());
    connections.set(connection.id, connection);

    log.info(`New connection: ${connection.id}, session: ${connection.sessionId}`);

    // Handle close
    connection.onClose(() => {
      log.debug(`Connection removed: ${connection.id}`);
      connections.delete(connection.id);
    });
  });

  // Handle server errors
  server.on('error', (err) => {
    log.error('Server error:', err);
  });

  const wsServer: WsServer = {
    config,
    getConnectionCount() {
      return connections.size;
    },
    getConnection(id: string) {
      return connections.get(id);
    },
    getConnections() {
      return Array.from(connections.values());
    },
    broadcast(message: unknown) {
      const data = JSON.stringify(message);
      connections.forEach((conn) => {
        if (conn.socket.readyState === WebSocket.OPEN) {
          conn.socket.send(data);
        }
      });
    },
    async shutdown() {
      log.info('Shutting down WebSocket server...');

      // Close all connections
      connections.forEach((conn) => {
        conn.close(1001, 'Server shutting down');
      });
      connections.clear();

      // Close server
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });

      log.info('WebSocket server shut down');
    },
  };

  return wsServer;
}

// ========== Convenience Exports ==========

export function startServer(config: ServerConfig): Promise<WsServer> {
  const log = createLogger('Server');
  log.info(`Starting WebSocket server on ${config.host}:${config.port}`);

  const wss = new WebSocketServer({
    port: config.port,
    host: config.host,
  });

  const server = createWsServer(config, wss);

  return Promise.resolve(server);
}
