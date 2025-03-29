# FuturesQuant Trading System

## Features

### Exchange Integration
- **Big.one Integration**
  - Real-time order execution
  - Market data streaming
  - Account management
  - Position tracking
  - Risk management controls
  - Support for:
    - Spot trading
    - Futures trading
    - Margin trading
    - Stop orders
    - Take profit orders
    - Trailing stops

- **Order Types**
  - Market orders
  - Limit orders
  - Stop orders
  - Take profit orders
  - Trailing stop orders
  - OCO (One-Cancels-Other) orders

- **Risk Management**
  - Position size limits
  - Stop-loss enforcement
  - Leverage controls
  - Margin requirements
  - Maximum drawdown limits

### News Analysis & Visualization

#### Real-time News Processing
- **Enhanced News Analysis**
  - Sentiment analysis with context-aware scoring
  - Entity recognition for companies, currencies, indices, and commodities
  - Topic modeling across multiple categories
  - Market impact prediction using trained classifiers
  - TF-IDF analysis for key term extraction
  - Multi-category classification system

- **News Categories**
  - Technical (market indicators, trading patterns)
  - Fundamental (earnings, financial metrics)
  - Market (trading activity, liquidity)
  - Regulatory (compliance, legal)
  - Geopolitical (government actions, global events)

- **Market Impact Analysis**
  - High-impact events (earnings, mergers, regulations)
  - Medium-impact events (upgrades, forecasts)
  - Low-impact events (minor announcements)
  - Impact score calculation with weighted factors

#### Trading Signals
- **Signal Generation**
  - Multi-factor analysis combining:
    - Sentiment (30% weight)
    - Market impact (30% weight)
    - Topic analysis (20% weight)
    - Category distribution (20% weight)
  - Confidence scoring based on multiple indicators
  - Detailed signal rationales explaining decisions

- **Signal Types**
  - BUY signals for positive market conditions
  - SELL signals for negative market conditions
  - HOLD signals for neutral conditions
  - Signal strength indicators

#### Visualization Dashboard
- **Real-time Charts**
  - Sentiment trend visualization
  - Market impact tracking
  - Category distribution analysis
  - Topic analysis display

- **News Feed**
  - Real-time news updates
  - Sentiment indicators
  - Impact scores
  - Category tags
  - Topic analysis

- **Interactive Features**
  - Hover effects on charts
  - Click-through for detailed analysis
  - Filtering by category/topic
  - Time-based navigation

#### Integration Features
- **System Integration**
  - Real-time news subscription
  - Historical data caching
  - Event-based updates
  - Signal combination with technical indicators

- **Data Management**
  - News history tracking
  - Entity relationship mapping
  - Topic trend analysis
  - Impact prediction models

### Technical Indicators
[Previous technical indicators documentation remains unchanged]

### Risk Management
[Previous risk management documentation remains unchanged]

## Usage

### Big.one Integration
```javascript
// Initialize Big.one client
const bigOneClient = new BigOneClient({
    apiKey: 'your-api-key',
    apiSecret: 'your-api-secret',
    testnet: false // Set to true for testing
});

// Place a market order
async function placeMarketOrder(symbol, side, amount) {
    try {
        const order = await bigOneClient.createOrder({
            symbol: symbol,
            side: side,
            type: 'market',
            amount: amount
        });
        console.log('Order placed:', order);
    } catch (error) {
        console.error('Order failed:', error);
    }
}

// Place a limit order with stop loss
async function placeLimitOrderWithStop(symbol, side, amount, price, stopPrice) {
    try {
        const order = await bigOneClient.createOrder({
            symbol: symbol,
            side: side,
            type: 'limit',
            amount: amount,
            price: price,
            stopPrice: stopPrice
        });
        console.log('Order placed:', order);
    } catch (error) {
        console.error('Order failed:', error);
    }
}

// Get account balance
async function getBalance() {
    try {
        const balance = await bigOneClient.getAccountBalance();
        console.log('Account balance:', balance);
    } catch (error) {
        console.error('Failed to get balance:', error);
    }
}

// Monitor positions
bigOneClient.on('positionUpdate', (position) => {
    console.log('Position updated:', position);
});
```

### News Analysis
```javascript
// Subscribe to news for specific symbols
newsHandler.subscribeToNews(['BTC-USDT', 'ETH-USDT']);

// Get news signals
const signals = newsHandler.getNewsSignals('BTC-USDT');

// Get news summary
const summary = newsHandler.getNewsSummary('BTC-USDT');

// Monitor news updates
newsHandler.on('newsUpdate', (symbol, data) => {
    console.log(`News update for ${symbol}:`, data);
});
```

### Visualization
```javascript
// Initialize news dashboard
const newsDashboard = new NewsDashboard('newsDashboard', newsHandler);

// Add styles
newsDashboard.addStyles();

// Update subscription when symbol changes
function updateNewsSubscription(symbol) {
    newsHandler.unsubscribeAll();
    newsHandler.subscribeToNews(symbol);
}
```

## Dependencies
- Chart.js: For visualization components
- Natural: For NLP and text analysis
- @big.one/api: For Big.one integration
- [Other existing dependencies remain unchanged]

## Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   cd trading-bot
   ```

2. Install the required dependencies:
   ```
   npm install
   ```

3. Configure your credentials:
   - Copy `config/credentials.json.example` to `config/credentials.json`
   - Add your Big.one API credentials:
     ```json
     {
       "bigone": {
         "apiKey": "your-api-key",
         "apiSecret": "your-api-secret",
         "testnet": false
       }
     }
     ```

## Configuration
- **Big.one Settings**
  ```json
  {
    "bigone": {
      "apiKey": "your-api-key",
      "apiSecret": "your-api-secret",
      "testnet": false,
      "defaultLeverage": 1,
      "maxPositionSize": 1000,
      "stopLossPercentage": 2,
      "takeProfitPercentage": 4
    }
  }
  ```

[Previous configuration instructions remain unchanged]

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.