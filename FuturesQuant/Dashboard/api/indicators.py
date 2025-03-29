from flask import Flask, jsonify, request
from tournament.signal.SignalAggregator import SignalAggregator

app = Flask(__name__)

# Initialize SignalAggregator
signal_aggregator = SignalAggregator()

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