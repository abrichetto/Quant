interface RiskConfig {
    maxLeverage: number;
    riskTolerance: number;
}
interface Position {
    balance: number;
    margin: number;
    leverage: number;
}
declare class RiskAgent {
    private maxLeverage;
    private riskTolerance;
    private logger;
    constructor(config: RiskConfig);
    calculateLeverage(position: Position): number;
    validateRisk(position: Position): boolean;
    adjustRiskTolerance(newTolerance: number): void;
    adjustMaxLeverage(newLeverage: number): void;
}
export default RiskAgent;
//# sourceMappingURL=riskAgent.d.ts.map