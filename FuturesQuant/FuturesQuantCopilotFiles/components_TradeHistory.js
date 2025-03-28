import React, { useState } from 'react';
import './TradeHistory.css';

const TradeHistory = ({ trades, onSelectTrade }) => {
  const [filter, setFilter] = useState('all'); // all, profitable, losing
  const [sortBy, setSortBy] = useState('date'); // date, pnl, symbol
  const [sortDir, setSortDir] = useState('desc'); // asc, desc
  
  const filterTrades = () => {
    let filtered = [...trades];
    
    // Apply filter
    if (filter === 'profitable') {
      filtered = filtered.filter(trade => trade.pnl > 0);
    } else if (filter === 'losing') {
      filtered = filtered.filter(trade => trade.pnl <= 0);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return sortDir === 'asc' 
          ? new Date(a.timestamp) - new Date(b.timestamp)
          : new Date(b.timestamp) - new Date(a.timestamp);
      } else if (sortBy === 'pnl') {
        return sortDir === 'asc' ? a.pnl - b.pnl : b.pnl - a.pnl;
      } else if (sortBy === 'symbol') {
        return sortDir === 'asc' 
          ? a.symbol.localeCompare(b.symbol)
          : b.symbol.localeCompare(a.symbol);
      }
      return 0;
    });
    
    return filtered;
  };
  
  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
  };
  
  const filteredTrades = filterTrades();
  
  // Calculate overall PnL
  const overallPnL = trades.reduce((sum, trade) => sum + trade.pnl, 0);
  const profitCount = trades.filter(t => t.pnl > 0).length;
  const winRate = trades.length ? (profitCount / trades.length) * 100 : 0;

  return (
    <div className="trade-history">
      <div className="trade-summary">
        <div className={`summary-card ${overallPnL >= 0 ? 'profit' : 'loss'}`}>
          <div className="summary-title">Total PnL</div>
          <div className="summary-value">${overallPnL.toFixed(2)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-title">Win Rate</div>
          <div className="summary-value">{winRate.toFixed(1)}%</div>
        </div>
        <div className="summary-card">
          <div className="summary-title">Total Trades</div>
          <div className="summary-value">{trades.length}</div>
        </div>
      </div>
      
      <div className="trade-controls">
        <div className="filter-controls">
          <label>Filter: </label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Trades</option>
            <option value="profitable">Profitable</option>
            <option value="losing">Losing</option>
          </select>
        </div>
      </div>
      
      <div className="trade-table-container">
        <table className="trade-table">
          <thead>
            <tr>
              <th onClick={() => toggleSort('date')}>
                Date/Time
                {sortBy === 'date' && <span>{sortDir === 'asc' ? ' ↑' : ' ↓'}</span>}
              </th>
              <th onClick={() => toggleSort('symbol')}>
                Symbol
                {sortBy === 'symbol' && <span>{sortDir === 'asc' ? ' ↑' : ' ↓'}</span>}
              </th>
              <th>Direction</th>
              <th>Size</th>
              <th>Entry</th>
              <th>Exit</th>
              <th onClick={() => toggleSort('pnl')}>
                PnL
                {sortBy === 'pnl' && <span>{sortDir === 'asc' ? ' ↑' : ' ↓'}</span>}
              </th>
              <th>Influencers</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTrades.map(trade => (
              <tr 
                key={trade.id} 
                className={trade.pnl > 0 ? 'profitable' : 'losing'}
                onClick={() => onSelectTrade(trade)}
              >
                <td>{new Date(trade.timestamp).toLocaleString()}</td>
                <td>{trade.symbol}</td>
                <td className={trade.direction === 'BUY' ? 'buy' : 'sell'}>
                  {trade.direction}
                </td>
                <td>{trade.size}</td>
                <td>${trade.entryPrice.toFixed(2)}</td>
                <td>${trade.exitPrice ? trade.exitPrice.toFixed(2) : 'Open'}</td>
                <td className={trade.pnl > 0 ? 'profit' : 'loss'}>
                  ${trade.pnl.toFixed(2)}
                </td>
                <td>
                  <div className="influencer-tags">
                    {trade.influencers && trade.influencers.map(agentId => (
                      <span key={agentId} className="influencer-tag">
                        {agentId}
                      </span>
                    ))}
                  </div>
                </td>
                <td>
                  <button 
                    className="analyze-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTrade(trade);
                    }}
                  >
                    Analyze
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TradeHistory;