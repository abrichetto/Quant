const IBKRAdapter = require('../src/execution/broker/ibkr');
const CryptoDataCollector = require('../src/data/crypto-collector');
const TechnicalAnalyzer = require('../src/analysis/technical-analyzer');
const ResearchRepository = require('../src/utils/research-repository');
const fs = require('fs');
const path = require('path');

async function runIntegrationTest() {
  console.log("=== AlgoTrader Pro Integration Test ===");
  
  // Initialize repository
  console.log("\n1. Initializing Research Repository...");
  const repository = new ResearchRepository();
  console.log(`Repository initialized at: ${repository.baseDir}`);
  
  // Test IBKR connection if config exists
  const configPath = path.join(__dirname, '..', 'config', 'ibkr-config.json');
  if (fs.existsSync(configPath)) {
    console.log("\n2. Testing IBKR Connection...");
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      const ibkr = new IBKRAdapter(config);
      
      await ibkr.connect();
      console.log("✅ Connected to IBKR successfully!");
      
      console.log("Fetching account summary...");
      const summary = await ibkr.getAccountSummary();
      console.log("Account summary:", summary);
      
      await ibkr.disconnect();
      console.log("Disconnected from IBKR");
    } catch (error) {
      console.error("❌ IBKR connection failed:", error.message);
      console.log("Continuing with other tests...");
    }
  } else {
    console.log("\n2. IBKR configuration not found. Skipping IBKR test.");
  }
  
  // Test cryptocurrency data collection
  console.log("\n3. Testing Cryptocurrency Data Collection...");
  const collector = new CryptoDataCollector({ repository });
  
  try {
    // Test with just one cryptocurrency for speed
    console.log("Fetching data for BTC...");
    const result = await collector.getHistoricalData('BTC', 7, 'daily');
    console.log(`✅ Successfully collected ${result.data.length} data points for BTC`);
    
    // Test technical analysis
    console.log("\n4. Testing Technical Analysis...");
    const analyzer = new TechnicalAnalyzer({ repository });
    
    const analysis = await analyzer.analyzeCrypto('BTC');
    console.log("✅ Technical analysis completed!");
    console.log(`Analysis saved to: ${analysis.path}`);
    
    // Create a due diligence report
    console.log("\n5. Generating Due Diligence Report...");
    const report = repository.generateDueDiligenceReport('BTC');
    console.log(`✅ Report generated at: ${report.path}`);
    
    console.log("\nSuccessfully completed all integration tests!");
  } catch (error) {
    console.error("❌ Error during testing:", error);
  }
}

runIntegrationTest().catch(console.error);