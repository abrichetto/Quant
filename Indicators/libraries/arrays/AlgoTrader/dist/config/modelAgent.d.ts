declare class Logger {
    info(message: string): void;
    warn(message: string): void;
    error(message: string): void;
}
export { Logger };
interface HistoricalData {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}
interface ModelConfig {
    indicators: string[];
    historicalData: HistoricalData[];
    riskRewardRatio: number;
    volatilityThreshold: number;
}
declare class ModelAgent {
    private indicators;
    private historicalData;
    private riskRewardRatio;
    private volatilityThreshold;
    private logger;
    constructor(config: ModelConfig);
    private calculateVolatility;
    private backtestStrategy;
    monitorMarket(riskAgent: any): void;
}
export default ModelAgent;
//# sourceMappingURL=modelAgent.d.ts.map