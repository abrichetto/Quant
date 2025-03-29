// Trading functionality for the dashboard
class TradingManager {
    constructor() {
        this.client = null;
        this.isAuthenticated = false;
    }

    initialize(apiKey, apiSecret) {
        if (!apiKey || !apiSecret) {
            console.error('API credentials are required');
            return false;
        }

        try {
            this.client = new BigOneClient(apiKey, apiSecret);
            this.isAuthenticated = true;
            return true;
        } catch (error) {
            console.error('Failed to initialize trading client:', error);
            return false;
        }
    }

    async getAccountBalance() {
        if (!this.isAuthenticated) {
            throw new Error('Not authenticated');
        }
        return await this.client.getAccountInfo();
    }

    async getMarketData(symbol) {
        if (!this.isAuthenticated) {
            throw new Error('Not authenticated');
        }
        return await this.client.getTicker(symbol);
    }

    async placeOrder(symbol, side, price, amount, orderType = 'LIMIT') {
        if (!this.isAuthenticated) {
            throw new Error('Not authenticated');
        }
        return await this.client.createOrder(symbol, side, price, amount, orderType);
    }

    async placeMarketOrder(symbol, side, amount) {
        if (!this.isAuthenticated) {
            throw new Error('Not authenticated');
        }
        return await this.client.createMarketOrder(symbol, side, amount);
    }

    async getOpenOrders(symbol) {
        if (!this.isAuthenticated) {
            throw new Error('Not authenticated');
        }
        return await this.client.getOpenOrders(symbol);
    }

    // Futures trading methods
    async getFuturesPositions(symbol) {
        if (!this.isAuthenticated) {
            throw new Error('Not authenticated');
        }
        return await this.client.getFuturesPositions(symbol);
    }

    async openFuturesPosition(symbol, side, leverage, amount, price = null, stopLoss = null, takeProfit = null) {
        if (!this.isAuthenticated) {
            throw new Error('Not authenticated');
        }
        return await this.client.openFuturesPosition(symbol, side, leverage, amount, price, stopLoss, takeProfit);
    }

    async closeFuturesPosition(symbol, positionId) {
        if (!this.isAuthenticated) {
            throw new Error('Not authenticated');
        }
        return await this.client.closeFuturesPosition(symbol, positionId);
    }
}

// Initialize trading manager
const tradingManager = new TradingManager();

// Export for use in other files
window.tradingManager = tradingManager;

const IndicatorIntegration = require('../../FuturesQuant/src/execution/indicator_integration');
const path = require('path');
const fs = require('fs');

// Load IBKR configuration
const configPath = path.join(__dirname, '../../config/ibkr.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Initialize indicator integration
const indicatorIntegration = new IndicatorIntegration(config);

// DOM Elements
const tradingSymbol = document.getElementById('trading-symbol');
const correlatedSymbol = document.getElementById('correlated-symbol');
const orderType = document.getElementById('order-type');
const tradingStrategy = document.getElementById('trading-strategy');
const orderSide = document.getElementById('order-side');
const orderAmount = document.getElementById('order-amount');
const orderPrice = document.getElementById('order-price');
const limitPriceRow = document.getElementById('limit-price-row');
const placeOrderBtn = document.getElementById('place-order-btn');

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Connect to IBKR
        await indicatorIntegration.connect();
        console.log('Connected to IBKR');

        // Set up initial active strategy
        const initialStrategy = tradingStrategy.value;
        indicatorIntegration.setActiveStrategy(initialStrategy);

        // Update account overview
        await updateAccountOverview();
    } catch (error) {
        console.error('Failed to initialize trading:', error);
        showError('Failed to connect to trading system');
    }
});

// Strategy selection handler
tradingStrategy.addEventListener('change', (e) => {
    const newStrategy = e.target.value;
    const oldStrategy = Array.from(indicatorIntegration.activeStrategies)[0];
    
    if (oldStrategy) {
        indicatorIntegration.setInactiveStrategy(oldStrategy);
    }
    indicatorIntegration.setActiveStrategy(newStrategy);
});

// Order type handler
orderType.addEventListener('change', (e) => {
    limitPriceRow.style.display = e.target.value === 'LIMIT' ? 'flex' : 'none';
});

// Place order handler
placeOrderBtn.addEventListener('click', async () => {
    try {
        const symbol = tradingSymbol.value;
        const correlatedSymbol = document.getElementById('correlated-symbol').value;
        const strategy = tradingStrategy.value;
        const side = orderSide.value;
        const amount = parseFloat(orderAmount.value);
        const price = orderType.value === 'LIMIT' ? parseFloat(orderPrice.value) : null;

        // Validate inputs
        if (!amount || amount <= 0) {
            showError('Please enter a valid amount');
            return;
        }

        if (orderType.value === 'LIMIT' && (!price || price <= 0)) {
            showError('Please enter a valid price for limit orders');
            return;
        }

        // Get current market data
        const marketData = await indicatorIntegration.ibkr.getMarketData(symbol);
        
        // Place order through IBKR
        const orderId = await indicatorIntegration.ibkr.placeOrder(
            symbol,
            orderType.value,
            side === 'BUY' ? amount : -amount,
            price
        );

        showSuccess(`Order placed successfully: ${orderId}`);
        
        // Update account overview
        await updateAccountOverview();
    } catch (error) {
        console.error('Failed to place order:', error);
        showError('Failed to place order: ' + error.message);
    }
});

// Update account overview
async function updateAccountOverview() {
    try {
        const accountSummary = await indicatorIntegration.ibkr.getAccountSummary();
        const positions = await indicatorIntegration.ibkr.getPositions();
        
        // Update UI with account information
        document.getElementById('total-balance').textContent = 
            `$${parseFloat(accountSummary.totalBalance).toFixed(2)}`;
        document.getElementById('available-balance').textContent = 
            `$${parseFloat(accountSummary.availableBalance).toFixed(2)}`;
        document.getElementById('open-positions').textContent = 
            positions.length.toString();
    } catch (error) {
        console.error('Failed to update account overview:', error);
    }
}

// Show success message
function showSuccess(message) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-success alert-dismissible fade show';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.querySelector('.trading-form').prepend(alert);
    setTimeout(() => alert.remove(), 5000);
}

// Show error message
function showError(message) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-danger alert-dismissible fade show';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.querySelector('.trading-form').prepend(alert);
    setTimeout(() => alert.remove(), 5000);
}

// Handle indicator signals
indicatorIntegration.on('signal', async (signal) => {
    const { strategy, symbol, action, price, stopLoss, takeProfit } = signal;
    
    // Update UI with signal information
    const signalElement = document.createElement('div');
    signalElement.className = 'signal-item ' + action.toLowerCase();
    signalElement.innerHTML = `
        <div class="signal-icon">
            <i class="bi bi-arrow-${action === 'BUY' ? 'up' : 'down'}-circle-fill"></i>
        </div>
        <div class="signal-details">
            <h5>${symbol} <span class="badge bg-${action === 'BUY' ? 'success' : 'danger'}">${action}</span></h5>
            <p>${strategy} strategy signal</p>
            <div class="signal-meta">
                <span>Entry: ${price}</span>
                ${stopLoss ? `<span>Stop: ${stopLoss}</span>` : ''}
                ${takeProfit ? `<span>Target: ${takeProfit}</span>` : ''}
            </div>
        </div>
    `;
    
    document.querySelector('.signals-list').prepend(signalElement);
}); 