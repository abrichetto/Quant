import React from 'react';

const AgentImpactPanel = ({ agents, trades }) => {
  return (
    <div className="agent-impact-panel">
      <h3>Agent Impact</h3>
      {agents.map((agent) => (
        <div key={agent.id} className="agent-impact-item">
          <h4>{agent.name}</h4>
          <ul>
            {trades.map((trade) => (
              <li key={trade.id}>
                {trade.symbol} - {trade.pnl} (Voting Impact: {agent.votingImpact[trade.id]})
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default AgentImpactPanel;