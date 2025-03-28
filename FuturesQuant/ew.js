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