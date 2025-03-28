export default class ModelAgent {
    private config;
    constructor(config: any);
    monitorMarket(): void;
    getPredictions(): Promise<Array<{
        symbol: string;
        predictedPrice: number;
        currentPrice: number;
        confidence: number;
    }>>;
}
//# sourceMappingURL=modelAgent.d.ts.map