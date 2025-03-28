import React from 'react';

const DetailedTradeAnalysis = ({ trade, agents, pnlSummary }) => {
  if (!trade) {
    return <div>Select a trade to see details</div>;
  }

  return (
    <div className="detailed-trade-analysis">
      <h3>Trade Analysis for {trade.symbol}</h3>
      <p>PNL: {trade.pnl}</p>
      <p>PNL Summary: {pnlSummary.pnl}</p>
      <h4>Agent Impact</h4>
      <ul>
        {agents.map((agent) => (
          <li key={agent.id}>
            {agent.name} - Impact: {agent.votingImpact[trade.id]}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DetailedTradeAnalysis;