/**
 * RiskAgent
 * 
 * Responsible for assessing trading risks and providing risk scores
 * to influence trading decisions and leverage.
 */

import BaseAgent from './BaseAgent';

class RiskAgent extends BaseAgent {
  constructor(config = {}) {
    super({
      name: 'Risk Manager',
      description: 'Monitors and manages trading risk exposure',
      ...config
    });
    
    // Risk thresholds
    this.riskThresholds = {
      low: 0.3,
      medium: 0.6,
      high: 0.8
    };
    
    // Default risk parameters
    this.params = {
      maxDrawdown: config.maxDrawdown || 0.05, // 5% max drawdown
      volatilityWeight: config.volatilityWeight || 0.25,
      marketCorrelationWeight: config.marketCorrelationWeight || 0.25,
      positionSizeWeight: config.positionSizeWeight || 0.20,
      leverageWeight: config.leverageWeight || 0.30,
      maxPositionSize: config.maxPositionSize || 0.15, // 15% of portfolio per position
      maxLeverage: config.maxLeverage || 5 // Maximum leverage
    };
    
    // Risk factor constants
    this.marketStateFactors = {
      bull: 0.8,  // Lower risk in bull markets
      neutral: 1.0,
      bear: 1.2   // Higher risk in bear markets
    };
    
    this.accountState = {
      balance: 0,
      equity: 0,
      positions: [],
      openRisk: 0
    };
  }
  
  /**
   * Update the account state with current data
   * @param {Object} accountData - Current account information
   */
  updateAccountState(accountData) {
    this.accountState = {
      balance: accountData.balance,
      equity: accountData.equity,
      positions: accountData.positions,
      openRisk: this.calculateOpenPositionsRisk(accountData.positions)
    };
    
    console.log(`RiskAgent: Account state updated. Open risk: ${this.accountState.openRisk.toFixed(2)}`);
  }
  
  /**
   * Calculate risk for open positions
   * @param {Array} positions - List of open positions
   * @returns {number} - Risk value for open positions
   */
  calculateOpenPositionsRisk(positions) {
    if (!positions || positions.length === 0) return 0;
    
    let totalRisk = 0;
    let totalExposure = 0;
    
    for (const position of positions) {
      const positionRisk = position.size * position.leverage / this.accountState.equity;
      totalRisk += positionRisk;
      totalExposure += position.size;
    }
    
    // Normalize risk based on total exposure and portfolio size
    return totalRisk * (totalExposure / this.accountState.equity);
  }
  
  /**
   * Calculate volatility risk based on price data
   * @param {Array} priceData - Historical price data
   * @param {number} window - Window size for calculations
   * @returns {number} - Volatility risk score between 0-1
   */
  calculateVolatilityRisk(priceData, window = 14) {
    if (!priceData || priceData.length < window) {
      return 0.5; // Default if not enough data
    }
    
    // Calculate price returns
    const returns = [];
    for (let i = 1; i < priceData.length; i++) {
      returns.push((priceData[i] - priceData[i-1]) / priceData[i-1]);
    }
    
    // Calculate standard deviation
    const mean = returns.reduce((sum, val) => sum + val, 0) / returns.length;
    const variance = returns.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    
    // Normalize to 0-1 scale (typical daily volatility ranges from 0.5% to 5%)
    return Math.min(stdDev * 20, 1);
  }
  
  /**
   * Calculate market condition risk
   * @param {Object} marketData - Market condition data
   * @returns {number} - Market condition risk factor
   */
  calculateMarketRisk(marketData) {
    const marketState = marketData.trend || 'neutral';
    return this.marketStateFactors[marketState] || 1.0;
  }
  
  /**
   * Calculate maximum safe leverage based on risk assessment
   * @param {Object} assetData - Asset-specific data
   * @param {Object} marketData - Overall market data
   * @param {number} confidence - Signal confidence (0-1)
   * @returns {Object} - Risk assessment including recommended max leverage
   */
  calculateMaxLeverage(assetData, marketData, confidence) {
    // Calculate individual risk components
    const volatilityRisk = this.calculateVolatilityRisk(assetData.prices) * this.params.volatilityWeight;
    const marketRisk = this.calculateMarketRisk(marketData) * this.params.marketCorrelationWeight;
    const positionRisk = (assetData.positionSize / this.params.maxPositionSize) * this.params.positionSizeWeight;
    const currentRisk = this.accountState.openRisk * this.params.leverageWeight;
    
    // Combine risk components
    const totalRisk = volatilityRisk + marketRisk + positionRisk + currentRisk;
    
    // Risk-adjusted confidence
    const riskAdjustedConfidence = confidence * (1 - totalRisk);
    
    // Calculate safe leverage based on risk and confidence
    // Higher confidence and lower risk = higher leverage
    const safeLeverage = Math.min(
      this.params.maxLeverage,
      1 + (this.params.maxLeverage - 1) * riskAdjustedConfidence
    );
    
    // Round to 0.5 step
    const recommendedLeverage = Math.floor(safeLeverage * 2) / 2;
    
    return {
      totalRisk,
      volatilityRisk,
      marketRisk,
      positionRisk,
      currentRisk,
      recommendedLeverage,
      riskLevel: this.getRiskLevel(totalRisk)
    };
  }
  
  /**
   * Get descriptive risk level based on risk score
   * @param {number} riskScore - Numeric risk score (0-1)
   * @returns {string} - Risk level description
   */
  getRiskLevel(riskScore) {
    if (riskScore < this.riskThresholds.low) return 'low';
    if (riskScore < this.riskThresholds.medium) return 'medium';
    if (riskScore < this.riskThresholds.high) return 'high';
    return 'extreme';
  }
  
  /**
   * Analyze a potential trade and provide risk assessment
   * @param {Object} tradeParams - Trade parameters
   * @param {Object} marketData - Current market data
   * @param {number} signalConfidence - Confidence in the signal (0-1)
   * @returns {Object} - Risk assessment and recommendations
   */
  assessTrade(tradeParams, marketData, signalConfidence) {
    // Extract relevant data
    const assetData = {
      positionSize: tradeParams.size / this.accountState.equity,
      prices: marketData.historicalPrices || []
    };
    
    // Calculate risk metrics
    const riskAssessment = this.calculateMaxLeverage(assetData, marketData, signalConfidence);
    
    // Check if trade exceeds risk parameters
    const isSafe = riskAssessment.totalRisk < this.riskThresholds.high;
    
    return {
      ...riskAssessment,
      isSafe,
      message: isSafe ? 
        `Trade is within risk parameters. Recommended leverage: ${riskAssessment.recommendedLeverage}x` : 
        `Trade exceeds risk parameters. Consider reducing position size or leverage.`
    };
  }
}

export default RiskAgent;