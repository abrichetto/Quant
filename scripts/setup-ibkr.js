const IBKRHandler = require('../src/execution/broker/ibkr');
const path = require('path');
const fs = require('fs');

// Load configuration
const configPath = path.join(__dirname, '../config/ibkr.json');
let config = {};

try {
    if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
} catch (error) {
    console.error('Error loading IBKR config:', error);
}

// Create IBKR handler instance
const ibkr = new IBKRHandler(config);

// Set up event handlers
ibkr.on('connected', () => {
    console.log('Successfully connected to IBKR');
    process.exit(0);
});

ibkr.on('error', (error) => {
    console.error('IBKR connection error:', error);
    process.exit(1);
});

ibkr.on('disconnected', () => {
    console.log('Disconnected from IBKR');
    process.exit(0);
});

// Connect to IBKR
console.log('Connecting to IBKR...');
ibkr.connect().catch(error => {
    console.error('Failed to connect to IBKR:', error);
    process.exit(1);
});