const IBKRHandler = require('./broker/ibkr');
const SuperTrendAI = require('../strategy/supertrend-ai');
const CrossCorrelationPair = require('../strategy/cross-correlation-pair');
const MLMI = require('../strategy/mlmi');
const NewsHandler = require('./news_handler');
const PersonaManager = require('./persona_manager');

class IndicatorIntegration {
    constructor(config = {}) {
        this.ibkr = new IBKRHandler(config);
        this.indicators = {
            supertrend: new SuperTrendAI(),
            crossCorrelation: new CrossCorrelationPair(),
            mlmi: new MLMI()
        };
        this.newsHandler = new NewsHandler({ ibkr: this.ibkr });
        this.personaManager = new PersonaManager(config);
        this.activeStrategies = new Set();
        this.signalHandlers = new Map();
        this.setupEventHandlers();
    }

    setupEventHandlers() {
        // IBKR market data handler
        this.ibkr.on('marketData', (data) => {
            this.processMarketData(data);
        });

        // IBKR order status handler
        this.ibkr.on('orderStatus', (data) => {
            this.processOrderStatus(data);
        });

        // News handler events
        this.newsHandler.on('signal', (signal) => {
            this.handleSignal('news', signal);
        });

        // Persona manager events
        this.personaManager.on('consensusSignal', (signal) => {
            this.handleConsensusSignal(signal);
        });

        // Set up signal handlers for each indicator
        this.setupIndicatorSignals();
    }

    setupIndicatorSignals() {
        // SuperTrend AI signals
        this.indicators.supertrend.on('signal', (signal) => {
            this.handleSignal('supertrend', signal);
        });

        // Cross Correlation Pair signals
        this.indicators.crossCorrelation.on('signal', (signal) => {
            this.handleSignal('crossCorrelation', signal);
        });

        // MLMI signals
        this.indicators.mlmi.on('signal', (signal) => {
            this.handleSignal('mlmi', signal);
        });
    }

    async connect() {
        try {
            await this.ibkr.connect();
            await this.personaManager.initialize();
            console.log('Connected to IBKR and initialized all components');
            return true;
        } catch (error) {
            console.error('Failed to connect:', error);
            throw error;
        }
    }

    async disconnect() {
        await this.ibkr.disconnect();
        console.log('Disconnected from IBKR');
    }

    processMarketData(data) {
        const { symbol, field, price, timestamp } = data;

        // Update indicators with new market data
        if (this.activeStrategies.has('supertrend')) {
            this.indicators.supertrend.update({
                symbol,
                price,
                timestamp
            });
        }

        if (this.activeStrategies.has('crossCorrelation')) {
            this.indicators.crossCorrelation.update({
                symbol,
                price,
                timestamp
            });
        }

        if (this.activeStrategies.has('mlmi')) {
            this.indicators.mlmi.update({
                symbol,
                price,
                timestamp
            });
        }

        // Update personas with market data
        this.personaManager.handleMarketData(data);
    }

    processOrderStatus(data) {
        const { orderId, status, filled, remaining, avgFillPrice } = data;
        
        // Update position tracking for indicators
        if (status === 'FILLED') {
            this.updateIndicatorPositions(data);
            this.personaManager.handleOrderFilled(data);
        }
    }

    updateIndicatorPositions(orderData) {
        const { symbol, filled, avgFillPrice } = orderData;

        // Update position tracking for each active indicator
        this.activeStrategies.forEach(strategy => {
            if (this.indicators[strategy]) {
                this.indicators[strategy].updatePosition({
                    symbol,
                    quantity: filled,
                    price: avgFillPrice
                });
            }
        });
    }

    handleSignal(strategy, signal) {
        const { symbol, action, price, stopLoss, takeProfit } = signal;

        // Forward signal to persona manager
        this.personaManager.handleSignal(strategy, signal);

        // Check if we should execute the signal
        if (this.shouldExecuteSignal(strategy, signal)) {
            this.executeSignal(strategy, signal);
        }
    }

    handleConsensusSignal(signal) {
        // Execute consensus signal from persona manager
        this.executeSignal('consensus', signal);
    }

    shouldExecuteSignal(strategy, signal) {
        // Implement signal validation logic here
        // For example, check risk parameters, position limits, etc.
        return true;
    }

    async executeSignal(strategy, signal) {
        const { symbol, action, price, stopLoss, takeProfit } = signal;

        try {
            // Place main order
            const orderId = await this.ibkr.placeOrder(
                symbol,
                'LIMIT',
                action === 'BUY' ? 1 : -1,
                price
            );

            // Place stop loss if provided
            if (stopLoss) {
                await this.ibkr.placeOrder(
                    symbol,
                    'STOP',
                    action === 'BUY' ? -1 : 1,
                    null,
                    stopLoss
                );
            }

            // Place take profit if provided
            if (takeProfit) {
                await this.ibkr.placeOrder(
                    symbol,
                    'LIMIT',
                    action === 'BUY' ? -1 : 1,
                    takeProfit
                );
            }

            console.log(`Executed ${strategy} signal for ${symbol}: ${action} at ${price}`);
        } catch (error) {
            console.error(`Failed to execute ${strategy} signal:`, error);
        }
    }

    async subscribeToNews(symbols = [], sources = []) {
        await this.newsHandler.subscribeToNews(symbols, sources);
    }

    async unsubscribeFromNews(symbol) {
        await this.newsHandler.unsubscribeFromNews(symbol);
    }

    getNewsSummary(symbol) {
        return this.newsHandler.getNewsSummary(symbol);
    }

    getNewsSignals(symbol) {
        return this.newsHandler.getNewsSignals(symbol);
    }

    setActiveStrategy(strategy) {
        if (this.indicators[strategy]) {
            this.activeStrategies.add(strategy);
            console.log(`Activated ${strategy} strategy`);
        }
    }

    setInactiveStrategy(strategy) {
        this.activeStrategies.delete(strategy);
        console.log(`Deactivated ${strategy} strategy`);
    }

    setActivePersona(personaName) {
        this.personaManager.setActivePersona(personaName);
    }

    setInactivePersona(personaName) {
        this.personaManager.setInactivePersona(personaName);
    }

    getIndicatorStatus(strategy) {
        return {
            active: this.activeStrategies.has(strategy),
            lastSignal: this.indicators[strategy]?.getLastSignal(),
            position: this.indicators[strategy]?.getCurrentPosition()
        };
    }

    getAllIndicatorStatus() {
        return Object.keys(this.indicators).reduce((acc, strategy) => {
            acc[strategy] = this.getIndicatorStatus(strategy);
            return acc;
        }, {});
    }

    getPersonaStatus(personaName) {
        return this.personaManager.getPersonaStatus(personaName);
    }

    getAllPersonaStatus() {
        return this.personaManager.getAllPersonaStatus();
    }

    updateRiskParameters(newParams) {
        this.personaManager.updateRiskParameters(newParams);
    }
}

module.exports = IndicatorIntegration; 