// Map of active SSE client connections: userId -> Set of Response objects
const activeClients = new Map();

/**
 * Register an active SSE client connection for a user.
 * @param {string} userId 
 * @param {object} res - Express Response object
 */
export function registerClient(userId, res) {
  if (!activeClients.has(userId)) {
    activeClients.set(userId, new Set());
  }
  
  const userConnections = activeClients.get(userId);
  userConnections.add(res);

  // Connection keep-alive pulse every 30 seconds to prevent connection drops
  const keepAliveInterval = setInterval(() => {
    res.write(': keepalive\n\n');
  }, 30000);

  res.on('close', () => {
    clearInterval(keepAliveInterval);
    userConnections.delete(res);
    if (userConnections.size === 0) {
      activeClients.delete(userId);
    }
  });
}

/**
 * Pushes a notification object in real-time to all active connections for a user.
 * @param {string} userId 
 * @param {object} notification 
 */
export function sendRealtimeNotification(userId, notification) {
  const userConnections = activeClients.get(userId.toString());
  if (!userConnections || userConnections.size === 0) return;

  const payload = `data: ${JSON.stringify(notification)}\n\n`;
  userConnections.forEach(res => {
    try {
      res.write(payload);
    } catch (err) {
      console.error(`Error writing to SSE stream for user ${userId}:`, err);
    }
  });
}

/**
 * Broadcast notification to all active SSE clients.
 * @param {object} notification 
 */
export function broadcastNotification(notification) {
  const payload = `data: ${JSON.stringify(notification)}\n\n`;
  activeClients.forEach((connections) => {
    connections.forEach(res => {
      try {
        res.write(payload);
      } catch (err) {
        // Safe to ignore, connection cleanup handles standard drops
      }
    });
  });
}
