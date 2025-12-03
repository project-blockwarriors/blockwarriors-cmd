class MineflayerTestingClient {
  constructor() {
    this.socket = null;
    this.bots = [];
    this.selectedBotId = null;
    this.maxLogs = 1000;
    this.minimapScale = 10; // 1 pixel = 10 blocks
    this.minimapCenter = { x: 0, z: 0 };
    this.init();
  }

  async init() {
    this.setupSocket();
    this.setupMinimap();
    await this.loadBots();
    this.startMinimapRenderLoop();
  }

  setupSocket() {
    this.socket = io();

    this.socket.on('connect', () => {
      this.addLog('info', 'Connected to server');
    });

    this.socket.on('disconnect', () => {
      this.addLog('error', 'Disconnected from server');
    });

    this.socket.on('log', (data) => {
      this.addLog(data.level, `[Bot ${data.id}] ${data.message}`);
    });

    this.socket.on('error', (data) => {
      this.addLog('error', `[Bot ${data.id}] ERROR: ${data.error}`);
    });

    this.socket.on('status', (data) => {
      this.updateBotStatus(data);
    });

    this.socket.on('position', (data) => {
      this.updateBotPosition(data);
    });

    this.socket.on('bots-update', (bots) => {
      this.bots = bots;
      this.renderBots();
      this.updateBotSelector();
      this.renderMinimap();
    });
  }

  setupMinimap() {
    const canvas = document.getElementById('minimap');
    this.minimapCanvas = canvas;
    this.minimapCtx = canvas.getContext('2d');
  }

  startMinimapRenderLoop() {
    setInterval(() => this.renderMinimap(), 100); // Update 10 times per second
  }

  renderMinimap() {
    const ctx = this.minimapCtx;
    const canvas = this.minimapCanvas;
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#1a2332';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#2d3748';
    ctx.lineWidth = 1;

    const gridSize = 50; // Grid lines every 50 blocks
    const gridPixels = gridSize / this.minimapScale;

    // Calculate offset for grid based on center
    const offsetX = (this.minimapCenter.x % gridSize) / this.minimapScale;
    const offsetZ = (this.minimapCenter.z % gridSize) / this.minimapScale;

    // Vertical lines
    for (let x = offsetX; x < width; x += gridPixels) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let z = offsetZ; z < height; z += gridPixels) {
      ctx.beginPath();
      ctx.moveTo(0, z);
      ctx.lineTo(width, z);
      ctx.stroke();
    }

    // Draw center cross
    ctx.strokeStyle = '#4a5568';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width / 2, height / 2 - 10);
    ctx.lineTo(width / 2, height / 2 + 10);
    ctx.moveTo(width / 2 - 10, height / 2);
    ctx.lineTo(width / 2 + 10, height / 2);
    ctx.stroke();

    // Draw bots
    const connectedBots = this.bots.filter(b => b.status === 'connected' && b.position);

    connectedBots.forEach((bot, index) => {
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
      const color = colors[index % colors.length];

      const screenX = width / 2 + (bot.position.x - this.minimapCenter.x) / this.minimapScale;
      const screenZ = height / 2 + (bot.position.z - this.minimapCenter.z) / this.minimapScale;

      // Draw bot circle
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(screenX, screenZ, 6, 0, Math.PI * 2);
      ctx.fill();

      // Draw bot direction indicator (based on yaw)
      if (bot.yaw !== undefined) {
        const angle = -bot.yaw; // Negative because canvas Y is inverted
        const indicatorLength = 12;
        const endX = screenX + Math.cos(angle) * indicatorLength;
        const endZ = screenZ + Math.sin(angle) * indicatorLength;

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(screenX, screenZ);
        ctx.lineTo(endX, endZ);
        ctx.stroke();
      }

      // Draw bot label
      ctx.fillStyle = '#fff';
      ctx.font = '11px monospace';
      ctx.fillText(bot.username, screenX + 10, screenZ + 4);
    });

    // Draw scale indicator
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px monospace';
    ctx.fillText(`1:${this.minimapScale}`, 10, height - 10);
  }

  centerMinimap() {
    const connectedBots = this.bots.filter(b => b.status === 'connected' && b.position);

    if (connectedBots.length === 0) {
      this.minimapCenter = { x: 0, z: 0 };
      return;
    }

    // Calculate average position
    let sumX = 0;
    let sumZ = 0;

    connectedBots.forEach(bot => {
      sumX += bot.position.x;
      sumZ += bot.position.z;
    });

    this.minimapCenter = {
      x: sumX / connectedBots.length,
      z: sumZ / connectedBots.length
    };

    this.renderMinimap();
  }

  async loadBots() {
    try {
      const response = await fetch('/api/bots');
      const data = await response.json();
      if (data.success) {
        this.bots = data.bots;
        this.renderBots();
        this.updateBotSelector();
      }
    } catch (error) {
      this.addLog('error', `Failed to load bots: ${error.message}`);
    }
  }

  updateBotSelector() {
    const select = document.getElementById('selected-bot');
    const currentValue = select.value;

    // Keep track of the current selection
    const selectedBot = currentValue ? parseInt(currentValue) : null;

    // Rebuild options
    select.innerHTML = '<option value="">Select a bot...</option>';

    this.bots.forEach(bot => {
      if (bot.status === 'connected') {
        const option = document.createElement('option');
        option.value = bot.id;
        option.textContent = bot.username;
        if (bot.id === selectedBot) {
          option.selected = true;
        }
        select.appendChild(option);
      }
    });
  }

  selectBot() {
    const select = document.getElementById('selected-bot');
    this.selectedBotId = select.value ? parseInt(select.value) : null;
  }

  renderBots() {
    const container = document.getElementById('bots-list');

    if (this.bots.length === 0) {
      container.innerHTML = '<p class="empty-state">No bots created yet. Click "Add Bot" to get started.</p>';
      return;
    }

    container.innerHTML = this.bots.map(bot => this.renderBotCard(bot)).join('');
  }

  renderBotCard(bot) {
    const statusClass = `status-${bot.status}`;
    const isConnected = bot.status === 'connected';
    const canConnect = bot.status === 'disconnected';

    let infoHtml = '';
    if (isConnected) {
      infoHtml = `
        <div class="bot-info">
          ${bot.health !== undefined ? `<div class="bot-info-row"><span class="bot-info-label">Health:</span><span>${bot.health.toFixed(1)}/20</span></div>` : ''}
          ${bot.food !== undefined ? `<div class="bot-info-row"><span class="bot-info-label">Food:</span><span>${bot.food}/20</span></div>` : ''}
          ${bot.position ? `<div class="bot-info-row"><span class="bot-info-label">Position:</span><span>(${Math.floor(bot.position.x)}, ${Math.floor(bot.position.y)}, ${Math.floor(bot.position.z)})</span></div>` : ''}
          ${bot.players && bot.players.length > 0 ? `<div class="bot-info-row"><span class="bot-info-label">Players:</span><span>${bot.players.length}</span></div>` : ''}
          ${bot.attacking ? '<div class="bot-info-row"><span class="bot-info-label">Status:</span><span style="color: #ef4444">ATTACKING</span></div>' : ''}
          ${bot.following ? '<div class="bot-info-row"><span class="bot-info-label">Status:</span><span style="color: #3b82f6">FOLLOWING</span></div>' : ''}
          ${bot.viewerUrl ? `<a href="${bot.viewerUrl}" target="_blank" class="bot-viewer-link">🎮 Open 3D Viewer</a>` : ''}
        </div>
      `;
    }

    const actions = isConnected ? `
      <button class="btn btn-secondary" onclick="app.showChatDialog(${bot.id})">Chat</button>
      <button class="btn btn-secondary" onclick="app.showKillPlayerDialog(${bot.id})">Attack</button>
      <button class="btn btn-secondary" onclick="app.showFollowDialog(${bot.id})">Follow</button>
      <button class="btn btn-secondary" onclick="app.selectBotForMovement(${bot.id})">Control</button>
      <button class="btn btn-danger" onclick="app.disconnectBot(${bot.id})">Disconnect</button>
      <button class="btn btn-danger" onclick="app.removeBot(${bot.id})">Remove</button>
    ` : canConnect ? `
      <button class="btn btn-primary" onclick="app.showConnectBotDialog(${bot.id})">Connect</button>
      <button class="btn btn-danger" onclick="app.removeBot(${bot.id})">Remove</button>
    ` : `
      <button class="btn btn-danger" onclick="app.removeBot(${bot.id})">Remove</button>
    `;

    return `
      <div class="bot-card" id="bot-${bot.id}">
        <div class="bot-header">
          <span class="bot-name">${bot.username}</span>
          <span class="bot-status ${statusClass}">${bot.status}</span>
        </div>
        ${infoHtml}
        <div class="bot-actions">
          ${actions}
        </div>
      </div>
    `;
  }

  selectBotForMovement(botId) {
    const select = document.getElementById('selected-bot');
    select.value = botId;
    this.selectedBotId = botId;
    this.addLog('info', `Selected Bot ${botId} for movement control`);
  }

  updateBotStatus(data) {
    const bot = this.bots.find(b => b.id === data.id);
    if (bot) {
      Object.assign(bot, data);
      this.renderBots();
      this.updateBotSelector();
    }
  }

  updateBotPosition(data) {
    const bot = this.bots.find(b => b.id === data.id);
    if (bot) {
      bot.position = data.position;
      bot.yaw = data.yaw;
      bot.pitch = data.pitch;
      // Position rendering handled by minimap loop
    }
  }

  // Movement Controls
  moveBot(dx, dz) {
    if (!this.selectedBotId) {
      this.addLog('warning', 'Please select a bot first');
      return;
    }

    fetch(`/api/bots/${this.selectedBotId}/move-relative`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dx, dz })
    });
  }

  stopBot() {
    if (!this.selectedBotId) {
      this.addLog('warning', 'Please select a bot first');
      return;
    }

    fetch(`/api/bots/${this.selectedBotId}/stop-follow`, {
      method: 'POST'
    });
  }

  quickStopFollow() {
    if (!this.selectedBotId) {
      this.addLog('warning', 'Please select a bot first');
      return;
    }

    fetch(`/api/bots/${this.selectedBotId}/stop-follow`, {
      method: 'POST'
    });
  }

  // Dialog Management
  showCreateBotDialog() {
    document.getElementById('create-bot-modal').classList.add('active');
    document.getElementById('bot-username').focus();
  }

  hideCreateBotDialog() {
    document.getElementById('create-bot-modal').classList.remove('active');
    document.getElementById('bot-username').value = '';
  }

  showConnectBotDialog(botId) {
    document.getElementById('connect-bot-id').value = botId;
    document.getElementById('connect-bot-modal').classList.add('active');
    document.getElementById('bot-token').focus();
  }

  hideConnectBotDialog() {
    document.getElementById('connect-bot-modal').classList.remove('active');
    document.getElementById('bot-token').value = '';
  }

  showKillPlayerDialog(botId) {
    document.getElementById('kill-bot-id').value = botId;
    document.getElementById('kill-player-modal').classList.add('active');
    document.getElementById('kill-target').focus();
  }

  hideKillPlayerDialog() {
    document.getElementById('kill-player-modal').classList.remove('active');
    document.getElementById('kill-target').value = '';
  }

  showChatDialog(botId) {
    document.getElementById('chat-bot-id').value = botId;
    document.getElementById('chat-modal').classList.add('active');
    document.getElementById('chat-message').focus();
  }

  hideChatDialog() {
    document.getElementById('chat-modal').classList.remove('active');
    document.getElementById('chat-message').value = '';
  }

  showMoveDialog() {
    if (!this.selectedBotId) {
      this.addLog('warning', 'Please select a bot first');
      return;
    }

    document.getElementById('move-bot-id').value = this.selectedBotId;
    document.getElementById('move-modal').classList.add('active');
    document.getElementById('move-x').focus();
  }

  hideMoveDialog() {
    document.getElementById('move-modal').classList.remove('active');
    document.getElementById('move-x').value = '';
    document.getElementById('move-y').value = '';
    document.getElementById('move-z').value = '';
  }

  showFollowDialog(botId) {
    document.getElementById('follow-bot-id').value = botId;
    document.getElementById('follow-modal').classList.add('active');
    document.getElementById('follow-target').focus();
  }

  hideFollowDialog() {
    document.getElementById('follow-modal').classList.remove('active');
    document.getElementById('follow-target').value = '';
  }

  // API Calls
  async createBot(event) {
    event.preventDefault();
    const username = document.getElementById('bot-username').value;

    try {
      const response = await fetch('/api/bots/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });

      const data = await response.json();
      if (data.success) {
        this.addLog('success', `Bot created: ${username} (ID: ${data.botId})`);
        this.hideCreateBotDialog();
      } else {
        this.addLog('error', `Failed to create bot: ${data.error}`);
      }
    } catch (error) {
      this.addLog('error', `Failed to create bot: ${error.message}`);
    }
  }

  async connectBot(event) {
    event.preventDefault();
    const botId = parseInt(document.getElementById('connect-bot-id').value);
    const token = document.getElementById('bot-token').value;

    try {
      const response = await fetch(`/api/bots/${botId}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      const data = await response.json();
      if (data.success) {
        this.addLog('success', `Connecting bot ${botId}...`);
        this.hideConnectBotDialog();
      } else {
        this.addLog('error', `Failed to connect bot: ${data.error}`);
      }
    } catch (error) {
      this.addLog('error', `Failed to connect bot: ${error.message}`);
    }
  }

  async disconnectBot(botId) {
    try {
      const response = await fetch(`/api/bots/${botId}/disconnect`, {
        method: 'POST'
      });

      const data = await response.json();
      if (data.success) {
        this.addLog('info', `Disconnecting bot ${botId}...`);
      } else {
        this.addLog('error', `Failed to disconnect bot: ${data.error}`);
      }
    } catch (error) {
      this.addLog('error', `Failed to disconnect bot: ${error.message}`);
    }
  }

  async removeBot(botId) {
    if (!confirm('Are you sure you want to remove this bot?')) {
      return;
    }

    try {
      const response = await fetch(`/api/bots/${botId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        this.addLog('info', `Bot ${botId} removed`);
      } else {
        this.addLog('error', `Failed to remove bot: ${data.error}`);
      }
    } catch (error) {
      this.addLog('error', `Failed to remove bot: ${error.message}`);
    }
  }

  async sendChat(event) {
    event.preventDefault();
    const botId = parseInt(document.getElementById('chat-bot-id').value);
    const message = document.getElementById('chat-message').value;

    try {
      const response = await fetch(`/api/bots/${botId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });

      const data = await response.json();
      if (data.success) {
        this.hideChatDialog();
      } else {
        this.addLog('error', `Failed to send chat: ${data.error}`);
      }
    } catch (error) {
      this.addLog('error', `Failed to send chat: ${error.message}`);
    }
  }

  async killPlayer(event) {
    event.preventDefault();
    const botId = parseInt(document.getElementById('kill-bot-id').value);
    const target = document.getElementById('kill-target').value;

    try {
      const response = await fetch(`/api/bots/${botId}/kill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target })
      });

      const data = await response.json();
      if (data.success) {
        this.hideKillPlayerDialog();
      } else {
        this.addLog('error', `Failed to attack player: ${data.error}`);
      }
    } catch (error) {
      this.addLog('error', `Failed to attack player: ${error.message}`);
    }
  }

  async moveBotToCoords(event) {
    event.preventDefault();
    const botId = parseInt(document.getElementById('move-bot-id').value);
    const x = parseFloat(document.getElementById('move-x').value);
    const y = parseFloat(document.getElementById('move-y').value);
    const z = parseFloat(document.getElementById('move-z').value);

    try {
      const response = await fetch(`/api/bots/${botId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x, y, z })
      });

      const data = await response.json();
      if (data.success) {
        this.hideMoveDialog();
      } else {
        this.addLog('error', `Failed to move bot: ${data.error}`);
      }
    } catch (error) {
      this.addLog('error', `Failed to move bot: ${error.message}`);
    }
  }

  async followPlayer(event) {
    event.preventDefault();
    const botId = parseInt(document.getElementById('follow-bot-id').value);
    const target = document.getElementById('follow-target').value;

    try {
      const response = await fetch(`/api/bots/${botId}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target })
      });

      const data = await response.json();
      if (data.success) {
        this.hideFollowDialog();
      } else {
        this.addLog('error', `Failed to follow player: ${data.error}`);
      }
    } catch (error) {
      this.addLog('error', `Failed to follow player: ${error.message}`);
    }
  }

  // Logging
  addLog(level, message) {
    const container = document.getElementById('logs-container');
    const entry = document.createElement('p');
    entry.className = `log-entry log-${level}`;

    const timestamp = new Date().toLocaleTimeString();
    entry.textContent = `[${timestamp}] ${message}`;

    container.appendChild(entry);

    // Limit log entries
    while (container.children.length > this.maxLogs) {
      container.removeChild(container.firstChild);
    }

    // Auto-scroll to bottom
    container.scrollTop = container.scrollHeight;
  }

  clearLogs() {
    const container = document.getElementById('logs-container');
    container.innerHTML = '<p class="log-entry log-info">Logs cleared.</p>';
  }
}

// Initialize app
const app = new MineflayerTestingClient();

// Close modals when clicking outside
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    e.target.classList.remove('active');
  }
});
