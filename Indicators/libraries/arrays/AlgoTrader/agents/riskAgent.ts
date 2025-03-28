// Risk thresholds enum
export enum RiskThreshold {
  CONSERVATIVE = 'conservative',
  MODERATE = 'moderate',
  AGGRESSIVE = 'aggressive'
}

// Risk configuration interface
export interface RiskConfig {
  maxLeverage: { [key in RiskThreshold]: number };
  marginRiskPercentage: { [key in RiskThreshold]: number };
  stopLossPercentage: { [key in RiskThreshold]: number };
  signalConfidenceThreshold: number;
  defaultThreshold: RiskThreshold;
}

// Position interface to track trading positions
export interface Position {
  balance: number;
  margin: number;
  currentLeverage?: number;
  openPositions?: number;
}

// Signal strength interface for risk adjustment
export interface SignalStrength {
  confidence: number;
  consistency: number; // How consistent are recent signals (0-1)
  volume: number;      // Trading volume factor (0-1)
}

export default class RiskAgent {
  private config: RiskConfig;
  private currentThreshold: RiskThreshold;
  private signalMultiplier: number = 1.0;

  constructor(config: any) {
    // Set conservative defaults if not provided in config
    this.config = {
      maxLeverage: {
        [RiskThreshold.CONSERVATIVE]: 2,    // Very low leverage
        [RiskThreshold.MODERATE]: 5,        // Medium leverage
        [RiskThreshold.AGGRESSIVE]: 10      // High leverage (use cautiously)
      },
      marginRiskPercentage: {
        [RiskThreshold.CONSERVATIVE]: 2,    // Only 2% of balance as margin
        [RiskThreshold.MODERATE]: 5,        // 5% of balance as margin
        [RiskThreshold.AGGRESSIVE]: 10      // 10% of balance as margin
      },
      stopLossPercentage: {
        [RiskThreshold.CONSERVATIVE]: 1,    // Tight 1% stop loss
        [RiskThreshold.MODERATE]: 2.5,      // Medium 2.5% stop loss
        [RiskThreshold.AGGRESSIVE]: 5       // Wider 5% stop loss
      },
      signalConfidenceThreshold: 0.7,       // Minimum confidence to increase risk
      defaultThreshold: RiskThreshold.CONSERVATIVE,
      ...config
    };
    
    // Always start with conservative settings
    this.currentThreshold = this.config.defaultThreshold;
    console.log(`Risk agent initialized with ${this.currentThreshold} threshold`);
  }

  /**
   * Update risk settings via WebSocket configuration
   */
  public updateRiskSettings(newSettings: Partial<RiskConfig>): void {
    this.config = { ...this.config, ...newSettings };
    console.log(`Risk settings updated: ${JSON.stringify(this.config)}`);
  }

  /**
   * Update the current risk threshold via WebSocket slider
   */
  public setRiskThreshold(threshold: RiskThreshold): void {
    this.currentThreshold = threshold;
    console.log(`Risk threshold set to: ${threshold}`);
  }

  /**
   * Adjust risk based on signal strength
   */
  public adjustRiskWithSignal(signal: SignalStrength): void {
    // Only increase risk if signal confidence exceeds threshold
    if (signal.confidence >= this.config.signalConfidenceThreshold) {
      const strengthFactor = (signal.confidence * 0.5) + 
                             (signal.consistency * 0.3) + 
                             (signal.volume * 0.2);
      
      // Scale between 1.0 (no change) and 1.5 (50% increase)
      this.signalMultiplier = 1.0 + (strengthFactor * 0.5); 
      
      console.log(`Risk adjusted based on signal strength. Multiplier: ${this.signalMultiplier}`);
      
      // Potentially upgrade risk threshold if signals are very strong
      if (strengthFactor > 0.8 && this.currentThreshold === RiskThreshold.CONSERVATIVE) {
        this.currentThreshold = RiskThreshold.MODERATE;
        console.log("Strong signals detected: Risk threshold increased to MODERATE");
      }
    } else {
      // Reset to conservative if signal is weak
      this.signalMultiplier = 1.0;
      if (this.currentThreshold !== RiskThreshold.CONSERVATIVE) {
        this.currentThreshold = RiskThreshold.CONSERVATIVE;
        console.log("Weak signals detected: Risk threshold reset to CONSERVATIVE");
      }
    }
  }

  /**
   * Validate if a position meets risk management rules
   */
  public validateRisk(position: Position): boolean {
    console.log(`Validating risk with ${this.currentThreshold} threshold...`);
    
    // Calculate max allowed margin for this risk level
    const maxMarginPercentage = this.config.marginRiskPercentage[this.currentThreshold];
    const maxMargin = position.balance * (maxMarginPercentage / 100);
    
    // Apply signal multiplier to max margin (only if it would increase it)
    const adjustedMaxMargin = this.currentThreshold !== RiskThreshold.AGGRESSIVE ? 
      maxMargin * this.signalMultiplier : maxMargin;
    
    // Calculate if current margin exceeds adjusted max margin
    const isWithinMarginLimit = position.margin <= adjustedMaxMargin;
    
    console.log(`Risk validation: ${isWithinMarginLimit ? 'PASSED' : 'FAILED'}`);
    console.log(`Current margin: ${position.margin}, Max allowed: ${adjustedMaxMargin}`);
    
    return isWithinMarginLimit;
  }

  /**
   * Calculate appropriate leverage based on current risk settings
   */
  public calculateLeverage(position: Position): number {
    console.log(`Calculating leverage with ${this.currentThreshold} threshold...`);
    
    // Get base max leverage for current threshold
    const baseMaxLeverage = this.config.maxLeverage[this.currentThreshold];
    
    // Apply signal multiplier (capped at aggressive threshold)
    let adjustedMaxLeverage = baseMaxLeverage * this.signalMultiplier;
    const absoluteMaxLeverage = this.config.maxLeverage[RiskThreshold.AGGRESSIVE];
    
    // Never exceed the absolute maximum leverage
    if (adjustedMaxLeverage > absoluteMaxLeverage) {
      adjustedMaxLeverage = absoluteMaxLeverage;
    }
    
    // Calculate position size based on margin and risk settings
    // For simplicity, we'll return a value between 1 and adjustedMaxLeverage
    // In a real system, this would be more complex
    const riskRatio = position.margin / position.balance;
    const safeMaxLeverage = Math.min(
      adjustedMaxLeverage,
      1 + (adjustedMaxLeverage - 1) * (1 - riskRatio * 10)
    );
    
    // Ensure leverage is at least 1x
    const finalLeverage = Math.max(1, safeMaxLeverage);
    
    console.log(`Calculated leverage: ${finalLeverage}x (base max: ${baseMaxLeverage}x, adjusted max: ${adjustedMaxLeverage}x)`);
    
    return finalLeverage;
  }

  /**
   * Get recommended stop loss percentage based on risk settings
   */
  public getStopLossPercentage(): number {
    return this.config.stopLossPercentage[this.currentThreshold];
  }
}