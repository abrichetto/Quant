/**
 * ExampleAgent
 * 
 * An example agent that implements the AgentInterface.
 */

const AgentInterface = require('./AgentInterface');

class ExampleAgent extends AgentInterface {
  constructor(config = {}) {
    super(config.name || 'ExampleAgent');
  }

  /**
   * Override receiveIndicatorData to process the data
   * @param {Object} data - Indicator data
   */
  receiveIndicatorData(data) {
    super.receiveIndicatorData(data);
    // Process the indicator data
    console.log(`${this.name} received indicator data:`, data);
  }

  /**
   * Override evaluatePerformance to return actual performance metrics
   * @returns {Object} Performance metrics
   */
  evaluatePerformance() {
    // Placeholder for actual implementation
    const profit = Math.random() * 10000;   // Random profit for example
    const drawdown = Math.random() * 1000;  // Random drawdown for example
    return {
      profit,
      drawdown
    };
  }
}

module.exports = ExampleAgent;