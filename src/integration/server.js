const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const { spawn } = require('child_process');
const logger = require('../utils/logger');
const tradingviewAdapter = require('./adapters/tradingview-adapter');
const computationAdapter = require('./adapters/computation-adapter');
const brokerManager = require('../execution/broker/broker-manager');

class IntegrationServer {
  constructor(config = {}) {
    // Configuration with defaults
    this.config = {
      port: config.port || 8080,
      wsPort: config.wsPort || 8081,
      computationEngine: config.computationEngine || 'python', // 'python' or 'julia'
      ...config
    };
    
    // Initialize Express app
    this.app = express();
    this.server = http.createServer(this.app);
    
    // Initialize WebSocket server
    this.wss = new WebSocket.Server({ server: this.server });
    
    // Initialize components
    this.tradingviewAdapter = tradingviewAdapter;
    this.computationAdapter = computationAdapter;
    this.brokerManager = brokerManager;
    
    // State
    this.computationProcess = null;
    this.clients = new Set();
  }
  
  async initialize() {
    // Configure Express
    this.setupExpress();
    
    // Configure WebSocket
    this.setupWebSocket();
    
    // Start computation engine
    await this.startComputationEngine();
    
    // Connect to broker if credentials exist
    try {
      await this.brokerManager.initialize();
    } catch (error) {
      logger.warn('Could not initialize broker connection:', error);
    }
    
    return this;
  }
  
  setupExpress() {
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, '..', '..', 'dashboard', 'client', 'build')));
    
    // TradingView webhook endpoint
    this.app.post('/webhook/tradingview', (req, res) => {
      try {
        const alert = req.body;
        logger.info(`Received alert from TradingView: ${JSON.stringify(alert)}`);
        
        // Forward to computation engine
        this.computationAdapter.processAlert(alert);
        
        res.status(200).send('Alert received');
      } catch (error) {
        logger.error(`Error processing TradingView alert: ${error.message}`);
        res.status(400).send('Invalid alert format');
      }
    });
    
    // Fallback route
    this.app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '..', '..', 'dashboard', 'client', 'build', 'index.html'));
    });
  }
  
  setupWebSocket() {
    this.wss.on('connection', (ws) => {
      logger.info('Client connected to WebSocket');
      this.clients.add(ws);
      
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          logger.info(`Received WebSocket message: ${JSON.stringify(data)}`);
          
          if (data.type === 'computation') {
            this.computationAdapter.sendToComputation(data);
          } else if (data.type === 'broker') {
            this.brokerManager.processCommand(data);
          }
        } catch (error) {
          logger.error(`Error processing WebSocket message: ${error.message}`);
        }
      });
      
      ws.on('close', () => {
        logger.info('Client disconnected');
        this.clients.delete(ws);
      });
    });
    
    // Listen for events from computation adapter
    this.computationAdapter.on('result', (result) => {
      this.broadcastToClients({
        type: 'computation_result',
        data: result
      });
    });
    
    // Listen for events from broker manager
    this.brokerManager.on('update', (update) => {
      this.broadcastToClients({
        type: 'broker_update',
        data: update
      });
    });
  }
  
  broadcastToClients(data) {
    const message = JSON.stringify(data);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
  
  async startComputationEngine() {
    const enginePath = path.join(
      __dirname, 
      '..', 
      'computation',
      this.config.computationEngine === 'julia' ? 'julia' : 'python',
      this.config.computationEngine === 'julia' ? 'engine.jl' : 'engine.py'
    );
    
    // Check if the engine file exists
    try {
      require('fs').accessSync(enginePath);
    } catch (error) {
      logger.error(`Computation engine not found at ${enginePath}`);
      return false;
    }
    
    // Start the computation process
    const command = this.config.computationEngine === 'julia' ? 'julia' : 'python';
    this.computationProcess = spawn(command, [enginePath, this.config.wsPort]);
    
    // Handle process output
    this.computationProcess.stdout.on('data', (data) => {
      logger.info(`Computation engine: ${data}`);
    });
    
    this.computationProcess.stderr.on('data', (data) => {
      logger.error(`Computation engine error: ${data}`);
    });
    
    this.computationProcess.on('close', (code) => {
      logger.warn(`Computation engine exited with code ${code}`);
      
      // Restart after a delay
      setTimeout(() => this.startComputationEngine(), 5000);
    });
    
    return true;
  }
  
  start() {
    // Start the server
    this.server.listen(this.config.port, () => {
      logger.info(`Integration server listening on port ${this.config.port}`);
    });
    
    return this;
  }
  
  stop() {
    // Stop the server
    this.server.close();
    
    // Kill computation process if running
    if (this.computationProcess) {
      this.computationProcess.kill();
    }
    
    // Disconnect from broker
    this.brokerManager.disconnect();
    
    logger.info('Integration server stopped');
  }
}

module.exports = IntegrationServer;