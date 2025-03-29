class CodeGPTManager {
    constructor() {
        this.messages = [];
        this.isProcessing = false;
        this.quickActions = {
            'configure-api': this.handleConfigureAPI.bind(this),
            'add-indicator': this.handleAddIndicator.bind(this),
            'create-strategy': this.handleCreateStrategy.bind(this),
            'optimize-performance': this.handleOptimizePerformance.bind(this)
        };
    }

    initialize() {
        this.setupEventListeners();
        this.addWelcomeMessage();
    }

    setupEventListeners() {
        // Send message button
        document.getElementById('send-message').addEventListener('click', () => this.handleSendMessage());

        // Enter key in textarea
        document.getElementById('codegpt-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
            }
        });

        // Quick action buttons
        document.querySelectorAll('.quick-actions button').forEach(button => {
            button.addEventListener('click', () => {
                const action = button.dataset.action;
                if (this.quickActions[action]) {
                    this.quickActions[action]();
                }
            });
        });
    }

    addWelcomeMessage() {
        this.addMessage('assistant', `Hello! I'm your CodeGPT assistant. I can help you with:
- Configuring API keys and settings
- Adding new technical indicators
- Creating trading strategies
- Optimizing performance
- Adding new features
- Debugging issues

What would you like help with?`);
    }

    async handleSendMessage() {
        const input = document.getElementById('codegpt-input');
        const message = input.value.trim();
        
        if (!message || this.isProcessing) return;

        // Clear input
        input.value = '';

        // Add user message
        this.addMessage('user', message);

        // Show thinking state
        const thinkingMessage = this.addMessage('assistant', 'Thinking', true);

        try {
            // Process the message
            const response = await this.processMessage(message);
            
            // Remove thinking message
            thinkingMessage.remove();
            
            // Add response
            this.addMessage('assistant', response);
        } catch (error) {
            thinkingMessage.remove();
            this.addMessage('assistant', `Sorry, I encountered an error: ${error.message}`);
        }
    }

    async processMessage(message) {
        this.isProcessing = true;

        try {
            // Here you would integrate with your actual CodeGPT/Copilot API
            // For now, we'll simulate responses based on message content
            const response = await this.generateResponse(message);
            return response;
        } finally {
            this.isProcessing = false;
        }
    }

    async generateResponse(message) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Basic response generation based on message content
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes('api') || lowerMessage.includes('key')) {
            return this.generateAPIResponse();
        } else if (lowerMessage.includes('indicator') || lowerMessage.includes('technical')) {
            return this.generateIndicatorResponse();
        } else if (lowerMessage.includes('strategy') || lowerMessage.includes('trading')) {
            return this.generateStrategyResponse();
        } else if (lowerMessage.includes('optimize') || lowerMessage.includes('performance')) {
            return this.generateOptimizationResponse();
        } else {
            return "I understand you're asking about something, but I'm not sure exactly what. Could you please be more specific? I can help with API configuration, adding indicators, creating strategies, or optimizing performance.";
        }
    }

    generateAPIResponse() {
        return `To configure your API keys:

1. Go to your Big.one account settings
2. Navigate to the API Management section
3. Create a new API key with the following permissions:
   - Read account information
   - Place orders
   - View market data

Then, you can set the keys in your browser's localStorage:
\`\`\`javascript
localStorage.setItem('bigone_api_key', 'your_api_key');
localStorage.setItem('bigone_api_secret', 'your_api_secret');
\`\`\`

Would you like me to help you implement a more secure way to store these credentials?`;
    }

    generateIndicatorResponse() {
        return `I can help you add technical indicators. Here's an example of how to add an RSI indicator:

\`\`\`javascript
class RSIIndicator {
    constructor(period = 14) {
        this.period = period;
        this.values = [];
    }

    calculate(prices) {
        // RSI calculation logic
        const changes = prices.slice(1).map((price, i) => price - prices[i]);
        const gains = changes.map(change => change > 0 ? change : 0);
        const losses = changes.map(change => change < 0 ? -change : 0);
        
        const avgGain = gains.slice(0, this.period).reduce((a, b) => a + b) / this.period;
        const avgLoss = losses.slice(0, this.period).reduce((a, b) => a + b) / this.period;
        
        const rs = avgGain / avgLoss;
        return 100 - (100 / (1 + rs));
    }
}
\`\`\`

Would you like me to help you implement this indicator or would you prefer a different one?`;
    }

    generateStrategyResponse() {
        return `I can help you create a trading strategy. Here's a basic example of a moving average crossover strategy:

\`\`\`javascript
class MACrossoverStrategy {
    constructor(fastPeriod = 10, slowPeriod = 20) {
        this.fastPeriod = fastPeriod;
        this.slowPeriod = slowPeriod;
    }

    calculateSignals(prices) {
        const fastMA = this.calculateMA(prices, this.fastPeriod);
        const slowMA = this.calculateMA(prices, this.slowPeriod);
        
        const signals = [];
        for (let i = this.slowPeriod; i < prices.length; i++) {
            if (fastMA[i] > slowMA[i] && fastMA[i-1] <= slowMA[i-1]) {
                signals.push({ type: 'BUY', price: prices[i] });
            } else if (fastMA[i] < slowMA[i] && fastMA[i-1] >= slowMA[i-1]) {
                signals.push({ type: 'SELL', price: prices[i] });
            }
        }
        
        return signals;
    }

    calculateMA(prices, period) {
        const ma = [];
        for (let i = 0; i < prices.length; i++) {
            if (i < period - 1) {
                ma.push(null);
                continue;
            }
            const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b);
            ma.push(sum / period);
        }
        return ma;
    }
}
\`\`\`

Would you like me to help you implement this strategy or would you prefer a different one?`;
    }

    generateOptimizationResponse() {
        return `I can help you optimize your trading system's performance. Here are some key areas we can focus on:

1. Backtesting Framework
2. Risk Management
3. Position Sizing
4. Entry/Exit Optimization
5. Performance Metrics

Here's an example of a basic backtesting framework:

\`\`\`javascript
class Backtester {
    constructor(strategy, initialCapital = 10000) {
        this.strategy = strategy;
        this.initialCapital = initialCapital;
        this.capital = initialCapital;
        this.positions = [];
    }

    run(historicalData) {
        const signals = this.strategy.calculateSignals(historicalData);
        let currentPosition = null;
        
        for (const signal of signals) {
            if (signal.type === 'BUY' && !currentPosition) {
                currentPosition = {
                    type: 'LONG',
                    entryPrice: signal.price,
                    entryTime: signal.time
                };
            } else if (signal.type === 'SELL' && currentPosition) {
                const profit = (signal.price - currentPosition.entryPrice) / currentPosition.entryPrice;
                this.capital *= (1 + profit);
                this.positions.push({
                    ...currentPosition,
                    exitPrice: signal.price,
                    exitTime: signal.time,
                    profit
                });
                currentPosition = null;
            }
        }
        
        return this.generateReport();
    }

    generateReport() {
        const totalTrades = this.positions.length;
        const winningTrades = this.positions.filter(p => p.profit > 0).length;
        const totalProfit = (this.capital - this.initialCapital) / this.initialCapital * 100;
        
        return {
            totalTrades,
            winningTrades,
            winRate: (winningTrades / totalTrades) * 100,
            totalProfit,
            positions: this.positions
        };
    }
}
\`\`\`

Would you like me to help you implement any of these optimization features?`;
    }

    addMessage(type, content, isThinking = false) {
        const messagesContainer = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}${isThinking ? ' thinking' : ''}`;
        
        if (typeof content === 'string') {
            messageDiv.textContent = content;
        } else {
            messageDiv.innerHTML = content;
        }
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        return messageDiv;
    }

    // Quick action handlers
    handleConfigureAPI() {
        this.addMessage('user', 'Help me configure my API keys');
        this.handleSendMessage();
    }

    handleAddIndicator() {
        this.addMessage('user', 'Help me add a new technical indicator');
        this.handleSendMessage();
    }

    handleCreateStrategy() {
        this.addMessage('user', 'Help me create a new trading strategy');
        this.handleSendMessage();
    }

    handleOptimizePerformance() {
        this.addMessage('user', 'Help me optimize my trading system performance');
        this.handleSendMessage();
    }
}

// Initialize CodeGPT manager
const codeGPTManager = new CodeGPTManager();
document.addEventListener('DOMContentLoaded', () => codeGPTManager.initialize()); 