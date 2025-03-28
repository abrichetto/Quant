const BaseAgent = require('./base-agent');

/**
 * Director agent that supervises specialist feed agents
 */
class DirectorAgent extends BaseAgent {
  constructor(config = {}) {
    super({
      ...config,
      type: 'director',
      priority: 8 // Directors have high priority
    });
    
    this.feedAgents = [];
    this.correlationThreshold = config.correlationThreshold || 0.6;
    this.emergingPatternThreshold = config.emergingPatternThreshold || 2;
    this.consensusRequired = config.consensusRequired || false;
  }
  
  /**
   * Register a feed agent with this director
   * @param {Object} agent - Feed agent to register
   */
  registerFeedAgent(agent) {
    this.feedAgents.push(agent);
    console.log(`Director ${this.name}: Registered feed agent "${agent.name}"`);
    return this;
  }
  
  /**
   * Collect signals from all registered feed agents
   */
  async collectFeedSignals() {
    const allSignals = [];
    
    for (const agent of this.feedAgents) {
      const signals = agent.getSignificantSignals();
      allSignals.push(...signals.map(signal => ({
        ...signal,
        feedAgent: agent.name,
        feedType: agent.type
      })));
    }
    
    return allSignals;
  }
  
  /**
   * Process incoming data by prioritizing and correlating signals
   * @param {Object} options - Optional parameters
   */
  async processData(options = {}) {
    console.log(`Director ${this.name}: Processing signals from ${this.feedAgents.length} feed agents`);
    
    // Collect all signals from feed agents
    const rawSignals = await this.collectFeedSignals();
    
    if (rawSignals.length === 0) {
      console.log(`Director ${this.name}: No significant signals from feed agents`);
      return [];
    }
    
    console.log(`Director ${this.name}: Collected ${rawSignals.length} raw signals`);
    
    // Group signals by topic/asset
    const groupedSignals = this._groupSignalsByTopic(rawSignals);
    
    // Process each group to find correlated signals and consensus
    const aggregatedSignals = [];
    
    for (const [topic, signals] of Object.entries(groupedSignals)) {
      // Skip if too few signals and consensus is required
      if (this.consensusRequired && signals.length < 2) continue;
      
      const aggregatedSignal = this._aggregateSignalGroup(topic, signals);
      if (aggregatedSignal) {
        aggregatedSignals.push(aggregatedSignal);
      }
    }
    
    // Sort by priority and strength
    aggregatedSignals.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return b.strength - a.strength;
    });
    
    // Add significant signals to our buffer
    aggregatedSignals.forEach(signal => {
      if (signal.strength >= this.signalThreshold) {
        this.addSignal(signal);
      }
    });
    
    // Store signals in repository
    await this.storeSignals();
    
    console.log(`Director ${this.name}: Processed ${aggregatedSignals.length} aggregated signals`);
    return aggregatedSignals;
  }
  
  /**
   * Group signals by their topic or asset
   * @private
   */
  _groupSignalsByTopic(signals) {
    const groups = {};
    
    signals.forEach(signal => {
      const topic = signal.topic || signal.asset || 'general';
      if (!groups[topic]) groups[topic] = [];
      groups[topic].push(signal);
    });
    
    return groups;
  }
  
  /**
   * Aggregate a group of signals on the same topic
   * @private
   */
  _aggregateSignalGroup(topic, signals) {
    // Determine if there's consensus or contradiction
    let positiveSignals = 0;
    let negativeSignals = 0;
    let neutralSignals = 0;
    
    signals.forEach(signal => {
      if (signal.sentiment > 0.2) positiveSignals++;
      else if (signal.sentiment < -0.2) negativeSignals++;
      else neutralSignals++;
    });
    
    // Calculate consensus metrics
    const totalSignals = signals.length;
    const consensusLevel = Math.max(positiveSignals, negativeSignals, neutralSignals) / totalSignals;
    const contradictionLevel = Math.min(positiveSignals, negativeSignals) > 0 ? 
      Math.min(positiveSignals, negativeSignals) / totalSignals : 0;
    
    // Calculate weighted averages
    let totalSentiment = 0;
    let totalStrength = 0;
    let totalConfidence = 0;
    let totalPriority = 0;
    
    signals.forEach(signal => {
      totalSentiment += signal.sentiment || 0;
      totalStrength += signal.strength || 0;
      totalConfidence += signal.confidence || 0;
      totalPriority += signal.priority || 5;
    });
    
    // Create aggregated signal
    return {
      topic,
      sources: signals.map(s => s.feedAgent || s.source).filter((v, i, a) => a.indexOf(v) === i),
      signalCount: signals.length,
      timestamp: new Date().toISOString(),
      sentiment: totalSentiment / totalSignals,
      strength: totalStrength / totalSignals,
      confidence: totalConfidence / totalSignals * consensusLevel * (1 - contradictionLevel/2),
      priority: Math.round(totalPriority / totalSignals),
      consensusLevel,
      contradictionLevel,
      details: signals.slice(0, 3), // Include top 3 original signals
      keywords: this._extractCommonKeywords(signals)
    };
  }
  
  /**
   * Extract common keywords from signals
   * @private
   */
  _extractCommonKeywords(signals) {
    const keywords = {};
    
    signals.forEach(signal => {
      if (signal.keywords) {
        signal.keywords.forEach(kw => {
          if (!keywords[kw]) keywords[kw] = 0;
          keywords[kw]++;
        });
      }
    });
    
    return Object.entries(keywords)
      .filter(([_, count]) => count > 1)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 5)
      .map(([kw]) => kw);
  }
}

module.exports = DirectorAgent;