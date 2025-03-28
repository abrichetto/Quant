/**
 * Risk Management Agent
 * 
 * This agent is responsible for monitoring and managing trading risk, including:
 * - Portfolio drawdown monitoring
 * - Position size limits
 * - Automatic hedging
 * - Stop loss management
 * - Leverage monitoring
 * - Portfolio rebalancing
 */

import { EventEmitter } from 'events';
import BaseAgent, { AgentState, BaseAgentConfig } from './BaseAgent';
import config from '../config';

// Risk agent specific configuration
interface RiskAgentConfig extends BaseAgentConfig {
  maxDrawdown: number;
  positionSizeLimit: number;
  hedgeThreshold: number;
  autoHedgeEnabled: boolean;
  leverageLimit: number;
  stopLossPercent: number;
  rebalanceInterval: number;
}

// Position interface
interface Position {
  id: string;
  asset: string;
  side: 'long' | 'short';
  entryPrice: number;
  currentPrice: number;
  size: number;
  leverage: number;
  liquidationPrice?: number;
  unrealizedPnl?: number;
  unrealizedPnlPercent?: number;
  updatedAt: Date;
}

// Portfolio interface
interface Portfolio {
  totalValue: number;
  initialValue: number;
  positions: Position[];
  cash: number;
  allocation: Record<string, number>;
  drawdown: number;
  leverage: number;
  lastUpdated: Date;
}

class RiskAgent extends BaseAgent {
  private portfolio: Portfolio;
  private positionUpdates: EventEmitter;
  private hedgePositions: Position[];
  private lastRebalanceTime: number;
  private riskConfig: RiskAgentConfig;
  private alertsTriggered: Record<string, boolean>;
  private stopLossOrders: Map<string, number>;

  constructor() {
    // Create config from global config
    const riskConfig: RiskAgentConfig = {
      name: 'RiskAgent',
      enabled: config.agents.riskAgent.enabled,
      maxDrawdown: config.agents.riskAgent.maxDrawdown,
      positionSizeLimit: config.agents.riskAgent.positionSizeLimit,
      hedgeThreshold: config.agents.riskAgent.hedgeThreshold,
      autoHedgeEnabled: config.agents.riskAgent.autoHedgeEnabled,
      leverageLimit: config.agents.riskAgent.leverageLimit,
      stopLossPercent: config.agents.riskAgent.stopLossPercent,
      rebalanceInterval: config.agents.riskAgent.rebalanceInterval,
      checkIntervalMs: 5000, // Check every 5 seconds
      timeoutMs: 30000, // 30 second timeout
      priority: 10 // Highest priority for risk management
    };
    
    super(riskConfig);
    
    // Store risk-specific config
    this.riskConfig = riskConfig;
    
    // Initialize portfolio
    this.portfolio = {
      totalValue: 0,
      initialValue: 0,
      positions: [],
      cash: 0,
      allocation: {},
      drawdown: 0,
      leverage: 0,
      lastUpdated: new Date()
    };
    
    this.positionUpdates = new EventEmitter();
    this.hedgePositions = [];
    this.lastRebalanceTime = 0;
    this.alertsTriggered = {
      drawdown: false,
      positionSize: false,
      leverage: false
    };
    this.stopLossOrders = new Map();
    
    // Add additional metrics
    this.metrics.positionsMonitored = 0;
    this.metrics.hedgesTriggered = 0;
    this.metrics.stopLossesTriggered = 0;
    this.metrics.rebalancesPerformed = 0;
    this.metrics.riskScore = 0;

    // Listen for position updates
    this.positionUpdates.on('update', this.handlePositionUpdate.bind(this));
  }

