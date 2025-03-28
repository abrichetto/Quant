class WarrenBuffettAgent extends PortfolioManagerAgent {
  constructor(config = {}) {
    super(config);
    this.name = 'Warren Buffett (Berkshire Hathaway)';
    this.bias = -85; // Initial skepticism for cryptocurrencies
    this.riskTolerance = 20; // Very risk-averse
    this.timeHorizon = 'very-long'; // Very long-term investor
    this.focusAreas = ['intrinsic-value', 'cash-flow', 'moats', 'productive-assets'];
    this.signalThreshold = 85; // Extremely high threshold - needs overwhelming evidence
  }
  
  evaluateSignal(signal) {
    console.log(`${this.name} evaluating ${signal.symbol}...`);
    
    // Value assessment (60%)
    const value = this._evaluateValue(signal);
    
    // Risk assessment (30%)
    const risk = this._evaluateRisk(signal);
    
    // Evidence strength (10%) - Buffett values strong evidence
    const evidence = this._evaluateEvidenceStrength(signal);
    
    // Calculate weighted score
    const score = (
      value.score * 0.6 +
      risk.score * 0.3 +
      evidence.score * 0.1
    );
    
    // Adjust for personal bias (less impact when evidence is strong)
    // This allows Buffett to overcome his bias when presented with strong evidence
    const evidenceStrength = evidence.score / 100; // 0-1 scale
    const biasWeight = Math.max(0.05, 0.3 - (evidenceStrength * 0.25)); // Reduces bias impact with strong evidence
    const adjustedScore = Math.min(100, Math.max(-100, score + (this.bias * biasWeight)));
    
    // Determine recommendation
    let recommendation;
    if (adjustedScore >= 75) recommendation = 'STRONG_BUY';
    else if (adjustedScore >= 25) recommendation = 'BUY';
    else if (adjustedScore > -25) recommendation = 'NEUTRAL';
    else if (adjustedScore > -75) recommendation = 'SELL';
    else recommendation = 'STRONG_SELL';
    
    // Calculate confidence - higher with stronger evidence
    const confidence = Math.min(1.0, 0.4 + (evidence.score / 100) * 0.5);
    
    // Compile reasoning
    const reasoning = [
      ...value.reasoning,
      ...risk.reasoning,
      ...evidence.reasoning
    ];
    
    // Add the classic Buffett view but acknowledge evidence when strong
    if (signal.symbol === 'BTC' || signal.symbol === 'ETH') {
      reasoning.push(`${signal.symbol} traditionally lacks productive capacity I seek in investments`);
      
      if (evidence.score > 70) {
        reasoning.push("However, the evidence presented is substantial and merits consideration despite my traditional skepticism");
        reasoning.push("I've been wrong before about technology investments, and I recognize when data strongly supports an investment thesis");
      }
    }
    
    return {
      recommendation,
      confidence,
      reasoning
    };
  }
  
  // [Other evaluation methods remain unchanged]
  
  /**
   * Evaluate the strength of evidence supporting this investment
   * @private
   */
  _evaluateEvidenceStrength(signal) {
    const reasoning = [];
    let score = 0;
    
    // Check for strong research backing
    if (signal.research && signal.research.sources) {
      if (signal.research.sources.length >= 3) {
        score += 20;
        reasoning.push("Multiple independent research sources provide supporting evidence");
      }
      
      if (signal.research.peer_reviewed) {
        score += 15;
        reasoning.push("Peer-reviewed analysis adds credibility to the investment thesis");
      }
    }
    
    // Check for strong quantitative backing
    if (signal.quantitative) {
      if (signal.quantitative.backtested && signal.quantitative.backtested.years >= 5) {
        score += 25;
        reasoning.push(`${signal.quantitative.backtested.years}-year backtest shows consistent performance patterns`);
      }
      
      if (signal.quantitative.statistical_significance > 0.95) {
        score += 20;
        reasoning.push("Statistical significance exceeds my threshold for coincidence");
      }
    }
    
    // Check for adoption metrics - Buffett respects proven adoption
    if (signal.fundamentals && signal.fundamentals.adoption) {
      if (signal.fundamentals.adoption.institutional && signal.fundamentals.adoption.institutional > 30) {
        score += 20;
        reasoning.push(`${signal.fundamentals.adoption.institutional}% institutional adoption suggests legitimacy beyond speculation`);
      }
    }
    
    return { score, reasoning };
  }
}