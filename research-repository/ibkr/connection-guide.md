# IBKR Connection Guide for AlgoTrader Pro

## Account Setup Requirements

### 1. Account Types

For testing and development:
- **Paper Trading Account**: No real money, ideal for testing strategies
- Accessible through TWS or IB Gateway in Paper Trading mode

For live trading:
- **Minimum $1,000 funding** recommended for crypto trading
- Individual or entity account types supported

### 2. API Access Setup

1. **Enable API Access**:
   - Log in to Account Management
   - Go to Settings > API > Settings
   - Enable "Read-Only API" and "Trading API" access
   - Set "Socket Port" (default: 7496/7497)

2. **TWS Configuration**:
   - Open TWS (Trader Workstation)
   - File > Global Configuration > API > Settings
   - Check "Enable ActiveX and Socket Clients"
   - Set "Socket port" to match Account Management setting
   - Check "Allow connections from localhost only" for security
   - IMPORTANT: Uncheck "Read-Only API" to enable trading

### 3. Creating Paper Trading Account

1. Log in to Account Management
2. Go to Paper Trading section
3. Click "Create Paper Trading Account"
4. Paper trading account will be reset with $1,000,000 virtual cash

## Connection Methods

### TWS (Trader Workstation)

- Full trading platform with all features
- Must be running for API connectivity
- Configuration:
  - Edit > Global Configuration > API
  - Enable API connections
  - Set port to 7497 for paper trading
  - Allow localhost connections
  - Disable "Read-Only API"

### IB Gateway

- Lightweight application for API connections
- Runs in background without full interface
- More suitable for server deployments
- Configuration:
  - Settings gear icon > API > Settings
  - Enable API connections
  - Set port to 7496 for paper trading
  - Allow localhost connections

## Connection Parameters

| Environment | Application | Default Port | Client ID |
|-------------|-------------|--------------|-----------|
| Paper Trading | TWS | 7497 | Any unique ID |
| Paper Trading | IB Gateway | 7496 | Any unique ID |
| Live Trading | TWS | 7495 | Any unique ID |
| Live Trading | IB Gateway | 7494 | Any unique ID |

## AlgoTrader Pro Configuration

```javascript
const IBKRClient = require('../execution/ibkr-client');

// Paper trading configuration
const paperClient = new IBKRClient({
  host: '127.0.0.1',
  port: 7497,  // TWS Paper Trading
  clientId: 1,
  paperTrading: true
});

// Live trading configuration
const liveClient = new IBKRClient({
  host: '127.0.0.1',
  port: 7495,  // TWS Live Trading
  clientId: 2,
  paperTrading: false
});