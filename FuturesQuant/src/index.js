/**
 * Main application entry point
 */
const TradingService = require('./services/trading-service');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

// Load configuration
const loadConfig = () => {
  try {
    const configPath = path.join(__dirname, '../config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return config;
    } else {
      console.warn('Config file not found, using default configuration');
      return {
        apiKey: process.env.API_KEY || '',
        apiSecret: process.env.API_SECRET || '',
        symbol: process.env.TRADING_SYMBOL || 'BTC-USDT',
        candlePeriod: process.env.CANDLE_PERIOD || '5m',
        leverage: parseInt(process.env.LEVERAGE || '5'),
        riskPercentage: parseFloat(process.env.RISK_PERCENTAGE || '1'),
        enableTrading: process.env.ENABLE_TRADING === 'true',
        strategyConfig: {
          length: 10,
          minMult: 1,
          maxMult: 5,
          step: 0.5,
          perfAlpha: 10,
          fromCluster: 'Best' // 'Best', 'Average', or 'Worst'
        }
      };
    }
  } catch (error) {
    console.error('Error loading config:', error);
    process.exit(1);
  }
};

// Start the application
const startApp = async () => {
  console.log('Starting SuperTrend AI Trading Bot