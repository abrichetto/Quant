import { TradingTournament } from './tournament';
export declare class TournamentWebUI {
    private tournament;
    private port;
    private app;
    private server;
    private io;
    constructor(tournament: TradingTournament, port?: number);
    private setupRoutes;
    private setupWebSockets;
}
//# sourceMappingURL=webUI.d.ts.map