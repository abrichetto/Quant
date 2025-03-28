/**st ResearchRepository = require('../src/utils/research-repository');
 * Base class for all signal intelligence agentsts/kernel-agent');
 */st DirectorAgent = require('../src/signals/agents/director-agent');
class BaseAgent {
  constructor(config = {}) {
    this.name = config.name || 'Unnamed Agent';TradingFeed } = require('../src/signals/agents/feeds/market-feeds');
    this.type = config.type || 'base';Feed } = require('../src/signals/agents/feeds/crypto-feeds');
    this.priority = config.priority || 5; // 1-10 scale, 10 being highest'../src/signals/agents/feeds/macro-feeds');
    this.repository = config.repository;
    this.signalBuffer = [];
    this.maxBufferSize = config.maxBufferSize || 100;al Signals Intelligence System...");
    this.signalThreshold = config.signalThreshold || 0.5; // Signal strength threshold for forwarding
    this.noiseReductionFactor = config.noiseReductionFactor || 0.3; // How aggressively to filter noise
    this.lastUpdate = null;searchRepository();
  }
  // Create the kernel (top-level) agent
  /**st kernel = new KernelAgent({ repository });
   * Process incoming data and detect signals
   * @param {Object} data - Raw data to process
   * @returns {Array} - Detected signalsnt({
   */ame: "Market Intelligence Director",
  async processData(data) {
    throw new Error('processData method must be implemented by subclass');
  });
  
  /**st cryptoDirector = new DirectorAgent({
   * Add a signal to the bufferDirector",
   */omain: "crypto",
  addSignal(signal) {
    // Make sure signal has required fields
    const processedSignal = {
      ...signal,ector = new DirectorAgent({
      timestamp: signal.timestamp || new Date().toISOString(),
      source: signal.source || this.name,
      strength: signal.strength || 0,
      confidence: signal.confidence || 0,ultiple signals for macro trends
      id: this._generateSignalId()
    };
     Create specialized feed agents
    this.signalBuffer.push(processedSignal);
     Market feeds
    // Keep buffer size in checklStreetFeed({ repository });
    if (this.signalBuffer.length > this.maxBufferSize) { });
      this.signalBuffer.shift(); // Remove oldest signalpository });
    }
     Crypto feeds
    this.lastUpdate = new Date(); repository });
    nst layerOneTwoFeed = new LayerOneTwoFeed({ repository });
    return processedSignal;ed({ repository });
  }
  // Macro feeds
  /**st fiscalPolicyFeed = new FiscalPolicyFeed({ repository });
   * Get signals that meet the threshold{ repository });
   */st geopoliticalRiskFeed = new GeopoliticalRiskFeed({ repository });
  getSignificantSignals() {
    return this.signalBuffer.filter(signal => 
      signal.strength >= this.signalThresholdFeed)
    );         .registerFeedAgent(secFilingsFeed)
  }            .registerFeedAgent(insiderTradingFeed);
               
  /**ptoDirector.registerFeedAgent(defiFeed)
   * Get all signals in bufferent(layerOneTwoFeed)
   */          .registerFeedAgent(nftFeed);
  getAllSignals() {
    return [...this.signalBuffer];fiscalPolicyFeed)
  }           .registerFeedAgent(ratesFedFeed)
              .registerFeedAgent(geopoliticalRiskFeed);
  /**
   * Clear the signal buffer kernel
   */nel.registerDirector(marketDirector)
  clearBuffer() {Director(cryptoDirector)
    this.signalBuffer = [];acroDirector);
  }
  console.log("Hierarchical system initialized with 3 directors and 9 specialized feed agents");
  /**
   * Store signals in repositoryerarchy
   */sole.log("\nStarting data collection and signal processing...");
  async storeSignals() {
    if (!this.repository) return null;
    // First, process data at feed agent level
    const signals = this.getAllSignals();nt data...");
    if (signals.length === 0) return null;
      wallStreetFeed.processData(),
    const filePath = await this.repository.storeResearch(
      `Signals - ${this.name}`,sData(),
      'analysis',ocessData(),
      {ayerOneTwoFeed.processData(),
        agent: this.name,(),
        type: this.type,rocessData(),
        timestamp: new Date().toISOString(),
        signalscalRiskFeed.// filepath: /Users/anthonybrichetto/Package/AlgoTrader Pro/scripts/run-signals-hierarchy.js
      },searchRepository = require('../src/utils/research-repository');
      {ernelAgent = require('../src/signals/agents/kernel-agent');
        agent_type: this.type,'../src/signals/agents/director-agent');
        signal_count: signals.length
      }rt feed agents
    );{ WallStreetFeed, SECFilingsFeed, InsiderTradingFeed } = require('../src/signals/agents/feeds/market-feeds');
    t { DeFiFeed, LayerOneTwoFeed, NFTFeed } = require('../src/signals/agents/feeds/crypto-feeds');
    return filePath;Feed, RatesFedFeed, GeopoliticalRiskFeed } = require('../src/signals/agents/feeds/macro-feeds');
  }
  ync function main() {
  /**sole.log("Initializing AlgoTrader Pro Hierarchical Signals Intelligence System...");
   * Generate a unique signal ID
   * @privateze repository
   */st repository = new ResearchRepository();
  _generateSignalId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
  }onst kernel = new KernelAgent({ repository });
} 
  // Create director agents
