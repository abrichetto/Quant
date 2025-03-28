const { PortfolioManagerAgent } = require('./portfolio-manager-framework');

class MichaelSaylorAgent extends PortfolioManagerAgent {
  constructor(config = {}) {
    super(config);
    this.name = 'Michael Saylor (MicroStrategy)';
    this.bias = 95; // Extremely bullish on Bitcoin specifically
    this.riskTolerance = 90; // Very high risk tolerance for Bitcoin
    this.timeHorizon = 'very-long'; // Multi-decade view
    this.focusAreas = ['bitcoin', 'monetary-network', 'store-of-value'];
    this.signalThreshold = 30; // Lower threshold for Bitcoin
  }
  
  evaluateSignal(signal) {
    console.log(`${this.name} evaluating ${signal.symbol}...`);
    
    const reasoning = [];
    let baseScore = 0;
    let confidence = 0.7; // Base confidence
    
    // Special case for Bitcoin - Saylor is extremely Bitcoin-focused
    if (signal.symbol === 'BTC') {
      // Michael Saylor's Bitcoin-specific approach
      baseScore = 85; // Starts highly positive
      confidence = 0.9;
      
      reasoning.push("Bitcoin is digital property on a monetary network and the apex asset for treasury reserves");
      reasoning.push("Time in the market is more important than timing the market with Bitcoin");
      
      // Look at on-chain fundamentals
      if (signal.onChain && signal.onChain.supply) {
        if (signal.onChain.supply.exchange_balance_trend < 0) {
          baseScore += 10;
          reasoning.push("Decreasing exchange balances indicate accumulation and hodling behavior");
        }
        
        if (signal.onChain.supply.entities_holding > signal.onChain.supply.prev_entities_holding) {
          baseScore += 5;
          reasoning.push("Growing number of entities holding Bitcoin indicates expanding adoption");
        }
      }
      
      // Macroeconomic context
      if (signal.macro && signal.macro.inflation > 2) {
        baseScore += 5;
        reasoning.push(`Inflation at ${signal.macro.inflation}% enhances Bitcoin's value proposition as an inflation hedge`);
      }
      
    } else if (signal.symbol === 'ETH') {
      // Somewhat positive on ETH but nowhere near BTC conviction
      baseScore = 20;
      confidence = 0.5;
      reasoning.push("Ethereum has utility value but doesn't meet the perfect monetary properties of Bitcoin");
      reasoning.push("May serve as a complementary asset but not a primary treasury reserve");
    } else {
      // Virtually no interest in other cryptocurrencies
      baseScore = -20;
      confidence = 0.6;
      reasoning.push("Alternative cryptocurrencies lack the network effects and security of Bitcoin");
      reasoning.push("Focus should remain on the dominant digital property network (Bitcoin)");
    }
    
    // Adapt score based on the signal's technical data - but this matters less to Saylor
    if (signal.technical && signal.technical.trend) {
      if (signal.technical.trend.includes('Downtrend') && signal.symbol === 'BTC') {
        // For BTC, a downtrend is buying opportunity
        baseScore += 5;
        reasoning.push("Price weakness presents strategic acquisition opportunity for long-term holders");
      }
    }
    
    // Determine recommendation
    let recommendation;
    if (baseScore >= 75) recommendation = 'STRONG_BUY';
    else if (baseScore >= 25) recommendation = 'BUY';
    else if (baseScore > -25) recommendation = 'NEUTRAL';
    else if (baseScore > -75) recommendation = 'SELL';
    else recommendation = 'STRONG_SELL';
    
    return {
      recommendation,
      confidence,
      reasoning
    };
  }
}

module.exports = MichaelSaylorAgent;