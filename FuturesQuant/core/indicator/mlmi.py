"""
Machine Learning Momentum Index (MLMI) implementation
Based on Zeiierman's Pine Script implementation
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, List
from .base import Indicator

class MLMI(Indicator):
    def __init__(self, 
                 num_neighbors: int = 200,
                 momentum_window: int = 20):
        """
        Initialize the MLMI indicator.
        
        Args:
            num_neighbors (int): Number of neighbors for k-NN prediction
            momentum_window (int): Window for momentum calculation
        """
        super().__init__("MLMI", {
            "num_neighbors": num_neighbors,
            "momentum_window": momentum_window
        })
        
        self.num_neighbors = num_neighbors
        self.momentum_window = momentum_window
        
        # Initialize data storage
        self.parameter1 = []  # RSI slow
        self.parameter2 = []  # RSI quick
        self.price_array = []
        self.result_array = []
        
    def calculate(self, data: pd.DataFrame) -> Dict[str, Any]:
        """
        Calculate the MLMI indicator values.
        
        Args:
            data (pd.DataFrame): DataFrame containing price data
            
        Returns:
            Dict containing:
            - prediction: Current MLMI prediction
            - prediction_ma: WMA of prediction
            - upper: Upper channel
            - lower: Lower channel
            - upper_: Upper channel with standard deviation
            - lower_: Lower channel with standard deviation
            - signal: Trading signal based on crossovers
        """
        if len(data) < self.momentum_window:
            return {
                "prediction": 0,
                "prediction_ma": 0,
                "upper": 0,
                "lower": 0,
                "upper_": 0,
                "lower_": 0,
                "signal": None
            }
            
        # Calculate moving averages and RSI
        ma_quick = self.calculate_wma(data['close'], 5)
        ma_slow = self.calculate_wma(data['close'], 20)
        
        rsi_quick = self.calculate_wma(self.calculate_rsi(data['close'], 5), self.momentum_window)
        rsi_slow = self.calculate_wma(self.calculate_rsi(data['close'], 20), self.momentum_window)
        
        # Check for crossovers
        pos = self.crossover(ma_quick, ma_slow)
        neg = self.crossunder(ma_quick, ma_slow)
        
        # Store previous trade data if crossover occurs
        if pos or neg:
            self.store_previous_trade(rsi_slow, rsi_quick)
            
        # Calculate prediction
        prediction = self.knn_predict(rsi_slow, rsi_quick)
        prediction_ma = self.calculate_wma(pd.Series(prediction), 20)
        
        # Calculate channels
        upper = np.max(prediction)
        lower = np.min(prediction)
        std_dev = self.calculate_ema(self.calculate_std(prediction, 20), 20)
        
        upper_ = upper - std_dev
        lower_ = lower + std_dev
        
        # Generate signal based on crossovers
        signal = None
        if prediction > upper_:
            signal = 'SELL'
        elif prediction < lower_:
            signal = 'BUY'
            
        return {
            "prediction": prediction,
            "prediction_ma": prediction_ma,
            "upper": upper,
            "lower": lower,
            "upper_": upper_,
            "lower_": lower_,
            "signal": signal
        }
        
    def store_previous_trade(self, p1: float, p2: float):
        """Store previous trade data."""
        if len(self.parameter1) > 0:
            self.parameter1.append(self.parameter1[-1])
            self.parameter2.append(self.parameter2[-1])
            self.price_array.append(self.price_array[-1])
            self.result_array.append(1 if self.price_array[-1] >= self.price_array[-2] else -1)
            
        self.parameter1.append(p1)
        self.parameter2.append(p2)
        self.price_array.append(self.price_array[-1] if len(self.price_array) > 0 else 0)
        
    def knn_predict(self, p1: float, p2: float) -> float:
        """Make prediction using k-NN algorithm."""
        if len(self.parameter1) < 2:
            return 0
            
        # Calculate distances
        distances = []
        for i in range(len(self.parameter1)):
            dist = np.sqrt(
                np.power(p1 - self.parameter1[i], 2) + 
                np.power(p2 - self.parameter2[i], 2)
            )
            distances.append(dist)
            
        # Get k nearest neighbors
        k = min(self.num_neighbors, len(distances))
        nearest_indices = np.argsort(distances)[:k]
        neighbors = [self.result_array[i] for i in nearest_indices]
        
        return np.sum(neighbors)
        
    def calculate_wma(self, data: pd.Series, period: int) -> pd.Series:
        """Calculate Weighted Moving Average."""
        weights = np.arange(1, period + 1)
        return data.rolling(window=period).apply(
            lambda x: np.sum(weights * x) / weights.sum()
        )
        
    def calculate_rsi(self, data: pd.Series, period: int) -> pd.Series:
        """Calculate Relative Strength Index."""
        delta = data.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        return 100 - (100 / (1 + rs))
        
    def calculate_ema(self, data: pd.Series, period: int) -> pd.Series:
        """Calculate Exponential Moving Average."""
        return data.ewm(span=period, adjust=False).mean()
        
    def calculate_std(self, data: pd.Series, period: int) -> pd.Series:
        """Calculate Standard Deviation."""
        return data.rolling(window=period).std()
        
    def crossover(self, series1: pd.Series, series2: pd.Series) -> bool:
        """Check for crossover."""
        return series1.iloc[-1] > series2.iloc[-1] and series1.iloc[-2] <= series2.iloc[-2]
        
    def crossunder(self, series1: pd.Series, series2: pd.Series) -> bool:
        """Check for crossunder."""
        return series1.iloc[-1] < series2.iloc[-1] and series1.iloc[-2] >= series2.iloc[-2] 