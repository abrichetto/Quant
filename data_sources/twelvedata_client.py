import requests
import pandas as pd
from config import Config

class TwelveDataClient:
    BASE_URL = "https://api.twelvedata.com"

    def __init__(self):
        self.api_key = Config.TWELVEDATA_API_KEY

    def _make_request(self, endpoint, params):
        params["apikey"] = self.api_key
        response = requests.get(f"{self.BASE_URL}/{endpoint}", params=params)
        response.raise_for_status()
        return response.json()

    def get_price(self, symbol):
        """Fetch the current price for a symbol."""
        data = self._make_request("price", {"symbol": symbol})
        return data["price"]

    def get_time_series(self, symbol, interval="1min", outputsize=30):
        """Fetch time series data for a symbol."""
        data = self._make_request("time_series", {
            "symbol": symbol,
            "interval": interval,
            "outputsize": outputsize
        })
        df = pd.DataFrame(data["values"])
        df["datetime"] = pd.to_datetime(df["datetime"])
        return df.set_index("datetime").sort_index()

import unittest
from unittest.mock import patch

class TestTwelveDataClient(unittest.TestCase):
    @patch("trading_bot.src.twelvedata_client.requests.get")
    def test_get_price(self, mock_get):
        mock_get.return_value.json.return_value = {"price": "150.00"}
        client = TwelveDataClient()
        price = client.get_price("AAPL")
        self.assertEqual(price, "150.00")

if __name__ == "__main__":
    unittest.main()