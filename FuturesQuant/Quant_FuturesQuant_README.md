# FuturesQuant

## Overview
FuturesQuant is a comprehensive trading dashboard designed to analyze and visualize trading strategies and their performance. It includes features such as agent decision impact analysis, trading history, PNL summaries, and detailed trade analysis.

## Features
- **Agent Decisions & Impact**: Visualize the impact of agent decisions on trades.
- **Trading History & PNL**: View historical trades and their PNL.
- **Detailed Trade Analysis**: Analyze individual trades in detail, including PNL and agent impact.
- **Real-time Updates**: The dashboard fetches and updates data in real-time.
- **CoPilot Chat**: Integrated chat feature for assistance.

## Folder Structure
```plaintext
FuturesQuant/
  ├── Dashboard/
  │     ├── MainDashboard.js
  │     ├── PNLTab.js
  │     ├── VotingLogic.js
  │     ├── components/
  │           ├── AgentImpactPanel.js
  │           ├── TradeHistory.js
  │           ├── DecisionTreeVisualizer.js
  │           ├── DetailedTradeAnalysis.js
  │           └── ChatBox.js
  ├── README.md
```

## Components and Logic Explanation

### MainDashboard
The `MainDashboard` component is the core of the FuturesQuant dashboard. It manages the state and integrates all other components to display the trading overview and detailed trade analysis.

#### Logic
- **State Management**: Manages state variables such as activeTab, activeTrade, trades, agents, isChatVisible, and pnlSummary.
- **Data Fetching**: Uses `useEffect` to fetch initial data and set up real-time updates for trades and PNL summary.
- **Tab Navigation**: Switches between the overview and detailed analysis tabs.
- **Handlers**: Includes handlers for selecting trades and toggling the chat visibility.

```javascript name=Quant/FuturesQuant/Dashboard/MainDashboard.js
import AgentImpactPanel from './components/AgentImpactPanel';
import TradeHistory from './components/TradeHistory';
import DecisionTreeVisualizer from './components/DecisionTreeVisualizer';
import DetailedTradeAnalysis from './components/DetailedTradeAnalysis';
import ChatBox from './components/ChatBox';
import './Dashboard.css';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [activeTrade, setActiveTrade] = useState(null);
  const [trades, setTrades] = useState([]);
  const [agents, setAgents] = useState([]);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [pnlSummary, setPnlSummary] = useState({});

  useEffect(() => {
    // Fetch initial data
    fetchTrades();
    fetchAgents();
    fetchPnlSummary();
    
    // Set up real-time updates
    const tradesInterval = setInterval(fetchTrades, 30000);
    const pnlInterval = setInterval(fetchPnlSummary, 30000);
    return () => {
      clearInterval(tradesInterval);
      clearInterval(pnlInterval);
    };
  }, []);
  
  const fetchTrades = async () => {
    try {
      // Replace with actual API call to big.one
      const response = await fetch('/api/trades');
      const data = await response.json();
      setTrades(data);
    } catch (error) {
      console.error('Error fetching trades:', error);
    }
  };
  
  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents');
      const data = await response.json();
      setAgents(data);
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const fetchPnlSummary = async () => {
    try {
      const response = await fetch('/api/pnl-summary');
      const data = await response.json();
      setPnlSummary(data);
    } catch (error) {
      console.error('Error fetching PNL summary:', error);
    }
  };
  
  const handleTradeSelect = (trade) => {
    setActiveTrade(trade);
    setActiveTab('details');
  };
  
  const toggleChat = () => {
    setIsChatVisible(!isChatVisible);
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Trading Dashboard</h1>
        <div className="last-updated">
          Last updated: {new Date().toLocaleString()}
        </div>
        <div className="tab-navigation">
          <button 
            className={activeTab === 'overview' ? 'active' : ''} 
            onClick={() => setActiveTab('overview')}
          >
            Trading Overview
          </button>
          <button 
            className={activeTab === 'details' ? 'active' : ''} 
            onClick={() => setActiveTab('details')}
          >
            Trade Analysis
          </button>
        </div>
      </header>
      
      <main className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="agent-decision-section">
              <h2>Agent Decisions & Impact</h2>
              <AgentImpactPanel agents={agents} trades={trades} />
              <DecisionTreeVisualizer agents={agents} />
            </div>
            
            <div className="trade-history-section">
              <h2>Trading History & PnL</h2>
              <TradeHistory 
                trades={trades} 
                onSelectTrade={handleTradeSelect}
              />
              <div className="pnl-summary">
                <h3>PNL Summary</h3>
                <p>Leverage: {pnlSummary.leverage}</p>
                <p>Active Trades: {pnlSummary.activeTrades}</p>
                <p>PNL: {pnlSummary.pnl}</p>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'details' && (
          <DetailedTradeAnalysis 
            trade={activeTrade}
            agents={agents}
            pnlSummary={pnlSummary}
          />
        )}
      </main>
      
      <button className="chat-toggle" onClick={toggleChat}>
        {isChatVisible ? 'Hide CoPilot' : 'Show CoPilot'}
      </button>
      
      {isChatVisible && (
        <ChatBox onClose={() => setIsChatVisible(false)} />
      )}
    </div>
  );
};

export default Dashboard;
```

