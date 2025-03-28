"""
FuturesQuant - Quantitative Trading System for Futures Markets
"""
import logging
from datetime import datetime

from src.agents.signal_agent import SignalAgent
from src.agents.portfolio_manager import PortfolioManager
from src.data.data_fetcher import DataFetcher
from src.strategies.trading_strategy import TradingStrategy

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def main():
    """Main entry point for the FuturesQuant system"""
    logger.info("Starting FuturesQuant system at %s", datetime.now())
    
    # Initialize components
    data_fetcher = DataFetcher()
    signal_agent = SignalAgent()
    portfolio_manager = PortfolioManager()
    trading_strategy = TradingStrategy(signal_agent, portfolio_manager)
    
    # Run the trading system
    try:
        market_data = data_fetcher.fetch_latest_data()
        signals = signal_agent.generate_signals(market_data)
        decisions = portfolio_manager.make_decisions(signals)
        trades = trading_strategy.execute_trades(decisions)
        
        logger.info("Generated %d trading signals", len(signals))
        logger.info("Executed %d trades", len(trades))
        
    except Exception as e:
        logger.error("Error running trading system: %s", str(e))
        raise
    
    logger.info("FuturesQuant system finished execution")

if __name__ == "__main__":
    main()