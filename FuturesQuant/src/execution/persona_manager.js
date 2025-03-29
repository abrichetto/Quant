const MichaelSaylorAgent = require('../agents/strategies/MichaelSaylorAgent');
const EventEmitter = require('events');

class PersonaManager extends EventEmitter {
    constructor(config = {}) {
        super();
        this.personas = {
            michaelSaylor: new MichaelSaylorAgent({
                focusAssets: ['BTC', 'ETH'],
                accumulationThreshold: 0.7,
                dipPercentage: 0.1
            })
        };
        this.activePersonas = new Set();
        this.signalWeights = new Map();
        this.riskParameters = {
            maxPositionSize: config.maxPositionSize || 0.1, // 10% of portfolio
            maxDrawdown: config.maxDrawdown || 0.15, // 15% max drawdown
            dailyLossLimit: config.dailyLossLimit || 0.05, // 5% daily loss limit
            leverageLimit: config.leverageLimit || 2 // Max 2x leverage
        };
        this.setupEventHandlers();
    }

    setupEventHandlers() {
        // Listen for signals from each persona
        Object.entries(this.personas).forEach(([name, persona]) => {
            persona.on('signal', (signal) => {
                this.handlePersonaSignal(name, signal);
            });
        });
    }

    async initialize() {
        // Initialize all personas
        for (const persona of Object.values(this.personas)) {
            await persona.initialize();
        }
        console.log('All personas initialized');
    }

    handlePersonaSignal(personaName, signal) {
        const { symbol, action, confidence, rationale } = signal;
        
        // Update signal weights for this persona
        this.signalWeights.set(`${personaName}-${symbol}`, {
            action,
            confidence,
            timestamp: Date.now(),
            rationale
        });

        // Analyze combined signals
        this.analyzeCombinedSignals(symbol);
    }

    analyzeCombinedSignals(symbol) {
        const signals = Array.from(this.signalWeights.entries())
            .filter(([key]) => key.endsWith(symbol))
            .map(([_, value]) => value);

        if (signals.length === 0) return;

        // Calculate weighted consensus
        const consensus = this.calculateConsensus(signals);
        
        // Apply risk management
        const validatedSignal = this.applyRiskManagement(consensus);

        // Emit final decision
        if (validatedSignal) {
            this.emit('consensusSignal', validatedSignal);
        }
    }

    calculateConsensus(signals) {
        // Weight signals based on persona confidence and recentness
        const weightedSignals = signals.map(signal => ({
            ...signal,
            weight: signal.confidence * this.calculateTimeWeight(signal.timestamp)
        }));

        // Calculate weighted average
        const totalWeight = weightedSignals.reduce((sum, s) => sum + s.weight, 0);
        const weightedAction = weightedSignals.reduce((acc, s) => {
            acc[s.action] = (acc[s.action] || 0) + s.weight;
            return acc;
        }, {});

        // Determine final action
        const buyWeight = weightedAction['BUY'] || 0;
        const sellWeight = weightedAction['SELL'] || 0;
        
        return {
            action: buyWeight > sellWeight ? 'BUY' : 'SELL',
            confidence: Math.max(buyWeight, sellWeight) / totalWeight,
            rationale: this.generateConsensusRationale(weightedSignals)
        };
    }

    calculateTimeWeight(timestamp) {
        // Exponential decay based on time
        const age = Date.now() - timestamp;
        const decayRate = 0.0001; // Adjust this value to control decay speed
        return Math.exp(-decayRate * age);
    }

    generateConsensusRationale(signals) {
        return signals.map(s => 
            `${s.action} (${(s.confidence * 100).toFixed(1)}% confidence): ${s.rationale}`
        ).join('\n');
    }

    applyRiskManagement(signal) {
        // Check position limits
        if (!this.checkPositionLimits(signal)) {
            console.log('Signal rejected: Position limits exceeded');
            return null;
        }

        // Check drawdown limits
        if (!this.checkDrawdownLimits(signal)) {
            console.log('Signal rejected: Drawdown limits exceeded');
            return null;
        }

        // Check daily loss limits
        if (!this.checkDailyLossLimits(signal)) {
            console.log('Signal rejected: Daily loss limit exceeded');
            return null;
        }

        return signal;
    }

    checkPositionLimits(signal) {
        // Implement position size checks
        return true; // Placeholder
    }

    checkDrawdownLimits(signal) {
        // Implement drawdown checks
        return true; // Placeholder
    }

    checkDailyLossLimits(signal) {
        // Implement daily loss checks
        return true; // Placeholder
    }

    setActivePersona(personaName) {
        if (this.personas[personaName]) {
            this.activePersonas.add(personaName);
            console.log(`Activated persona: ${personaName}`);
        }
    }

    setInactivePersona(personaName) {
        this.activePersonas.delete(personaName);
        console.log(`Deactivated persona: ${personaName}`);
    }

    getPersonaStatus(personaName) {
        return {
            active: this.activePersonas.has(personaName),
            lastSignals: Array.from(this.signalWeights.entries())
                .filter(([key]) => key.startsWith(personaName))
                .map(([_, value]) => value)
        };
    }

    getAllPersonaStatus() {
        return Object.keys(this.personas).reduce((acc, persona) => {
            acc[persona] = this.getPersonaStatus(persona);
            return acc;
        }, {});
    }

    updateRiskParameters(newParams) {
        this.riskParameters = {
            ...this.riskParameters,
            ...newParams
        };
        console.log('Risk parameters updated:', this.riskParameters);
    }

    getNewsSignals(symbol) {
        // Implementation of getNewsSignals method
    }

    getNewsSummary(symbol) {
        // Implementation of getNewsSummary method
    }
}

module.exports = PersonaManager; 