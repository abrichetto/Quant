/**
 * FuturesQuant Module
 * 
 * Specialized module for perpetual futures leveraged trading
 * Integrates with Big.One exchange and uses SuperTrend AI for signals
 */

import LeverageAgent from './LeverageAgent';
import RiskManager from './RiskManager';
import BigOneAPI from './api/BigOneAPI';
import SuperTrendAI from './indicators/SuperTrendAI';
import { EventEmitter } from 'events';

class FuturesQuant {
  constructor(config = {}) {
    this.config = {
      maxLeverage: 20,
      defaultLeverage: 3,
      minConfidenceForLeverage: 0.75,
      requiredAgreementCount: 3,
      ...config
    };
    
    // Initialize components
    this.leverageAgent = new LeverageAgent(this.config);
    this.riskManager = new RiskManager(this.config);
    this.api = new BigOneAPI(config.apiCredentials);
    this.superTrendAI = new SuperTrendAI();
    
    // Portfolio Managers references (to be injected)
    this.portfolioManagers = [];
    
    // Event system for internal communication
    this.events = new EventEmitter();
    this.setupEventListeners();
    
    // Trading state
    this.state = {
      isTrading: false,
      currentLeverage: this.config.defaultLeverage,
      currentPositions: {},
      pendingOrders: [],
      confidence: 0,
      signals: [],
      marketData: {},
      lastTradeTime: null,
      performanceMetrics: {
        winRate: 0,
        profitFactor: 0,
        sharpeRatio: 0
      }
    };
    
    console.log("FuturesQuant module initialized with max leverage:", this.config.maxLeverage);
  }
  
  /**
   * Add portfolio manager agents to the decision-making process
   * @param {Array|Object} managers - Portfolio manager agents
   */
  addPortfolioManagers(managers) {
    if (Array.isArray(managers)) {
      this.portfolioManagers = [...this.portfolioManagers, ...managers];
    } else {
      this.portfolioManagers.push(managers);
    }
    
    console.log(`Added ${Array.isArray(managers) ? managers.length : 1} portfolio managers. Total: ${this.portfolioManagers.length}`);
  }
  
  /** 