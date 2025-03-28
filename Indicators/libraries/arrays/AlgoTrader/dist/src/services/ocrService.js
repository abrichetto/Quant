"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
exports.startWebSocketServer = startWebSocketServer;
const https = __importStar(require("https"));
const ws_1 = require("ws");
class Logger {
    info(message) {
        console.log(`INFO: ${message}`);
    }
    error(message) {
        console.error(`ERROR: ${message}`);
    }
}
exports.Logger = Logger;
class WebSocketService {
    constructor(preferredPort) {
        const server = https.createServer();
        server.listen(preferredPort, () => {
            this.actualPort = preferredPort;
            const logger = new Logger();
            logger.info(`WebSocket server started on ws://localhost:${preferredPort}`);
        });
        server.on('error', (error) => {
            const logger = new Logger();
            if (error.code === 'EADDRINUSE') {
                logger.error(`Port ${preferredPort} is already in use.`);
                process.exit(1);
            }
            else {
                throw error;
            }
        });
        this.wss = new ws_1.WebSocketServer({ server });
        this.wss.on('connection', (ws) => {
            const logger = new Logger();
            logger.info('New WebSocket client connected');
            ws.send(JSON.stringify({ message: 'Welcome to the WebSocket server!' }));
            ws.on('message', (message) => {
                const logger = new Logger();
                logger.info(`Received message: ${message}`);
                ws.send(`Echo: ${message}`);
            });
            ws.on('close', () => {
                const logger = new Logger();
                logger.info('WebSocket client disconnected');
            });
        });
    }
    getPort() {
        return this.actualPort;
    }
}
function startWebSocketServer(port = 3031) {
    return new WebSocketService(port);
}
//# sourceMappingURL=ocrService.js.map