/**
 * AgentInterface
 * 
 * Interface that all agents must implement to participate in the tournament.
 */

class AgentInterface {
  constructor(name) {
    this.name = name;
    this.indicatorData = null;
  }

  /**
   * Receive indicator data
   * @param {Object} data - Indicator data
   */
  receiveIndicatorData(data) {
    this.indicatorData = data;
  }

  /**
   * Evaluate performance based on trades
   * @returns {Object} Performance metrics
   */
  evaluatePerformance() {
    // Placeholder for actual implementation
    return {
      profit: Math.random() * 10000,   // Random profit for example
      drawdown: Math.random() * 1000   // Random drawdown for example
    };
  }
}

module.exports = AgentInterface;