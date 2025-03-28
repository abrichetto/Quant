"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskThreshold = void 0;
var RiskThreshold;
(function (RiskThreshold) {
    RiskThreshold["CONSERVATIVE"] = "conservative";
    RiskThreshold["MODERATE"] = "moderate";
    RiskThreshold["AGGRESSIVE"] = "aggressive";
})(RiskThreshold || (exports.RiskThreshold = RiskThreshold = {}));
class RiskAgent {
    constructor(config) {
        this.signalMultiplier = 1.0;
        this.config = Object.assign({ maxLeverage: {
                [RiskThreshold.CONSERVATIVE]: 2,
                [RiskThreshold.MODERATE]: 5,
                [RiskThreshold.AGGRESSIVE]: 10
            }, marginRiskPercentage: {
                [RiskThreshold.CONSERVATIVE]: 2,
                [RiskThreshold.MODERATE]: 5,
                [RiskThreshold.AGGRESSIVE]: 10
            }, stopLossPercentage: {
                [RiskThreshold.CONSERVATIVE]: 1,
                [RiskThreshold.MODERATE]: 2.5,
                [RiskThreshold.AGGRESSIVE]: 5
            }, signalConfidenceThreshold: 0.7, defaultThreshold: RiskThreshold.CONSERVATIVE }, config);
        this.currentThreshold = this.config.defaultThreshold;
        console.log(`Risk agent initialized with ${this.currentThreshold} threshold`);
    }
    updateRiskSettings(newSettings) {
        this.config = Object.assign(Object.assign({}, this.config), newSettings);
        console.log(`Risk settings updated: ${JSON.stringify(this.config)}`);
    }
    setRiskThreshold(threshold) {
        this.currentThreshold = threshold;
        console.log(`Risk threshold set to: ${threshold}`);
    }
    adjustRiskWithSignal(signal) {
        if (signal.confidence >= this.config.signalConfidenceThreshold) {
            const strengthFactor = (signal.confidence * 0.5) +
                (signal.consistency * 0.3) +
                (signal.volume * 0.2);
            this.signalMultiplier = 1.0 + (strengthFactor * 0.5);
            console.log(`Risk adjusted based on signal strength. Multiplier: ${this.signalMultiplier}`);
            if (strengthFactor > 0.8 && this.currentThreshold === RiskThreshold.CONSERVATIVE) {
                this.currentThreshold = RiskThreshold.MODERATE;
                console.log("Strong signals detected: Risk threshold increased to MODERATE");
            }
        }
        else {
            this.signalMultiplier = 1.0;
            if (this.currentThreshold !== RiskThreshold.CONSERVATIVE) {
                this.currentThreshold = RiskThreshold.CONSERVATIVE;
                console.log("Weak signals detected: Risk threshold reset to CONSERVATIVE");
            }
        }
    }
    validateRisk(position) {
        console.log(`Validating risk with ${this.currentThreshold} threshold...`);
        const maxMarginPercentage = this.config.marginRiskPercentage[this.currentThreshold];
        const maxMargin = position.balance * (maxMarginPercentage / 100);
        const adjustedMaxMargin = this.currentThreshold !== RiskThreshold.AGGRESSIVE ?
            maxMargin * this.signalMultiplier : maxMargin;
        const isWithinMarginLimit = position.margin <= adjustedMaxMargin;
        console.log(`Risk validation: ${isWithinMarginLimit ? 'PASSED' : 'FAILED'}`);
        console.log(`Current margin: ${position.margin}, Max allowed: ${adjustedMaxMargin}`);
        return isWithinMarginLimit;
    }
    calculateLeverage(position) {
        console.log(`Calculating leverage with ${this.currentThreshold} threshold...`);
        const baseMaxLeverage = this.config.maxLeverage[this.currentThreshold];
        let adjustedMaxLeverage = baseMaxLeverage * this.signalMultiplier;
        const absoluteMaxLeverage = this.config.maxLeverage[RiskThreshold.AGGRESSIVE];
        if (adjustedMaxLeverage > absoluteMaxLeverage) {
            adjustedMaxLeverage = absoluteMaxLeverage;
        }
        const riskRatio = position.margin / position.balance;
        const safeMaxLeverage = Math.min(adjustedMaxLeverage, 1 + (adjustedMaxLeverage - 1) * (1 - riskRatio * 10));
        const finalLeverage = Math.max(1, safeMaxLeverage);
        console.log(`Calculated leverage: ${finalLeverage}x (base max: ${baseMaxLeverage}x, adjusted max: ${adjustedMaxLeverage}x)`);
        return finalLeverage;
    }
    getStopLossPercentage() {
        return this.config.stopLossPercentage[this.currentThreshold];
    }
}
exports.default = RiskAgent;
//# sourceMappingURL=riskAgent.js.map