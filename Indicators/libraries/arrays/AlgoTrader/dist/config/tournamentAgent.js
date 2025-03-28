"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const agents_1 = require("../agents");
const logger_1 = require("../utils/logger");
class TournamentAgent {
    constructor(config = {}) {
        this.config = Object.assign({ rebalancePeriod: 3600000, maxWeightDelta: 0.05, initialWeight: 0.2, minWeight: 0.05, adjustmentFactor: 0.8, enableRebalancing: true, simulationMode: true, performanceDecayFactor: 0.9 }, config);
        this.agents = new Map();
        this.performances = new Map();
        this.logger = new logger_1.Logger();
        this.lastRebalanceTime = Date.now();
        this.isRunning = false;
    }
    registerAgent(id, agent, name, type) {
        this.agents.set(id, agent);
        this.performances.set(id, {
            id,
            name,
            type,
            wins: 0,
            losses: 0,
            pnl: 0,
            successRate: 0,
            weight: this.config.initialWeight,
            trades: 0
        });
        this.logger.info(`Registered agent: ${name} (${type}) with ID ${id}`);
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isRunning) {
                this.logger.info("Tournament is already running");
                return;
            }
            this.isRunning = true;
            this.logger.info(`Starting tournament with ${this.agents.size} agents`);
            this.normalizeWeights();
            this.runTournamentCycle();
        });
    }
    stop() {
        this.isRunning = false;
        this.logger.info("Tournament stopped");
    }
    getLeaderboard() {
        return Array.from(this.performances.values())
            .sort((a, b) => b.pnl - a.pnl);
    }
    runTournamentCycle() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isRunning)
                return;
            try {
                if (this.config.enableRebalancing &&
                    (Date.now() - this.lastRebalanceTime >= this.config.rebalancePeriod)) {
                    this.rebalanceWeights();
                    this.lastRebalanceTime = Date.now();
                }
                this.logger.info('Collecting signals from agents...');
                const signals = yield this.collectSignals();
                const results = this.simulateTrades(signals);
                this.updatePerformances(results);
                setTimeout(() => this.runTournamentCycle(), 5 * 60 * 1000);
            }
            catch (error) {
                this.logger.error(`Tournament cycle error: ${error instanceof Error ? error.message : String(error)}`);
                setTimeout(() => this.runTournamentCycle(), 5 * 60 * 1000);
            }
        });
    }
    collectSignals() {
        return __awaiter(this, void 0, void 0, function* () {
            const allSignals = [];
            for (const [id, agent] of this.agents.entries()) {
                try {
                    const performance = this.performances.get(id);
                    if (!performance)
                        continue;
                    if (agent instanceof agents_1.SignalAgent) {
                        yield agent.monitor();
                        const agentSignals = yield this.getAgentSignals(agent, 'signal');
                        agentSignals.forEach(signal => {
                            allSignals.push({
                                agentId: id,
                                symbol: signal.symbol,
                                action: signal.action,
                                confidence: signal.confidence * performance.weight,
                                timestamp: Date.now()
                            });
                        });
                    }
                    else if (agent instanceof agents_1.ModelAgent) {
                        agent.monitorMarket();
                        const predictions = yield agent.getPredictions();
                        predictions.forEach(prediction => {
                            const action = prediction.predictedPrice > prediction.currentPrice ? 'buy' : 'sell';
                            allSignals.push({
                                agentId: id,
                                symbol: prediction.symbol,
                                action,
                                confidence: prediction.confidence * performance.weight,
                                timestamp: Date.now()
                            });
                        });
                    }
                }
                catch (error) {
                    this.logger.error(`Error collecting signals from agent ${id}: ${error instanceof Error ? error.message : String(error)}`);
                }
            }
            return allSignals;
        });
    }
    getAgentSignals(agent, type) {
        return __awaiter(this, void 0, void 0, function* () {
            return [
                { symbol: 'BTC', action: 'buy', confidence: 0.85 },
                { symbol: 'ETH', action: 'buy', confidence: 0.75 },
                { symbol: 'SOL', action: 'sell', confidence: 0.65 }
            ];
        });
    }
    simulateTrades(signals) {
        const symbolSignals = new Map();
        signals.forEach(signal => {
            if (!symbolSignals.has(signal.symbol)) {
                symbolSignals.set(signal.symbol, []);
            }
            symbolSignals.get(signal.symbol).push(signal);
        });
        const results = [];
        symbolSignals.forEach((symbolSignalArray, symbol) => {
            symbolSignalArray.sort((a, b) => b.confidence - a.confidence);
            const marketMoved = Math.random() > 0.5 ? 'up' : 'down';
            const percentChange = Math.random() * 3;
            symbolSignalArray.forEach(signal => {
                let success = false;
                let pnl = 0;
                if (signal.action === 'buy' && marketMoved === 'up') {
                    success = true;
                    pnl = percentChange;
                }
                else if (signal.action === 'sell' && marketMoved === 'down') {
                    success = true;
                    pnl = percentChange;
                }
                else if (signal.action !== 'hold') {
                    success = false;
                    pnl = -percentChange;
                }
                results.push({
                    agentId: signal.agentId,
                    symbol,
                    action: signal.action,
                    success,
                    pnl
                });
            });
        });
        return results;
    }
    updatePerformances(results) {
        const agentResults = new Map();
        results.forEach(result => {
            if (!agentResults.has(result.agentId)) {
                agentResults.set(result.agentId, []);
            }
            agentResults.get(result.agentId).push(result);
        });
        agentResults.forEach((agentResultArray, agentId) => {
            const performance = this.performances.get(agentId);
            if (!performance)
                return;
            performance.pnl *= this.config.performanceDecayFactor;
            let wins = 0;
            let totalPnl = 0;
            agentResultArray.forEach(result => {
                if (result.success)
                    wins++;
                totalPnl += result.pnl;
                performance.trades++;
            });
            performance.wins += wins;
            performance.losses += (agentResultArray.length - wins);
            performance.pnl += totalPnl;
            if (performance.trades > 0) {
                performance.successRate = performance.wins / performance.trades;
            }
            this.logger.info(`Agent ${agentId} performance updated: PnL=${performance.pnl.toFixed(2)}, Success=${(performance.successRate * 100).toFixed(1)}%`);
        });
    }
    rebalanceWeights() {
        const totalAgents = this.performances.size;
        if (totalAgents <= 1)
            return;
        this.logger.info("Rebalancing agent weights based on performance");
        const performanceArray = Array.from(this.performances.values());
        performanceArray.sort((a, b) => b.pnl - a.pnl);
        performanceArray.forEach((performance, index) => {
            const rankFactor = 1 - (2 * index / (totalAgents - 1));
            const adjustment = this.config.maxWeightDelta * rankFactor * this.config.adjustmentFactor;
            performance.weight = Math.max(this.config.minWeight, Math.min(1, performance.weight + adjustment));
            this.logger.info(`Agent ${performance.id} weight adjusted to ${performance.weight.toFixed(2)}`);
        });
        this.normalizeWeights();
    }
    normalizeWeights() {
        let weightSum = 0;
        this.performances.forEach(performance => {
            weightSum += performance.weight;
        });
        if (weightSum > 0) {
            this.performances.forEach(performance => {
                performance.weight = performance.weight / weightSum;
            });
        }
    }
}
exports.default = TournamentAgent;
//# sourceMappingURL=tournamentAgent.js.map