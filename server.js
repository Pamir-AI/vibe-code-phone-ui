const express = require('express');
const { WebSocketServer } = require('ws');
const path = require('path');
const fs = require('fs');
const http = require('http');
const os = require('os');

// Get project root from command line or use current directory
let PROJECT_ROOT = process.argv[2] || process.cwd();
console.log(`Project root: ${PROJECT_ROOT}`);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Import the adapted Claude chat provider
const ClaudeChatProvider = require('./claudeChat');

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Single active WebSocket connection (last one wins)
let activeWs = null;
let chatProvider = null;

// Initialize chat provider
function initializeChatProvider() {
  chatProvider = new ClaudeChatProvider(PROJECT_ROOT);
  
  // Override postMessage to use WebSocket
  chatProvider._postMessage = (message) => {
    if (activeWs && activeWs.readyState === 1) {
      activeWs.send(JSON.stringify(message));
    }
  };
  
  return chatProvider;
}

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('New WebSocket connection');
  
  // Close previous connection if exists
  if (activeWs) {
    console.log('Closing previous connection');
    activeWs.close();
  }
  activeWs = ws;
  
  // Initialize or get existing chat provider
  if (!chatProvider) {
    initializeChatProvider();
  }
  
  // Send initial state
  ws.send(JSON.stringify({ type: 'connected' }));
  
  // Restore session if exists
  const sessionInfo = chatProvider.getSessionInfo();
  if (sessionInfo) {
    ws.send(JSON.stringify({ 
      type: 'sessionResumed', 
      data: sessionInfo 
    }));
    
    // Load conversation history
    chatProvider.loadLatestConversation();
  }
  
  // Handle incoming messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('Received message:', data.type);
      
      // Route messages to chat provider
      switch (data.type) {
        case 'sendMessage':
          chatProvider.sendMessage(data.text, data.planMode, data.thinkingMode);
          break;
          
        case 'newSession':
          chatProvider.newSession();
          break;
          
        case 'stopRequest':
          chatProvider.stopCurrentRequest();
          break;
          
        case 'getWorkspaceFiles':
          chatProvider.getWorkspaceFiles(data.searchTerm);
          break;
          
        case 'selectModel':
          chatProvider.selectModel(data.model);
          break;
          
        case 'getSettings':
          chatProvider.getSettings();
          break;
          
        case 'updateSettings':
          chatProvider.updateSettings(data.settings);
          break;
          
        case 'permissionResponse':
          chatProvider.handlePermissionResponse(data.id, data.approved, data.alwaysAllow);
          break;
          
        case 'getPermissions':
          chatProvider.getPermissions();
          break;
          
        case 'removePermission':
          chatProvider.removePermission(data.tool, data.command);
          break;
          
        case 'getConversationList':
          const conversations = chatProvider.getConversationList();
          ws.send(JSON.stringify({
            type: 'conversationList',
            data: conversations
          }));
          break;
          
        case 'loadConversation':
          const conversation = chatProvider.loadConversation(data.sessionId);
          if (conversation) {
            // Send all messages to UI
            conversation.messages.forEach(msg => {
              ws.send(JSON.stringify(msg));
            });
            // Send session info
            ws.send(JSON.stringify({
              type: 'sessionInfo',
              data: chatProvider.getSessionInfo()
            }));
          }
          break;
          
        case 'deleteConversation':
          const success = chatProvider.deleteConversation(data.sessionId);
          ws.send(JSON.stringify({
            type: 'conversationDeleted',
            data: { sessionId: data.sessionId, success }
          }));
          break;
          
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        data: `Error: ${error.message}` 
      }));
    }
  });
  
  ws.on('close', () => {
    console.log('WebSocket connection closed');
    if (activeWs === ws) {
      activeWs = null;
    }
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// File system API endpoints (scoped to project root)
app.get('/api/files', (req, res) => {
  const relativePath = req.query.path || '';
  const fullPath = path.join(PROJECT_ROOT, relativePath);
  
  // Security: Ensure path doesn't escape project root
  if (!fullPath.startsWith(PROJECT_ROOT)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  try {
    const stats = fs.statSync(fullPath);
    
    if (stats.isDirectory()) {
      const items = fs.readdirSync(fullPath).map(name => {
        const itemPath = path.join(fullPath, name);
        const itemStats = fs.statSync(itemPath);
        return {
          name,
          type: itemStats.isDirectory() ? 'directory' : 'file',
          path: path.relative(PROJECT_ROOT, itemPath)
        };
      });
      
      res.json({ type: 'directory', items });
    } else {
      const content = fs.readFileSync(fullPath, 'utf8');
      res.json({ type: 'file', content });
    }
  } catch (error) {
    res.status(404).json({ error: 'Path not found' });
  }
});

// Read file endpoint
app.get('/api/file/:path(*)', (req, res) => {
  const relativePath = req.params.path;
  const fullPath = path.join(PROJECT_ROOT, relativePath);
  
  if (!fullPath.startsWith(PROJECT_ROOT)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    res.json({ content });
  } catch (error) {
    res.status(404).json({ error: 'File not found' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    projectRoot: PROJECT_ROOT,
    connected: activeWs !== null 
  });
});

// Project management endpoints
app.get('/api/projects', (req, res) => {
  const projectsDir = path.join(os.homedir(), 'projects');
  
  try {
    const items = fs.readdirSync(projectsDir, { withFileTypes: true });
    const projects = items
      .filter(item => item.isDirectory())
      .map(dir => ({
        name: dir.name,
        path: path.join(projectsDir, dir.name),
        isCurrent: path.join(projectsDir, dir.name) === PROJECT_ROOT
      }));
    
    res.json({ 
      projects,
      currentProject: PROJECT_ROOT
    });
  } catch (error) {
    console.error('Error reading projects directory:', error);
    res.status(500).json({ error: 'Failed to read projects directory' });
  }
});

app.get('/api/projects/current', (req, res) => {
  res.json({ 
    projectRoot: PROJECT_ROOT,
    projectName: path.basename(PROJECT_ROOT)
  });
});

app.post('/api/projects/switch', express.json(), (req, res) => {
  const { projectPath } = req.body;
  
  if (!projectPath) {
    return res.status(400).json({ error: 'Project path is required' });
  }
  
  // Validate the project path exists
  if (!fs.existsSync(projectPath)) {
    return res.status(400).json({ error: 'Project path does not exist' });
  }
  
  // Update the project root
  const oldRoot = PROJECT_ROOT;
  PROJECT_ROOT = projectPath;
  console.log(`Switching project from ${oldRoot} to ${PROJECT_ROOT}`);
  
  // Reinitialize the chat provider with new project root
  if (chatProvider) {
    chatProvider.cleanup();
  }
  
  chatProvider = new ClaudeChatProvider(PROJECT_ROOT);
  
  // Reconfigure the postMessage override
  chatProvider._postMessage = (message) => {
    if (activeWs && activeWs.readyState === 1) {
      activeWs.send(JSON.stringify(message));
    }
  };
  
  // Notify connected client about project switch
  if (activeWs && activeWs.readyState === 1) {
    activeWs.send(JSON.stringify({ 
      type: 'projectSwitched',
      data: {
        projectRoot: PROJECT_ROOT,
        projectName: path.basename(PROJECT_ROOT)
      }
    }));
  }
  
  res.json({ 
    success: true,
    projectRoot: PROJECT_ROOT,
    projectName: path.basename(PROJECT_ROOT)
  });
});

app.post('/api/projects/create', express.json(), (req, res) => {
  const { projectName } = req.body;
  
  if (!projectName) {
    return res.status(400).json({ error: 'Project name is required' });
  }
  
  // Sanitize project name
  const sanitizedName = projectName.replace(/[^a-zA-Z0-9-_]/g, '-');
  const projectsDir = path.join(os.homedir(), 'projects');
  const newProjectPath = path.join(projectsDir, sanitizedName);
  
  // Check if project already exists
  if (fs.existsSync(newProjectPath)) {
    return res.status(400).json({ error: 'Project already exists' });
  }
  
  try {
    // Create the project directory
    fs.mkdirSync(newProjectPath, { recursive: true });
    
    // Create a README file
    const readmeContent = `# ${projectName}\n\nCreated on ${new Date().toLocaleDateString()}\n`;
    fs.writeFileSync(path.join(newProjectPath, 'README.md'), readmeContent);
    
    res.json({ 
      success: true,
      projectName: sanitizedName,
      projectPath: newProjectPath
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Claude Code Chat server running on http://localhost:${PORT}`);
  console.log(`Project root: ${PROJECT_ROOT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    if (chatProvider) {
      chatProvider.cleanup();
    }
    process.exit(0);
  });
});