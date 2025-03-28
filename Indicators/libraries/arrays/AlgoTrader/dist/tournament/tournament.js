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
exports.TradingTournament = void 0;
const agents_1 = require("../agents");
const logger_1 = require("../utils/logger");
class TradingTournament {
    constructor(initialBalance = 10000, rebalanceInterval = 60 * 60 * 1000) {
        this.initialBalance = initialBalance;
        this.rebalanceInterval = rebalanceInterval;
        this.agents = new Map();
        this.performances = new Map();
        this.logger = new logger_1.Logger();
        this.isRunning = false;
        this.lastRebalanceTime = Date.now();
    }
    registerAgent(id, agent, type) {
        this.agents.set(id, agent);
        this.performances.set(id, {
            id,
            type,
            pnl: 0,
            winRate: 0,
            tradingVolume: 0,
            score: 0,
            weight: 1.0,
            initialBalance: this.initialBalance,
            currentBalance: this.initialBalance
        });
        this.logger.info(`Registered agent: ${id} (${type})`);
    }
    start() {
        this.isRunning = true;
        this.logger.info('Tournament started');
        this.runTournamentCycle();
    }
    stop() {
        this.isRunning = false;
        this.logger.info('Tournament stopped');
    }
    runTournamentCycle() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isRunning)
                return;
            try {
                if (Date.now() - this.lastRebalanceTime >= this.rebalanceInterval) {
                    this.rebalanceWeights();
                    this.lastRebalanceTime = Date.now();
                }
                this.logger.info('Collecting signals from agents...');
                const signals = yield this.collectSignals();
                const results = this.simulateTrades(signals);
                this.updatePerformances(results);
            }
            catch (error) {
                this.logger.error(`Tournament cycle error: ${error}`);
            }
            setTimeout(() => this.runTournamentCycle(), 5 * 60 * 1000);
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
                    let signals = [];
                    if (agent instanceof agents_1.SignalAgent) {
                        yield agent.monitor();
                        signals = [{ type: 'market', confidence: 0.8, action: 'buy' }];
                    }
                    else if (agent instanceof agents_1.ModelAgent) {
                        agent.monitorMarket();
                        signals = [{ type: 'prediction', confidence: 0.75, action: 'sell' }];
                    }
                    signals.forEach(signal => {
                        allSignals.push(Object.assign(Object.assign({}, signal), { agentId: id, weight: performance.weight }));
                    });
                }
                catch (error) {
                    this.logger.error(`Error collecting signals from ${id}: ${error}`);
                }
            }
            return allSignals;
        });
    }
    simulateTrades(signals) {
        return signals.map(signal => {
            const success = Math.random() > 0.5;
            const pnlPercent = success ?
                (signal.confidence * 5) + (Math.random() * 5) :
                -((signal.confidence * 2) + (Math.random() * 3));
            return Object.assign(Object.assign({}, signal), { success,
                pnlPercent });
        });
    }
    updatePerformances(results) {
        for (const result of results) {
            const performance = this.performances.get(result.agentId);
            if (!performance)
                continue;
            performance.tradingVolume += 1;
            const pnlAmount = performance.currentBalance * (result.pnlPercent / 100);
            performance.currentBalance += pnlAmount;
            const wins = performance.winRate * performance.tradingVolume;
            performance.winRate = (wins + (result.success ? 1 : 0)) / (performance.tradingVolume);
            performance.pnl = (performance.currentBalance / performance.initialBalance - 1) * 100;
            performance.score = (performance.pnl * 0.7) + (performance.winRate * 100 * 0.3);
            this.logger.info(`Agent ${result.agentId}: ${result.success ? 'WON' : 'LOST'} ${result.pnlPercent.toFixed(2)}%, ` +
                `Balance: $${performance.currentBalance.toFixed(2)}`);
        }
    }
    rebalanceWeights() {
        this.logger.info('Rebalancing agent weights...');
        const sortedPerformances = Array.from(this.performances.values())
            .sort((a, b) => b.score - a.score);
        if (sortedPerformances.length < 2)
            return;
        const adjustmentFactor = 0.05;
        sortedPerformances.forEach((perf, index) => {
            const position = index / (sortedPerformances.length - 1);
            const adjustment = adjustmentFactor * (0.5 - position);
            perf.weight = Math.max(0.05, Math.min(1, perf.weight * (1 + adjustment)));
        });
        this.normalizeWeights();
        this.displayLeaderboard();
    }
    displayLeaderboard() {
        this.logger.info('Current Tournament Standings:');
        const sortedPerformances = Array.from(this.performances.values())
            .sort((a, b) => b.score - a.score);
        sortedPerformances.forEach((perf, index) => {
            this.logger.info(`${index + 1}. ${perf.id} (${perf.type}): Score=${perf.score.toFixed(2)}, ` +
                `PnL=${perf.pnl.toFixed(2)}%, Win Rate=${(perf.winRate * 100).toFixed(2)}%`);
        });
    }
    getLeaderboard() {
        return Array.from(this.performances.values())
            .sort((a, b) => b.pnl - a.pnl);
    }
    manuallyAdjustWeight(agentId, adjustment) {
        const performance = this.performances.get(agentId);
        if (performance) {
            performance.weight = Math.max(0.05, Math.min(1, performance.weight + adjustment));
            this.normalizeWeights();
        }
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
exports.TradingTournament = TradingTournament;
//# sourceMappingURL=tournament.js.map