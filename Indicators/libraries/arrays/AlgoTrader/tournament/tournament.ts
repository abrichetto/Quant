import { SignalAgent, RiskAgent, TraderAgent, PriorityManagerAgent, ModelAgent } from '../agents';
import { Logger } from '../utils/logger';

interface TradingSignal {
  type: string;
  confidence: number;
  action: string;
  agentId: string;
  weight: number;
}

interface AgentPerformance {
  id: string;
  type: string;
  pnl: number;
  winRate: number;
  tradingVolume: number;
  score: number;
  weight: number;
  initialBalance: number;
  currentBalance: number;
}

export class TradingTournament {
  private agents: Map<string, any> = new Map();
  private performances: Map<string, AgentPerformance> = new Map();
  private logger: Logger = new Logger();
  private isRunning = false;
  private lastRebalanceTime = Date.now();

  constructor(private initialBalance = 10000, private rebalanceInterval = 60 * 60 * 1000) {} // 1 hour default

  registerAgent(id: string, agent: any, type: string): void {
    this.agents.set(id, agent);
    this.performances.set(id, {
      id,
      type,
      pnl: 0,
      winRate: 0,
      tradingVolume: 0,
      score: 0,
      weight: 1.0, // Initial equal weight
      initialBalance: this.initialBalance,
      currentBalance: this.initialBalance
    });
    this.logger.info(`Registered agent: ${id} (${type})`);
  }

  start(): void {
    this.isRunning = true;
    this.logger.info('Tournament started');
    this.runTournamentCycle();
  }

  stop(): void {
    this.isRunning = false;
    this.logger.info('Tournament stopped');
  }

  private async runTournamentCycle(): Promise<void> {
    if (!this.isRunning) return;
    
    try {
      // 1. Check if we need to rebalance weights
      if (Date.now() - this.lastRebalanceTime >= this.rebalanceInterval) {
        this.rebalanceWeights();
        this.lastRebalanceTime = Date.now();
      }

      // 2. Collect signals from all agents
      this.logger.info('Collecting signals from agents...');
      const signals = await this.collectSignals();
      
      // 3. Execute simulated trades
      const results = this.simulateTrades(signals);
      
      // 4. Update agent performances
      this.updatePerformances(results);
      
    } catch (error) {
      this.logger.error(`Tournament cycle error: ${error}`);
    }
    setTimeout(() => this.runTournamentCycle(), 5 * 60 * 1000);
  }

  private async collectSignals(): Promise<TradingSignal[]> {
    const allSignals: TradingSignal[] = [];
    
    for (const [id, agent] of this.agents.entries()) {
      try {
        const performance = this.performances.get(id);
        if (!performance) continue;
        
        // Different agent types provide different signals
        let signals: { type: string; confidence: number; action: string; }[] = [];
        if (agent instanceof SignalAgent) {
          await agent.monitor();
          signals = [{ type: 'market', confidence: 0.8, action: 'buy' }]; // Example
        } else if (agent instanceof ModelAgent) {
          agent.monitorMarket();
          signals = [{ type: 'prediction', confidence: 0.75, action: 'sell' }]; // Example
        }
        
        // Apply agent weight to signals
        signals.forEach(signal => {
          allSignals.push({
            ...signal,
            agentId: id,
            weight: performance.weight
          });
        });
        
      } catch (error) {
        this.logger.error(`Error collecting signals from ${id}: ${error}`);
      }
    }
    
    return allSignals;
  }

  private simulateTrades(signals: any[]): any[] {
    // Simple simulation - in real implementation, would use historical data
    return signals.map(signal => {
      const success = Math.random() > 0.5;
      const pnlPercent = success ? 
        (signal.confidence * 5) + (Math.random() * 5) : // Winning trade
        -((signal.confidence * 2) + (Math.random() * 3)); // Losing trade
      
      return {
        ...signal,
        success,
        pnlPercent
      };
    });
  }

  private updatePerformances(results: any[]): void {
    for (const result of results) {
      const performance = this.performances.get(result.agentId);
      if (!performance) continue;
      
      // Update performance metrics
      performance.tradingVolume += 1;
      
      // Calculate PnL in dollars
      const pnlAmount = performance.currentBalance * (result.pnlPercent / 100);
      performance.currentBalance += pnlAmount;
      
      // Update win rate
      const wins = performance.winRate * performance.tradingVolume;
      performance.winRate = (wins + (result.success ? 1 : 0)) / (performance.tradingVolume);
      
      // Calculate overall PnL percentage
      performance.pnl = (performance.currentBalance / performance.initialBalance - 1) * 100;
      
      // Calculate score (weighted combination of PnL and win rate)
      performance.score = (performance.pnl * 0.7) + (performance.winRate * 100 * 0.3);
      
      this.logger.info(
        `Agent ${result.agentId}: ${result.success ? 'WON' : 'LOST'} ${result.pnlPercent.toFixed(2)}%, ` +
        `Balance: $${performance.currentBalance.toFixed(2)}`
      );
    }
  }
  
  private rebalanceWeights(): void {
    this.logger.info('Rebalancing agent weights...');
    
    // Sort by performance (highest score first)
    const sortedPerformances = Array.from(this.performances.values())
      .sort((a, b) => b.score - a.score);
    
    // Only rebalance if we have enough agents
    if (sortedPerformances.length < 2) return;
    
    // Calculate adjustment factor (5%)
    const adjustmentFactor = 0.05;
    
    // Adjust weights - better performers get increased weight
    sortedPerformances.forEach((perf, index) => {
      // Top performer gets positive boost, lowest gets negative
      const position = index / (sortedPerformances.length - 1); // 0 for top, 1 for bottom
      const adjustment = adjustmentFactor * (0.5 - position); // Range from +2.5% to -2.5%
      
      perf.weight = Math.max(0.05, Math.min(1, perf.weight * (1 + adjustment)));
    });
    
    // Normalize weights
    this.normalizeWeights();
    
    this.displayLeaderboard();
  }

  private displayLeaderboard(): void {
    this.logger.info('Current Tournament Standings:');
    const sortedPerformances = Array.from(this.performances.values())
      .sort((a, b) => b.score - a.score);
    
    sortedPerformances.forEach((perf, index) => {
      this.logger.info(
        `${index + 1}. ${perf.id} (${perf.type}): Score=${perf.score.toFixed(2)}, ` +
        `PnL=${perf.pnl.toFixed(2)}%, Win Rate=${(perf.winRate * 100).toFixed(2)}%`
      );
    });
  }

  public getLeaderboard(): Array<any> {
    // Return the current leaderboard
    return Array.from(this.performances.values())
      .sort((a, b) => b.pnl - a.pnl);
  }

  public manuallyAdjustWeight(agentId: string, adjustment: number): void {
    const performance = this.performances.get(agentId);
    if (performance) {
      // Use a minimum weight of 0.05 instead of this.config.minWeight which doesn't exist
      performance.weight = Math.max(
        0.05, // Minimum weight
        Math.min(1, performance.weight + adjustment)
      );
      
      // Need to implement the normalizeWeights method
      this.normalizeWeights();
    }
  }

  private normalizeWeights(): void {
    // Calculate sum of all weights
    let weightSum = 0;
    this.performances.forEach(performance => {
      weightSum += performance.weight;
    });
    
    // Normalize each weight so they sum to 1
    if (weightSum > 0) {
      this.performances.forEach(performance => {
        performance.weight = performance.weight / weightSum;
      });
    }
  }
}