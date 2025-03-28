"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startOCRService = startOCRService;
require("module-alias/register");
const riskAgent_1 = __importDefault(require("./agents/riskAgent"));
const signalAgent_1 = __importDefault(require("./agents/signalAgent"));
const traderAgent_1 = __importDefault(require("./agents/traderAgent"));
const priorityManagerAgent_1 = __importDefault(require("./agents/priorityManagerAgent"));
const modelAgent_1 = __importDefault(require("./agents/modelAgent"));
const webSocketServer_1 = require("./utils/webSocketServer");
const logger_1 = require("./utils/logger");
const config_1 = require("./config");
const logger = new logger_1.Logger();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            logger.info("Initializing AlgoTrader Pro...");
            const riskAgent = new riskAgent_1.default(config_1.config.riskManager);
            const wsServer = (0, webSocketServer_1.startWebSocketServer)(5010);
            const signalAgent = new signalAgent_1.default(config_1.config.newsParser);
            const traderAgent = new traderAgent_1.default({ platform: config_1.config.platform });
            const priorityManagerAgent = new priorityManagerAgent_1.default(config_1.config.priorityManager);
            const modelAgent = new modelAgent_1.default(config_1.config);
            logger.info("All services initialized successfully.");
            startTradingCycle();
        }
        catch (error) {
            if (error instanceof Error) {
                logger.error(`Failed to initialize AlgoTrader Pro: ${error.message}`);
                console.error('Stack trace:', error.stack);
            }
            else {
                logger.error(`Unknown error during initialization: ${String(error)}`);
                console.error('Unknown error:', error);
            }
            process.exit(1);
        }
    });
}
function startTradingCycle() {
    return __awaiter(this, void 0, void 0, function* () {
        logger.info("Starting trading cycle...");
    });
}
main().catch((error) => {
    logger.error(`Unhandled error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
});
function startOCRService() {
}
//# sourceMappingURL=main.js.map