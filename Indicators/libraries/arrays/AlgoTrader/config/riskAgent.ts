import { Logger } from '../utils/logger';

interface RiskConfig {
  maxLeverage: number;
  riskTolerance: number; // Percentage of balance to risk per trade
}

interface Position {
  balance: number;
  margin: number;
  leverage: number;
}

class RiskAgent {
  private maxLeverage: number;
  private riskTolerance: number;
  private logger: Logger;

  constructor(config: RiskConfig) {
    this.maxLeverage = config.maxLeverage;
    this.riskTolerance = config.riskTolerance;
    this.logger = new Logger();
  }

  public calculateLeverage(position: Position): number {
    const riskLevel = position.margin / position.balance;
    const newLeverage = Math.min(this.maxLeverage, Math.max(1, riskLevel * 10));
    this.logger.info(`Calculated leverage: ${newLeverage}`);
    return newLeverage;
  }

  public validateRisk(position: Position): boolean {
    const riskPercentage = (position.margin / position.balance) * 100;
    const isValid = riskPercentage <= this.riskTolerance;
    this.logger.info(`Risk validation: ${isValid ? 'Valid' : 'Exceeded'}`);
    return isValid;
  }

  public adjustRiskTolerance(newTolerance: number): void {
    this.riskTolerance = newTolerance;
    this.logger.info(`Risk tolerance adjusted to: ${newTolerance}%`);
  }

  public adjustMaxLeverage(newLeverage: number): void {
    this.maxLeverage = newLeverage;
    this.logger.info(`Max leverage adjusted to: ${newLeverage}`);
  }
}

export default RiskAgent;