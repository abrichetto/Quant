"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("../utils/logger");
class RiskAgent {
    constructor(config) {
        this.maxLeverage = config.maxLeverage;
        this.riskTolerance = config.riskTolerance;
        this.logger = new logger_1.Logger();
    }
    calculateLeverage(position) {
        const riskLevel = position.margin / position.balance;
        const newLeverage = Math.min(this.maxLeverage, Math.max(1, riskLevel * 10));
        this.logger.info(`Calculated leverage: ${newLeverage}`);
        return newLeverage;
    }
    validateRisk(position) {
        const riskPercentage = (position.margin / position.balance) * 100;
        const isValid = riskPercentage <= this.riskTolerance;
        this.logger.info(`Risk validation: ${isValid ? 'Valid' : 'Exceeded'}`);
        return isValid;
    }
    adjustRiskTolerance(newTolerance) {
        this.riskTolerance = newTolerance;
        this.logger.info(`Risk tolerance adjusted to: ${newTolerance}%`);
    }
    adjustMaxLeverage(newLeverage) {
        this.maxLeverage = newLeverage;
        this.logger.info(`Max leverage adjusted to: ${newLeverage}`);
    }
}
exports.default = RiskAgent;
//# sourceMappingURL=riskAgent.js.map