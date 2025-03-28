interface SignalAgentConfig {
    sources: Array<{
        name: string;
        rssUrl: string;
        weight: number;
    }>;
}
declare class SignalAgent {
    #private;
    constructor(config: SignalAgentConfig);
    monitor(): Promise<void>;
}
export default SignalAgent;
//# sourceMappingURL=signalAgent.d.ts.map