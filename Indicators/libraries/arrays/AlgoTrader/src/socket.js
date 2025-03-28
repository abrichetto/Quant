const WebSocket = require('ws');
const http = require('http');

/**
 * Initialize the WebSocket server.
 * @param {object} server - The HTTP server instance.
 * @returns {object} The WebSocket server instance.
 */
function initializeSocket(server) {
  if (!(server instanceof http.Server)) {
    throw new TypeError('The "server" parameter must be an instance of http.Server');
  }

  const wss = new WebSocket.Server({ server });

  try {
    wss.on('connection', (ws) => {
      console.log('A client connected.');

      ws.on('message', (message) => {
        console.log('Received message from client:', message);

        // Example: Echo the message back to the client
        ws.send(`Server received: ${message}`);
      });

      ws.on('close', () => {
        console.log('A client disconnected.');
      });
    });
  } catch (error) {
    console.error('WebSocket server error:', error);
  }

  return wss;
}

// Create an HTTP server and bind the WebSocket server to it
const server = http.createServer();
const PORT = 5010;

initializeSocket(server);

server.listen(PORT, () => {
  console.log(`HTTP server is running on http://localhost:${PORT}`);
  console.log(`WebSocket server is running on ws://localhost:${PORT}`);
});