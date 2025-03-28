import { SignalAgent, RiskAgent, TraderAgent, PriorityManagerAgent, ModelAgent } from '../agents';
import { Logger } from '../utils/logger';

// Types for tournament participants and performance tracking
interface AgentPerformance {
  id: string;
  name: string;
  type: string;
  wins: number;
  losses: number;
  pnl: number;
  successRate: number;
  weight: number;  // Influence weight in the system (0-1)
  trades: number;  // Total trades executed
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
  private agents: Map<string, any>;
  private performances: Map<string, AgentPerformance>;
  private config: LocalTournamentConfig;
  private logger: Logger;
  private lastRebalanceTime: number;
  private isRunning: boolean;

  constructor(config: Partial<LocalTournamentConfig> = {}) {
    // Default tournament configuration
    this.config = {
      rebalancePeriod: 3600000, // 1 hour
      maxWeightDelta: 0.05,     // 5% max adjustment
      initialWeight: 0.2,       // 20% starting weight
      minWeight: 0.05,          // 5% minimum weight
      adjustmentFactor: 0.8,    // Moderately aggressive adjustment
      enableRebalancing: true,
      simulationMode: true,     // Default to simulation mode for safety
      performanceDecayFactor: 0.9,
      ...config
    };

    this.agents = new Map();
    this.performances = new Map();
    this.logger = new Logger();
    this.lastRebalanceTime = Date.now();
    this.isRunning = false;
  }

  /**
   * Register an agent to participate in the tournament
   */
  public registerAgent(id: string, agent: any, name: string, type: string): void {
    this.agents.set(id, agent);
    
    this.performances.set(id, {
      id,
      name,
      type,
      wins: 0,
      losses: 0,
      pnl: 0,
      successRate: 0,
      weight: this.config.initialWeight,
      trades: 0
    });
    
    this.logger.info(`Registered agent: ${name} (${type}) with ID ${id}`);
  }

  /**
   * Start the tournament
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.info("Tournament is already running");
      return;
    }
    
    this.isRunning = true;
    this.logger.info(`Starting tournament with ${this.agents.size} agents`);
    
    // Normalize weights on start
    this.normalizeWeights();
    
    // Begin tournament cycle
    this.runTournamentCycle();
  }

  /**
   * Stop the tournament
   */
  public stop(): void {
    this.isRunning = false;
    this.logger.info("Tournament stopped");
  }

  /**
   * Get tournament leaderboard
   */
  public getLeaderboard(): AgentPerformance[] {
    return Array.from(this.performances.values())
      .sort((a, b) => b.pnl - a.pnl);
  }

  /**
   * Main tournament cycle: collect signals, simulate trades, update performance
   */
  private async runTournamentCycle(): Promise<void> {
    if (!this.isRunning) return;
    
    try {
      // Check if we need to rebalance weights
      if (this.config.enableRebalancing && 
          (Date.now() - this.lastRebalanceTime >= this.config.rebalancePeriod)) {
        this.rebalanceWeights();
        this.lastRebalanceTime = Date.now();
      }

      // Collect signals from all agents
      this.logger.info('Collecting signals from agents...');
      const signals = await this.collectSignals();
      
      // Execute simulated trades
      const results = this.simulateTrades(signals);
      
      // Update agent performances
      this.updatePerformances(results);
      
      // Schedule next cycle
      setTimeout(() => this.runTournamentCycle(), 5 * 60 * 1000); // Run every 5 minutes
    } catch (error) {
      this.logger.error(`Tournament cycle error: ${error instanceof Error ? error.message : String(error)}`);
      // Continue tournament even if there was an error
      setTimeout(() => this.runTournamentCycle(), 5 * 60 * 1000);
    }
  }

