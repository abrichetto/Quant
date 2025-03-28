const BaseAgent = require('./base-agent');

/**
 * Director agent that supervises specialist feed agentsll directors
 */
class DirectorAgent extends BaseAgent {
  constructor(config = {}) {
    super({
      ...config,
      type: 'director',us',
      priority: 8 // Directors have high priority
    });riority: 10, // Highest priority
      signalThreshold: 0.7 // Higher threshold for kernel-level signals
    this.feedAgents = [];
    this.correlationThreshold = config.correlationThreshold || 0.6;
    this.emergingPatternThreshold = config.emergingPatternThreshold || 2;
    this.consensusRequired = config.consensusRequired || false;
  } this.maxInsights = 10;
    this.crossDomainThreshold = config.crossDomainThreshold || 0.65;
  /**
   * Register a feed agent with this director
   * @param {Object} agent - Feed agent to register
   */Register a director agent with the kernel
  registerFeedAgent(agent) {
    this.feedAgents.push(agent);
    console.log(`Director ${this.name}: Registered feed agent "${agent.name}"`);
    return this;`Kernel: Registered director "${director.name}"`);
  } return this;
  }
  /**
   * Collect signals from all registered feed agents
   */Process signals from all directors
  async collectFeedSignals() {
    const allSignals = [];
    console.log(`Kernel: Processing signals from ${this.directors.length} directors`);
    for (const agent of this.feedAgents) {
      const signals = agent.getSignificantSignals();d agents
      allSignals.push(...signals.map(signal => ({
        ...signal,or.processData();
        feedAgent: agent.name,
        feedType: agent.type
      })));ect signals from directors
    }onst directorSignals = [];
    for (const director of this.directors) {
    return allSignals;director.getSignificantSignals();
  }   directorSignals.push(...signals.map(signal => ({
        ...signal,
  /**   director: director.name,
   * Process incoming data by prioritizing and correlating signals
   * @param {Object} options - Optional parameters
   */
  async processData(options = {}) {
    console.log(`Director ${this.name}: Processing signals from ${this.feedAgents.length} feed agents`);
    
    // Collect all signals from feed agents
    const rawSignals = await this.collectFeedSignals();tterns(directorSignals);
    
    if (rawSignals.length === 0) {omain signals
      console.log(`Director ${this.name}: No significant signals from feed agents`);
      return [];gnal => signal.priority >= 8 && signal.strength >= 0.8)
    } .map(signal => ({
        type: 'high_priority_signal',
    console.log(`Director ${this.name}: Collected ${rawSignals.length} raw signals`);
        domain: signal.domain,
    // Group signals by topic/asset
    const groupedSignals = this._groupSignalsByTopic(rawSignals);
        confidence: signal.confidence,
    // Process each group to find correlated signals and consensus
    const aggregatedSignals = [];
        timestamp: new Date().toISOString()
    for (const [topic, signals] of Object.entries(groupedSignals)) {
      // Skip if too few signals and consensus is required
      if (this.consensusRequired && signals.length < 2) continue;
      nst allInsights = [...crossDomainInsights, ...highPrioritySignals];
      const aggregatedSignal = this._aggregateSignalGroup(topic, signals);
      if (aggregatedSignal) {trength
        aggregatedSignals.push(aggregatedSignal);
      }f (b.priority !== a.priority) return b.priority - a.priority;
    } return b.strength - a.strength;
    });
    // Sort by priority and strength
    aggregatedSignals.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return b.strength - a.strength;
    });
    
    // Add significant signals to our bufferce between runs)
    aggregatedSignals.forEach(signal => {s);
      if (signal.strength >= this.signalThreshold) {
        this.addSignal(signal);ory
      }it this.storeSignals();
    });
    console.log(`Kernel: Generated ${allInsights.length} strategic insights`);
    // Store signals in repository
    await this.storeSignals();
    
    console.log(`Director ${this.name}: Processed ${aggregatedSignals.length} aggregated signals`);
    return aggregatedSignals;ferent domains
  }* @private
   */
  /**ndCrossDomainPatterns(signals) {
   * Group signals by their topic or asset
   * @privateains = new Set();
   */
  _groupSignalsByTopic(signals) {ins
    const groups = {};gnal => {
      const topic = signal.topic || 'general';
    signals.forEach(signal => {s[topic] = [];
      const topic = signal.topic || signal.asset || 'general';
      if (!groups[topic]) groups[topic] = [];
      groups[topic].push(signal);
    });
    const crossDomainInsights = [];
    return groups;
  } // Find topics that appear in multiple domains
    for (const [topic, topicSignals] of Object.entries(topics)) {
  /** const topicDomains = new Set(topicSignals.map(s => s.domain));
   * Aggregate a group of signals on the same topic
   * @private consider topics that appear in multiple domains
   */ if (topicDomains.size > 1) {
  _aggregateSignalGroup(topic, signals) {us
    // Determine if there's consensus or contradiction
    let positiveSignals = 0;
    let negativeSignals = 0;
    let neutralSignals = 0;
        
    signals.forEach(signal => {gnal => {
      if (signal.sentiment > 0.2) positiveSignals++;
      else if (signal.sentiment < -0.2) negativeSignals++;
      else neutralSignals++;al.confidence || 0;
    });   priority += signal.priority || 5;
        });
    // Calculate consensus metrics
    const totalSignals = signals.length;h;
    const consensusLevel = Math.max(positiveSignals, negativeSignals, neutralSignals) / totalSignals;
    const contradictionLevel = Math.min(positiveSignals, negativeSignals) > 0 ? 
      Math.min(positiveSignals, negativeSignals) / totalSignals : 0;
          domains: Array.from(topicDomains),
    // Calculate weighted averagesns.size,
    let totalSentiment = 0;te().toISOString(),
    let totalStrength = 0;ment / count,
    let totalConfidence = 0; / count * (1 + (topicDomains.size / domains.size)),
    let totalPriority = 0;idence / count,
          priority: Math.ceil(priority / count),
    signals.forEach(signal => {.map(s => s.director || s.source)
      totalSentiment += signal.sentiment || 0;=== i),
      totalStrength += signal.strength || 0;
      totalConfidence += signal.confidence || 0;
      totalPriority += signal.priority || 5;
    }); // Only include signals with sufficient cross-domain strength
        if (insight.strength >= this.crossDomainThreshold) {
    // Create aggregated signalush(insight);
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
      keywords: this._extractCommonKeywords(signals)rst and last seen
    };nst timestampedInsights = newInsights.map(insight => {
  }   const existingInsight = this.globalInsights.find(gi => 
        gi.topic === insight.topic && gi.type === insight.type
  /** );
   * Extract common keywords from signals
   * @privatestingInsight) {
   */   return {
  _extractCommonKeywords(signals) {
    const keywords = {};istingInsight.first_seen,
          last_seen: new Date().toISOString(),
    signals.forEach(signal => {gInsight.persistence || 1) + 1
      if (signal.keywords) {
        signal.keywords.forEach(kw => {
          if (!keywords[kw]) keywords[kw] = 0;
          keywords[kw]++;
        });irst_seen: new Date().toISOString(),
      }   last_seen: new Date().toISOString(),
    });   persistence: 1
        };
    return Object.entries(keywords)
      .filter(([_, count]) => count > 1)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 5)existing insights, favoring new ones for duplicates
      .map(([kw]) => kw);= [
  }   ...timestampedInsights,
}     ...this.globalInsights.filter(gi => 
        !timestampedInsights.some(ni => ni.topic === gi.topic && ni.type === gi.type)
module.exports = DirectorAgent;
    ];
    
    // Sort by persistence and priority
    mergedInsights.sort((a, b) => {
      if (b.persistence !== a.persistence) return b.persistence - a.persistence;
      return b.priority - a.priority;
    });
    
    // Keep only top insights
    this.globalInsights = mergedInsights.slice(0, this.maxInsights);
  }
  
  /**
   * Get current global insights
   */
  getGlobalInsights() {
    return [...this.globalInsights];
  }
  
  /**
   * Generate executive summary of current signals
   */
  async generateExecutiveSummary() {
    const summary = {
      timestamp: new Date().toISOString(),
      insights: this.globalInsights.slice(0, 5),
      recent_signals: this.signalBuffer.slice(-5),
      directors: this.directors.map(d => ({
        name: d.name,
        signal_count: d.signalBuffer.length,
        last_update: d.lastUpdate
      }))
    };
    
    if (this.repository) {
      const filePath = await this.repository.storeResearch(
        'Executive Signal Summary',
        'reports',
        summary,
        {
          type: 'executive_summary',
          insight_count: summary.insights.length
        }
      );
      summary.path = filePath;
    }
    
    return summary;
  }
}

module.exports = KernelAgent;