module.exports = BaseAgent;w DirectorAgent({
    name: "Market Intelligence Director",
    domain: "market",
    repository
  });
  
  const cryptoDirector = new DirectorAgent({
    name: "Crypto Intelligence Director",
    domain: "crypto",
    repository
  });
  
  const macroDirector = new DirectorAgent({
    name: "Macro Intelligence Director",
    domain: "macro",
    repository,
    consensusRequired: true  // Require multiple signals for macro trends
  });
  
  // Create specialized feed agents
  
  // Market feeds
  const wallStreetFeed = new WallStreetFeed({ repository });
  const secFilingsFeed = new SECFilingsFeed({ repository });
  const insiderTradingFeed = new InsiderTradingFeed({ repository });
  
  // Crypto feeds
  const defiFeed = new DeFiFeed({ repository });
  const layerOneTwoFeed = new LayerOneTwoFeed({ repository });
  const nftFeed = new NFTFeed({ repository });
  
  // Macro feeds
  const fiscalPolicyFeed = new FiscalPolicyFeed({ repository });
  const ratesFedFeed = new RatesFedFeed({ repository });
  const geopoliticalRiskFeed = new GeopoliticalRiskFeed({ repository });
  
  // Register feed agents with their directors
  marketDirector.registerFeedAgent(wallStreetFeed)
               .registerFeedAgent(secFilingsFeed)
               .registerFeedAgent(insiderTradingFeed);
               
  cryptoDirector.registerFeedAgent(defiFeed)
               .registerFeedAgent(layerOneTwoFeed)
               .registerFeedAgent(nftFeed);
               
  macroDirector.registerFeedAgent(fiscalPolicyFeed)
              .registerFeedAgent(ratesFedFeed)
              .registerFeedAgent(geopoliticalRiskFeed);
  
  // Register directors with kernel
  kernel.registerDirector(marketDirector)
        .registerDirector(cryptoDirector)
        .registerDirector(macroDirector);
  
  console.log("Hierarchical system initialized with 3 directors and 9 specialized feed agents");
  
  // Process data through the hierarchy
  console.log("\nStarting data collection and signal processing...");
  
  try {
    // First, process data at feed agent level
    console.log("\n1. Processing feed agent data...");
    await Promise.all([
      wallStreetFeed.processData(),
      secFilingsFeed.processData(),
      insiderTradingFeed.processData(),
      defiFeed.processData(),
      layerOneTwoFeed.processData(),
      nftFeed.processData(),
      fiscalPolicyFeed.processData(),
      ratesFedFeed.processData(),
      geopoliticalRiskFeed.