"""
Manager for trading indicators that can be shared across strategies.
All portfolio managers/strategies will use the same indicators for fair competition.
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Callable, Any
import logging

class Indicator:
    """Base class for all technical indicators"""
    def __init__(self, name: str, params: Dict[str, Any] = None):
        self.name = name
        self.params = params or {}
        self.logger = logging.getLogger(f"indicator.{name}")
    
    def calculate(self, data: pd.DataFrame) -> pd.Series:
        """Calculate the indicator value from price data"""
        raise NotImplementedError("Subclasses must implement calculate()")
        
    def __str__(self):
        return f"{self.name} ({', '.join([f'{k}={v}' for k, v in self.params.items()])})"

class IndicatorManager:
    """
    Manages all indicators available to portfolio managers.
    Ensures all strategies have access to the same indicators.
    """
    
    def __init__(self):
        self.indicators: Dict[str, Indicator] = {}
        self.logger = logging.getLogger("IndicatorManager")
        
    def register_indicator(self, indicator: Indicator) -> bool:
        """Register a new indicator"""
        indicator_id = f"{indicator.name}_{hash(frozenset(indicator.params.items()))}"
        if indicator_id in self.indicators:
            self.logger.warning(f"Indicator {indicator_id} already registered")
            return False
            
        self.indicators[indicator_id] = indicator
        self.logger.info(f"Registered indicator: {indicator}")
        return True
        
    def get_indicator(self, name: str, params: Dict[str, Any] = None) -> Indicator:
        """Get an indicator by name and parameters"""
        params = params or {}
        indicator_id = f"{name}_{hash(frozenset(params.items()))}"
        
        if indicator_id not in self.indicators:
            self.logger.error(f"Indicator {indicator_id} not found")
            raise KeyError(f"Indicator {name} with params {params} not registered")
            
        return self.indicators[indicator_id]
        
    def calculate_all(self, data: pd.DataFrame) -> Dict[str, pd.Series]:
        """Calculate all indicators for the given data"""
        results = {}
        for indicator_id, indicator in self.indicators.items():
            results[indicator_id] = indicator.calculate(data)
        return results


# Common technical indicators
class SMA(Indicator):
    """Simple Moving Average"""
    def __init__(self, period: int = 20):
        super().__init__("SMA", {"period": period})
        
    def calculate(self, data: pd.DataFrame) -> pd.Series:
        return data['close'].rolling(window=self.params['period']).mean()

class EMA(Indicator):
    """Exponential Moving Average"""
    def __init__(self, period: int = 20):
        super().__init__("EMA", {"period": period})
        
    def calculate(self, data: pd.DataFrame) -> pd.Series:
        return data['close'].ewm(span=self.params['period'], adjust=False).mean()

class RSI(Indicator):
    """Relative Strength Index"""
    def __init__(self, period: int = 14):
        super().__init__("RSI", {"period": period})
        
    def calculate(self, data: pd.DataFrame) -> pd.Series:
        delta = data['close'].diff()
        
        gain = delta.where(delta > 0, 0)
        loss = -delta.where(delta < 0, 0)
        
        avg_gain = gain.rolling(window=self.params['period']).mean()
        avg_loss = loss.rolling(window=self.params['period']).mean()
        
        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))
        
        return rsi

class MACD(Indicator):
    """Moving Average Convergence Divergence"""
    def __init__(self, fast_period: int = 12, slow_period: int = 26, signal_period: int = 9):
        super().__init__("MACD", {
            "fast_period": fast_period,
            "slow_period": slow_period,
            "signal_period": signal_period
        })
        
    def calculate(self, data: pd.DataFrame) -> pd.DataFrame:
        fast_ema = data['close'].ewm(span=self.params['fast_period'], adjust=False).mean()
        slow_ema = data['close'].ewm(span=self.params['slow_period'], adjust=False).mean()
        
        macd_line = fast_ema - slow_ema
        signal_line = macd_line.ewm(span=self.params['signal_period'], adjust=False).mean()
        histogram = macd_line - signal_line
        
        result = pd.DataFrame({
            'macd_line': macd_line,
            'signal_line': signal_line,
            'histogram': histogram
        })
        
        return result

class BollingerBands(Indicator):
    """Bollinger Bands"""
    def __init__(self, period: int = 20, std_dev: float = 2.0):
        super().__init__("BollingerBands", {"period": period, "std_dev": std_dev})
        
    def calculate(self, data: pd.DataFrame) -> pd.DataFrame:
        typical_price = (data['high'] + data['low'] + data['close']) / 3
        middle_band = typical_price.rolling(window=self.params['period']).mean()
        
        std = typical_price.rolling(window=self.params['period']).std()
        upper_band = middle_band + (std * self.params['std_dev'])
        lower_band = middle_band - (std * self.params['std_dev'])
        
        result = pd.DataFrame({
            'middle': middle_band,
            'upper': upper_band,
            'lower': lower_band
        })
        
        return result