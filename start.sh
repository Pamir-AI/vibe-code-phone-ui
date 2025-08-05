#!/bin/bash

# Claude Code Chat Web Server Startup Script

# Default to current directory if no argument provided
PROJECT_DIR="${1:-.}"

# Convert to absolute path
PROJECT_DIR=$(cd "$PROJECT_DIR" && pwd)

echo "Starting Claude Code Chat Web Server..."
echo "Project directory: $PROJECT_DIR"
echo "Server will be available at: http://localhost:3000"
echo ""

# Start the server
node server.js "$PROJECT_DIR"