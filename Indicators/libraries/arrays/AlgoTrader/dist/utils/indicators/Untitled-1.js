"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SharpeIndicator {
    calculate(returns, riskFreeRate = 0) {
        if (returns.length === 0) {
            throw new Error('Returns array cannot be empty.');
        }
        const averageReturn = this.mean(returns);
        const excessReturns = returns.map((r) => r - riskFreeRate);
        const standardDeviation = this.standardDeviation(excessReturns);
        if (standardDeviation === 0) {
            throw new Error('Standard deviation is zero, Sharpe Ratio cannot be calculated.');
        }
        return averageReturn / standardDeviation;
    }
    mean(data) {
        return data.reduce((sum, value) => sum + value, 0) / data.length;
    }
    standardDeviation(data) {
        const meanValue = this.mean(data);
        const variance = data.reduce((sum, value) => sum + Math.pow(value - meanValue, 2), 0) / data.length;
        return Math.sqrt(variance);
    }
}
exports.default = SharpeIndicator;
//# sourceMappingURL=Untitled-1.js.map