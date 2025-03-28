/**
 * IBKR API Client for AlgoTrader Pro
 * Handles connection to Interactive Brokers TWS or IB Gateway
 */

const EventEmitter = require('events');
const ib = require('ib');  // You'll need to install: npm install ib

class IBKRClient extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Default configuration
    this.config = {
      host: config.host || '127.0.0.1',
      port: config.port || 7497, // 7497 for TWS paper trading, 7496 for IB Gateway paper, 7495/4 for live
      clientId: config.clientId || 1,
      connectTimeout: config.connectTimeout || 5000,
      reconnect: config.reconnect !== false,
      reconnectInterval: config.reconnectInterval || 10000,
      paperTrading: config.paperTrading !== false
    };
    
    // Initialize connection status
    this.connected = false;
    this.connecting = false;
    this.account = null;
    this._nextOrderId = null;
    this._nextRequestId = 1;
    this._pendingRequests = new Map();
    
    // Create IB connection
    this._api = new ib({
      clientId: this.config.clientId,
      host: this.config.host,
      port: this.config.port
    });
    
    // Set up event handlers
    this._setupEventHandlers();
  }
  
  /**
   * Connect to IBKR TWS/Gateway
   */
  connect() {
    if (this.connected || this.connecting) return;
    
    this.connecting = true;
    console.log(`Connecting to IBKR at ${this.config.host}:${this.config.port} (clientId: ${this.config.clientId})`);
    
    // Connect to API
    this._api.connect();
    
    // Set connection timeout
    this._connectionTimeout = setTimeout(() => {
      if (!this.connected) {
        console.error('Connection to IBKR timed out');
        this.emit('error', new Error('Connection timeout'));
        this.connecting = false;
        this._api.disconnect();
      }
    }, this.config.connectTimeout);
  }
  
  /**
   * Disconnect from IBKR
   */
  disconnect() {
    if (!this.connected && !this.connecting) return;
    
    console.log('Disconnecting from IBKR');
    this._api.disconnect();
    this.connected = false;
    this.connecting = false;
  }
  
  /**
   * Get account information
   */
  async getAccountSummary() {
    if (!this.connected) {
      throw new Error('Not connected to IBKR');
    }
    
    return new Promise((resolve, reject) => {
      const requestId = this._getNextRequestId();
      
      const timeout = setTimeout(() => {
        this._pendingRequests.delete(requestId);
        reject(new Error('Account summary request timed out'));
      }, 10000);
      
      this._pendingRequests.set(requestId, {
        type: 'accountSummary',
        data: [],
        resolve,
        reject,
        timeout
      });
      
      this._api.reqAccountSummary(requestId, 'All', 'TotalCashValue,NetLiquidation,GrossPositionValue');
    });
  }
  
  /**
   * Get portfolio positions
   */
  async getPositions() {
    if (!this.connected) {
      throw new Error('Not connected to IBKR');
    }
    
    return new Promise((resolve, reject) => {
      const positions = [];
      
      // Set up position handlers
      const positionHandler = (account, contract, pos, avgCost) => {
        positions.push({
          account,
          symbol: contract.symbol,
          secType: contract.secType,
          exchange: contract.exchange,
          currency: contract.currency,
          position: pos,
          averageCost: avgCost
        });
      };
      
      const positionEndHandler = () => {
        // Remove handlers
        this._api.removeListener('position', positionHandler);
        this._api.removeListener('positionEnd', positionEndHandler);
        
        // Resolve with positions
        resolve(positions);
      };
      
      // Set up listeners
      this._api.on('position', positionHandler);
      this._api.on('positionEnd', positionEndHandler);
      
      // Request positions
      this._api.reqPositions();
    });
  }
  
  /**
   * Place a market order
   * @param {string} symbol - The asset symbol
   * @param {number} quantity - Order quantity (negative for sell)
   * @param {string} secType - Security type (STK, CRYPTO, etc)
   * @param {string} exchange - Exchange name
   * @param {string} currency - Currency code
   * @returns {Promise<Object>} Order result
   */
  async placeMarketOrder(symbol, quantity, secType = 'STK', exchange = 'SMART', currency = 'USD') {
    if (!this.connected) {
      throw new Error('Not connected to IBKR');
    }
    
    return new Promise((resolve, reject) => {
      const orderId = this._getNextOrderId();
      
      // Create contract
      const contract = {
        symbol,
        secType,
        exchange,
        currency
      };
      
      // Create order
      const order = {
        action: quantity > 0 ? 'BUY' : 'SELL',
        totalQuantity: Math.abs(quantity),
        orderType: 'MKT'
      };
      
      // Set up order handlers
      const orderStatusHandler = (id, status, filled, remaining, avgFillPrice) => {
        if (id === orderId) {
          if (status === 'Filled') {
            this._api.removeListener('orderStatus', orderStatusHandler);
            resolve({
              orderId,
              status,
              filled,
              remaining,
              averageFillPrice: avgFillPrice
            });
          } else if (['Cancelled', 'Inactive'].includes(status)) {
            this._api.removeListener('orderStatus', orderStatusHandler);
            reject(new Error(`Order ${status}: ${id}`));
          }
        }
      };
      
      // Listen for order status
      this._api.on('orderStatus', orderStatusHandler);
      
      // Place order
      this._api.placeOrder(orderId, contract, order);
      
      // Set timeout
      setTimeout(() => {
        // If we still have the listener, order didn't complete or cancel
        if (this._api.listeners('orderStatus').includes(orderStatusHandler)) {
          this._api.removeListener('orderStatus', orderStatusHandler);
          reject(new Error('Order timeout'));
        }
      }, 30000);
    });
  }
  
  /**
   * Set up API event handlers
   * @private
   */
  _setupEventHandlers() {
    // Connection established
    this._api.on('connected', () => {
      console.log('Connected to IBKR');
      this.connected = true;
      this.connecting = false;
      clearTimeout(this._connectionTimeout);
      
      // Request account list
      this._api.reqAccountUpdates(true, '');
      
      // Request next valid order ID
      this._api.reqIds(1);
      
      this.emit('connected');
    });
    
    // Connection closed
    this._api.on('disconnected', () => {
      console.log('Disconnected from IBKR');
      this.connected = false;
      this.connecting = false;
      this.emit('disconnected');
      
      // Reconnect if enabled
      if (this.config.reconnect) {
        console.log(`Reconnecting in ${this.config.reconnectInterval / 1000} seconds...`);
        setTimeout(() => this.connect(), this.config.reconnectInterval);
      }
    });
    
    // Next valid order ID received
    this._api.on('nextValidId', (orderId) => {
      console.log(`Next valid order ID: ${orderId}`);
      this._nextOrderId = orderId;
    });
    
    // Account information received
    this._api.on('updateAccountValue', (key, value, currency, accountName) => {
      if (key === 'AccountReady' && value === 'true') {
        this.account = accountName;
        this.emit('accountReady', accountName);
      }
    });
    
    // Account summary
    this._api.on('accountSummary', (reqId, account, tag, value, currency) => {
      const request = this._pendingRequests.get(+reqId);
      if (request && request.type === 'accountSummary') {
        request.data.push({ account, tag, value, currency });
      }
    });
    
    this._api.on('accountSummaryEnd', (reqId) => {
      const request = this._pendingRequests.get(+reqId);
      if (request && request.type === 'accountSummary') {
        clearTimeout(request.timeout);
        this._pendingRequests.delete(+reqId);
        request.resolve(request.data);
      }
    });
    
    // Error handling
    this._api.on('error', (err, code, reqId) => {
      console.error(`IBKR API error ${code}: ${err}`);
      
      // Check if error is related to a pending request
      if (reqId && this._pendingRequests.has(+reqId)) {
        const request = this._pendingRequests.get(+reqId);
        clearTimeout(request.timeout);
        this._pendingRequests.delete(+reqId);
        request.reject(new Error(`API error ${code}: ${err}`));
      }
      
      this.emit('error', new Error(`API error ${code}: ${err}`));
    });
  }
  
  /**
   * Get next request ID
   * @private
   */
  _getNextRequestId() {
    return this._nextRequestId++;
  }
  
  /**
   * Get next order ID
   * @private
   */
  _getNextOrderId() {
    if (this._nextOrderId === null) {
      throw new Error('No valid order ID available');
    }
    return this._nextOrderId++;
  }
}

module.exports = IBKRClient;