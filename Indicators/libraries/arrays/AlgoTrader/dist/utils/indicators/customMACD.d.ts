export default class CustomMACD {
    calculate(data: number[], { fastPeriod, slowPeriod, signalPeriod }?: {
        fastPeriod?: number | undefined;
        slowPeriod?: number | undefined;
        signalPeriod?: number | undefined;
    }): {
        macd: number[];
        signal: number[];
        histogram: number[];
    };
    private ema;
}
//# sourceMappingURL=customMACD.d.ts.map