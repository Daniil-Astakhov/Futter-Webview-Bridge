import { useEffect, useState, useCallback } from "react";
import {
  flutterBridge,
  FlutterBridge,
  MessageCallback,
  ConnectionStatus,
} from "./bridge";

export interface UseFlutterBridgeReturn {
  sendMessage: (data: unknown) => void;
  lastMessage: unknown | null;
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
}

export interface UseFlutterBridgeOptions {
  bridge?: FlutterBridge;
  onMessage?: MessageCallback;
}

/**
 * A React hook for interacting with the Flutter WebView bridge.
 * It provides a way to send messages to Flutter and receive the last message from it.
 */
export function useFlutterBridge(
  options: UseFlutterBridgeOptions = {}
): UseFlutterBridgeReturn {
  const { bridge = flutterBridge, onMessage } = options;

  const [lastMessage, setLastMessage] = useState<unknown | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    () => bridge.getConnectionStatus()
  );

  useEffect(() => {
    const handleMessage = (message: unknown) => {
      setLastMessage(message);
      onMessage?.(message);
    };

    // Subscribe to messages when the component mounts.
    const unsubscribe = bridge.subscribe(handleMessage);

    // Update connection status periodically
    const statusInterval = setInterval(() => {
      setConnectionStatus(bridge.getConnectionStatus());
    }, 1000);

    // Cleanup
    return () => {
      unsubscribe();
      clearInterval(statusInterval);
    };
  }, [bridge, onMessage]);

  // Provide a stable function to send messages to Flutter.
  const sendMessage = useCallback(
    (data: unknown) => {
      bridge.sendMessage(data);
    },
    [bridge]
  );

  return {
    sendMessage,
    lastMessage,
    isConnected: connectionStatus.hasPort,
    connectionStatus,
  };
}

// Export the bridge instance for direct access
export { flutterBridge, FlutterBridge };
export type { MessageCallback, ConnectionStatus } from "./bridge";
