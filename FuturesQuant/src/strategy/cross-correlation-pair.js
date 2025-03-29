/**
 * Cross Correlation Pair indicator implementation
 * Calculates correlation between two assets and generates trading signals based on correlation strength and divergence
 */

class CrossCorrelationPair {
    constructor(options = {}) {
        // Default settings
        this.lookbackPeriod = options.lookbackPeriod || 20;
        this.correlationThreshold = options.correlationThreshold || 0.7;
        this.divergenceThreshold = options.divergenceThreshold || 0.2;
        
        // Initialize storage
        this.data = [];
        this.historicalCorrelation = [];
        this.historicalSpread = [];
    }
    
    update(candleData) {
        // Add candle data to history
        this.data.push(candleData);
        
        // Keep only recent history
        if (this.data.length > this.lookbackPeriod) {
            this.data.shift();
        }
        
        if (this.data.length < this.lookbackPeriod) {
            return {
                correlation: 0,
                spread: 0,
                signal: null,
                strength: 0
            };
        }
        
        // Calculate returns
        const returns1 = this.calculateReturns(this.data.map(d => d.asset1));
        const returns2 = this.calculateReturns(this.data.map(d => d.asset2));
        
        // Calculate correlation
        const correlation = this.calculateCorrelation(returns1, returns2);
        
        // Calculate spread
        const spread = this.data[this.data.length - 1].asset1 - this.data[this.data.length - 1].asset2;
        
        // Store historical values
        this.historicalCorrelation.push(correlation);
        this.historicalSpread.push(spread);
        
        // Keep only recent history
        if (this.historicalCorrelation.length > this.lookbackPeriod) {
            this.historicalCorrelation.shift();
            this.historicalSpread.shift();
        }
        
        // Generate signals based on correlation and divergence
        let signal = null;
        let strength = 0;
        
        if (Math.abs(correlation) >= this.correlationThreshold) {
            // Calculate spread z-score
            const spreadMean = this.calculateMean(this.historicalSpread);
            const spreadStd = this.calculateStandardDeviation(this.historicalSpread);
            const spreadZscore = (spread - spreadMean) / spreadStd;
            
            // Detect divergence
            if (Math.abs(spreadZscore) >= this.divergenceThreshold) {
                if (spreadZscore > 0) {
                    signal = 'SELL';  // Asset1 is overvalued relative to Asset2
                } else {
                    signal = 'BUY';   // Asset1 is undervalued relative to Asset2
                }
                
                // Calculate signal strength based on correlation and divergence
                strength = Math.min(Math.abs(correlation), Math.abs(spreadZscore));
            }
        }
        
        return {
            correlation,
            spread,
            signal,
            strength
        };
    }
    
    calculateReturns(prices) {
        const returns = [];
        for (let i = 1; i < prices.length; i++) {
            returns.push((prices[i] - prices[i-1]) / prices[i-1]);
        }
        return returns;
    }
    
    calculateCorrelation(returns1, returns2) {
        const mean1 = this.calculateMean(returns1);
        const mean2 = this.calculateMean(returns2);
        
        let numerator = 0;
        let denominator1 = 0;
        let denominator2 = 0;
        
        for (let i = 0; i < returns1.length; i++) {
            const diff1 = returns1[i] - mean1;
            const diff2 = returns2[i] - mean2;
            
            numerator += diff1 * diff2;
            denominator1 += diff1 * diff1;
            denominator2 += diff2 * diff2;
        }
        
        return numerator / Math.sqrt(denominator1 * denominator2);
    }
    
    calculateMean(values) {
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }
    
    calculateStandardDeviation(values) {
        const mean = this.calculateMean(values);
        const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
        return Math.sqrt(this.calculateMean(squaredDiffs));
    }
    
    getHistoricalValues() {
        return {
            correlation: this.historicalCorrelation,
            spread: this.historicalSpread
        };
    }
}

module.exports = CrossCorrelationPair; 