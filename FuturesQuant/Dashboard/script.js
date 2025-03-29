async function fetchAggregatedSignals() {
    try {
        const response = await fetch('/api/aggregated-signals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                agent_signals: [
                    { agent: "CathyWoodAgent", action: "BUY", indicator: "SuperTrend", data: {} },
                    { agent: "WarrenBuffetAgent", action: "SELL", indicator: "MLMI", data: {} }
                ]
            })
        });

        const data = await response.json();
        updateDashboard(data);
    } catch (error) {
        console.error('Error fetching aggregated signals:', error);
    }
}

function updateDashboard(data) {
    const dashboard = document.getElementById('dashboard');
    dashboard.innerHTML = '';

    // Display aggregated signals
    const signalsSection = document.createElement('div');
    signalsSection.innerHTML = '<h3>Aggregated Signals</h3>';
    data.aggregated_signals.forEach(signal => {
        const signalRow = document.createElement('div');
        signalRow.className = 'signal-row';
        signalRow.innerHTML = `
            <div>Agent: ${signal.agent}</div>
            <div>Action: ${signal.action}</div>
            <div>Indicator Signal: ${signal.indicator_signal}</div>
        `;
        signalsSection.appendChild(signalRow);
    });
    dashboard.appendChild(signalsSection);

    // Display sentiment summary
    const sentimentSection = document.createElement('div');
    sentimentSection.innerHTML = `
        <h3>Market Sentiment Summary</h3>
        <div>BUY: ${data.sentiment_summary.BUY}</div>
        <div>SELL: ${data.sentiment_summary.SELL}</div>
        <div>HOLD: ${data.sentiment_summary.HOLD}</div>
    `;
    dashboard.appendChild(sentimentSection);
}

// Fetch data every 5 seconds
setInterval(fetchAggregatedSignals, 5000);