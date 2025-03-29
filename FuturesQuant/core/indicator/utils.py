import numpy as np

def calculate_atr(high, low, close, period=14):
    """
    Calculate the Average True Range (ATR) for volatility measurement.

    Args:
        high (list or np.array): High prices.
        low (list or np.array): Low prices.
        close (list or np.array): Close prices.
        period (int): Lookback period for ATR calculation.

    Returns:
        np.array: ATR values.
    """
    tr = np.maximum(high - low, np.maximum(abs(high - close.shift(1)), abs(low - close.shift(1))))
    atr = tr.rolling(window=period).mean()
    return atr

def calculate_rsi(close, period=14):
    """
    Calculate the Relative Strength Index (RSI).

    Args:
        close (list or np.array): Close prices.
        period (int): Lookback period for RSI calculation.

    Returns:
        np.array: RSI values.
    """
    delta = close.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    return rsi

def knn_predict(data, target, k=5):
    """
    Perform k-Nearest Neighbors (k-NN) prediction.

    Args:
        data (np.array): Training data.
        target (np.array): Target data for prediction.
        k (int): Number of neighbors to consider.

    Returns:
        float: Predicted value based on k-NN.
    """
    distances = np.linalg.norm(data - target, axis=1)
    nearest_indices = distances.argsort()[:k]
    return np.mean(nearest_indices)

def calculate_standard_deviation(data):
    """
    Calculate the standard deviation of a dataset.

    Args:
        data (list or np.array): Input data.

    Returns:
        float: Standard deviation of the data.
    """
    mean = np.mean(data)
    variance = np.mean((data - mean) ** 2)
    return np.sqrt(variance)