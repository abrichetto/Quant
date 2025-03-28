const { PortfolioManagerAgent } = require('./portfolio-manager-framework');

class JamieDimonAgent extends PortfolioManagerAgent {
  constructor(config = {}) {
    super(config);
    this.name = 'Jamie Dimon (JPMorgan)';
    this.bias = -20; // Somewhat skeptical but pragmatic
    this.riskTolerance = 30; // Conservative
    this.timeHorizon = 'medium'; // Medium-term view
    this.focusAreas = ['regulation', 'institutional-adoption', 'blockchain-technology'];
    this.signalThreshold = 70; // High threshold - needs strong evidence
  }
  
  evaluateSignal(signal) {
    console.log(`${this.name} evaluating ${signal.symbol}...`);
    
    // Regulatory assessment (40%)
    const regulatory = this._evaluateRegulatory(signal);
    
    // Technical analysis (20%)
    const technical = this._evaluateTechnical(signal);
    
    // Institutional trends (40%)
    const institutional = this._evaluateInstitutionalAdoption(signal);
    
    // Calculate weighted score
    const score = (
      regulatory.score * 0.4 +
      technical.score * 0.2 +
      institutional.score * 0.4
    );
    
    // Adjust for personal bias (less than others - more pragmatic)
    const adjustedScore = Math.min(100, Math.max(-100, score + (this.bias * 0.1)));
    
    // Determine recommendation
    let recommendation;
    if (adjustedScore >= 75) recommendation = 'STRONG_BUY';
    else if (adjustedScore >= 25) recommendation = 'BUY';
    else if (adjustedScore > -25) recommendation = 'NEUTRAL';
    else if (adjustedScore > -75) recommendation = 'SELL';
    else recommendation = 'STRONG_SELL';
    
    // Calculate confidence
    const confidence = Math.min(1.0, 0.4 + Math.abs(adjustedScore) / 150);
    
    // Compile reasoning
    const reasoning = [
      ...regulatory.reasoning,
      ...technical.reasoning,
      ...institutional.reasoning
    ];
    
    // Special considerations for major cryptocurrencies
    if (signal.symbol === 'BTC') {
      reasoning.push("While I've been skeptical of Bitcoin, client demand cannot be ignored and appropriate exposure may be warranted");
      reasoning.push("Bitcoin remains speculative but established enough for consideration in small allocations");
    } else if (signal.symbol === 'ETH') {
      reasoning.push("Ethereum's smart contract capabilities have practical applications for financial services");
      reasoning.push("The technology underlying Ethereum may have more institutional value than the asset itself");
    }
    
    return {
      recommendation,
      confidence,
      reasoning
    };
  }
  
  _evaluateRegulatory(signal) {
    const reasoning = [];
    let score = 0;
    
    // Check for regulatory concerns
    if (signal.sentiment && signal.sentiment.themes) {
      const hasRegulatoryConcerns = signal.sentiment.themes.some(
        theme => theme.topic.toLowerCase().includes('regulation') || 
                theme.topic.toLowerCase().includes('sec') ||
                theme.topic.toLowerCase().includes('compliance')
      );
      
      if (hasRegulatoryConcerns) {
        score -= 40;
        reasoning.push("Regulatory uncertainty poses significant risk for institutional exposure");
      } else {
        score += 20;
        reasoning.push("Absence of immediate regulatory concerns provides short-term opportunity");
      }
    }
    
    // JPM would be more positive on assets with clear regulatory status
    if (signal.symbol === 'BTC' || signal.symbol === 'ETH') {
      score += 10;
      reasoning.push(`${signal.symbol} has more regulatory clarity than newer alternative cryptocurrencies`);
    }
    
    return { score, reasoning };
  }
  
  _evaluateTechnical(signal) {
    const reasoning = [];
    let score = 0;
    
    if (signal.technical && signal.technical.trend) {
      // Conservative technical approach
      if (signal.technical.trend.includes('Strong Uptrend')) {
        score += 30;
        reasoning.push("Strong uptrend with institutional volume suggests sustainable price action");
      } else if (signal.technical.trend.includes('Uptrend')) {
        score += 15;
        reasoning.push("Positive trend but requires monitoring for trend continuation");
      } else if (signal.technical.trend.includes('Strong Downtrend')) {
        score -= 40;
        reasoning.push("Significant downtrend increases risk profile beyond acceptable levels");
      } else if (signal.technical.trend.includes('Downtrend')) {
        score -= 20;
        reasoning.push("Negative trend suggests waiting for stabilization");
      }
    }
    
    return { score, reasoning };
  }
  
  _evaluateInstitutionalAdoption(signal) {
    const reasoning = [];
    let score = 0;
    
    // JPM would care a lot about what other institutions are doing
    if (signal.fundamentals && signal.fundamentals.institutional_activity) {
      const institutional = signal.fundamentals.institutional_activity;
      
      if (institutional.inflows > 0) {
        score += 30;
        reasoning.push(`Positive institutional inflows of ${institutional.inflows}M indicate growing professional acceptance`);
      } else if (institutional.inflows < 0) {
        score -= 40;
        reasoning.push(`Institutional outflows of ${Math.abs(institutional.inflows)}M raise concerns about professional sentiment`);
      }
      
      if (institutional.new_entities > 0) {
        score += 20;
        reasoning.push(`${institutional.new_entities} new institutional entities entering the space signals expanding acceptance`);
      }
    }
    
    return { score, reasoning };
  }
}

module.exports = JamieDimonAgent;