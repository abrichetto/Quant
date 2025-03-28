/**
 * Base Agent Class
 * 
 * This is the foundation class for all trading agents in the AlgoTrader Pro system.
 * It provides common functionality like event emitting, health monitoring, and lifecycle management.
 */

import EventEmitter from 'events';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';

// Agent states
export enum AgentState {
  IDLE = 'idle',
  INITIALIZING = 'initializing',
  RUNNING = 'running',
  PAUSED = 'paused',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
  ERROR = 'error'
}

// Base configuration for all agents
export interface BaseAgentConfig {
  enabled: boolean;
  name: string;
  priority?: number;
  checkIntervalMs?: number;
  timeoutMs?: number;
  maxRetries?: number;
}

export abstract class BaseAgent extends EventEmitter {
  // Agent properties
  protected id: string;
  protected name: string;
  protected state: AgentState;
  protected enabled: boolean;
  protected priority: number;
  protected checkIntervalMs: number;
  protected timeoutMs: number;
  protected maxRetries: number;
  protected startTime: number;
  protected lastCheckTime: number;
  protected checkInterval: NodeJS.Timeout | null;
  protected logger: any;
  protected metrics: Record<string, any>;
  protected retryCount: number;

  /**
   * Constructor for the base agent
   * 
   * @param config Base configuration for the agent
   */
  constructor(config: BaseAgentConfig) {
    super();
    this.id = uuidv4();
    this.name = config.name;
    this.enabled = config.enabled;
    this.priority = config.priority || 1;
    this.checkIntervalMs = config.checkIntervalMs || 30000; // 30 seconds
    this.timeoutMs = config.timeoutMs || 60000; // 1 minute
    this.maxRetries = config.maxRetries || 3;
    this.state = AgentState.IDLE;
    this.startTime = 0;
    this.lastCheckTime = 0;
    this.checkInterval = null;
    this.logger = logger.createNamespace(this.name);
    this.metrics = {
      executionCount: 0,
      successCount: 0,
      errorCount: 0,
      lastExecutionTime: 0,
      averageExecutionTime: 0,
      totalExecutionTime: 0
    };
    this.retryCount = 0;

    this.logger.info(`Agent created: ${this.name} (${this.id})`);
  }

