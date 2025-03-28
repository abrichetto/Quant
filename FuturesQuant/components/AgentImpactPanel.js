import React from 'react';
import './AgentImpactPanel.css';

const AgentImpactPanel = ({ agents, trades }) => {
  // Calculate agent impact scores based on recent trades
  const calculateAgentImpact = (agent, trades) => {
    if (!trades.length) return { score: 0, profits: 0, accuracy: 0 };
    
    const agentTrades = trades.filter(trade => 
      trade.influencers && trade.influencers.includes(agent.id)
    );
    
    if (!agentTrades.length) return { score: 0, profits: 0, accuracy: 0 };
    
    const profitableTrades = agentTrades.filter(trade => trade.pnl > 0);
    const totalPnL = agentTrades.reduce((sum, trade) => sum + trade.pnl, 0);
    
    return {
      score: (totalPnL / agentTrades.length) * (profitableTrades.length / agentTrades.length) * 10,
      profits: totalPnL,
      accuracy: (profitableTrades.length / agentTrades.length) * 100
    };
  };

  return (
    <div className="agent-impact-panel">
      <div className="agent-cards">
        {agents.map(agent => {
          const impact = calculateAgentImpact(agent, trades);
          
          return (
            <div key={agent.id} className="agent-card">
              <div className="agent-header">
                <h3>{agent.name}</h3>
                <div className={`impact-score ${impact.score > 0 ? 'positive' : 'negative'}`}>
                  {impact.score.toFixed(1)}
                </div>
              </div>
              
              <div className="agent-metrics">
                <div className="metric">
                  <span className="metric-label">Profit Contribution:</span>
                  <span className={`metric-value ${impact.profits > 0 ? 'positive' : 'negative'}`}>
                    ${impact.profits.toFixed(2)}
                  </span>
                </div>
                <div className="metric">
                  <span className="metric-label">Signal Accuracy:</span>
                  <span className="metric-value">{impact.accuracy.toFixed(1)}%</span>
                </div>
              </div>
              
              <div className="agent-recent">
                <h4>Recent Decisions:</h4>
                <ul className="decision-list">
                  {trades
                    .filter(trade => trade.influencers && trade.influencers.includes(agent.id))
                    .slice(0, 3)
                    .map(trade => (
                      <li key={trade.id} className={trade.pnl > 0 ? 'positive' : 'negative'}>
                        {trade.symbol}: {trade.direction === 'BUY' ? '↑' : '↓'} {trade.reasoning.slice(0, 50)}...
                      </li>
                    ))
                  }
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AgentImpactPanel;