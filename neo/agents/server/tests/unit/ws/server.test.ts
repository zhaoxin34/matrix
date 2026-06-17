import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  type WsConnection,
  createWsConnection,
  type ServerConfig,
  type WsServer,
  createWsServer,
} from '../../../src/ws/server.js';

describe('WebSocket Connection', () => {
  let mockSocket: any;
  let connection: WsConnection;

  beforeEach(() => {
    // Create mock socket with proper event storage
    mockSocket = {
      readyState: 1, // OPEN
      send: vi.fn(),
      close: vi.fn(),
      _handlers: {} as Record<string, any[]>,
      on: vi.fn((event: string, handler: any) => {
        if (!mockSocket._handlers[event]) mockSocket._handlers[event] = [];
        mockSocket._handlers[event].push(handler);
      }),
      off: vi.fn((event: string, handler: any) => {
        if (mockSocket._handlers[event]) {
          mockSocket._handlers[event] = mockSocket._handlers[event].filter((h: any) => h !== handler);
        }
      }),
      emit: vi.fn((event: string, data: any) => {
        if (mockSocket._handlers[event]) {
          mockSocket._handlers[event].forEach((h: any) => h(data));
        }
      }),
    };
  });

  describe('createWsConnection()', () => {
    it('should create connection with socket', () => {
      connection = createWsConnection(mockSocket, 'session-123');
      expect(connection.sessionId).toBe('session-123');
    });

    it('should return correct state', () => {
      connection = createWsConnection(mockSocket, 'session-123');
      expect(connection.state).toBe('connected');
    });

    it('should send JSON-RPC messages', () => {
      connection = createWsConnection(mockSocket, 'session-123');

      const message = { jsonrpc: '2.0', method: 'agent.event', params: { type: 'agent_start' } };
      connection.send(message);

      expect(mockSocket.send).toHaveBeenCalledWith(JSON.stringify(message));
    });

    it('should send batch messages', () => {
      connection = createWsConnection(mockSocket, 'session-123');

      const messages = [
        { jsonrpc: '2.0', method: 'event1', params: {} },
        { jsonrpc: '2.0', method: 'event2', params: {} },
      ];
      connection.sendBatch(messages);

      expect(mockSocket.send).toHaveBeenCalledWith(JSON.stringify(messages));
    });

    it('should close connection', () => {
      connection = createWsConnection(mockSocket, 'session-123');
      connection.close();

      expect(mockSocket.close).toHaveBeenCalled();
      expect(connection.state).toBe('disconnected');
    });
  });

  describe('Event Handling', () => {
    it('should subscribe to messages', () => {
      connection = createWsConnection(mockSocket, 'session-123');
      const handler = vi.fn();

      const unsubscribe = connection.onMessage(handler);
      expect(typeof unsubscribe).toBe('function');
    });

    it('should receive messages', () => {
      connection = createWsConnection(mockSocket, 'session-123');
      const handler = vi.fn();
      connection.onMessage(handler);

      // Simulate message received - WebSocket passes data as string or Buffer
      const message = { jsonrpc: '2.0', method: 'test' };
      const msgHandler = mockSocket._handlers['message']?.[0];
      // ws library passes the data directly (string or Buffer)
      msgHandler?.(JSON.stringify(message));

      expect(handler).toHaveBeenCalledWith(message);
    });

    it('should handle parse errors', () => {
      connection = createWsConnection(mockSocket, 'session-123');
      const errorHandler = vi.fn();
      connection.onError(errorHandler);

      // Call the message handler with invalid data
      const msgHandler = mockSocket._handlers['message']?.[0];
      msgHandler?.('not valid json');

      expect(errorHandler).toHaveBeenCalled();
    });

    it('should handle close events', () => {
      connection = createWsConnection(mockSocket, 'session-123');
      const closeHandler = vi.fn();
      connection.onClose(closeHandler);

      // Call the close handler
      const closeEvtHandler = mockSocket._handlers['close']?.[0];
      closeEvtHandler?.();

      expect(closeHandler).toHaveBeenCalled();
      expect(connection.state).toBe('disconnected');
    });
  });
});

