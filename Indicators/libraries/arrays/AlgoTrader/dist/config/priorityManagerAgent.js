"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("../utils/logger");
class PriorityManagerAgent {
    constructor(config) {
        this.ocrThreshold = config.ocrThreshold;
        this.predictionThreshold = config.predictionThreshold;
        this.logger = new logger_1.Logger();
    }
    prioritizeData(ocrData, predictions) {
        const prioritizedData = [];
        const validOCRData = ocrData.filter((data) => data.price >= this.ocrThreshold);
        this.logger.info(`Valid OCR data: ${JSON.stringify(validOCRData)}`);
        prioritizedData.push(...validOCRData);
        const validPredictions = predictions.filter((prediction) => prediction.confidence >= this.predictionThreshold);
        this.logger.info(`Valid TensorFlow predictions: ${JSON.stringify(validPredictions)}`);
        prioritizedData.push(...validPredictions);
        prioritizedData.sort((a, b) => b.confidence - a.confidence || b.timestamp - a.timestamp);
        return prioritizedData;
    }
}
exports.default = PriorityManagerAgent;
//# sourceMappingURL=priorityManagerAgent.js.map