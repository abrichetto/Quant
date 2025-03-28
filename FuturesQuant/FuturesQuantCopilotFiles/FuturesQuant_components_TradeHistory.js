import React from 'react';

const TradeHistory = ({ trades, onSelectTrade }) => {
  return (
    <div className="trade-history">
      <h3>Trade History</h3>
      <ul>
        {trades.map((trade) => (
          <li key={trade.id} onClick={() => onSelectTrade(trade)}>
            {trade.symbol} - {trade.pnl} (Agent Impact: {trade.agentImpact})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TradeHistory;