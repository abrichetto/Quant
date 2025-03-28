interface AgentPerformance {
    id: string;
    name: string;
    type: string;
    wins: number;
    losses: number;
    pnl: number;
    successRate: number;
    weight: number;
    trades: number;
}
export interface LocalTournamentConfig {
    rebalancePeriod: number;
    maxWeightDelta: number;
    initialWeight: number;
    minWeight: number;
    adjustmentFactor: number;
    enableRebalancing: boolean;
    simulationMode: boolean;
    performanceDecayFactor: number;
}
export default class TournamentAgent {
    private agents;
    private performances;
    private config;
    private logger;
    private lastRebalanceTime;
    private isRunning;
    constructor(config?: Partial<LocalTournamentConfig>);
    registerAgent(id: string, agent: any, name: string, type: string): void;
    start(): Promise<void>;
    stop(): void;
    getLeaderboard(): AgentPerformance[];
    private runTournamentCycle;
    private collectSignals;
    private getAgentSignals;
    private simulateTrades;
    private updatePerformances;
    private rebalanceWeights;
    private normalizeWeights;
}
export {};
//# sourceMappingURL=tournamentAgent.d.ts.map