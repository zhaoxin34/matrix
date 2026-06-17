import type {
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcNotification,
  AgentEvent,
} from '../types';

/**
 * WebSocket 客户端封装
 */
export class AgentClient {
  private ws: WebSocket | null = null;
  private pendingRequests: Map<number | string, {
    resolve: (result: unknown) => void;
    reject: (error: Error) => void;
  }> = new Map();
  private eventHandlers: Set<(event: AgentEvent) => void> = new Set();
  private idCounter: number = 0;
  private endpoint: string = '';
  private reconnectAttempts: number = 0;

  /**
   * 连接到 WebSocket 服务器
   */
  connect(endpoint: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws) {
        this.ws.close();
      }

      this.endpoint = endpoint;
      this.ws = new WebSocket(endpoint);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        resolve();
      };

      this.ws.onerror = () => {
        reject(new Error('WebSocket connection error'));
      };

      this.ws.onclose = () => {
        this.handleDisconnect();
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };
    });
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.pendingRequests.clear();
  }

  /**
   * 发送请求并等待响应
   */
  async call(method: string, params?: Record<string, unknown>): Promise<unknown> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected');
    }

    const id = ++this.idCounter;
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      method,
      params,
      id,
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      this.ws!.send(JSON.stringify(request));

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Request ${method} timed out`));
        }
      }, 30000);
    });
  }

  /**
   * 订阅 Agent 事件
   */
  onEvent(handler: (event: AgentEvent) => void): () => void {
    this.eventHandlers.add(handler);
    return () => {
      this.eventHandlers.delete(handler);
    };
  }

  /**
   * 获取连接状态
   */
  get isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * 获取当前 endpoint
   */
  get currentEndpoint(): string {
    return this.endpoint;
  }

  /**
   * 获取重连次数
   */
  get attempts(): number {
    return this.reconnectAttempts;
  }

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      // Notification (event)
      if ('method' in message && message.method === 'agent.event') {
        const notification = message as JsonRpcNotification;
        const event = notification.params as unknown as AgentEvent;
        this.eventHandlers.forEach((handler) => handler(event));
        return;
      }

      // Response
      if ('id' in message) {
        const response = message as JsonRpcResponse;
        const pending = this.pendingRequests.get(response.id as number | string);
        if (pending) {
          this.pendingRequests.delete(response.id as number | string);
          if (response.error) {
            pending.reject(new Error(response.error.message));
          } else {
            pending.resolve(response.result);
          }
        }
      }
    } catch (error) {
      console.error('Failed to parse message:', error);
    }
  }

  private handleDisconnect(): void {
    // Reject all pending requests
    this.pendingRequests.forEach((pending) => {
      pending.reject(new Error('Connection closed'));
    });
    this.pendingRequests.clear();
  }
}

// Singleton instance
let clientInstance: AgentClient | null = null;

export function getAgentClient(): AgentClient {
  if (!clientInstance) {
    clientInstance = new AgentClient();
  }
  return clientInstance;
}
