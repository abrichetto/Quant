"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CustomMACD {
    calculate(data, { fastPeriod = 12, slowPeriod = 26, signalPeriod = 9 } = {}) {
        if (data.length < slowPeriod) {
            throw new Error('Data length must be greater than or equal to the slow period.');
        }
        const slowEMA = this.ema(data, slowPeriod);
        const fastEMA = this.ema(data, fastPeriod);
        const macd = fastEMA.map((value, index) => value - slowEMA[index]);
        const signal = this.ema(macd.slice(slowPeriod - 1), signalPeriod);
        const histogram = macd.slice(slowPeriod - 1).map((value, index) => value - signal[index]);
        return { macd: macd.slice(slowPeriod - 1), signal, histogram };
    }
    ema(data, period) {
        const multiplier = 2 / (period + 1);
        const ema = [];
        const sma = data.slice(0, period).reduce((sum, value) => sum + value, 0) / period;
        ema.push(sma);
        for (let i = period; i < data.length; i++) {
            const value = (data[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1];
            ema.push(value);
        }
        return ema;
    }
}
exports.default = CustomMACD;
//# sourceMappingURL=customMACD.js.map