/**
 * @fileoverview Provides a bridge for communication between web applications and Flutter WebView.
 * This script captures a MessagePort sent from Flutter and facilitates two-way communication.
 *
 * @singleton
 */

export type MessageCallback = (data: unknown) => void;

export interface ConnectionStatus {
  hasPort: boolean;
  subscribersCount: number;
}

export interface FlutterBridgeOptions {
  debug?: boolean;
  captureCommand?: string;
  confirmationMessage?: string;
}

/**
 * Manages the MessagePort connection with the Flutter host.
 */
export class FlutterBridge {
  private port: MessagePort | null = null;
  private subscribers: Set<MessageCallback> = new Set();
  private options: Required<FlutterBridgeOptions>;

  /**
   * Initializes the bridge and starts listening for the port from Flutter.
   */
  constructor(options: FlutterBridgeOptions = {}) {
    this.options = {
      debug: false,
      captureCommand: "capturePort",
      confirmationMessage: "portReceived",
      ...options,
    };

    if (typeof window !== "undefined") {
      this.log("Инициализация FlutterBridge, подписка на window message");
      window.addEventListener("message", this.capturePort.bind(this));

      if (this.options.debug) {
        // Дополнительная отладка - слушаем ВСЕ сообщения
        window.addEventListener("message", event => {
          this.log("Получено window message:", {
            data: event.data,
            origin: event.origin,
            source: event.source ? "present" : "null",
            ports: event.ports?.length || 0,
          });
        });
      }
    } else {
      this.warn("window недоступен (SSR?)");
    }
  }

  /**
   * Captures the MessagePort sent from Flutter.
   */
  private capturePort(event: MessageEvent): void {
    if (this.options.debug) {
      this.log("Проверка сообщения на capturePort:", {
        data: event.data,
        hasPorts: event.ports && event.ports.length > 0,
        portsCount: event.ports?.length || 0,
      });
    }

    if (
      event.data === this.options.captureCommand &&
      event.ports &&
      event.ports.length > 0
    ) {
      this.log("✅ Flutter message port captured!");
      this.port = event.ports[0];
      this.port.onmessage = this.handleMessage.bind(this);

      // Уведомляем Flutter, что порт получен
      this.port.postMessage(this.options.confirmationMessage);
      this.log(
        `Отправлено подтверждение '${this.options.confirmationMessage}'`
      );
    } else if (this.options.debug) {
      this.log("❌ Сообщение не соответствует критериям capturePort");
    }
  }

  /**
   * Handles incoming messages from the Flutter port and notifies subscribers.
   */
  private handleMessage(event: MessageEvent): void {
    this.log("Message received from Flutter:", event.data);
    this.subscribers.forEach(callback => callback(event.data));
  }

  /**
   * Sends a message to the Flutter application.
   */
  public sendMessage(data: unknown): void {
    if (this.options.debug) {
      this.log("Попытка отправки сообщения:", {
        data,
        hasPort: !!this.port,
        portState: this.port ? "active" : "null",
      });
    }

    if (this.port) {
      this.log("✅ Отправка сообщения во Flutter");
      this.port.postMessage(data);
    } else {
      this.warn("❌ Flutter port not initialized. Cannot send message.");
      if (this.options.debug) {
        this.warn("Возможные причины:");
        this.warn("1. Flutter еще не отправил порт");
        this.warn("2. Сообщение от Flutter имеет неправильный формат");
        this.warn("3. Проблема с timing - сообщение отправляется слишком рано");
      }
    }
  }

  /**
   * Subscribes a callback to listen for messages from Flutter.
   */
  public subscribe(callback: MessageCallback): () => void {
    this.subscribers.add(callback);
    this.log(`Подписчик добавлен. Всего: ${this.subscribers.size}`);
    return () => {
      this.subscribers.delete(callback);
      this.log(`Подписчик удален. Осталось: ${this.subscribers.size}`);
    };
  }

  /**
   * Проверяет состояние подключения
   */
  public getConnectionStatus(): ConnectionStatus {
    return {
      hasPort: !!this.port,
      subscribersCount: this.subscribers.size,
    };
  }

  /**
   * Проверяет, инициализирован ли порт
   */
  public isConnected(): boolean {
    return !!this.port;
  }

  /**
   * Отключает bridge и очищает все подписки
   */
  public disconnect(): void {
    if (this.port) {
      this.port.close();
      this.port = null;
    }
    this.subscribers.clear();
    this.log("Bridge отключен");
  }

  private log(message: string, data?: unknown): void {
    if (this.options.debug) {
      console.log(`[FlutterBridge] ${message}`, data || "");
    }
  }

  private warn(message: string): void {
    console.warn(`[FlutterBridge] ${message}`);
  }
}

// Export a singleton instance of the bridge with debug enabled by default
export const flutterBridge = new FlutterBridge({ debug: false });
