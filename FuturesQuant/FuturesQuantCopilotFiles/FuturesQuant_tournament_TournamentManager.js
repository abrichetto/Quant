/**
 * TournamentManager
 * 
 * Manages the tournament for portfolio agents.
 * Ensures all agents receive the same indicator data.
 */

const { EventEmitter } = require('events');
const SMAIndicator = require('../indicators/SMAIndicator'); // Assuming an SMA indicator module

class TournamentManager extends EventEmitter {
  constructor(config = {}) {
    super();
    this.agents = config.agents || [];
    this.indicator = new SMAIndicator(config.indicatorConfig || { period: 14 });
    this.results = [];
  }

  /**
   * Distribute indicator data to all agents
   */
  distributeIndicatorData() {
    const indicatorData = this.indicator.calculate();
    this.agents.forEach(agent => {
      agent.receiveIndicatorData(indicatorData);
    });
  }

  /**
   * Track and compare agent performance
   */
  trackPerformance() {
    this.agents.forEach(agent => {
      const performance = agent.evaluatePerformance();
      this.results.push({
        agentName: agent.name,
        profit: performance.profit,
        drawdown: performance.drawdown
      });
    });
  }

  /**
   * Determine the winner based on performance
   */
  determineWinner() {
    const winner = this.results.reduce((best, current) => {
      if (current.profit > best.profit && current.drawdown < best.drawdown) {
        return current;
      }
      return best;
    }, { profit: -Infinity, drawdown: Infinity });

    console.log(`Winner: ${winner.agentName} with profit: ${winner.profit} and drawdown: ${winner.drawdown}`);
  }

  /**
   * Start the tournament
   */
  async startTournament() {
    this.distributeIndicatorData();
    await new Promise(resolve => setTimeout(resolve, 60000)); // Simulate time for agents to process data
    this.trackPerformance();
    this.determineWinner();
  }
}

module.exports = TournamentManager;