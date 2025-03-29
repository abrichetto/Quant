"""
Cross Correlation Pair indicator implementation.
Calculates correlation between two assets and generates trading signals based on correlation strength and divergence.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple
from .base import Indicator

class CrossCorrelationPair(Indicator):
    def __init__(self, 
                 lookback_period: int = 20,
                 correlation_threshold: float = 0.7,
                 divergence_threshold: float = 0.2):
        """
        Initialize the Cross Correlation Pair indicator.
        
        Args:
            lookback_period (int): Period for correlation calculation
            correlation_threshold (float): Minimum correlation strength to consider
            divergence_threshold (float): Threshold for divergence detection
        """
        super().__init__("CrossCorrelationPair", {
            "lookback_period": lookback_period,
            "correlation_threshold": correlation_threshold,
            "divergence_threshold": divergence_threshold
        })
        
        self.lookback_period = lookback_period
        self.correlation_threshold = correlation_threshold
        self.divergence_threshold = divergence_threshold
        
        # Store historical values
        self.historical_correlation = []
        self.historical_spread = []
        
    def calculate(self, data: pd.DataFrame) -> Dict[str, Any]:
        """
        Calculate the cross correlation between two assets and generate signals.
        
        Args:
            data (pd.DataFrame): DataFrame containing price data for both assets
            
        Returns:
            Dict containing:
            - correlation: Current correlation value
            - spread: Current spread between assets
            - signal: Trading signal ('BUY', 'SELL', or None)
            - strength: Signal strength (0-1)
        """
        if len(data) < self.lookback_period:
            return {
                "correlation": 0,
                "spread": 0,
                "signal": None,
                "strength": 0
            }
            
        # Calculate returns
        returns1 = data['asset1'].pct_change()
        returns2 = data['asset2'].pct_change()
        
        # Calculate correlation
        correlation = returns1.rolling(window=self.lookback_period).corr(returns2).iloc[-1]
        
        # Calculate spread
        spread = (data['asset1'] - data['asset2']).iloc[-1]
        
        # Store historical values
        self.historical_correlation.append(correlation)
        self.historical_spread.append(spread)
        
        # Keep only recent history
        if len(self.historical_correlation) > self.lookback_period:
            self.historical_correlation.pop(0)
            self.historical_spread.pop(0)
            
        # Generate signals based on correlation and divergence
        signal = None
        strength = 0
        
        if abs(correlation) >= self.correlation_threshold:
            # Calculate spread z-score
            spread_mean = np.mean(self.historical_spread)
            spread_std = np.std(self.historical_spread)
            spread_zscore = (spread - spread_mean) / spread_std
            
            # Detect divergence
            if abs(spread_zscore) >= self.divergence_threshold:
                if spread_zscore > 0:
                    signal = 'SELL'  # Asset1 is overvalued relative to Asset2
                else:
                    signal = 'BUY'   # Asset1 is undervalued relative to Asset2
                    
                # Calculate signal strength based on correlation and divergence
                strength = min(abs(correlation), abs(spread_zscore))
                
        return {
            "correlation": correlation,
            "spread": spread,
            "signal": signal,
            "strength": strength
        }
        
    def get_historical_values(self) -> Tuple[list, list]:
        """
        Get historical correlation and spread values.
        
        Returns:
            Tuple of (correlation_history, spread_history)
        """
        return self.historical_correlation, self.historical_spread 