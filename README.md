# Flutter WebView Bridge

A TypeScript/React library for seamless communication between Flutter WebView and web applications using the MessagePort API.

## Features

- 🚀 **Easy to use** - Simple API for sending and receiving messages
- 📱 **Flutter Integration** - Works with Flutter's WebView `postWebMessage`
- ⚛️ **React Hook** - Built-in React hook for easy integration
- 🔧 **TypeScript** - Full TypeScript support with type definitions
- 🐛 **Debug Mode** - Comprehensive logging for development
- 🔄 **Connection Status** - Real-time connection monitoring
- 🎯 **Singleton Pattern** - Global bridge instance for consistent communication

## Installation

```bash
npm install flutter-webview-bridge
```

## Quick Start

### 1. Flutter Side

```dart
import 'package:flutter_inappwebview/flutter_inappwebview.dart';

class WebViewExample extends StatefulWidget {
  @override
  _WebViewExampleState createState() => _WebViewExampleState();
}

class _WebViewExampleState extends State<WebViewExample> {
  InAppWebViewController? webViewController;
  WebMessagePort? port1;
  WebMessagePort? port2;

  @override
  Widget build(BuildContext context) {
    return InAppWebView(
      onWebViewCreated: (controller) {
        webViewController = controller;
      },
      onLoadStop: (controller, url) async {
        // Create message channel
        final webMessageChannel = await controller.createWebMessageChannel();
        port1 = webMessageChannel!.port1;
        port2 = webMessageChannel.port2;

        // Set up message listener
        await port1?.setWebMessageCallback((message) async {
          print("Message from WebView: ${message.data}");

          // Echo the message back
          await port1?.postMessage(WebMessage(data: "Echo: ${message.data}"));
        });

        // Send the port to WebView
        await controller.postWebMessage(
          message: WebMessage(data: 'capturePort', ports: [port2!]),
          targetOrigin: WebUri('*')
        );
      },
    );
  }
}
```

### 2. React/Web Side

```tsx
import React, { useEffect } from "react";
import { useFlutterBridge } from "flutter-webview-bridge";

function MyComponent() {
  const { sendMessage, lastMessage, isConnected } = useFlutterBridge();

  useEffect(() => {
    if (lastMessage) {
      console.log("Received from Flutter:", lastMessage);
    }
  }, [lastMessage]);

  const handleSendMessage = () => {
    sendMessage({
      type: "greeting",
      payload: { message: "Hello from React!" },
    });
  };

  return (
    <div>
      <p>
        Connection Status: {isConnected ? "✅ Connected" : "❌ Disconnected"}
      </p>
      <button onClick={handleSendMessage} disabled={!isConnected}>
        Send Message to Flutter
      </button>
      {lastMessage && (
        <div>
          <h3>Last Message:</h3>
          <pre>{JSON.stringify(lastMessage, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
```

## API Reference

### `useFlutterBridge(options?)`

React hook for Flutter WebView communication.

#### Parameters

- `options` (optional): Configuration object
  - `bridge`: Custom FlutterBridge instance
  - `onMessage`: Callback for incoming messages

#### Returns

- `sendMessage(data)`: Function to send messages to Flutter
- `lastMessage`: Last received message from Flutter
- `isConnected`: Boolean indicating connection status
- `connectionStatus`: Detailed connection information

#### Example

```tsx
const { sendMessage, lastMessage, isConnected, connectionStatus } =
  useFlutterBridge({
    onMessage: message => {
      console.log("New message:", message);
    },
  });
```

### `FlutterBridge`

Core bridge class for managing Flutter communication.

#### Constructor

```typescript
new FlutterBridge(options?: FlutterBridgeOptions)
```

#### Options

- `debug`: Enable debug logging (default: false)
- `captureCommand`: Command to capture port (default: 'capturePort')
- `confirmationMessage`: Confirmation message (default: 'portReceived')

#### Methods

- `sendMessage(data)`: Send message to Flutter
- `subscribe(callback)`: Subscribe to messages
- `getConnectionStatus()`: Get connection status
- `isConnected()`: Check if connected
- `disconnect()`: Disconnect and cleanup

#### Example

```typescript
import { FlutterBridge } from "flutter-webview-bridge";

const bridge = new FlutterBridge({ debug: true });

bridge.subscribe(message => {
  console.log("Received:", message);
});

bridge.sendMessage({ type: "test", data: "Hello Flutter!" });
```

### Global Bridge Instance

```typescript
import { flutterBridge } from "flutter-webview-bridge";

// Use the global singleton instance
flutterBridge.sendMessage({ type: "global", data: "Hello!" });
```

## Advanced Usage

### Custom Message Handling

```tsx
import { useFlutterBridge } from "flutter-webview-bridge";

function AdvancedComponent() {
  const { sendMessage, lastMessage, isConnected } = useFlutterBridge({
    onMessage: message => {
      // Handle specific message types
      if (message?.type === "navigation") {
        window.location.href = message.payload.url;
      } else if (message?.type === "alert") {
        alert(message.payload.message);
      }
    },
  });

  const sendCommand = (command: string, payload?: any) => {
    sendMessage({
      type: "command",
      command,
      payload,
      timestamp: Date.now(),
    });
  };

  return (
    <div>
      <button onClick={() => sendCommand("close")}>Close WebView</button>
      <button
        onClick={() => sendCommand("share", { url: window.location.href })}
      >
        Share Current Page
      </button>
    </div>
  );
}
```

### Connection Monitoring

```tsx
import { useFlutterBridge } from "flutter-webview-bridge";

function ConnectionMonitor() {
  const { connectionStatus, isConnected } = useFlutterBridge();

  return (
    <div>
      <h3>Connection Status</h3>
      <p>Connected: {isConnected ? "Yes" : "No"}</p>
      <p>Subscribers: {connectionStatus.subscribersCount}</p>
    </div>
  );
}
```

## Troubleshooting

### Common Issues

1. **Port not initialized**

   - Ensure Flutter calls `postWebMessage` with `capturePort` command
   - Check timing - WebView should be fully loaded
   - Verify ports are included in the message

2. **Messages not received**

   - Enable debug mode to see detailed logs
   - Check console for error messages
   - Verify message format

3. **Connection drops**
   - Monitor connection status
   - Implement reconnection logic if needed

### Debug Mode

Enable debug logging to troubleshoot issues:

```typescript
import { FlutterBridge } from "flutter-webview-bridge";

const bridge = new FlutterBridge({ debug: true });
```

This will log all communication attempts and help identify issues.

## TypeScript Support

The library is written in TypeScript and includes complete type definitions:

```typescript
import {
  FlutterBridge,
  MessageCallback,
  ConnectionStatus,
  FlutterBridgeOptions,
} from "flutter-webview-bridge";

const callback: MessageCallback = (data: unknown) => {
  console.log("Received:", data);
};

const options: FlutterBridgeOptions = {
  debug: true,
  captureCommand: "customCaptureCommand",
};
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 🐛 [Report Issues](https://github.com/yourusername/flutter-webview-bridge/issues)
- 💬 [Discussions](https://github.com/yourusername/flutter-webview-bridge/discussions)
- 📧 [Email Support](mailto:support@example.com)
