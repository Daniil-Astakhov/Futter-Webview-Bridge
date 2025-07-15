/**
 * Flutter WebView Bridge
 *
 * A TypeScript/React library for seamless communication between
 * Flutter WebView and web applications using MessagePort API.
 */

// Main exports
export { FlutterBridge, flutterBridge } from "./bridge";
export { useFlutterBridge } from "./useFlutterBridge";

// Types
export type {
  MessageCallback,
  ConnectionStatus,
  FlutterBridgeOptions,
} from "./bridge";

export type {
  UseFlutterBridgeReturn,
  UseFlutterBridgeOptions,
} from "./useFlutterBridge";

// Version
export const VERSION = "1.0.0";
