/**
 * Big.one API Client for trading
 */
const axios = require('axios');
const crypto = require('crypto');

class BigOneClient {
  constructor(apiKey, apiSecret, baseUrl = 'https://big.one/api/v3') {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.baseUrl = baseUrl;
  }

  /**
   * Generate signature for authenticated requests
   */
  generateSignature(timestamp, method, requestPath, body = '') {
    const message = `${timestamp}${method}${requestPath}${body}`;
    return crypto
      .createHmac('sha256', this.apiSecret)
      .update(message)
      .digest('hex');
  }

  /**
   * Make authenticated request to Big.one API
   */
  async request(method, endpoint, params = {}, data = null) {
    const timestamp = Date.now().toString();
    const url = `${this.baseUrl}${endpoint}`;
    const signature = this.generateSignature(
      timestamp,
      method.toUpperCase(),
      endpoint,
      data ? JSON.stringify(data) : ''
    );

    try {
      const response = await axios({
        method,
        url,
        params,
        data,
        headers: {
          'Content-Type': 'application/json',
          'BigONE-AUTHENTICATED': 'true',
          'BigONE-API-KEY': this.apiKey,
          'BigONE-TIMESTAMP': timestamp,
          'BigONE-SIGNATURE': signature
        }
      });
      return response.data;
    } catch (error) {
      console.error('BigOne API Error:', error.response ? error.response.data : error.message);
      throw error;
    }
  }

  // Account endpoints
  async getAccountInfo() {
    return this.request('GET', '/accounts');
  }

  // Market data endpoints
  async getTicker(symbol) {
    return this.request('GET', `/markets/${symbol}/ticker`);
  }

  async getOrderBook(symbol, limit = 100) {
    return this.request('GET', `/markets/${symbol}/depth`, { limit });
  }

  async getKlines(symbol, period = '1d', limit = 100) {
    return this.request('GET', `/markets/${symbol}/candles`, { period, limit });
  }

  // Trading endpoints
  async createOrder(symbol, side, price, amount, orderType = 'LIMIT') {
    const data = {
      market_id: symbol,
      side: side.toUpperCase(),
      price,
      amount,
      order_type: orderType
    };
    return this.request('POST', '/orders', {}, data);
  }

  async createMarketOrder(symbol, side, amount) {
    return this.createOrder(symbol, side, '', amount, 'MARKET');
  }

  async cancelOrder(orderId) {
    return this.request('POST', `/orders/${orderId}/cancel`);
  }

  async getOrder(orderId) {
    return this.request('GET', `/orders/${orderId}`);
  }

  async getOpenOrders(symbol) {
    return this.request('GET', '/orders', { market_id: symbol });
  }

  // Perpetual Futures specific endpoints
  async getFuturesPositions(symbol) {
    return this.request('GET', `/futures/${symbol}/positions`);
  }

  async openFuturesPosition(symbol, side, leverage, amount, price = null, stopLoss = null, takeProfit = null) {
    const data = {
      symbol,
      side: side.toUpperCase(),
      leverage,
      amount,
      type: price ? 'LIMIT' : 'MARKET'
    };
    
    if (price) {
      data.price = price;
    }
    
    if (stopLoss) {
      data.stop_loss = stopLoss;
    }
    
    if (takeProfit) {
      data.take_profit = takeProfit;
    }
    
    return this.request('POST', '/futures/positions', {}, data);
  }

  async closeFuturesPosition(symbol, positionId) {
    return this.request('POST', `/futures/${symbol}/positions/${positionId}/close`);
  }

  async updateFuturesPosition(symbol, positionId, stopLoss = null, takeProfit = null) {
    const data = {};
    
    if (stopLoss) {
      data.stop_loss = stopLoss;
    }
    
    if (takeProfit) {
      data.take_profit = takeProfit;
    }
    
    return this.request('PUT', `/futures/${symbol}/positions/${positionId}`, {}, data);
  }
}

module.exports = BigOneClient;