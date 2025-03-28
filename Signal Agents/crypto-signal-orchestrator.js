const { PortfolioManagerConsensus } = require('./agents/portfolio-managers/portfolio-manager-framework');
const CathieWoodAgent = require('./agents/portfolio-managers/cathie-wood-agent');
const MichaelSaylorAgent = require('./agents/portfolio-managers/michael-saylor-agent');
const JamieDimonAgent = require('./agents/portfolio-managers/jamie-dimon-agent');
const WarrenBuffettAgent = require('./agents/portfolio-managers/warren-buffett-agent');
const ResearchRepository = require('../utils/research-repository');

class CryptoSignalOrchestrator {
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
    
    // Signal enrichment settings
    this.enhanceBtcEthSignals = config.enhanceBtcEthSignals !== false;
    this.bypassConsensusThreshold = config.bypassConsensusThreshold || 0.9; // Very high-confidence signals bypass manager review
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
    
    // Register with weights (out of 100)
    this.managerConsensus.registerManager(cathieWood, 85);    // Innovation focus
    this.managerConsensus.registerManager(michaelSaylor, 90); // BTC focus
    this.managerConsensus.registerManager(jamieDimon, 70);    // Institutional perspective
    this.managerConsensus.registerManager(warrenBuffett, 60); // Value investor skeptic
  }
  
  /**
   * Process a crypto signal through the orchestration pipeline
   * @param {Object} signal - The generated signal
   * @returns {Object} The processed signal with consensus
   */
  async processSignal(signal) {
    console.log(`CryptoSignalOrchestrator processing signal for ${signal.symbol}`);
    
    // For BTC and ETH, process through portfolio manager consensus
    if ((signal.symbol === 'BTC' || signal.symbol === 'ETH') && this.enhanceBtcEthSignals) {
      // Skip consensus for extremely high-confidence signals
      if (signal.confidence_score >= this.bypassConsensusThreshold) {
        console.log(`Ultra-high confidence signal (${signal.confidence_score}) bypassing manager consensus`);
        return {
          ...signal,
          consensus_applied: false,
          bypass_reason: 'Ultra-high confidence signal'
        };
      }
      
      // For BTC/ETH: Get portfolio manager consensus
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
    
    // For other crypto assets, return original signal
    return signal;
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

module.exports = CryptoSignalOrchestrator;