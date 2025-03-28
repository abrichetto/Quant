export { default as SignalAgent } from './signalAgent';
export { default as RiskAgent } from './riskAgent';
export { default as TraderAgent } from './traderAgent';
export { default as ModelAgent } from './modelAgent';
type OCRData = {
    symbol: string;
    price: number;
    timestamp: number;
};
type Prediction = {
    symbol: string;
    predictedPrice: number;
    confidence: number;
    currentPrice?: number;
};
export type PrioritizedData = {
    symbol: string;
    price: number;
    predictedPrice: number;
    confidence: number;
    priorityScore: number;
};
export default class PriorityManagerAgent {
    private config;
    constructor(config: any);
    prioritizeData(ocrData: OCRData[], predictions: Prediction[]): PrioritizedData[];
}
//# sourceMappingURL=priorityManagerAgent.d.ts.map