describe('WebSocket Server', () => {
  let server: WsServer;
  let mockWss: any;
  let mockConfig: ServerConfig;

  beforeEach(() => {
    mockWss = {
      on: vi.fn(),
      close: vi.fn(),
    };

    mockConfig = {
      port: 8080,
      host: 'localhost',
      maxConnections: 100,
      pingInterval: 30000,
      pingTimeout: 5000,
    };
  });

  describe('createWsServer()', () => {
    it('should create server with config', () => {
      server = createWsServer(mockConfig, mockWss);
      expect(server.config.port).toBe(8080);
    });

    it('should register connection handler', () => {
      server = createWsServer(mockConfig, mockWss);
      expect(mockWss.on).toHaveBeenCalledWith('connection', expect.any(Function));
    });
  });

  describe('Connection Management', () => {
    it('should track active connections', () => {
      server = createWsServer(mockConfig, mockWss);

      expect(server.getConnectionCount()).toBe(0);

      // Simulate connection with mock request
      const connectionHandler = mockWss.on.mock.calls.find((call: any[]) => call[0] === 'connection')?.[1];
      const mockSocket = { readyState: 1, on: vi.fn(), close: vi.fn() };
      const mockRequest = { url: '/?session=test-123', headers: { host: 'localhost' } };
      connectionHandler?.(mockSocket, mockRequest);

      expect(server.getConnectionCount()).toBe(1);
    });

    it('should remove connection on close', () => {
      server = createWsServer(mockConfig, mockWss);

      const connectionHandler = mockWss.on.mock.calls.find((call: any[]) => call[0] === 'connection')?.[1];
      const mockSocket: any = { readyState: 1, on: vi.fn((event, cb) => {
        if (event === 'close') mockSocket._closeHandler = cb;
      }), close: vi.fn() };
      const mockRequest = { url: '/', headers: { host: 'localhost' } };
      connectionHandler?.(mockSocket, mockRequest);

      expect(server.getConnectionCount()).toBe(1);

      // Simulate close
      mockSocket._closeHandler?.();
      expect(server.getConnectionCount()).toBe(0);
    });
  });

  describe('Broadcast', () => {
    it('should broadcast to all connections', () => {
      server = createWsServer(mockConfig, mockWss);

      const mockSend = vi.fn();
      const connectionHandler = mockWss.on.mock.calls.find((call: any[]) => call[0] === 'connection')?.[1];
      const mockSocket1 = { readyState: 1, send: mockSend, on: vi.fn(), close: vi.fn() };
      const mockSocket2 = { readyState: 1, send: mockSend, on: vi.fn(), close: vi.fn() };
      const mockRequest = { url: '/', headers: { host: 'localhost' } };

      connectionHandler?.(mockSocket1, mockRequest);
      connectionHandler?.(mockSocket2, mockRequest);

      server.broadcast({ jsonrpc: '2.0', method: 'notification', params: {} });

      expect(mockSend).toHaveBeenCalledTimes(2);
    });
  });

  describe('Shutdown', () => {
    it('should close all connections on shutdown', () => {
      server = createWsServer(mockConfig, mockWss);

      const mockClose = vi.fn();
      const connectionHandler = mockWss.on.mock.calls.find((call: any[]) => call[0] === 'connection')?.[1];
      const mockSocket = { readyState: 1, send: vi.fn(), on: vi.fn(), close: mockClose };
      const mockRequest = { url: '/', headers: { host: 'localhost' } };
      connectionHandler?.(mockSocket, mockRequest);

      server.shutdown();

      expect(mockClose).toHaveBeenCalled();
      expect(mockWss.close).toHaveBeenCalled();
    });
  });
});