  /**
   * Initialize the agent before starting
   */
  public async initialize(): Promise<void> {
    if (this.state !== AgentState.IDLE && this.state !== AgentState.STOPPED) {
      throw new Error(`Cannot initialize agent in state: ${this.state}`);
    }

    try {
      this.state = AgentState.INITIALIZING;
      this.emit('initializing');
      this.logger.info(`Initializing agent: ${this.name}`);

      // Call the agent-specific initialization
      await this.onInitialize();

      this.logger.info(`Agent initialized: ${this.name}`);
      this.state = AgentState.IDLE;
      this.emit('initialized');
    } catch (error: any) {
      this.logger.error(`Initialization error: ${error.message}`, { error });
      this.state = AgentState.ERROR;
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Start the agent
   */
  public async start(): Promise<void> {
    if (!this.enabled) {
      this.logger.warn(`Cannot start disabled agent: ${this.name}`);
      return;
    }

    if (this.state === AgentState.RUNNING) {
      this.logger.warn(`Agent already running: ${this.name}`);
      return;
    }

    try {
      // Initialize if not done already
      if (this.state === AgentState.IDLE || this.state === AgentState.STOPPED) {
        await this.initialize();
      }

      this.startTime = Date.now();
      this.state = AgentState.RUNNING;
      this.retryCount = 0;
      this.emit('starting');
      this.logger.info(`Starting agent: ${this.name}`);

      // Call the agent-specific start logic
      await this.onStart();

      // Set up periodic check if defined
      if (this.checkIntervalMs > 0) {
        this.checkInterval = setInterval(() => this.check(), this.checkIntervalMs);
      }

      this.logger.info(`Agent started: ${this.name}`);
      this.emit('started');
    } catch (error: any) {
      this.logger.error(`Start error: ${error.message}`, { error });
      this.state = AgentState.ERROR;
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Pause the agent
   */
  public async pause(): Promise<void> {
    if (this.state !== AgentState.RUNNING) {
      this.logger.warn(`Cannot pause agent in state: ${this.state}`);
      return;
    }

    try {
      this.state = AgentState.PAUSED;
      this.emit('pausing');
      this.logger.info(`Pausing agent: ${this.name}`);

      // Clear check interval if it exists
      if (this.checkInterval) {
        clearInterval(this.checkInterval);
        this.checkInterval = null;
      }

      // Call the agent-specific pause logic
      await this.onPause();

      this.logger.info(`Agent paused: ${this.name}`);
      this.emit('paused');
    } catch (error: any) {
      this.logger.error(`Pause error: ${error.message}`, { error });
      this.state = AgentState.ERROR;
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Resume the agent from a paused state
   */
  public async resume(): Promise<void> {
    if (this.state !== AgentState.PAUSED) {
      this.logger.warn(`Cannot resume agent in state: ${this.state}`);
      return;
    }

    try {
      this.state = AgentState.RUNNING;
      this.emit('resuming');
      this.logger.info(`Resuming agent: ${this.name}`);

      // Call the agent-specific resume logic
      await this.onResume();

      // Restart the check interval
      if (this.checkIntervalMs > 0) {
        this.checkInterval = setInterval(() => this.check(), this.checkIntervalMs);
      }

      this.logger.info(`Agent resumed: ${this.name}`);
      this.emit('resumed');
    } catch (error: any) {
      this.logger.error(`Resume error: ${error.message}`, { error });
      this.state = AgentState.ERROR;
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Stop the agent
   */
  public async stop(): Promise<void> {
    if (this.state === AgentState.STOPPED) {
      this.logger.warn(`Agent already stopped: ${this.name}`);
      return;
    }

    try {
      this.state = AgentState.STOPPING;
      this.emit('stopping');
      this.logger.info(`Stopping agent: ${this.name}`);

      // Clear check interval if it exists
      if (this.checkInterval) {
        clearInterval(this.checkInterval);
        this.checkInterval = null;
      }

      // Call the agent-specific stop logic
      await this.onStop();

      this.state = AgentState.STOPPED;
      this.logger.info(`Agent stopped: ${this.name}`);
      this.emit('stopped');
    } catch (error: any) {
      this.logger.error(`Stop error: ${error.message}`, { error });
      this.state = AgentState.ERROR;
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Check the agent state and perform periodic tasks
   */
  protected async check(): Promise<void> {
    if (this.state !== AgentState.RUNNING) {
      return;
    }

    this.lastCheckTime = Date.now();
    this.emit('checking');

    try {
      // Call the agent-specific check logic
      await this.onCheck();
      
      this.emit('checked');
    } catch (error: any) {
      this.logger.error(`Check error: ${error.message}`, { error });
      this.emit('checkError', error);
      
      // Retry logic
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        this.logger.warn(`Retrying check (${this.retryCount}/${this.maxRetries})`);
        // Retry after a delay
        setTimeout(() => this.check(), Math.pow(2, this.retryCount) * 1000);
      } else {
        this.logger.error(`Maximum retries exceeded, setting agent to error state`);
        this.state = AgentState.ERROR;
        this.emit('error', new Error(`Maximum retries exceeded: ${error.message}`));
      }
    }
  }

  /**
   * Execute the agent's main task with performance tracking
   */
  protected async execute<T>(task: () => Promise<T>): Promise<T> {
    const startTime = Date.now();
    this.emit('executing');
    
    try {
      this.metrics.executionCount++;
      
      // Execute the task with a timeout
      const result = await Promise.race([
        task(),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`Task execution timed out after ${this.timeoutMs}ms`)), this.timeoutMs);
        })
      ]);
      
      const executionTime = Date.now() - startTime;
      this.metrics.lastExecutionTime = executionTime;
      this.metrics.totalExecutionTime += executionTime;
      this.metrics.averageExecutionTime = this.metrics.totalExecutionTime / this.metrics.executionCount;
      this.metrics.successCount++;
      
      this.emit('executed', { executionTime, success: true });
      return result;
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      this.metrics.lastExecutionTime = executionTime;
      this.metrics.errorCount++;
      
      this.logger.error(`Execution error: ${error.message}`, { error, executionTime });
      this.emit('executed', { executionTime, success: false, error });
      throw error;
    }
  }

  /**
   * Get the current state of the agent
   */
  public getState(): AgentState {
    return this.state;
  }

  /**
   * Get the agent's metrics
   */
  public getMetrics(): Record<string, any> {
    return {
      ...this.metrics,
      uptime: this.startTime ? Date.now() - this.startTime : 0,
      state: this.state,
      lastCheckTime: this.lastCheckTime,
      id: this.id,
      name: this.name,
      enabled: this.enabled,
      priority: this.priority
    };
  }

  /**
   * Enable or disable the agent
   */
  public setEnabled(enabled: boolean): void {
    if (this.enabled === enabled) {
      return;
    }

    this.enabled = enabled;
    this.logger.info(`Agent ${enabled ? 'enabled' : 'disabled'}: ${this.name}`);
    this.emit('enabledChanged', enabled);

    // If disabling a running agent, pause it
    if (!enabled && this.state === AgentState.RUNNING) {
      this.pause();
    }
  }

  // Abstract methods that derived agents must implement
  protected abstract onInitialize(): Promise<void>;
  protected abstract onStart(): Promise<void>;
  protected abstract onPause(): Promise<void>;
  protected abstract onResume(): Promise<void>;
  protected abstract onStop(): Promise<void>;
  protected abstract onCheck(): Promise<void>;
}

export default BaseAgent;