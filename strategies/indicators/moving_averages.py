from typing import List

def simple_moving_average(data: List[float], period: int) -> List[float]:
    """Calculate the Simple Moving Average (SMA) for a given data set."""
    if period <= 0:
        raise ValueError("Period must be a positive integer.")
    if len(data) < period:
        raise ValueError("Data length must be greater than or equal to the period.")
    
    sma = []
    for i in range(len(data)):
        if i < period - 1:
            sma.append(None)  # Not enough data to calculate SMA
        else:
            average = sum(data[i - period + 1:i + 1]) / period
            sma.append(average)
    return sma

def exponential_moving_average(data: List[float], period: int) -> List[float]:
    """Calculate the Exponential Moving Average (EMA) for a given data set."""
    if period <= 0:
        raise ValueError("Period must be a positive integer.")
    if len(data) < period:
        raise ValueError("Data length must be greater than or equal to the period.")
    
    ema = [None] * len(data)
    sma_initial = sum(data[:period]) / period
    ema[period - 1] = sma_initial
    
    multiplier = 2 / (period + 1)
    
    for i in range(period, len(data)):
        ema[i] = (data[i] - ema[i - 1]) * multiplier + ema[i - 1]
    
    return ema

def weighted_moving_average(data: List[float], period: int) -> List[float]:
    """Calculate the Weighted Moving Average (WMA) for a given data set."""
    if period <= 0:
        raise ValueError("Period must be a positive integer.")
    if len(data) < period:
        raise ValueError("Data length must be greater than or equal to the period.")
    
    wma = []
    for i in range(len(data)):
        if i < period - 1:
            wma.append(None)  # Not enough data to calculate WMA
        else:
            weights = list(range(1, period + 1))
            weighted_sum = sum(data[i - j] * weights[j] for j in range(period))
            wma.append(weighted_sum / sum(weights))
    return wma