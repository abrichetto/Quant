const { IB } = require('@stoqey/ib');
const credentialsManager = require('./credentials-manager');

class IBKRAdapter {
  constructor(config = {}) {
    this.connected = false;
    this.client = null;
    this.config = {
      clientId: config.clientId || 1,
      port: config.port || 7497, // Use 7496 for TWS, 7497 for IB Gateway
      host: config.host || '127.0.0.1'
    };
  }

  async connect() {
    try {
      // Get credentials securely
      const credentials = await this._getCredentials();
      
      // Initialize IB client
      this.client = new IB({
        ...this.config,
        ...credentials
      });
      
      // Connect to IB
      await this.client.connect();
      this.connected = true;
      console.log('Connected to Interactive Brokers');
      
      // Set up event listeners
      this._setupEventListeners();
      
      return true;
    } catch (error) {
      console.error('Failed to connect to Interactive Brokers:', error);
      return false;
    }
  }
  
  async disconnect() {
    if (this.client && this.connected) {
      await this.client.disconnect();
      this.connected = false;
      console.log('Disconnected from Interactive Brokers');
    }
  }
  
  async _getCredentials() {
    try {
      // Load encrypted credentials
      return credentialsManager.loadCredentials('ibkr');
    } catch (error) {
      console.error('Could not load IBKR credentials:', error);
      throw error;
    }
  }
  
  _setupEventListeners() {
    if (!this.client) return;
    
    this.client.on('error', (err) => {
      console.error('IB Error:', err);
    });
    
    this.client.on('disconnected', () => {
      this.connected = false;
      console.log('IB Disconnected');
    });
  }
  
  // Market data methods
  async getMarketData(symbol, options = {}) {
    if (!this.connected) throw new Error('Not connected to IBKR');
    
    // Create contract object
    const contract = {
      symbol,
      secType: options.secType || 'STK',
      exchange: options.exchange || 'SMART',
      currency: options.currency || 'USD'
    };
    
    // Request market data
    return new Promise((resolve, reject) => {
      this.client.reqMarketData(contract, (data) => {
        resolve(data);
      }, (error) => {
        reject(error);
      });
    });
  }
  
  // Order execution methods
  async placeOrder(order) {
    if (!this.connected) throw new Error('Not connected to IBKR');
    
    // Create contract
    const contract = {
      symbol: order.symbol,
      secType: order.secType || 'STK',
      exchange: order.exchange || 'SMART',
      currency: order.currency || 'USD'
    };
    
    // Create order object
    const ibOrder = {
      action: order.action, // 'BUY' or 'SELL'
      totalQuantity: order.quantity,
      orderType: order.type || 'MKT',
      tif: order.timeInForce || 'DAY'
    };
    
    // Add limit price if applicable
    if (order.type === 'LMT' && order.price) {
      ibOrder.lmtPrice = order.price;
    }
    
    // Place the order
    return new Promise((resolve, reject) => {
      this.client.placeOrder(contract, ibOrder, (orderId) => {
        resolve({ orderId, status: 'submitted' });
      }, (error) => {
        reject(error);
      });
    });
  }
  
  // Account information
  async getAccountSummary() {
    if (!this.connected) throw new Error('Not connected to IBKR');
    
    return new Promise((resolve, reject) => {
      this.client.reqAccountSummary((data) => {
        resolve(data);
      }, (error) => {
        reject(error);
      });
    });
  }
  
  // Positions
  async getPositions() {
    if (!this.connected) throw new Error('Not connected to IBKR');
    
    return new Promise((resolve, reject) => {
      this.client.reqPositions((positions) => {
        resolve(positions);
      }, (error) => {
        reject(error);
      });
    });
  }
}

module.exports = IBKRAdapter;