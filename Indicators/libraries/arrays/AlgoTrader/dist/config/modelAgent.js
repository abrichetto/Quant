"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
class Logger {
    info(message) {
        console.log(`INFO: ${message}`);
    }
    warn(message) {
        console.warn(`WARN: ${message}`);
    }
    error(message) {
        console.error(`ERROR: ${message}`);
    }
}
exports.Logger = Logger;
class ModelAgent {
    constructor(config) {
        this.indicators = config.indicators;
        this.historicalData = config.historicalData;
        this.riskRewardRatio = config.riskRewardRatio;
        this.volatilityThreshold = config.volatilityThreshold;
        this.logger = new Logger();
    }
    calculateVolatility(data) {
        const priceChanges = data.map((d) => d.high - d.low);
        const averageChange = priceChanges.reduce((sum, change) => sum + change, 0) / priceChanges.length;
        const volatilityScore = averageChange / data[0].close;
        const isVolatile = volatilityScore > this.volatilityThreshold;
        this.logger.info(`Volatility Score: ${volatilityScore}, Is Volatile: ${isVolatile}`);
        return { isVolatile, volatilityScore };
    }
    backtestStrategy(strategyName, data) {
        return Math.random() * 1000;
    }
    monitorMarket(riskAgent) {
        this.logger.info('Monitoring market conditions...');
        const { isVolatile, volatilityScore } = this.calculateVolatility(this.historicalData);
        if (isVolatile) {
            this.logger.warn('Market is volatile! Adjusting RiskAgent parameters...');
            riskAgent.adjustRiskTolerance(2);
            riskAgent.adjustMaxLeverage(3);
        }
        else {
            this.logger.info('Market is stable. Restoring RiskAgent parameters...');
            riskAgent.adjustRiskTolerance(5);
            riskAgent.adjustMaxLeverage(10);
        }
    }
}
exports.default = ModelAgent;
//# sourceMappingURL=modelAgent.js.map