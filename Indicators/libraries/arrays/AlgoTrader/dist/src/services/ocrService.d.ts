export declare class Logger {
    info(message: string): void;
    error(message: string): void;
}
declare class WebSocketService {
    private wss;
    private actualPort;
    constructor(preferredPort: number);
    getPort(): number;
}
export declare function startWebSocketServer(port?: number): WebSocketService;
export {};
//# sourceMappingURL=ocrService.d.ts.map