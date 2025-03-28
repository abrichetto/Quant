# Base strategy class
"""
Abstract base class for all trading strategies.
"""

from abc import ABC, abstractmethod
import logging
from typing import Dict, Any, List, Optional

class BaseStrategy(ABC):
    """
    Abstract base strategy that all trading strategies should inherit from.
    """
    
    def __init__(self, name: str, symbols: List[str], params: Dict[str, Any]):
        """
        Initialize the strategy.
        
        Args:
            name: Strategy name
            symbols: List of trading symbols
            params: Strategy parameters
        """
        self.name = name
        self.symbols = symbols
        self.params = params
        self.is_active = False
        self.positions = {}
        self.logger = logging.getLogger(f"strategy.{name}")
        
    @abstractmethod
    def generate_signals(self) -> Dict[str, str]:
        """
        Generate trading signals for each symbol.
        
        Returns:
            Dictionary mapping symbols to signals ('BUY', 'SELL', 'HOLD')
        """
        pass
        
    def execute(self):
        """Execute the strategy for the current market data."""
        if not self.is_active:
            return
            
        signals = self.generate_signals()
        self._process_signals(signals)
        
    def _process_signals(self, signals: Dict[str, str]):
        """
        Process the generated signals.
        
        Args:
            signals: Dictionary mapping symbols to signals
        """
        for symbol, signal in signals.items():
            if signal == 'BUY':
                self._enter_position(symbol)
            elif signal == 'SELL':
                self._exit_position(symbol)
    
    def _enter_position(self, symbol: str):
        """
        Enter a position based on the strategy signal.
        
        Args:
            symbol: Trading symbol
        """
        # Implementation for entering positions
        self.logger.info(f"Enter position: {symbol}")
        
    def _exit_position(self, symbol: str):
        """
        Exit a position based on the strategy signal.
        
        Args:
            symbol: Trading symbol
        """
        # Implementation for exiting positions
        self.logger.info(f"Exit position: {symbol}")
        
    def start(self):
        """Activate the strategy."""
        self.is_active = True
        self.logger.info(f"Strategy {self.name} activated")
        
    def stop(self):
        """Deactivate the strategy."""
        self.is_active = False
        self.logger.info(f"Strategy {self.name} deactivated")