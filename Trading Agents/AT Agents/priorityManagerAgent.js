"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelAgent = exports.TraderAgent = exports.RiskAgent = exports.SignalAgent = void 0;
var signalAgent_1 = require("./signalAgent");
Object.defineProperty(exports, "SignalAgent", { enumerable: true, get: function () { return __importDefault(signalAgent_1).default; } });
var riskAgent_1 = require("./riskAgent");
Object.defineProperty(exports, "RiskAgent", { enumerable: true, get: function () { return __importDefault(riskAgent_1).default; } });
var traderAgent_1 = require("./traderAgent");
Object.defineProperty(exports, "TraderAgent", { enumerable: true, get: function () { return __importDefault(traderAgent_1).default; } });
var modelAgent_1 = require("./modelAgent");
Object.defineProperty(exports, "ModelAgent", { enumerable: true, get: function () { return __importDefault(modelAgent_1).default; } });
class PriorityManagerAgent {
    constructor(config) {
        this.config = config;
    }
    prioritizeData(ocrData, predictions) {
        console.log(`Prioritizing data for ${ocrData.length} market entries and ${predictions.length} predictions`);
        const predictionMap = new Map();
        predictions.forEach(prediction => {
            predictionMap.set(prediction.symbol, prediction);
        });
        const result = ocrData
            .filter(data => predictionMap.has(data.symbol))
            .map(data => {
            const prediction = predictionMap.get(data.symbol);
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
exports.default = PriorityManagerAgent;
//# sourceMappingURL=priorityManagerAgent.js.map