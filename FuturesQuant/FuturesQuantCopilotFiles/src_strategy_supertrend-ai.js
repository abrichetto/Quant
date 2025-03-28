/**
 * SuperTrend AI (Clustering) strategy implementation
 * Based on LuxAlgo's SuperTrend AI indicator
 */

class SuperTrendAI {
  constructor(options = {}) {
    // Default settings (matching the Pine Script)
    this.length = options.length || 10;
    this.minMult = options.minMult || 1;
    this.maxMult = options.maxMult || 5;
    this.step = options.step || 0.5;
    this.perfAlpha = options.perfAlpha || 10;
    this.fromCluster = options.fromCluster || 'Best'; // 'Best', 'Average', 'Worst'
    
    // Initialize storage
    this.data = [];
    this.supertrendVariants = [];
    this.initializeSupertrends();
    
    // Signal and state tracking
    this.signalGenerated = false;
    this.currentSignal = null;
    this.targetFactor = null;
    this.os = 0; // Trend direction (0 = down, 1 = up)
    this.ts = null; // Current trailing stop level
    this.perfAma = null; // AMA of the trailing stop
  }

  initializeSupertrends() {
    // Create supertrend variants for each factor in the range
    const factorCount = Math.floor((this.maxMult - this.minMult) / this.step) + 1;
    
    for (let i = 0; i < factorCount; i++) {
      const factor = this.minMult + i * this.step;
      this.supertrendVariants.push({
        factor,
        upper: null,
        lower: null,
        output: null,
        perf: 0,
        trend: 0
      });
    }
  }

  calculateATR(high, low, close) {
    if (this.data.length < this.length + 1) {
      return null;
    }
    
    let sum = 0;
    for (let i = 1; i <= this.length; i++) {
      const idx = this.data.length - i;
      const tr = Math.max(
        this.data[idx].high - this.data[idx].low,
        Math.abs(this.data[idx].high - this.data[idx - 1].close),
        Math.abs(this.data[idx].low - this.data[idx - 1].close)
      );
      sum += tr;
    }
    
    return sum / this.length;
  }

  // K-means clustering implementation
  applyClustering(data, factorArray) {
    // Intitalize centroids using quartiles
    const sortedData = [...data].sort((a, b) => a - b);
    const centroids = [
      sortedData[Math.floor(sortedData.length * 0.25)], // 25th percentile
      sortedData[Math.floor(sortedData.length * 0.5)],  // 50th percentile
      sortedData[Math.floor(sortedData.length * 0.75)]  // 75th percentile
    ];
    
    // Initialize clusters
    let factorsClusters = [[], [], []];
    let perfClusters = [[], [], []];
    
    // Maximum iterations for k-means
    const maxIter = 1000;
    
    for (let iter = 0; iter < maxIter; iter++) {
      factorsClusters = [[], [], []];
      perfClusters = [[], [], []];
      
      // Assign value to cluster
      for (let i = 0; i < data.length; i++) {
        const value = data[i];
        const distances = centroids.map(centroid => Math.abs(value - centroid));
        const minDistance = Math.min(...distances);
        const clusterIndex = distances.indexOf(minDistance);
        
        perfClusters[clusterIndex].push(value);
        factorsClusters[clusterIndex].push(factorArray[i]);
      }
      
      // Update centroids
      const newCentroids = perfClusters.map(cluster => 
        cluster.length > 0 ? 
          cluster.reduce((sum, val) => sum + val, 0) / cluster.length : 
          0
      );
      
      // Test if centroids changed
      if (
        newCentroids[0] === centroids[0] && 
        newCentroids[1] === centroids[1] && 
        newCentroids[2] === centroids[2]
      ) {
        break;
      }
      
      centroids[0] = newCentroids[0];
      centroids[1] = newCentroids[1];
      centroids[2] = newCentroids[2];
    }
    
    return { factorsClusters, perfClusters, centroids };
  }

  // Get average value from array
  avg(arr) {
    if (arr.length === 0) return 0;
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
  }

