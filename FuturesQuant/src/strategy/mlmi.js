/**
 * Machine Learning Momentum Index (MLMI) implementation
 * Based on Zeiierman's Pine Script implementation
 */

class MLMI {
    constructor(options = {}) {
        // Default settings
        this.numNeighbors = options.numNeighbors || 200;
        this.momentumWindow = options.momentumWindow || 20;
        
        // Initialize data storage
        this.parameter1 = [];  // RSI slow
        this.parameter2 = [];  // RSI quick
        this.priceArray = [];
        this.resultArray = [];
    }
    
    update(candleData) {
        // Add candle data to history
        this.data.push(candleData);
        
        // Keep only recent history
        if (this.data.length > this.momentumWindow) {
            this.data.shift();
        }
        
        if (this.data.length < this.momentumWindow) {
            return {
                prediction: 0,
                prediction_ma: 0,
                upper: 0,
                lower: 0,
                upper_: 0,
                lower_: 0,
                signal: null
            };
        }
        
        // Calculate moving averages and RSI
        const maQuick = this.calculateWMA(this.data.map(d => d.close), 5);
        const maSlow = this.calculateWMA(this.data.map(d => d.close), 20);
        
        const rsiQuick = this.calculateWMA(this.calculateRSI(this.data.map(d => d.close), 5), this.momentumWindow);
        const rsiSlow = this.calculateWMA(this.calculateRSI(this.data.map(d => d.close), 20), this.momentumWindow);
        
        // Check for crossovers
        const pos = this.crossover(maQuick, maSlow);
        const neg = this.crossunder(maQuick, maSlow);
        
        // Store previous trade data if crossover occurs
        if (pos || neg) {
            this.storePreviousTrade(rsiSlow, rsiQuick);
        }
        
        // Calculate prediction
        const prediction = this.knnPredict(rsiSlow, rsiQuick);
        const predictionMA = this.calculateWMA([prediction], 20);
        
        // Calculate channels
        const upper = Math.max(...this.resultArray);
        const lower = Math.min(...this.resultArray);
        const stdDev = this.calculateEMA(this.calculateStd([prediction], 20), 20);
        
        const upper_ = upper - stdDev;
        const lower_ = lower + stdDev;
        
        // Generate signal based on crossovers
        let signal = null;
        if (prediction > upper_) {
            signal = 'SELL';
        } else if (prediction < lower_) {
            signal = 'BUY';
        }
        
        return {
            prediction,
            prediction_ma: predictionMA,
            upper,
            lower,
            upper_,
            lower_,
            signal
        };
    }
    
    storePreviousTrade(p1, p2) {
        if (this.parameter1.length > 0) {
            this.parameter1.push(this.parameter1[this.parameter1.length - 1]);
            this.parameter2.push(this.parameter2[this.parameter2.length - 1]);
            this.priceArray.push(this.priceArray[this.priceArray.length - 1]);
            this.resultArray.push(
                this.priceArray[this.priceArray.length - 1] >= this.priceArray[this.priceArray.length - 2] ? 1 : -1
            );
        }
        
        this.parameter1.push(p1);
        this.parameter2.push(p2);
        this.priceArray.push(this.priceArray.length > 0 ? this.priceArray[this.priceArray.length - 1] : 0);
    }
    
    knnPredict(p1, p2) {
        if (this.parameter1.length < 2) {
            return 0;
        }
        
        // Calculate distances
        const distances = this.parameter1.map((param1, i) => {
            const param2 = this.parameter2[i];
            return Math.sqrt(
                Math.pow(p1 - param1, 2) + 
                Math.pow(p2 - param2, 2)
            );
        });
        
        // Get k nearest neighbors
        const k = Math.min(this.numNeighbors, distances.length);
        const sortedIndices = distances
            .map((dist, i) => ({ dist, i }))
            .sort((a, b) => a.dist - b.dist)
            .slice(0, k)
            .map(item => item.i);
            
        const neighbors = sortedIndices.map(i => this.resultArray[i]);
        
        return neighbors.reduce((sum, val) => sum + val, 0);
    }
    
    calculateWMA(data, period) {
        const weights = Array.from({ length: period }, (_, i) => i + 1);
        const sum = weights.reduce((a, b) => a + b, 0);
        
        let result = 0;
        for (let i = 0; i < period; i++) {
            result += data[data.length - 1 - i] * weights[i];
        }
        
        return result / sum;
    }
    
    calculateRSI(data, period) {
        const deltas = [];
        for (let i = 1; i < data.length; i++) {
            deltas.push(data[i] - data[i - 1]);
        }
        
        const gains = deltas.map(d => d > 0 ? d : 0);
        const losses = deltas.map(d => d < 0 ? -d : 0);
        
        const avgGain = this.calculateWMA(gains, period);
        const avgLoss = this.calculateWMA(losses, period);
        
        const rs = avgGain / avgLoss;
        return 100 - (100 / (1 + rs));
    }
    
    calculateEMA(data, period) {
        const k = 2 / (period + 1);
        let ema = data[0];
        
        for (let i = 1; i < data.length; i++) {
            ema = data[i] * k + ema * (1 - k);
        }
        
        return ema;
    }
    
    calculateStd(data, period) {
        const mean = this.calculateMean(data);
        const squaredDiffs = data.map(val => Math.pow(val - mean, 2));
        return Math.sqrt(this.calculateMean(squaredDiffs));
    }
    
    calculateMean(values) {
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }
    
    crossover(series1, series2) {
        return series1[series1.length - 1] > series2[series2.length - 1] &&
               series1[series1.length - 2] <= series2[series2.length - 2];
    }
    
    crossunder(series1, series2) {
        return series1[series1.length - 1] < series2[series2.length - 1] &&
               series1[series1.length - 2] >= series2[series2.length - 2];
    }
}

module.exports = MLMI; 