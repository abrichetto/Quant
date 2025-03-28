/**
 * LeverageAgent
 * 
 * Manages leverage for trades based on consensus among portfolio managers
 * and risk assessment. Determines optimal leverage for maximizing profit
 * while maintaining acceptable risk levels.
 */

import BaseAgent from './BaseAgent';

class LeverageAgent extends BaseAgent {
  constructor(config = {}) {
    super({
      name: 'Leverage Manager',
      description: 'Manages optimal leverage for trades based on consensus and risk',
      ...config
    });

    // Leverage settings
    this.settings = {
      minLeverage: config.minLeverage || 1.0,
      maxLeverage: config.maxLeverage || 10.0,
      defaultLeverage: config.defaultLeverage || 1.0,
      highConfidenceThreshold: config.highConfidenceThreshold || 0.8,
      consensusThreshold: config.consensusThreshold || 0.75, // % of agents that must agree
      riskMultiplier: config.riskMultiplier || 1.0 // Adjust risk tolerance
    };

    // Keep track of portfolio manager opinions
    this.managerOpinions = {};

    // Reference to risk agent
    this.riskAgent = config.riskAgent || null;

    // Current state
    this.currentLeverage = this.settings.defaultLeverage;
  }

  /**
   * Set the risk agent reference
   * @param {RiskAgent} riskAgent - Risk agent instance
   */
  setRiskAgent(riskAgent) {
    this.riskAgent = riskAgent;
    console.log("LeverageAgent: Risk agent connection established");
  }

  /**
   * Register a portfolio manager's opinion on a trading opportunity
   * @param {string} managerName - Name of the portfolio manager
   * @param {Object} opinion - Manager's analysis and confidence
   */
  registerManagerOpinion(managerName, opinion) {
    this.managerOpinions[managerName] = {
      sentiment: opinion.sentiment || 'neutral',
      confidence: opinion.confidence || 0.5,
      timestamp: Date.now()
    };

    console.log(`LeverageAgent: Registered ${managerName}'s opinion - ${opinion.sentiment} with ${opinion.confidence.toFixed(2)} confidence`);
  }

  /**
   * Clear opinions that are older than the specified time
   * @param {number} maxAgeMs - Maximum age in milliseconds
   */
  clearStaleOpinions(maxAgeMs = 3600000) { // Default 1 hour
    const now = Date.now();
    Object.keys(this.managerOpinions).forEach(manager => {
      if (now - this.managerOpinions[manager].timestamp > maxAgeMs) {
        delete this.managerOpinions[manager];
      }
    });
  }

  /**
   * Analyze manager opinions and calculate consensus
   * @returns {Object} - Consensus analysis
   */
  analyzeConsensus() {
    // Clear stale opinions first
    this.clearStaleOpinions();

    const managers = Object.keys(this.managerOpinions);
    if (managers.length === 0) {
      return {
        hasConsensus: false,
        direction: 'neutral',
        averageConfidence: 0,
        consensusPercentage: 0,
        count: 0
      };
    }

    // Count sentiments
    let bullCount = 0;
    let bearCount = 0;
    let totalConfidence = 0;

    managers.forEach(manager => {
      const opinion = this.managerOpinions[manager];
      totalConfidence += opinion.confidence;

      if (opinion.sentiment === 'bullish') {
        bullCount++;
      } else if (opinion.sentiment === 'bearish') {
        bearCount++;
      }
    });

    // Calculate consensus
    const totalManagers = managers.length;
    const bullPercentage = bullCount / totalManagers;
    const bearPercentage = bearCount / totalManagers;
    const averageConfidence = totalConfidence / totalManagers;

    // Determine if we have consensus and in which direction
    let hasConsensus = false;
    let direction = 'neutral';
    let consensusPercentage = 0;

    if (bullPercentage >= this.settings.consensusThreshold) {
      hasConsensus = true;
      direction = 'bullish';
      consensusPercentage = bullPercentage;
    } else if (bearPercentage >= this.settings.consensusThreshold) {
      hasConsensus = true;
      direction = 'bearish';
      consensusPercentage = bearPercentage;
    }

    return {
      hasConsensus,
      direction,
      averageConfidence,
      consensusPercentage,
      count: totalManagers
    };
  }

  /**
   * Calculate the optimal leverage based on consensus and risk assessment
   * @param {Object} marketData - Current market data
   * @param {Object} tradeParams - Trade parameters
   * @returns {Object} - Leverage recommendation
   */
  calculateOptimalLeverage(marketData, tradeParams) {
    // Get consensus analysis
    const consensus = this.analyzeConsensus();

    // If no consensus or not enough data, use default leverage
    if (!consensus.hasConsensus || consensus.count < 2) {
      return {
        leverage: this.settings.defaultLeverage,
        reason: "Insufficient consensus among portfolio managers",
        details: consensus
      };
    }

    // Use risk agent to assess risk
    const riskAssessment = this.riskAgent.assessTrade(tradeParams, marketData, consensus.averageConfidence);

    // Adjust leverage based on risk
    const adjustedLeverage = Math.min(
      this.settings.maxLeverage,
      Math.max(this.settings.minLeverage, riskAssessment.recommendedLeverage)
    );

    return {
      leverage: adjustedLeverage,
      reason: `Consensus direction: ${consensus.direction}, average confidence: ${consensus.averageConfidence.toFixed(2)}`,
      details: consensus,
      riskAssessment
    };
  }
}

export default LeverageAgent;