  protected async onInitialize(): Promise<void> {
    try {
      // Load initial portfolio data from platform or database
      await this.updatePortfolio();
      
      // Set the initial value as the baseline for drawdown calculation
      this.portfolio.initialValue = this.portfolio.totalValue;
      
      this.logger.info(`Risk agent initialized with portfolio value: ${this.portfolio.totalValue}`);
      
      // Initialize stop losses for existing positions
      await this.setupStopLosses();
    } catch (error: any) {
      this.logger.error(`Failed to initialize risk agent: ${error.message}`);
      throw error;
    }
  }

  protected async onStart(): Promise<void> {
    // Perform full risk assessment on start
    await this.performRiskAssessment();
    this.logger.info('Risk monitoring started');
  }

  protected async onPause(): Promise<void> {
    // Nothing to do on pause
    this.logger.info('Risk monitoring paused');
  }

  protected async onResume(): Promise<void> {
    // Update portfolio data when resuming
    await this.updatePortfolio();
    this.logger.info('Risk monitoring resumed');
  }

  protected async onStop(): Promise<void> {
    // Clean up any listeners or active processes
    this.positionUpdates.removeAllListeners();
    this.logger.info('Risk monitoring stopped');
  }

  protected async onCheck(): Promise<void> {
    // Update portfolio and check risk on each interval
    await this.updatePortfolio();
    await this.checkDrawdown();
    await this.checkPositionSizes();
    await this.checkLeverage();
    await this.updateStopLosses();
    
    // Check if it's time to rebalance the portfolio
    const now = Date.now();
    if (now - this.lastRebalanceTime >= this.riskConfig.rebalanceInterval) {
      await this.rebalancePortfolio();
      this.lastRebalanceTime = now;
    }
    
    // Calculate the overall risk score
    this.calculateRiskScore();
  }

  /**
   * Update the portfolio data from the trading platform
   */
  private async updatePortfolio(): Promise<void> {
    try {
      // In a real implementation, this would fetch data from your trading API
      // Mocked for demo purposes
      const mockPortfolio = await this.fetchPortfolioFromPlatform();
      
      // Update the portfolio
      this.portfolio = mockPortfolio;
      this.metrics.positionsMonitored = this.portfolio.positions.length;
      
      // Calculate current drawdown
      if (this.portfolio.initialValue > 0) {
        this.portfolio.drawdown = Math.max(0, (this.portfolio.initialValue - this.portfolio.totalValue) / this.portfolio.initialValue);
      }
    } catch (error: any) {
      this.logger.error(`Failed to update portfolio: ${error.message}`);
      throw error;
    }
  }

  /**
   * Mock function to fetch portfolio data from platform
   * In a real implementation, this would call your trading platform's API
   */
  private async fetchPortfolioFromPlatform(): Promise<Portfolio> {
    // Mock data for demonstration
    return {
      totalValue: 10000 + (Math.random() * 500 - 250), // Random fluctuation
      initialValue: 10000,
      cash: 5000,
      positions: [
        {
          id: '1',
          asset: 'BTC',
          side: 'long',
          entryPrice: 62450.75,
          currentPrice: 63120.33 + (Math.random() * 200 - 100), // Random fluctuation
          size: 0.12,
          leverage: 3,
          liquidationPrice: 54320.18,
          unrealizedPnl: 80.35,
          unrealizedPnlPercent: 0.0107,
          updatedAt: new Date()
        },
        {
          id: '2',
          asset: 'ETH',
          side: 'long',
          entryPrice: 3250.50,
          currentPrice: 3322.25 + (Math.random() * 20 - 10), // Random fluctuation
          size: 0.5,
          leverage: 3,
          liquidationPrice: 2833.75,
          unrealizedPnl: 35.88,
          unrealizedPnlPercent: 0.0221,
          updatedAt: new Date()
        },
        {
          id: '3',
          asset: 'SOL',
          side: 'short',
          entryPrice: 142.75,
          currentPrice: 138.20 + (Math.random() * 5 - 2.5), // Random fluctuation
          size: 2.5,
          leverage: 2,
          liquidationPrice: 171.30,
          unrealizedPnl: 11.38,
          unrealizedPnlPercent: 0.0319,
          updatedAt: new Date()
        }
      ],
      allocation: {
        BTC: 40,
        ETH: 25,
        SOL: 15,
        CASH: 20
      },
      drawdown: 0.03 + (Math.random() * 0.02 - 0.01), // Random fluctuation
      leverage: 2.1,
      lastUpdated: new Date()
    };
  }

