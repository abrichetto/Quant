const { PortfolioManagerConsensus } = require('./agents/portfolio-managers/portfolio-manager-framework');
const CathieWoodAgent = require('./agents/portfolio-managers/cathie-wood-agent');
const MichaelSaylorAgent = require('./agents/portfolio-managers/michael-saylor-agent');
const JamieDimonAgent = require('./agents/portfolio-managers/jamie-dimon-agent');
const WarrenBuffettAgent = require('./agents/portfolio-managers/warren-buffett-agent');
const ResearchRepository = require('../utils/research-repository');

class SignalOrchestrator {
  constructor(config = {}) {
    this.repository = config.repository || new ResearchRepository();
    
    // Create portfolio manager consensus system
    this.managerConsensus = new PortfolioManagerConsensus({
      repository: this.repository,
      requiredConsensus: config.requiredConsensus || 0.6,
      voteThreshold: config.voteThreshold || 0.65,
      consensusStrategy: config.consensusStrategy || 'weightedMajority'
    });
    
    // Register portfolio managers with weights
    this._setupPortfolioManagers();
    
    // Signal configuration
    this.enhanceSignals = true;
    this.bypassConsensusThreshold = config.bypassConsensusThreshold || 0.9; // Very high-confidence signals bypass manager review
    
    // Asset categories for specialized expertise weighting
    this.assetCategories = {
      cryptocurrencies: ['BTC', 'ETH', 'AVAX', 'ADA', 'MATIC', 'SUI', 'DOGE', 'HBAR', 'ONE', 'UNI', 'SOL', 
                         'XRP', 'DOT', 'LINK', 'ATOM', 'FIL', 'NEAR', 'ARB', 'OP', 'ALGO', 'TON'],
      tech: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'AMD', 'INTC', 'CRM'],
      finance: ['JPM', 'BAC', 'WFC', 'GS', 'MS', 'BLK', 'C', 'AXP', 'V', 'MA'],
      consumer: ['PG', 'KO', 'PEP', 'MCD', 'WMT', 'HD', 'NKE', 'SBUX', 'DIS', 'COST'],
      industrial: ['CAT', 'BA', 'MMM', 'GE', 'HON', 'UNP', 'LMT', 'RTX', 'DE', 'EMR'],
      health: ['JNJ', 'PFE', 'MRK', 'ABBV', 'TMO', 'ABT', 'UNH', 'MDT', 'AMGN', 'BMY']
    };
  }
  
  /**
   * Setup the portfolio manager agents
   * @private
   */
  _setupPortfolioManagers() {
    // Create manager agents
    const cathieWood = new CathieWoodAgent({ repository: this.repository });
    const michaelSaylor = new MichaelSaylorAgent({ repository: this.repository });
    const jamieDimon = new JamieDimonAgent({ repository: this.repository });
    const warrenBuffett = new WarrenBuffettAgent({ repository: this.repository });
    
    // Register with default weights (out of 100)
    this.managerConsensus.registerManager(cathieWood, 85);    // Innovation focus
    this.managerConsensus.registerManager(michaelSaylor, 90); // BTC focus
    this.managerConsensus.registerManager(jamieDimon, 70);    // Institutional perspective
    this.managerConsensus.registerManager(warrenBuffett, 60); // Value investor skeptic
  }
  
  /**
   * Process a signal through the orchestration pipeline
   * @param {Object} signal - The generated signal
   * @returns {Object} The processed signal with consensus
   */
  async processSignal(signal) {
    console.log(`SignalOrchestrator processing signal for ${signal.symbol}`);
    
    // Skip consensus for extremely high-confidence signals
    if (signal.confidence_score >= this.bypassConsensusThreshold) {
      console.log(`Ultra-high confidence signal (${signal.confidence_score}) bypassing manager consensus`);
      return {
        ...signal,
        consensus_applied: false,
        bypass_reason: 'Ultra-high confidence signal'
      };
    }
    
    // Adjust manager weights based on asset type expertise
    this._adjustManagerWeightsForAsset(signal.symbol);
    
    // Get portfolio manager consensus
    console.log(`Getting portfolio manager consensus for ${signal.symbol}...`);
    const consensus = await this.managerConsensus.processSignal(signal);
    
    // Blend original signal with consensus
    return {
      ...signal,
      original_signal: signal.overall_signal,
      overall_signal: Math.round((signal.overall_signal * 0.3) + (consensus.consensusSignal * 0.7)),
      signal_strength: this._mapSignalStrength(consensus.consensusSignal),
      recommended_action: consensus.recommendation,
      consensus_applied: true,
      manager_consensus: {
        agreement: consensus.managersInAgreement,
        confidence: consensus.confidence,
        discussions: consensus.discussions.slice(0, 5) // Top 5 discussion points
      }
    };
  }
  
  /**
   * Adjust manager weights based on the asset being evaluated
   * @private
   */
  _adjustManagerWeightsForAsset(symbol) {
    // Find which category this asset belongs to
    let category = 'other';
    for (const [cat, symbols] of Object.entries(this.assetCategories)) {
      if (symbols.includes(symbol)) {
        category = cat;
        break;
      }
    }
    
    // Set weights based on category expertise
    if (category === 'cryptocurrencies') {
      this.managerConsensus.setManagerWeights({
        'Cathie Wood (Ark Invest)': 85,
        'Michael Saylor (MicroStrategy)': 90,
        'Jamie Dimon (JPMorgan)': 70,
        'Warren Buffett (Berkshire Hathaway)': 60
      });
    } else if (category === 'tech') {
      this.managerConsensus.setManagerWeights({
        'Cathie Wood (Ark Invest)': 90,
        'Michael Saylor (MicroStrategy)': 60,
        'Jamie Dimon (JPMorgan)': 70,
        'Warren Buffett (Berkshire Hathaway)': 70
      });
    } else if (category === 'finance') {
      this.managerConsensus.setManagerWeights({
        'Cathie Wood (Ark Invest)': 60,
        'Michael Saylor (MicroStrategy)': 50,
        'Jamie Dimon (JPMorgan)': 95,
        'Warren Buffett (Berkshire Hathaway)': 85
      });
    } else if (category === 'consumer') {
      this.managerConsensus.setManagerWeights({
        'Cathie Wood (Ark Invest)': 60,
        'Michael Saylor (MicroStrategy)': 50,
        'Jamie Dimon (JPMorgan)': 75,
        'Warren Buffett (Berkshire Hathaway)': 90
      });
    } else {
      // Default weights for other categories
      this.managerConsensus.setManagerWeights({
        'Cathie Wood (Ark Invest)': 75,
        'Michael Saylor (MicroStrategy)': 60,
        'Jamie Dimon (JPMorgan)': 80,
        'Warren Buffett (Berkshire Hathaway)': 75
      });
    }
  }
  
  /**
   * Map numeric signal to strength label
   * @private
   */
  _mapSignalStrength(signalValue) {
    if (signalValue > 70) return 'Strong Buy';
    else if (signalValue > 30) return 'Buy';
    else if (signalValue > 10) return 'Weak Buy';
    else if (signalValue > -10) return 'Neutral';
    else if (signalValue > -30) return 'Weak Sell';
    else if (signalValue > -70) return 'Sell';
    else return 'Strong Sell';
  }
}

module.exports = SignalOrchestrator;