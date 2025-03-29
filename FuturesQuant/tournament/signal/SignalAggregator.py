from core.indicator.manager import IndicatorManager

class SignalAggregator:
    def __init__(self):
        self.indicator_manager = IndicatorManager()

    def aggregate_signals(self, agent_signals):
        """
        Aggregates signals from agents and calculates indicator-based signals.

        Args:
            agent_signals (list): List of agent signals. Each signal is a dictionary
                                  containing 'agent', 'action', 'indicator', and 'data'.

        Returns:
            list: Aggregated signals with indicator-based calculations.
        """
        aggregated_signals = []
        for signal in agent_signals:
            # Calculate the indicator signal using the IndicatorManager
            indicator_signal = self.indicator_manager.calculate(signal["indicator"], signal["data"])
            
            # Append the aggregated signal
            aggregated_signals.append({
                "agent": signal["agent"],
                "action": signal["action"],
                "indicator_signal": indicator_signal,
            })
        
        return aggregated_signals

    def summarize_signals(self, aggregated_signals):
        """
        Summarizes aggregated signals to provide an overall market sentiment.

        Args:
            aggregated_signals (list): List of aggregated signals.

        Returns:
            dict: Summary of market sentiment (e.g., buy/sell/hold counts).
        """
        summary = {"BUY": 0, "SELL": 0, "HOLD": 0}
        for signal in aggregated_signals:
            action = signal.get("action", "HOLD")
            if action in summary:
                summary[action] += 1
        return summary