  /**
   * Check portfolio drawdown against threshold
   */
  private async checkDrawdown(): Promise<void> {
    if (this.portfolio.drawdown >= this.riskConfig.maxDrawdown) {
      if (!this.alertsTriggered.drawdown) {
        this.alertsTriggered.drawdown = true;
        this.logger.warn(`Drawdown alert triggered: ${(this.portfolio.drawdown * 100).toFixed(2)}% exceeds threshold of ${(this.riskConfig.maxDrawdown * 100).toFixed(2)}%`);
        
        // Emit drawdown alert event
        this.emit('drawdownAlert', {
          currentDrawdown: this.portfolio.drawdown,
          maxDrawdown: this.riskConfig.maxDrawdown,
          portfolioValue: this.portfolio.totalValue,
          initialValue: this.portfolio.initialValue
        });
        
        // If auto hedge is enabled, hedge the portfolio
        if (this.riskConfig.autoHedgeEnabled) {
          await this.hedgePortfolio();
        }
      }
    } else {
      // Reset the alert if drawdown goes back under threshold
      if (this.alertsTriggered.drawdown) {
        this.alertsTriggered.drawdown = false;
        this.logger.info(`Drawdown reduced to ${(this.portfolio.drawdown * 100).toFixed(2)}%, below threshold of ${(this.riskConfig.maxDrawdown * 100).toFixed(2)}%`);
      }
    }
  }

  /**
   * Check individual position sizes against limits
   */
  private async checkPositionSizes(): Promise<void> {
    let oversizedPositions = false;
    
    for (const position of this.portfolio.positions) {
      // Calculate position size as percentage of portfolio
      const positionValue = position.size * position.currentPrice * position.leverage;
      const positionSizePercent = positionValue / this.portfolio.totalValue;
      
      if (positionSizePercent > this.riskConfig.positionSizeLimit) {
        oversizedPositions = true;
        
        this.logger.warn(`Position size alert for ${position.asset}: ${(positionSizePercent * 100).toFixed(2)}% exceeds limit of ${(this.riskConfig.positionSizeLimit * 100).toFixed(2)}%`);
        
        // Emit position size alert event
        this.emit('positionSizeAlert', {
          asset: position.asset,
          positionSize: positionSizePercent,
          limit: this.riskConfig.positionSizeLimit,
          positionValue,
          portfolioValue: this.portfolio.totalValue
        });
      }
    }
    
    // Update the alert state
    this.alertsTriggered.positionSize = oversizedPositions;
  }

  /**
   * Check overall leverage ratio
   */
  private async checkLeverage(): Promise<void> {
    if (this.portfolio.leverage > this.riskConfig.leverageLimit) {
      if (!this.alertsTriggered.leverage) {
        this.alertsTriggered.leverage = true;
        
        this.logger.warn(`Leverage alert triggered: ${this.portfolio.leverage.toFixed(2)}x exceeds limit of ${this.riskConfig.leverageLimit.toFixed(2)}x`);
        
        // Emit leverage alert event
        this.emit('leverageAlert', {
          currentLeverage: this.portfolio.leverage,
          maxLeverage: this.riskConfig.leverageLimit,
          portfolioValue: this.portfolio.totalValue
        });
      }
    } else {
      // Reset the alert if leverage goes back under threshold
      if (this.alertsTriggered.leverage) {
        this.alertsTriggered.leverage = false;
        this.logger.info(`Leverage reduced to ${this.portfolio.leverage.toFixed(2)}x, below limit of ${this.riskConfig.leverageLimit.toFixed(2)}x`);
      }
    }
  }

