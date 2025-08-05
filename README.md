# Claude Code Chat - Mobile Web App

A mobile-first web interface for Claude Code CLI, designed to run on a Raspberry Pi and be accessed remotely from phones.

## Features

- 📱 Mobile-first design optimized for phone screens
- 💬 Real-time chat with Claude using WebSocket
- 📁 File browser scoped to project directory
- 📚 Conversation history with session persistence
- 🎤 Voice input support
- 🌓 Light/Dark theme
- 📌 PWA support for "Add to Home Screen"
- 👆 Touch gestures (swipe for sidebar)

## Installation

1. Install dependencies:
```bash
cd web-app
npm install
```

2. Make sure Claude Code CLI is installed on your Pi:
```bash
npm install -g @anthropic/claude-code
```

## Usage

Start the server with your project directory:

```bash
node server.js /path/to/your/project
```

Or use current directory:

```bash
node server.js
```

Then access from your phone:
- Local: `http://raspberry-pi.local:3000`
- Or use the Pi's IP address

## Architecture

- **Server**: Express + WebSocket server wrapping Claude CLI
- **Frontend**: Vanilla JS with mobile-optimized UI
- **Session**: Persistent across devices (single active session)
- **Files**: Scoped to project directory only

## Mobile Features

- **Voice Input**: Tap microphone to dictate messages
- **Swipe Gestures**: Swipe right from edge to open menu
- **Touch Optimized**: 44px minimum touch targets
- **PWA**: Add to home screen for app-like experience

## Configuration

The app stores data in `.claude-code-chat/` within your project:
- `conversations/`: Chat history
- `settings.json`: User preferences

## Development

For development with auto-reload:
```bash
npm run dev
```

## Notes

- Single session at a time (last connection wins)
- No authentication (secure your network/tunnel)
- Optimized for portrait mode on phones
- Works offline once loaded (reconnects automatically)

## Troubleshooting

### "Failed to parse JSON" errors
Claude CLI outputs JSON-formatted lines when used programmatically. If you see parsing errors:
1. Make sure you have the latest version of Claude CLI
2. The app will treat non-JSON output as plain text responses
3. Check if Claude CLI is properly authenticated: run `claude` manually first

### "Claude CLI not found"
Install Claude CLI globally:
```bash
npm install -g @anthropic/claude-code
```

### Can't connect from phone
1. Make sure your Pi and phone are on the same network
2. Check firewall settings: `sudo ufw allow 3000`
3. Use the Pi's IP address instead of hostname if needed