### PNLTab
The `PNLTab` component displays a concise PNL summary including leverage and active trades.

#### Logic
- **Data Display**: Shows leverage, active trades, and PNL from the pnlSummary prop.

```javascript name=Quant/FuturesQuant/Dashboard/PNLTab.js
import React from 'react';

const PNLTab = ({ pnlSummary }) => {
  return (
    <div className="pnl-summary">
      <h3>PNL Summary</h3>
      <p>Leverage: {pnlSummary.leverage}</p>
      <p>Active Trades: {pnlSummary.activeTrades}</p>
      <p>PNL: {pnlSummary.pnl}</p>
    </div>
  );
};

export default PNLTab;
```

### VotingLogic
The `VotingLogic` component shows detailed voting logic for agents and their impact on trades.

#### Logic
- **Agent Impact Display**: Lists agent names and their impact on trades.

```javascript name=Quant/FuturesQuant/Dashboard/VotingLogic.js
import React from 'react';

const VotingLogic = ({ agents, trades }) => {
  return (
    <div className="voting-logic">
      <h3>Voting Logic</h3>
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

export default VotingLogic;
```

### Components

#### AgentImpactPanel
Displays the impact of each agent's decisions on trades.

```javascript name=Quant/FuturesQuant/Dashboard/components/AgentImpactPanel.js
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
```

#### TradeHistory
Lists historical trades with PNL and agent impact.

```javascript name=Quant/FuturesQuant/Dashboard/components/TradeHistory.js
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
```

#### DecisionTreeVisualizer
Visualizes the decision-making process of agents.

```javascript name=Quant/FuturesQuant/Dashboard/components/DecisionTreeVisualizer.js
import React from 'react';

const DecisionTreeVisualizer = ({ agents }) => {
  return (
    <div className="decision-tree-visualizer">
      <h3>Decision Tree Visualizer</h3>
      {/* Add visualization logic here */}
    </div>
  );
};

export default DecisionTreeVisualizer;
```

#### DetailedTradeAnalysis
Provides detailed analysis of individual trades.

```javascript name=Quant/FuturesQuant/Dashboard/components/DetailedTradeAnalysis.js
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
```

#### ChatBox
Integrated chat feature for assistance.

```javascript name=Quant/FuturesQuant/Dashboard/components/ChatBox.js
import React from 'react';

const ChatBox = ({ onClose }) => {
  return (
    <div className="chat-box">
      <h3>CoPilot Chat</h3>
      {/* Add chat logic here */}
      <button onClick={onClose}>Close Chat</button>
    </div>
  );
};

export default ChatBox;
```

## Installation
1. Clone the repository: `git clone https://github.com/abrichetto/Quant`
2. Navigate to the `FuturesQuant` folder: `cd Quant/FuturesQuant`
3. Install dependencies: `npm install`
4. Start the application: `npm start`

## Usage
Navigate to the dashboard in your browser to view trading overviews, detailed trade analysis, and more.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue to discuss your ideas.

## License
This project is licensed under the MIT License.