const EventEmitter = require('events');
const ResearchRepository = require('../../../utils/research-repository');

/**
 * Base class for Portfolio Manager agents
 * These agents simulate the investment decision-making process of real-world
 * investment professionals with different biases and approaches
 */
class PortfolioManagerAgent extends EventEmitter {
  constructor(config = {}) {
    super();
    this.repository = config.repository || new ResearchRepository();
    this.name = 'Generic Portfolio Manager';
    this.bias = 0; // -100 to 100 scale (bearish to bullish)
    this.riskTolerance = 50; // 0-100 scale
    this.timeHorizon = 'medium'; // short, medium, long
    this.focusAreas = []; // specific sectors, technologies, etc.
    this.signalThreshold = 50; // minimum confidence to consider
    this.config = config;
  }
  
  /**
   * Evaluate a signal based on this manager's investment philosophy
   * @param {Object} signal - The signal to evaluate
   * @returns {Object} Evaluation with recommendation and confidence
   */
  evaluateSignal(signal) {
    // Base implementation - should be overridden by specific managers
    return {
      recommendation: 'NEUTRAL',
      confidence: 0,
      reasoning: []
    };
  }
  
  /**
   * Evaluate technical aspects of a signal
   * @protected
   */
  _evaluateTechnical(signal) {
    // Base implementation
    return { score: 0, reasoning: [] };
  }
  
  /**
   * Evaluate fundamental aspects of a signal
   * @protected
   */
  _evaluateFundamental(signal) {
    // Base implementation
    return { score: 0, reasoning: [] };
  }
  
  /**
   * Evaluate sentiment aspects of a signal
   * @protected
   */
  _evaluateSentiment(signal) {
    // Base implementation
    return { score: 0, reasoning: [] };
  }
  
  /**
   * Process historical context for this signal
   * @protected
   */
  _getHistoricalContext(signal) {
    // Base implementation
    return { relevantHistory: [], trendAlignment: 0 };
  }
}

/**
 * Orchestrates the decision-making process between multiple portfolio managers
 */
class PortfolioManagerConsensus {
  constructor(config = {}) {
    this.repository = config.repository || new ResearchRepository();
    this.managers = [];
    this.requiredConsensus = config.requiredConsensus || 0.6; // 60% agreement
    this.voteThreshold = config.voteThreshold || 0.65; // 65% confidence
    
    // Strategy for consensus
    this.consensusStrategy = config.consensusStrategy || 'weightedMajority';
  }
  
  /**
   * Register a portfolio manager
   * @param {PortfolioManagerAgent} manager - The manager to add
   * @param {number} weight - Voting weight (0-100)
   */
  registerManager(manager, weight = 100) {
    this.managers.push({
      agent: manager,
      weight: weight / 100
    });
  }
  
  /**
   * Process a signal through all portfolio managers
   * @param {Object} signal - The signal to evaluate
   * @returns {Object} Consensus decision with reasoning
   */
  async processSignal(signal) {
    console.log(`Portfolio Manager Consensus processing signal for ${signal.symbol}`);
    
    const evaluations = [];
    const discussions = [];
    
    // Get evaluations from each manager
    for (const manager of this.managers) {
      try {
        const evaluation = manager.agent.evaluateSignal(signal);
        evaluations.push({
          manager: manager.agent.name,
          weight: manager.weight,
          recommendation: evaluation.recommendation,
          confidence: evaluation.confidence,
          reasoning: evaluation.reasoning
        });
        
        // Add to discussion points
        discussions.push(...evaluation.reasoning.map(point => ({
          manager: manager.agent.name,
          point,
          bias: manager.agent.bias
        })));
        
      } catch (error) {
        console.error(`Error getting evaluation from ${manager.agent.name}:`, error);
      }
    }
    
    // Calculate weighted consensus
    const consensus = this._calculateConsensus(evaluations);
    
    // Store the consensus discussion in the repository
    this._storeConsensus(signal, evaluations, consensus);
    
    return {
      signal: signal.symbol,
      originalSignal: signal.overall_signal,
      consensusSignal: consensus.weightedSignal,
      recommendation: consensus.finalRecommendation,
      confidence: consensus.confidence,
      discussions,
      managersInAgreement: consensus.agreement,
      requiresHumanReview: consensus.confidence < 0.5,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Calculate consensus from manager evaluations
   * @private
   */
  _calculateConsensus(evaluations) {
    // Map recommendations to numeric values
    const numericValues = {
      'STRONG_BUY': 100,
      'BUY': 75,
      'WEAK_BUY': 25,
      'NEUTRAL': 0,
      'WEAK_SELL': -25,
      'SELL': -75,
      'STRONG_SELL': -100
    };
    
    // Calculate weighted signal
    let weightedSignalSum = 0;
    let totalWeight = 0;
    let strongBuy = 0;
    let buy = 0;
    let neutral = 0;
    let sell = 0;
    let strongSell = 0;
    
    evaluations.forEach(eval => {
      // Only include high confidence evaluations
      if (eval.confidence >= this.voteThreshold) {
        const signalValue = numericValues[eval.recommendation] || 0;
        weightedSignalSum += signalValue * eval.weight;
        totalWeight += eval.weight;
        
        // Count recommendations
        if (signalValue >= 75) strongBuy += eval.weight;
        else if (signalValue >= 25) buy += eval.weight;
        else if (signalValue > -25) neutral += eval.weight;
        else if (signalValue > -75) sell += eval.weight;
        else strongSell += eval.weight;
      }
    });
    
    // Get weighted signal
    const weightedSignal = totalWeight > 0 ? weightedSignalSum / totalWeight : 0;
    
    // Determine final recommendation
    let finalRecommendation = 'NEUTRAL';
    if (weightedSignal >= 75) finalRecommendation = 'STRONG_BUY';
    else if (weightedSignal >= 25) finalRecommendation = 'BUY';
    else if (weightedSignal > -25) finalRecommendation = 'NEUTRAL';
    else if (weightedSignal > -75) finalRecommendation = 'SELL';
    else finalRecommendation = 'STRONG_SELL';
    
    // Calculate agreement percentage 
    const topRecommendation = Math.max(strongBuy, buy, neutral, sell, strongSell);
    const agreement = totalWeight > 0 ? topRecommendation / totalWeight : 0;
    
    // Calculate confidence based on agreement and evaluation confidences
    const averageConfidence = evaluations.reduce((sum, eval) => sum + eval.confidence, 0) / evaluations.length;
    const confidence = (agreement + averageConfidence) / 2;
    
    return {
      weightedSignal,
      finalRecommendation,
      agreement,
      confidence
    };
  }
  
  /**
   * Store consensus decision in repository
   * @private
   */
  _storeConsensus(signal, evaluations, consensus) {
    const data = {
      timestamp: new Date().toISOString(),
      symbol: signal.symbol,
      originalSignal: signal,
      managerEvaluations: evaluations,
      consensus: consensus,
      finalRecommendation: consensus.finalRecommendation,
      confidence: consensus.confidence
    };
    
    this.repository.storeResearch(
      `Portfolio Manager Consensus - ${signal.symbol}`,
      'analysis',
      data,
      {
        type: 'portfolio_manager_consensus',
        symbol: signal.symbol,
        recommendation: consensus.finalRecommendation,
        timestamp: data.timestamp
      }
    );
  }
}

module.exports = {
  PortfolioManagerAgent,
  PortfolioManagerConsensus
};