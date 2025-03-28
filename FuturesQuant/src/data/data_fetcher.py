"""
Data Fetcher module - Responsible for retrieving market data
"""
import logging
from typing import Dict, Any
import random
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class DataFetcher:
    """
    DataFetcher retrieves market data from various sources
    """
    
    def __init__(self, config=None):
        """
        Initialize the DataFetcher
        
        Args:
            config (Dict): Configuration for data sources
        """
        self.config = config or {}
        self.data_sources = self.config.get("data_sources", ["mock"])
        logger.info(f"Initialized DataFetcher with sources: {self.data_sources}")
    
    def fetch_latest_data(self) -> Dict[str, Any]:
        """
        Fetch the latest market data
        
        Returns:
            Dictionary containing market data
        """
        if "mock" in self.data_sources:
            return self._generate_mock_data()
        else:
            # For now, just use mock data
            return self._generate_mock_data()
    
    def _generate_mock_data(self) -> Dict[str, Any]:
        """
        Generate mock market data for testing
        
        Returns:
            Dictionary with mock market data
        """
        instruments = ["ES", "NQ", "CL", "GC", "ZB"]
        now = datetime.now()
        
        data = {
            "timestamp": now.isoformat(),
            "instruments": {}
        }
        
        for instrument in instruments:
            # Generate random price data
            base_price = {
                "ES": 5000.0,  # S&P 500 futures
                "NQ": 17500.0, # Nasdaq futures
                "CL": 75.0,    # Crude oil futures
                "GC": 2300.0,  # Gold futures
                "ZB": 110.0,   # 30-year Treasury bond futures
            }.get(instrument, 100.0)
            
            # Add some random variation
            current_price = base_price * (1 + random.uniform(-0.01, 0.01))
            
            # Create price history (last 10 timestamps)
            price_history = []
            for i in range(10):
                time_point = now - timedelta(minutes=i)
                historical_price = base_price * (1 + random.uniform(-0.015, 0.015))
                price_history.append({
                    "timestamp": time_point.isoformat(),
                    "price": historical_price
                })
            
            # Volume data
            volume = random.randint(1000, 5000)
            
            data["instruments"][instrument] = {
                "current_price": current_price,
                "price_history": price_history,
                "volume": volume,
                "open_interest": random.randint(10000, 50000)
            }
        
        logger.debug(f"Generated mock data for {len(instruments)} instruments")
        return data