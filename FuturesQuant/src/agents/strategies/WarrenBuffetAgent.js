/**
 * WarrenBuffetAgent.js
 * Agent that emulates Warren Buffet's value investing strategy
 * Created: 2025-03-28
 * Author: abrichetto
 */

const SignalAgent = require('../base/SignalAgent');
const IndicatorManager = require('../../core/indicator/manager');

class WarrenBuffetAgent extends SignalAgent {
  constructor(config = {}) {
    super('WarrenBuffet', config);
    this.marginOfSafety = config.marginOfSafety || 0.3; // 30% discount to intrinsic value
    this.minimumMoat = config.minimumMoat || 0.6;       // Economic moat threshold
    this.longTermFocus = config.longTermFocus || true;  // Focus on long-term investments
    this.indicatorManager = new IndicatorManager();
  }
  
  async initialize() {
    await super.initialize();
    this.logger.info(`WarrenBuffet agent initialized with margin of safety: ${this.marginOfSafety * 100}%`);
    return true;
  }
  
  /**
   * Calculates intrinsic value of a stock based on fundamentals
   * @param {Object} stockData - Fundamental data for valuation
   * @returns {number} Estimated intrinsic value
   */
  calculateIntrinsicValue(stockData) {
    // This would be a sophisticated DCF or other valuation model
    // Simplified version for illustration
    const earningsGrowth = stockData.earnings.growth || 0.05;
    const currentEarnings = stockData.earnings.current || 0;
    const pe = stockData.ratios.pe || 15;
    
    // Basic intrinsic value calculation
    const growthAdjustment = 1 + (earningsGrowth * 10); // 10-year outlook
    const intrinsicValue = currentEarnings * pe * growthAdjustment;
    
    return intrinsicValue;
  }
  
  /**
   * Evaluates the economic moat (competitive advantage) of a company
   * @param {Object} companyData - Data about the company's business
   * @returns {number} Moat score between 0 and 1
   */
  evaluateMoat(companyData) {
    // Factors that contribute to a moat
    const factors = {
      brandStrength: companyData.brandStrength || 0,
      marketShare: companyData.marketShare || 0,
      switchingCosts: companyData.switchingCosts || 0,
      networkEffects: companyData.networkEffects || 0,
      costAdvantages: companyData.costAdvantages || 0
    };
    
    // Calculate weighted average
    const weights = {
      brandStrength: 0.2,
      marketShare: 0.2,
      switchingCosts: 0.2,
      networkEffects: 0.2,
      costAdvantages: 0.2
    };
    
    let moatScore = 0;
    let totalWeight = 0;
    
    for (const [factor, value] of Object.entries(factors)) {
      moatScore += value * weights[factor];
      totalWeight += weights[factor];
    }
    
    return totalWeight > 0 ? moatScore / totalWeight : 0;
  }
  
  /**
   * Process market data to generate value investment signals
   */
  async process() {
    this.logger.info('WarrenBuffet agent processing market data');
    
    while (this.isRunning) {
      try {
        // In a real implementation, this would fetch actual market data
        const mockStocks = this.getMockStockData();
        
        for (const stock of mockStocks) {
          const intrinsicValue = this.calculateIntrinsicValue(stock);
          const moatScore = this.evaluateMoat(stock);
          
          // Calculate margin of safety
          const currentPrice = stock.price;
          const discount = (intrinsicValue - currentPrice) / intrinsicValue;
          
          let action = 'NEUTRAL';
          let confidence = 0;
          
          if (discount >= this.marginOfSafety && moatScore >= this.minimumMoat) {
            action = 'BUY';
            confidence = Math.min(discount, 0.9); // Cap confidence at 90%
          }
          
          if (action !== 'NEUTRAL') {
            this.generateSignal({
              symbol: stock.symbol,
              action,
              confidence,
              intrinsicValue,
              currentPrice,
              discount: discount * 100, // Convert to percentage
              moatScore,
              rationale: `${stock.symbol} trading at ${discount.toFixed(2) * 100}% discount to intrinsic value with strong economic moat`
            });
          }
        }
        
        // Wait before next processing cycle (longer for Warren Buffet style - less frequent trades)
        await new Promise(resolve => setTimeout(resolve, 120000));
      } catch (error) {
        this.logger.error(`Error in WarrenBuffet agent processing: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait before retry
      }
    }
  }
  
  /**
   * Mock method to generate sample stock data
   * In production, this would be replaced with real data source
   */
  getMockStockData() {
    return [
      {
        symbol: 'CONS',
        price: 210.75,
        earnings: {
          current: 15.42,
          growth: 0.08
        },
        ratios: {
          pe: 13.7,
          pb: 2.3,
          roe: 0.18
        },
        brandStrength: 0.85,
        marketShare: 0.42,
        switchingCosts: 0.3,
        networkEffects: 0.2,
        costAdvantages: 0.7
      },
      {
        symbol: 'BNKG',
        price: 320.15,
        earnings: {
          current: 22.50,
          growth: 0.06
        },
        ratios: {
          pe: 14.2,
          pb: 1.8,
          roe: 0.13
        },
        brandStrength: 0.75,
        marketShare: 0.28,
        switchingCosts: 0.8,
        networkEffects: 0.5,
        costAdvantages: 0.4
      }
    ];
  }

  /**
   * Decides trade action based on indicator signals
   * @param {Object} data - Market data for decision making
   * @returns {Object} Trade decision with action and confidence
   */
  async decideTrade(data) {
    const scalpingSignal = this.indicatorManager.calculate("Scalping", data);
    const superTrendAISignal = this.indicatorManager.calculate("SuperTrendAI", data);

    if (scalpingSignal === "Reversal" && superTrendAISignal === "BUY") {
      return { action: "BUY", confidence: 0.8 };
    } else if (scalpingSignal === "Reversal" && superTrendAISignal === "SELL") {
      return { action: "SELL", confidence: 0.8 };
    }
    return { action: "HOLD", confidence: 0 };
  }
}

module.exports = WarrenBuffetAgent;