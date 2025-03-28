declare class WebSocketService {
    private wss;
    private actualPort;
    constructor(preferredPort: number);
    getPort(): number;
}
export declare function startWebSocketServer(port?: number): WebSocketService;
export {};
//# sourceMappingURL=webSocketServer.d.ts.map