  /**
   * Set up stop losses for all positions
   */
  private async setupStopLosses(): Promise<void> {
    try {
      for (const position of this.portfolio.positions) {
        // Calculate stop loss price based on entry price and risk percentage
        const stopPrice = this.calculateStopLossPrice(position);
        
        // Store the stop loss
        this.stopLossOrders.set(position.id, stopPrice);
        
        this.logger.debug(`Stop loss set for ${position.asset} at ${stopPrice}`);
      }
      
      this.logger.info(`Stop losses set up for ${this.portfolio.positions.length} positions`);
    } catch (error: any) {
      this.logger.error(`Failed to set up stop losses: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update stop losses based on current prices
   */
  private async updateStopLosses(): Promise<void> {
    for (const position of this.portfolio.positions) {
      const currentStopPrice = this.stopLossOrders.get(position.id);
      
      if (!currentStopPrice) {
        // New position, set up a stop loss
        const stopPrice = this.calculateStopLossPrice(position);
        this.stopLossOrders.set(position.id, stopPrice);
        continue;
      }
      
      // For long positions, check if we should trigger stop loss
      if (position.side === 'long' && position.currentPrice <= currentStopPrice) {
        await this.triggerStopLoss(position);
      }
      // For short positions, check if we should trigger stop loss
      else if (position.side === 'short' && position.currentPrice >= currentStopPrice) {
        await this.triggerStopLoss(position);
      }
    }
    
    // Clean up stop losses for closed positions
    const activePositionIds = new Set(this.portfolio.positions.map(p => p.id));
    for (const positionId of this.stopLossOrders.keys()) {
      if (!activePositionIds.has(positionId)) {
        this.stopLossOrders.delete(positionId);
      }
    }
  }

  /**
   * Calculate stop loss price for a position
   */
  private calculateStopLossPrice(position: Position): number {
    if (position.side === 'long') {
      // For long positions, stop loss is below entry price
      return position.entryPrice * (1 - this.riskConfig.stopLossPercent);
    } else {
      // For short positions, stop loss is above entry price
      return position.entryPrice * (1 + this.riskConfig.stopLossPercent);
    }
  }

  /**
   * Trigger stop loss for a position
   */
  private async triggerStopLoss(position: Position): Promise<void> {
    try {
      this.logger.warn(`Triggering stop loss for ${position.asset} at ${position.currentPrice}`);
      
      // In a real implementation, this would place a market order to close the position
      
      // Simulate closing the position
      this.stopLossOrders.delete(position.id);
      
      // Update metrics
      this.metrics.stopLossesTriggered++;
      
      // Emit stop loss event
      this.emit('stopLossTriggered', {
        asset: position.asset,
        positionId: position.id,
        side: position.side,
        entryPrice: position.entryPrice,
        exitPrice: position.currentPrice,
        size: position.size
      });
      
      this.logger.info(`Stop loss executed for ${position.asset}`);
    } catch (error: any) {
      this.logger.error(`Failed to execute stop loss for ${position.asset}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Hedge the portfolio to protect against further losses
   */
  private async hedgePortfolio(): Promise<void> {
    try {
      this.logger.info('Hedging portfolio due to excessive drawdown');
      
      // In a real implementation, this would determine which assets to hedge
      // and place appropriate hedge orders
      
      // For demonstration, just log the action and update metrics
      this.metrics.hedgesTriggered++;
      
      // Emit hedge event
      this.emit('portfolioHedged', {
        drawdown: this.portfolio.drawdown,
        hedgeTime: new Date(),
        portfolioValue: this.portfolio.totalValue,
        initialValue: this.portfolio.initialValue
      });
      
      this.logger.info('Portfolio hedged successfully');
    } catch (error: any) {
      this.logger.error(`Failed to hedge portfolio: ${error.message}`);
      throw error;
    }
  }

  /**
   * Rebalance the portfolio to maintain target allocations
   */
  private async rebalancePortfolio(): Promise<void> {
    try {
      this.logger.info('Rebalancing portfolio');
      
      // In a real implementation, this would determine which assets to buy/sell
      // to maintain target allocations
      
      // For demonstration, just log the action and update metrics
      this.metrics.rebalancesPerformed++;
      this.lastRebalanceTime = Date.now();
      
      // Emit rebalance event
      this.emit('portfolioRebalanced', {
        rebalanceTime: new Date(),
        portfolioValue: this.portfolio.totalValue,
        newAllocation: this.portfolio.allocation
      });
      
      this.logger.info('Portfolio rebalanced successfully');
    } catch (error: any) {
      this.logger.error(`Failed to rebalance portfolio: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate overall risk score based on multiple factors
   */
  private calculateRiskScore(): void {
    // Simple risk score calculation based on multiple factors
    // 0 = no risk, 1 = maximum risk
    
    const drawdownFactor = this.portfolio.drawdown / this.riskConfig.maxDrawdown;
    
    // Calculate position size risk
    let positionSizeRisk = 0;
    for (const position of this.portfolio.positions) {
      const positionValue = position.size * position.currentPrice * position.leverage;
      const positionSizePercent = positionValue / this.portfolio.totalValue;
      positionSizeRisk = Math.max(positionSizeRisk, positionSizePercent / this.riskConfig.positionSizeLimit);
    }
    
    // Calculate leverage risk
    const leverageRisk = this.portfolio.leverage / this.riskConfig.leverageLimit;
    
    // Weighted average of risk factors
    const riskScore = (
      drawdownFactor * 0.4 +
      positionSizeRisk * 0.3 +
      leverageRisk * 0.3
    );
    
    // Clamp between 0 and 1
    this.metrics.riskScore = Math.min(1, Math.max(0, riskScore));
  }

  /**
   * Handle position updates from external sources
   */
  private async handlePositionUpdate(position: Position): Promise<void> {
    // Find existing position or add new one
    const existingIndex = this.portfolio.positions.findIndex(p => p.id === position.id);
    
    if (existingIndex >= 0) {
      // Update existing position
      this.portfolio.positions[existingIndex] = position;
    } else {
      // Add new position
      this.portfolio.positions.push(position);
      
      // Set up stop loss for new position
      const stopPrice = this.calculateStopLossPrice(position);
      this.stopLossOrders.set(position.id, stopPrice);
    }
    
    // Run risk assessment after position update
    if (this.state === AgentState.RUNNING) {
      await this.performRiskAssessment();
    }
  }

  /**
   * Perform full risk assessment
   */
  private async performRiskAssessment(): Promise<void> {
    await this.updatePortfolio();
    await this.checkDrawdown();
    await this.checkPositionSizes();
    await this.checkLeverage();
    await this.updateStopLosses();
    this.calculateRiskScore();
  }

  /**
   * Get the current risk assessment
   */
  public getRiskAssessment(): any {
    return {
      drawdown: this.portfolio.drawdown,
      maxDrawdown: this.riskConfig.maxDrawdown,
      leverage: this.portfolio.leverage,
      maxLeverage: this.riskConfig.leverageLimit,
      riskScore: this.metrics.riskScore,
      alertsTriggered: this.alertsTriggered,
      stopLosses: Array.from(this.stopLossOrders.entries()).map(([id, price]) => {
        const position = this.portfolio.positions.find(p => p.id === id);
        return {
          id,
          asset: position?.asset,
          stopPrice: price,
          currentPrice: position?.currentPrice,
          entryPrice: position?.entryPrice
        };
      })
    };
  }

  /**
   * Get the current portfolio
   */
  public getPortfolio(): Portfolio {
    return this.portfolio;
  }
}

export default RiskAgent;