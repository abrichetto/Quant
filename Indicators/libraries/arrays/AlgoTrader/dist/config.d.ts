export declare const config: {
    newsParser: {
        sources: {
            name: string;
            rssUrl: string;
            weight: number;
        }[];
    };
    riskManager: {
        maxLeverage: {
            conservative: number;
            moderate: number;
            aggressive: number;
        };
        marginRiskPercentage: {
            conservative: number;
            moderate: number;
            aggressive: number;
        };
        stopLossPercentage: {
            conservative: number;
            moderate: number;
            aggressive: number;
        };
        signalConfidenceThreshold: number;
        defaultThreshold: string;
    };
    platform: {
        apiUrl: string;
        apiKey: string;
        placeOrder: string;
    };
    priorityManager: {
        ocrThreshold: number;
        predictionThreshold: number;
        signalWeightThreshold: number;
    };
    tournament: {
        rebalancePeriod: number;
        maxWeightDelta: number;
        initialWeight: number;
        minWeight: number;
        adjustmentFactor: number;
        enableRebalancing: boolean;
        simulationMode: boolean;
        performanceDecayFactor: number;
    };
    paths: {
        "utils/*": string[];
    };
};
//# sourceMappingURL=config.d.ts.map