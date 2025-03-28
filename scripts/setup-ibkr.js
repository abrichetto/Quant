const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const IBKRAdapter = require('../src/execution/broker/ibkr');

// Create interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to ask questions
function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupIBKR() {
  console.log("\n=== Interactive Brokers (IBKR) Setup ===\n");
  console.log("This script will help you configure your IBKR connection.\n");
  
  // Check if IBKR TWS or Gateway is installed
  console.log("First, let's verify your IBKR installation:");
  
  if (process.platform === 'darwin') { // Mac
    console.log("Checking for TWS/Gateway on MacOS...");
    const appsDir = '/Applications';
    const tws = fs.existsSync(path.join(appsDir, 'Trader Workstation.app'));
    const gateway = fs.existsSync(path.join(appsDir, 'IB Gateway.app'));
    
    if (tws) console.log("✅ Trader Workstation found");
    else console.log("❌ Trader Workstation not found");
    
    if (gateway) console.log("✅ IB Gateway found");
    else console.log("❌ IB Gateway not found");
  } else if (process.platform === 'win32') { // Windows
    console.log("Checking for TWS/Gateway on Windows...");
    // Add Windows-specific paths
  } else {
    console.log("Automatic detection not available for this OS. Please verify installation manually.");
  }

  // Configure API settings
  console.log("\n1. IBKR Connection Settings");
  console.log("-------------------------");
  
  const host = await askQuestion("Enter host (default: 127.0.0.1): ") || "127.0.0.1";
  const port = await askQuestion("Enter port (7496 for TWS, 7497 for Gateway/Paper): ") || "7497";
  const clientId = await askQuestion("Enter client ID (default: 1): ") || "1";
  
  // Account info
  console.log("\n2. Account Information");
  console.log("--------------------");
  
  const accountId = await askQuestion("Enter your IBKR Account ID: ");
  
  // Create config directory if it doesn't exist
  const configDir = path.join(__dirname, '..', 'config');
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  // Save configuration
  const config = {
    host,
    port: parseInt(port),
    clientId: parseInt(clientId),
    accountId,
    readOnly: true, // Start in read-only mode for safety
    created: new Date().toISOString()
  };
  
  fs.writeFileSync(
    path.join(configDir, 'ibkr-config.json'),
    JSON.stringify(config, null, 2)
  );
  
  console.log("\n✅ Configuration saved successfully!");
  console.log(`File: ${path.join(configDir, 'ibkr-config.json')}`);
  
  // Test connection
  console.log("\n3. Testing Connection");
  console.log("-----------------");
  console.log("Please ensure TWS or IB Gateway is running with API access enabled.");
  console.log("Note: In TWS/Gateway, go to Edit > Global Configuration > API > Settings and check 'Enable ActiveX and Socket Clients'");
  
  const proceed = await askQuestion("\nAttempt to connect now? (y/n): ");
  
  if (proceed.toLowerCase() === 'y') {
    try {
      console.log("\nAttempting to connect to IBKR...");
      
      const ibkr = new IBKRAdapter(config);
      await ibkr.connect();
      
      console.log("\n✅ Successfully connected to IBKR!");
      
      // Get account summary as a test
      console.log("\nFetching account summary...");
      const summary = await ibkr.getAccountSummary();
      console.log("Account summary:", summary);
      
      await ibkr.disconnect();
    } catch (error) {
      console.error("\n❌ Connection failed:", error.message);
      console.log("\nPlease check that:");
      console.log("1. TWS or IB Gateway is running");
      console.log("2. API access is enabled in settings");
      console.log("3. The port and client ID match your configuration");
    }
  }
  
  console.log("\nSetup complete! You can now use the IBKR adapter in AlgoTrader Pro.");
  
  rl.close();
}

// Run the setup
setupIBKR().catch(console.error);