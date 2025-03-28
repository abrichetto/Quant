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
  constructor(private config: any) {}

  public prioritizeData(ocrData: OCRData[], predictions: Prediction[]): PrioritizedData[] {
    console.log(`Prioritizing data for ${ocrData.length} market entries and ${predictions.length} predictions`);
    
    // Create a map of symbols to their prediction data
    const predictionMap = new Map<string, Prediction>();
    predictions.forEach(prediction => {
      predictionMap.set(prediction.symbol, prediction);
    });
    
    // Process each OCR data point
    const result = ocrData
      .filter(data => predictionMap.has(data.symbol))
      .map(data => {
        const prediction = predictionMap.get(data.symbol)!;
        
        // Calculate priority score based on confidence and potential price movement
        const priorityScore = prediction.confidence * 
          Math.abs((prediction.predictedPrice - data.price) / data.price);
        
        return {
          symbol: data.symbol,
          price: data.price,
          predictedPrice: prediction.predictedPrice,
          confidence: prediction.confidence,
          priorityScore: priorityScore
        };
      })
      .sort((a, b) => b.priorityScore - a.priorityScore);
    
    return result;
  }
}