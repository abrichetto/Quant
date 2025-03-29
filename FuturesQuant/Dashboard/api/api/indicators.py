from flask import Flask, jsonify, request
from tournament.signal.SignalAggregator import SignalAggregator
from ib_insync import IB, Stock, Forex, Future, Contract

app = Flask(__name__)

# Initialize SignalAggregator
signal_aggregator = SignalAggregator()

class IBKRWrapper:
    def __init__(self, host='127.0.0.1', port=4002, client_id=1):
        """
        Initialize the IBKR API connection.

        Args:
            host (str): Host address of the IBKR Gateway.
            port (int): Port number of the IBKR Gateway.
            client_id (int): Client ID for the connection.
        """
        self.ib = IB()
        self.host = host
        self.port = port
        self.client_id = client_id

    def connect(self):
        """
        Connect to the IBKR Gateway.
        """
        self.ib.connect(self.host, self.port, self.client_id)
        print("Connected to IBKR Gateway")

    def disconnect(self):
        """
        Disconnect from the IBKR Gateway.
        """
        self.ib.disconnect()
        print("Disconnected from IBKR Gateway")

    def get_market_data(self, symbol, exchange='SMART', currency='USD'):
        """
        Fetch real-time market data for a given symbol.

        Args:
            symbol (str): Ticker symbol of the asset.
            exchange (str): Exchange to fetch data from.
            currency (str): Currency of the asset.

        Returns:
            dict: Market data including bid, ask, and last prices.
        """
        contract = Stock(symbol, exchange, currency)
        self.ib.qualifyContracts(contract)
        ticker = self.ib.reqMktData(contract)
        self.ib.sleep(2)  # Wait for data to populate
        return {
            "symbol": symbol,
            "bid": ticker.bid,
            "ask": ticker.ask,
            "last": ticker.last
        }

    def place_order(self, symbol, action, quantity, order_type='MKT', exchange='SMART', currency='USD'):
        """
        Place an order for a given symbol.

        Args:
            symbol (str): Ticker symbol of the asset.
            action (str): 'BUY' or 'SELL'.
            quantity (int): Number of shares/contracts.
            order_type (str): Type of order ('MKT', 'LMT', etc.).
            exchange (str): Exchange to place the order on.
            currency (str): Currency of the asset.

        Returns:
            Order: The placed order object.
        """
        contract = Stock(symbol, exchange, currency)
        self.ib.qualifyContracts(contract)
        order = self.ib.marketOrder(action, quantity) if order_type == 'MKT' else self.ib.limitOrder(action, quantity, price)
        trade = self.ib.placeOrder(contract, order)
        return trade

@app.route('/api/aggregated-signals', methods=['POST'])
def get_aggregated_signals():
    """
    API endpoint to fetch aggregated signals and market sentiment.

    Request Body:
        {
            "agent_signals": [
                {"agent": "CathyWoodAgent", "action": "BUY", "indicator": "SuperTrend", "data": {...}},
                {"agent": "WarrenBuffetAgent", "action": "SELL", "indicator": "MLMI", "data": {...}}
            ]
        }

    Returns:
        JSON response with aggregated signals and sentiment summary.
    """
    request_data = request.get_json()
    agent_signals = request_data.get("agent_signals", [])

    # Aggregate signals
    aggregated_signals = signal_aggregator.aggregate_signals(agent_signals)

    # Summarize signals
    sentiment_summary = signal_aggregator.summarize_signals(aggregated_signals)

    return jsonify({
        "aggregated_signals": aggregated_signals,
        "sentiment_summary": sentiment_summary
    })

if __name__ == '__main__':
    app.run(debug=True)