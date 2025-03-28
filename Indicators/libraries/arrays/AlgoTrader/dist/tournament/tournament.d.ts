export declare class TradingTournament {
    private initialBalance;
    private rebalanceInterval;
    private agents;
    private performances;
    private logger;
    private isRunning;
    private lastRebalanceTime;
    constructor(initialBalance?: number, rebalanceInterval?: number);
    registerAgent(id: string, agent: any, type: string): void;
    start(): void;
    stop(): void;
    private runTournamentCycle;
    private collectSignals;
    private simulateTrades;
    private updatePerformances;
    private rebalanceWeights;
    private displayLeaderboard;
    getLeaderboard(): Array<any>;
    manuallyAdjustWeight(agentId: string, adjustment: number): void;
    private normalizeWeights;
}
//# sourceMappingURL=tournament.d.ts.map