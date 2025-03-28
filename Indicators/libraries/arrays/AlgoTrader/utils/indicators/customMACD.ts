// utils/indicators/customMACD.ts
export default class CustomMACD {
  /**
   * Calculates the MACD, Signal Line, and Histogram.
   * @param data - Array of price data.
   * @param options - Configuration for MACD calculation.
   * @param options.fastPeriod - Period for the fast EMA (default: 12).
   * @param options.slowPeriod - Period for the slow EMA (default: 26).
   * @param options.signalPeriod - Period for the signal line EMA (default: 9).
   * @returns An object containing the MACD, Signal Line, and Histogram arrays.
   */
  calculate(
    data: number[],
    { fastPeriod = 12, slowPeriod = 26, signalPeriod = 9 } = {}
  ): { macd: number[]; signal: number[]; histogram: number[] } {
    if (data.length < slowPeriod) {
      throw new Error('Data length must be greater than or equal to the slow period.');
    }

    const slowEMA = this.ema(data, slowPeriod);
    const fastEMA = this.ema(data, fastPeriod);

    // Calculate MACD line (difference between fast EMA and slow EMA)
    const macd = fastEMA.map((value, index) => value - slowEMA[index]);

    // Calculate Signal line (EMA of MACD line)
    const signal = this.ema(macd.slice(slowPeriod - 1), signalPeriod);

    // Calculate Histogram (difference between MACD and Signal line)
    const histogram = macd.slice(slowPeriod - 1).map((value, index) => value - signal[index]);

    return { macd: macd.slice(slowPeriod - 1), signal, histogram };
  }

  /**
   * Calculates the Exponential Moving Average (EMA).
   * @param data - Array of price data.
   * @param period - Period for the EMA calculation.
   * @returns An array containing the EMA values.
   */
  private ema(data: number[], period: number): number[] {
    const multiplier = 2 / (period + 1);
    const ema: number[] = [];

    // Start with the simple moving average (SMA) for the first EMA value
    const sma = data.slice(0, period).reduce((sum, value) => sum + value, 0) / period;
    ema.push(sma);

    // Calculate the rest of the EMA values
    for (let i = period; i < data.length; i++) {
      const value = (data[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1];
      ema.push(value);
    }

    return ema;
  }
}