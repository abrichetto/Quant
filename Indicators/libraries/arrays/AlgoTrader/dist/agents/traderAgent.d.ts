export interface TradeSignal {
    action: 'buy' | 'sell';
    symbol: string;
    amount: number;
}
export interface TraderConfig {
    platform: any;
}
export default class TraderAgent {
    private platform;
    constructor(config: TraderConfig);
    executeTrade(signal: TradeSignal): Promise<void>;
}
//# sourceMappingURL=traderAgent.d.ts.map