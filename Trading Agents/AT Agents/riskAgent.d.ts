export declare enum RiskThreshold {
    CONSERVATIVE = "conservative",
    MODERATE = "moderate",
    AGGRESSIVE = "aggressive"
}
export interface RiskConfig {
    maxLeverage: {
        [key in RiskThreshold]: number;
    };
    marginRiskPercentage: {
        [key in RiskThreshold]: number;
    };
    stopLossPercentage: {
        [key in RiskThreshold]: number;
    };
    signalConfidenceThreshold: number;
    defaultThreshold: RiskThreshold;
}
export interface Position {
    balance: number;
    margin: number;
    currentLeverage?: number;
    openPositions?: number;
}
export interface SignalStrength {
    confidence: number;
    consistency: number;
    volume: number;
}
export default class RiskAgent {
    private config;
    private currentThreshold;
    private signalMultiplier;
    constructor(config: any);
    updateRiskSettings(newSettings: Partial<RiskConfig>): void;
    setRiskThreshold(threshold: RiskThreshold): void;
    adjustRiskWithSignal(signal: SignalStrength): void;
    validateRisk(position: Position): boolean;
    calculateLeverage(position: Position): number;
    getStopLossPercentage(): number;
}
//# sourceMappingURL=riskAgent.d.ts.map