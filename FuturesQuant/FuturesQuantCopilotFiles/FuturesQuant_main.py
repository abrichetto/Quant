# Main entry point for the FuturesQuant system
"""
Entry point for starting the FuturesQuant trading system.
"""

import logging
import argparse
import json
import os
from typing import Dict, Any

from core.engine import TradingEngine
from core.data_handler import DataHandler
from strategies.cathie_wood_strategy import CathieWoodStrategy

def load_config(config_path: str) -> Dict[str, Any]:
    """
    Load configuration from a JSON file.
    
    Args:
        config_path: Path to the configuration file
        
    Returns:
        Dictionary containing configuration parameters
    """
    try:
        with open(config_path, 'r') as file:
            return json.load(file)
    except Exception as e:
        print(f"Error loading config: {e}")
        return {}

def setup_logging(level=logging.INFO):
    """
    Set up logging configuration.
    
    Args:
        level: Logging level
    """
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

def main():
    """Main entry point for the application."""
    parser = argparse.ArgumentParser(description="FuturesQuant Trading System")
    parser.add_argument('-c', '--config', default='config.json', help='Path to configuration file')
    parser.add_argument('-v', '--verbose', action='store_true', help='Enable verbose logging')
    args = parser.parse_args()
    
    # Setup logging
    log_level = logging.DEBUG if args.verbose else logging.INFO
    setup_logging(log_level)
    
    # Load configuration
    config = load_config(args.config)
    if not config:
        print("Failed to load configuration. Exiting.")
        return
    
    # Initialize components
    data_handler = DataHandler(config.get('data', {}))
    engine = TradingEngine(config.get('engine', {}))
    
    # Initialize strategies
    strategy_config = config.get('strategies', {})
    for strategy_name, params in strategy_config.items():
        if strategy_name == 'cathie_wood':
            symbols = params.get('symbols', [])
            strategy = CathieWoodStrategy(strategy_name, symbols, params)
            engine.add_strategy(strategy_name, strategy)
            strategy.start()
    
    # Start the engine
    try:
        engine.start()
    except KeyboardInterrupt:
        print("\nShutting down...")
        engine.stop()

if __name__ == '__main__':
    main()