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

