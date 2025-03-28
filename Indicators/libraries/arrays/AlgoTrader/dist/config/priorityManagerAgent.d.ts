interface OCRData {
    symbol: string;
    price: number;
    timestamp: number;
}
interface TensorFlowPrediction {
    symbol: string;
    predictedPrice: number;
    confidence: number;
}
interface PriorityManagerConfig {
    ocrThreshold: number;
    predictionThreshold: number;
}
declare class PriorityManagerAgent {
    private ocrThreshold;
    private predictionThreshold;
    private logger;
    constructor(config: PriorityManagerConfig);
    prioritizeData(ocrData: OCRData[], predictions: TensorFlowPrediction[]): any[];
}
export default PriorityManagerAgent;
//# sourceMappingURL=priorityManagerAgent.d.ts.map