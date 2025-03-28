const https = require('https');
const fs = require('fs');
const WebSocket = require('ws');
const path = require('path');

// Certificate paths - adjust if your certificates are in a different location
const keyPath = path.join(__dirname, 'localhost.key');
const certPath = path.join(__dirname, 'localhost.crt');

// SSL certificate options
const options = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath),
  // Allow self-signed certificates for development
  rejectUnauthorized: false
};

// Create HTTPS server
const server = http.createServer(options, (req, res) => {
  res.writeHead(200);
  res.end('AlgoTrader Pro Secure Server');
});

// Create secure WebSocket server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('Client connected via secure WebSocket');

  ws.on('message', (message) => {
    try {
      const parsedMessage = JSON.parse(message);
      console.log('Received:', parsedMessage);

      // Respond with some sample data for the UI
      if (parsedMessage.command === 'getInitialData') {
        ws.send(JSON.stringify({
          type: 'marketUpdate',
          data: {
            dailyPnl: '+2.35%',
            winRate: '68%',
            balance: 12450.75,
            openTrades: 3,
            signals: [
              { symbol: 'BTC/USD', action: 'buy', confidence: 0.87, time: Date.now() - 300000 },
              { symbol: 'ETH/USD', action: 'buy', confidence: 0.82, time: Date.now() - 720000 },
              { symbol: 'SOL/USD', action: 'sell', confidence: 0.76, time: Date.now() - 1680000 }
            ],
            agents: [
              { id: 'model1', name: 'Model Agent', score: 15.2, type: 'positive' },
              { id: 'signal1', name: 'Signal Agent', score: 9.7, type: 'positive' },
              { id: 'priority1', name: 'Priority Agent', score: 6.3, type: 'positive' },
              { id: 'risk1', name: 'Risk Agent', score: -2.1, type: 'negative' }
            ]
          }
        }));
      }

      // Send ping response
      if (parsedMessage.command === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Connected to AlgoTrader Pro'
  }));
});

// Start server
server.listen(5010, () => {
  console.log('Server listening on https:/localhost:5010');

  console.log('Server is up and running, ready to accept connections.');
});