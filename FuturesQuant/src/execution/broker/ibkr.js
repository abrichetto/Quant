const { Client } = require('@stoqey/ib');
const EventEmitter = require('events');

class IBKRHandler extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            host: config.host || '127.0.0.1',
            port: config.port || 7496, // 7496 for TWS, 4001 for IB Gateway
            clientId: config.clientId || 0,
            ...config
        };
        this.client = null;
        this.connected = false;
        this.subscriptions = new Map();
        this.positions = new Map();
        this.orders = new Map();
    }

    async connect() {
        try {
            this.client = new Client();
            
            // Set up event handlers
            this.client.on('connected', () => {
                this.connected = true;
                this.emit('connected');
                console.log('Connected to IBKR');
            });

            this.client.on('disconnected', () => {
                this.connected = false;
                this.emit('disconnected');
                console.log('Disconnected from IBKR');
            });

            this.client.on('error', (err) => {
                this.emit('error', err);
                console.error('IBKR Error:', err);
            });

            // Connect to IBKR
            await this.client.connect(
                this.config.host,
                this.config.port,
                this.config.clientId
            );

            // Request account summary
            await this.client.reqAccountSummary();
            
            // Set up market data subscriptions
            await this.setupMarketData();
            
            return true;
        } catch (error) {
            console.error('Failed to connect to IBKR:', error);
            throw error;
        }
    }

    async disconnect() {
        if (this.client) {
            await this.client.disconnect();
            this.connected = false;
            this.emit('disconnected');
        }
    }

    async setupMarketData() {
        // Subscribe to market data for configured symbols
        for (const [symbol, config] of this.subscriptions) {
            await this.subscribeMarketData(symbol, config);
        }
    }

    async subscribeMarketData(symbol, config = {}) {
        if (!this.connected) {
            throw new Error('Not connected to IBKR');
        }

        const contract = {
            symbol: symbol,
            secType: 'FUT',
            exchange: config.exchange || 'CME',
            currency: config.currency || 'USD',
            lastTradeDateOrContractMonth: config.expiry || ''
        };

        try {
            // Request market data
            await this.client.reqMktData(contract);
            
            // Store subscription
            this.subscriptions.set(symbol, {
                contract,
                config,
                lastUpdate: null
            });

            // Set up market data handlers
            this.client.on('tickPrice', (tickerId, field, price) => {
                const subscription = this.subscriptions.get(symbol);
                if (subscription) {
                    subscription.lastUpdate = {
                        field,
                        price,
                        timestamp: Date.now()
                    };
                    this.emit('marketData', { symbol, ...subscription.lastUpdate });
                }
            });

            return true;
        } catch (error) {
            console.error(`Failed to subscribe to market data for ${symbol}:`, error);
            throw error;
        }
    }

    async placeOrder(symbol, orderType, quantity, price = null, stopPrice = null) {
        if (!this.connected) {
            throw new Error('Not connected to IBKR');
        }

        const subscription = this.subscriptions.get(symbol);
        if (!subscription) {
            throw new Error(`No market data subscription for ${symbol}`);
        }

        const order = {
            action: quantity > 0 ? 'BUY' : 'SELL',
            totalQuantity: Math.abs(quantity),
            orderType: orderType.toUpperCase(),
            ...(price && { lmtPrice: price }),
            ...(stopPrice && { auxPrice: stopPrice })
        };

        try {
            const orderId = await this.client.placeOrder(
                subscription.contract,
                order
            );

            // Store order
            this.orders.set(orderId, {
                symbol,
                order,
                status: 'SUBMITTED',
                timestamp: Date.now()
            });

            // Set up order status handler
            this.client.on('orderStatus', (orderId, status, filled, remaining, avgFillPrice) => {
                const storedOrder = this.orders.get(orderId);
                if (storedOrder) {
                    storedOrder.status = status;
                    storedOrder.filled = filled;
                    storedOrder.remaining = remaining;
                    storedOrder.avgFillPrice = avgFillPrice;
                    this.emit('orderStatus', { orderId, ...storedOrder });
                }
            });

            return orderId;
        } catch (error) {
            console.error(`Failed to place order for ${symbol}:`, error);
            throw error;
        }
    }

    async cancelOrder(orderId) {
        if (!this.connected) {
            throw new Error('Not connected to IBKR');
        }

        try {
            await this.client.cancelOrder(orderId);
            const order = this.orders.get(orderId);
            if (order) {
                order.status = 'CANCELLED';
                this.emit('orderStatus', { orderId, ...order });
            }
            return true;
        } catch (error) {
            console.error(`Failed to cancel order ${orderId}:`, error);
            throw error;
        }
    }

    async getPositions() {
        if (!this.connected) {
            throw new Error('Not connected to IBKR');
        }

        try {
            const positions = await this.client.reqPositions();
            this.positions.clear();
            
            for (const position of positions) {
                this.positions.set(position.contract.symbol, position);
            }

            return positions;
        } catch (error) {
            console.error('Failed to get positions:', error);
            throw error;
        }
    }

    async getAccountSummary() {
        if (!this.connected) {
            throw new Error('Not connected to IBKR');
        }

        try {
            return await this.client.reqAccountSummary();
        } catch (error) {
            console.error('Failed to get account summary:', error);
            throw error;
        }
    }
}

module.exports = IBKRHandler; 