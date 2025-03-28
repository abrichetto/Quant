const { PortfolioManagerAgent } = require('./portfolio-manager-framework');

class CathieWoodAgent extends PortfolioManagerAgent {
  constructor(config = {}) {
    super(config);
    this.name = 'Cathie Wood (Ark Invest)';
    this.bias = 85; // Very bullish on innovation
    this.riskTolerance = 80; // High risk tolerance
    this.timeHorizon = 'long'; // Long-term investor
    this.focusAreas = ['innovation', 'disruption', 'technology', 'blockchain'];
    this.signalThreshold = 40; // Lower threshold - willing to take chances
  }
  
  evaluateSignal(signal) {
    console.log(`${this.name} evaluating ${signal.symbol}...`);
    
    // Technical analysis (20%)
    const technical = this._evaluateTechnical(signal);
    
    // Fundamental analysis (30%)
    const fundamental = this._evaluateFundamental(signal);
    
    // Innovation potential (50%) - Cathie focuses heavily on innovation
    const innovation = this._evaluateInnovationPotential(signal);
    
    // Calculate weighted score
    const score = (
      technical.score * 0.2 +
      fundamental.score * 0.3 +
      innovation.score * 0.5
    );
    
    // Adjust for personal bias
    const adjustedScore = Math.min(100, Math.max(-100, score + (this.bias * 0.2)));
    
    // Determine recommendation
    let recommendation;
    if (adjustedScore >= 75) recommendation = 'STRONG_BUY';
    else if (adjustedScore >= 25) recommendation = 'BUY';
    else if (adjustedScore > -25) recommendation = 'NEUTRAL';
    else if (adjustedScore > -75) recommendation = 'SELL';
    else recommendation = 'STRONG_SELL';
    
    // Calculate confidence
    const confidence = Math.min(1.0, 0.5 + Math.abs(adjustedScore) / 200);
    
    // Compile reasoning
    const reasoning = [
      ...technical.reasoning,
      ...fundamental.reasoning,
      ...innovation.reasoning
    ];
    
    // Special handling for Bitcoin and Ethereum
    if (signal.symbol === 'BTC' || signal.symbol === 'ETH') {
      reasoning.push(`${signal.symbol} represents a strategic allocation to digital assets which serve as a hedge against inflation and currency debasement`);
      reasoning.push(`The growing institutional adoption of ${signal.symbol} suggests we're still early in the adoption curve`);
      
      if (signal.symbol === 'ETH') {
        reasoning.push("Ethereum's smart contract platform enables decentralized applications that can disrupt traditional finance");
      }
    }
    
    return {
      recommendation,
      confidence,
      reasoning
    };
  }
  
  _evaluateTechnical(signal) {
    const reasoning = [];
    let score = 0;
    
    // Cathie is less focused on short-term technicals
    if (signal.technical && signal.technical.trend) {
      if (signal.technical.trend.includes('Uptrend')) {
        score += 20;
        reasoning.push("Technical uptrend confirms positive momentum");
      } else if (signal.technical.trend.includes('Downtrend')) {
        // Less concerned about short-term downtrends if fundamentals are strong
        score -= 10;
        reasoning.push("Technical indicators show downtrend, but this may present a buying opportunity if innovation thesis remains intact");
      }
    }
    
    return { score, reasoning };
  }
  
  _evaluateFundamental(signal) {
    const reasoning = [];
    let score = 0;
    
    // For crypto, look at network effects and adoption
    if (signal.fundamentals && signal.fundamentals.adoption) {
      const adoption = signal.fundamentals.adoption;
      
      if (adoption.growth > 30) {
        score += 40;
        reasoning.push(`Strong network growth of ${adoption.growth}% indicates accelerating adoption`);
      } else if (adoption.growth > 10) {
        score += 20;
        reasoning.push(`Positive network growth of ${adoption.growth}% supports long-term thesis`);
      }
    }
    
    return { score, reasoning };
  }
  
  _evaluateInnovationPotential(signal) {
    const reasoning = [];
    let score = 0;
    
    // Evaluate crypto-specific innovation factors
    if (signal.symbol === 'BTC') {
      score += 50;
      reasoning.push("Bitcoin represents a breakthrough digital monetary network that serves as a non-sovereign store of value");
    } else if (signal.symbol === 'ETH') {
      score += 60;
      reasoning.push("Ethereum's programmable smart contracts represent a platform technology with transformative potential for financial services");
    }
    
    // Consider sentiment as an early indicator
    if (signal.sentiment && signal.sentiment.score > 0.5) {
      score += 20;
      reasoning.push("Positive sentiment indicates growing awareness and potential for innovative applications");
    }
    
    return { score, reasoning };
  }
}

module.exports = CathieWoodAgent;