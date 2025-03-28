// utils/indicators/customMACD.ts
export default class SharpeIndicator {
  /**
   * Calculates the Sharpe Ratio.
   * @param returns - Array of asset returns (e.g., daily or monthly returns).
   * @param riskFreeRate - Risk-free rate (e.g., annualized rate divided by periods).
   * @returns The Sharpe Ratio.
   */
  calculate(returns: number[], riskFreeRate: number = 0): number {
    if (returns.length === 0) {
      throw new Error('Returns array cannot be empty.');
    }

    const averageReturn = this.mean(returns);
    const excessReturns = returns.map((r) => r - riskFreeRate);
    const standardDeviation = this.standardDeviation(excessReturns);

    if (standardDeviation === 0) {
      throw new Error('Standard deviation is zero, Sharpe Ratio cannot be calculated.');
    }

    return averageReturn / standardDeviation;
  }

  /**
   * Calculates the mean of an array of numbers.
   * @param data - Array of numbers.
   * @returns The mean value.
   */
  private mean(data: number[]): number {
    return data.reduce((sum, value) => sum + value, 0) / data.length;
  }

  /**
   * Calculates the standard deviation of an array of numbers.
   * @param data - Array of numbers.
   * @returns The standard deviation.
   */
  private standardDeviation(data: number[]): number {
    const meanValue = this.mean(data);
    const variance = data.reduce((sum, value) => sum + Math.pow(value - meanValue, 2), 0) / data.length;
    return Math.sqrt(variance);
  }
}