  update(candleData) {
    // Add candle data to history
    this.data.push(candleData);
    
    const { high, low, close } = candleData;
    const prevClose = this.data.length > 1 ? this.data[this.data.length - 2].close : close;
    const hl2 = (high + low) / 2;
    
    // Calculate ATR
    const atr = this.calculateATR(high, low, close);
    if (!atr) return null; // Not enough data yet
    
    // Calculate Supertrend for each variant
    for (let i = 0; i < this.supertrendVariants.length; i++) {
      const st = this.supertrendVariants[i];
      
      // Initialize on first update
      if (st.upper === null) {
        st.upper = hl2;
        st.lower = hl2;
        st.output = hl2;
        continue;
      }
      
      // Calculate new bands
      const up = hl2 + atr * st.factor;
      const dn = hl2 - atr * st.factor;
      
      // Update trend direction
      if (close > st.upper) {
        st.trend = 1;
      } else if (close < st.lower) {
        st.trend = 0;
      }
      
      // Update bands based on trend
      st.upper = prevClose < st.upper ? Math.min(up, st.upper) : up;
      st.lower = prevClose > st.lower ? Math.max(dn, st.lower) : dn;
      
      // Calculate performance
      const diff = Math.sign(prevClose - st.output);
      st.perf += 2/(this.perfAlpha+1) * ((close - prevClose) * diff - st.perf);
      
      // Set output value based on trend
      st.output = st.trend === 1 ? st.lower : st.upper;
    }
    
    // Prepare data for clustering
    const perfData = this.supertrendVariants.map(st => st.perf);
    const factorArray = this.supertrendVariants.map(st => st.factor);
    
    // Apply K-means clustering
    const { factorsClusters, perfClusters } = this.applyClustering(perfData, factorArray);
    
    // Determine cluster index based on user preference
    let clusterIndex;
    switch(this.fromCluster) {
      case 'Best':
        clusterIndex = 2;
        break;
      case 'Average':
        clusterIndex = 1;
        break;
      case 'Worst':
        clusterIndex = 0;
        break;
      default:
        clusterIndex = 2; // Default to Best
    }
    
    // Get target factor from selected cluster
    this.targetFactor = this.avg(factorsClusters[clusterIndex]);
    
    // Calculate performance index
    const den = this.calculateEMA(Math.abs(close - prevClose), this.perfAlpha);
    const perfIdx = Math.max(this.avg(perfClusters[clusterIndex]), 0) / den;
    
    // Calculate new supertrend with target factor
    const upper = this.data.length > 1 ? this.ts || hl2 : hl2;
    const lower = upper;
    
    const up = hl2 + atr * this.targetFactor;
    const dn = hl2 - atr * this.targetFactor;
    
    const newUpper = prevClose < upper ? Math.min(up, upper) : up;
    const newLower = prevClose > lower ? Math.max(dn, lower) : dn;
    
    // Update trend direction
    const prevOs = this.os;
    if (close > newUpper) {
      this.os = 1;
    } else if (close < newLower) {
      this.os = 0;
    }
    
    // Set trailing stop
    this.ts = this.os ? newLower : newUpper;
    
    // Calculate trailing stop AMA
    if (this.perfAma === null) {
      this.perfAma = this.ts;
    } else {
      this.perfAma += perfIdx * (this.ts - this.perfAma);
    }
    
    // Generate signals
    this.signalGenerated = false;
    this.currentSignal = null;
    
    if (this.os !== prevOs) {
      this.signalGenerated = true;
      this.currentSignal = {
        direction: this.os === 1 ? 'BUY' : 'SELL',
        price: close,
        strength: Math.floor(perfIdx * 10),
        trailingStop: this.ts,
        timestamp: new Date()
      };
    }
    
    return {
      trend: this.os === 1 ? 'UP' : 'DOWN',
      trailingStop: this.ts,
      adaptiveMA: this.perfAma,
      signal: this.currentSignal,
      perfIndex: perfIdx
    };
  }
  
  // Simple EMA calculation
  calculateEMA(value, period) {
    if (!this._emaValues) {
      this._emaValues = {};
    }
    
    if (!this._emaValues[period]) {
      this._emaValues[period] = value;
      return value;
    }
    
    const k = 2 / (period + 1);
    this._emaValues[period] = (value * k) + (this._emaValues[period] * (1 - k));
    return this._emaValues[period];
  }
  
  // Check if we have a new signal
  hasSignal() {
    return this.signalGenerated;
  }
  
  // Get current signal
  getSignal() {
    return this.currentSignal;
  }
  
  // Get current trend
  getTrend() {
    return this.os === 1 ? 'UP' : 'DOWN';
  }
}

module.exports = SuperTrendAI;