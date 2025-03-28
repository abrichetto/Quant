import { Logger } from '../utils/logger';

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
  ocrThreshold: number; // Minimum confidence for OCR data
  predictionThreshold: number; // Minimum confidence for TensorFlow predictions
}

class PriorityManagerAgent {
  private ocrThreshold: number;
  private predictionThreshold: number;
  private logger: Logger;

  constructor(config: PriorityManagerConfig) {
    this.ocrThreshold = config.ocrThreshold;
    this.predictionThreshold = config.predictionThreshold;
    this.logger = new Logger();
  }

  public prioritizeData(ocrData: OCRData[], predictions: TensorFlowPrediction[]): any[] {
    const prioritizedData: any[] = [];

    // Filter and prioritize OCR data
    const validOCRData = ocrData.filter((data) => data.price >= this.ocrThreshold);
    this.logger.info(`Valid OCR data: ${JSON.stringify(validOCRData)}`);
    prioritizedData.push(...validOCRData);

    // Filter and prioritize TensorFlow predictions
    const validPredictions = predictions.filter((prediction) => prediction.confidence >= this.predictionThreshold);
    this.logger.info(`Valid TensorFlow predictions: ${JSON.stringify(validPredictions)}`);
    prioritizedData.push(...validPredictions);

    // Sort by timestamp or confidence
    prioritizedData.sort((a, b) => b.confidence - a.confidence || b.timestamp - a.timestamp);

    return prioritizedData;
  }
}

export default PriorityManagerAgent;