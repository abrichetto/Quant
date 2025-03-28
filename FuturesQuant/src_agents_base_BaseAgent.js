/**
 * BaseAgent.js
 * Foundation class for all PerpetualQuant agents
 * Created: 2025-03-28
 * Author: abrichetto
 */

class BaseAgent {
  constructor(name, config = {}) {
    this.name = name;
    this.config = config;
    this.isRunning = false;
    this.lastRun = null;
    this.logger = config.logger || console;
  }

  /**
   * Initialize the agent with necessary resources
   */
  async initialize() {
    this.logger.info(`Initializing agent: ${this.name}`);
    // Implementation specific to each agent
    return true;
  }

  /**
   * Start the agent's processing loop
   */
  async start() {
    if (this.isRunning) {
      this.logger.warn(`Agent ${this.name} is already running`);
      return;
    }
    
    this.isRunning = true;
    this.logger.info(`Agent ${this.name} started`);
    
    try {
      await this.process();
    } catch (error) {
      this.logger.error(`Error in agent ${this.name}: ${error.message}`);
      this.stop();
    }
  }
  
  /**
   * Stop the agent's processing
   */
  stop() {
    this.isRunning = false;
    this.lastRun = new Date().toISOString();
    this.logger.info(`Agent ${this.name} stopped`);
  }
  
  /**
   * Core processing logic - must be implemented by subclasses
   */
  async process() {
    throw new Error('Method process() must be implemented by subclass');
  }
}

module.exports = BaseAgent;