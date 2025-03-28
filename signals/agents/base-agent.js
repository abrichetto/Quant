/**
 * Base class for all signal intelligence agents
 */
class BaseAgent {
  constructor(config = {}) {
    this.name = config.name || 'Unnamed Agent';
    this.type = config.type || 'base';
    this.priority = config.priority || 5; // 1-10 scale, 10 being highest
    this.repository = config.repository;
    this.signalBuffer = [];
    this.maxBufferSize = config.maxBufferSize || 100;
    this.signalThreshold = config.signalThreshold || 0.5; // Signal strength threshold for forwarding
    this.noiseReductionFactor = config.noiseReductionFactor || 0.3; // How aggressively to filter noise
    this.lastUpdate = null;
  }
  
  /**
   * Process incoming data and detect signals
   * @param {Object} data - Raw data to process
   * @returns {Array} - Detected signals
   */
  async processData(data) {
    throw new Error('processData method must be implemented by subclass');
  }
  
  /**
   * Add a signal to the buffer
   */
  addSignal(signal) {
    // Make sure signal has required fields
    const processedSignal = {
      ...signal,
      timestamp: signal.timestamp || new Date().toISOString(),
      source: signal.source || this.name,
      strength: signal.strength || 0,
      confidence: signal.confidence || 0,
      id: this._generateSignalId()
    };
    
    this.signalBuffer.push(processedSignal);
    
    // Keep buffer size in check
    if (this.signalBuffer.length > this.maxBufferSize) {
      this.signalBuffer.shift(); // Remove oldest signal
    }
    
    this.lastUpdate = new Date();
    
    return processedSignal;
  }
  
  /**
   * Get signals that meet the threshold
   */
  getSignificantSignals() {
    return this.signalBuffer.filter(signal => 
      signal.strength >= this.signalThreshold
    );
  }
  
  /**
   * Get all signals in buffer
   */
  getAllSignals() {
    return [...this.signalBuffer];
  }
  
  /**
   * Clear the signal buffer
   */
  clearBuffer() {
    this.signalBuffer = [];
  }
  
  /**
   * Store signals in repository
   */
  async storeSignals() {
    if (!this.repository) return null;
    
    const signals = this.getAllSignals();
    if (signals.length === 0) return null;
    
    const filePath = await this.repository.storeResearch(
      `Signals - ${this.name}`,
      'analysis',
      {
        agent: this.name,
        type: this.type,
        timestamp: new Date().toISOString(),
        signals
      },
      {
        agent_type: this.type,
        signal_count: signals.length
      }
    );
    
    return filePath;
  }
  
  /**
   * Generate a unique signal ID
   * @private
   */
  _generateSignalId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
  }
}

module.exports = BaseAgent;