  /**
   * Collect trading signals from all agents
   */
  private async collectSignals(): Promise<Array<{
    agentId: string;
    symbol: string;
    action: 'buy' | 'sell' | 'hold';
    confidence: number;
    timestamp: number;
  }>> {
    const allSignals: Array<{
      agentId: string;
      symbol: string;
      action: 'buy' | 'sell' | 'hold';
      confidence: number;
      timestamp: number;
    }> = [];
    
    for (const [id, agent] of this.agents.entries()) {
      try {
        const performance = this.performances.get(id);
        if (!performance) continue;
        
        // Different agent types provide different signals
        if (agent instanceof SignalAgent) {
          await agent.monitor();
          // Get signals from agent's internal state or via a method call
          const agentSignals = await this.getAgentSignals(agent, 'signal');
          
          agentSignals.forEach(signal => {
            allSignals.push({
              agentId: id,
              symbol: signal.symbol,
              action: signal.action,
              confidence: signal.confidence * performance.weight, // Apply weight
              timestamp: Date.now()
            });
          });
        } 
        else if (agent instanceof ModelAgent) {
          agent.monitorMarket();
          // Get predictions from model agent
          const predictions = await agent.getPredictions();
          
          predictions.forEach(prediction => {
            const action = prediction.predictedPrice > prediction.currentPrice ? 'buy' : 'sell';
            allSignals.push({
              agentId: id,
              symbol: prediction.symbol,
              action,
              confidence: prediction.confidence * performance.weight, // Apply weight
              timestamp: Date.now()
            });
          });
        }
        // Add other agent types here
      } catch (error) {
        this.logger.error(`Error collecting signals from agent ${id}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    return allSignals;
  }

  /**
   * Get signals from an agent based on its type
   */
  private async getAgentSignals(agent: any, type: string): Promise<Array<{
    symbol: string;
    action: 'buy' | 'sell' | 'hold';
    confidence: number;
  }>> {
    // This is a placeholder - in a real implementation, you would have agent-specific methods
    // to get their signals or access their internal state
    
    // For now, return some mock signals
    return [
      { symbol: 'BTC', action: 'buy', confidence: 0.85 },
      { symbol: 'ETH', action: 'buy', confidence: 0.75 },
      { symbol: 'SOL', action: 'sell', confidence: 0.65 }
    ];
  }

  /**
   * Simulate trades based on collected signals
   */
  private simulateTrades(signals: Array<{
    agentId: string;
    symbol: string;
    action: 'buy' | 'sell' | 'hold';
    confidence: number;
    timestamp: number;
  }>): Array<{
    agentId: string;
    symbol: string;
    action: 'buy' | 'sell' | 'hold';
    success: boolean;
    pnl: number;
  }> {
    // Group signals by symbol
    const symbolSignals = new Map<string, typeof signals>();
    signals.forEach(signal => {
      if (!symbolSignals.has(signal.symbol)) {
        symbolSignals.set(signal.symbol, []);
      }
      symbolSignals.get(signal.symbol)!.push(signal);
    });
    
    const results: Array<{
      agentId: string;
      symbol: string;
      action: 'buy' | 'sell' | 'hold';
      success: boolean;
      pnl: number;
    }> = [];
    
    // Process signals symbol by symbol
    symbolSignals.forEach((symbolSignalArray, symbol) => {
      // Sort by confidence (highest first)
      symbolSignalArray.sort((a, b) => b.confidence - a.confidence);
      
      // Simulate market movement (random for this example)
      const marketMoved = Math.random() > 0.5 ? 'up' : 'down';
      const percentChange = Math.random() * 3; // 0-3% move
      
      // Process each signal and determine if it was successful
      symbolSignalArray.forEach(signal => {
        let success = false;
        let pnl = 0;
        
        if (signal.action === 'buy' && marketMoved === 'up') {
          success = true;
          pnl = percentChange;
        } else if (signal.action === 'sell' && marketMoved === 'down') {
          success = true;
          pnl = percentChange;
        } else if (signal.action !== 'hold') {
          success = false;
          pnl = -percentChange;
        }
        
        results.push({
          agentId: signal.agentId,
          symbol,
          action: signal.action,
          success,
          pnl
        });
      });
    });
    
    return results;
  }

  /**
   * Update agent performances based on trade results
   */
  private updatePerformances(results: Array<{
    agentId: string;
    symbol: string;
    action: 'buy' | 'sell' | 'hold';
    success: boolean;
    pnl: number;
  }>): void {
    // Group results by agent
    const agentResults = new Map<string, typeof results>();
    results.forEach(result => {
      if (!agentResults.has(result.agentId)) {
        agentResults.set(result.agentId, []);
      }
      agentResults.get(result.agentId)!.push(result);
    });
    
    // Update performance for each agent
    agentResults.forEach((agentResultArray, agentId) => {
      const performance = this.performances.get(agentId);
      if (!performance) return;
      
      // Apply performance decay factor to existing metrics
      performance.pnl *= this.config.performanceDecayFactor;
      
      // Count wins, losses, and calculate PnL
      let wins = 0;
      let totalPnl = 0;
      
      agentResultArray.forEach(result => {
        if (result.success) wins++;
        totalPnl += result.pnl;
        performance.trades++;
      });
      
      // Update performance metrics
      performance.wins += wins;
      performance.losses += (agentResultArray.length - wins);
      performance.pnl += totalPnl;
      
      if (performance.trades > 0) {
        performance.successRate = performance.wins / performance.trades;
      }
      
      this.logger.info(`Agent ${agentId} performance updated: PnL=${performance.pnl.toFixed(2)}, Success=${(performance.successRate * 100).toFixed(1)}%`);
    });
  }

  /**
   * Rebalance agent weights based on performance
   */
  private rebalanceWeights(): void {
    const totalAgents = this.performances.size;
    if (totalAgents <= 1) return;
    
    this.logger.info("Rebalancing agent weights based on performance");
    
    // Get all performances
    const performanceArray = Array.from(this.performances.values());
    
    // Sort by PnL
    performanceArray.sort((a, b) => b.pnl - a.pnl);
    
    // Calculate adjustment based on rank
    performanceArray.forEach((performance, index) => {
      // Top performer gets positive adjustment, bottom performer gets negative
      const rankFactor = 1 - (2 * index / (totalAgents - 1));
      const adjustment = this.config.maxWeightDelta * rankFactor * this.config.adjustmentFactor;
      
      // Adjust weight within bounds
      performance.weight = Math.max(
        this.config.minWeight,
        Math.min(1, performance.weight + adjustment)
      );
      
      this.logger.info(`Agent ${performance.id} weight adjusted to ${performance.weight.toFixed(2)}`);
    });
    
    // Normalize weights so they sum to 1
    this.normalizeWeights();
  }

  /**
   * Normalize weights so they sum to 1
   */
  private normalizeWeights(): void {
    // Calculate sum of all weights
    let weightSum = 0;
    this.performances.forEach(performance => {
      weightSum += performance.weight;
    });
    
    // Normalize each weight
    if (weightSum > 0) {
      this.performances.forEach(performance => {
        performance.weight = performance.weight / weightSum;
      });
    }
  }
}