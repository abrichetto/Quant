const path = require('path');
const fs = require('fs');
const readline = require('readline');
const dataAggregator = require('../src/utils/data-aggregator');
const DataSafe = require('../src/utils/data-safe');

// Create interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const dataSafe = new DataSafe();

const menu = `
=============================================
  AlgoTrader Pro - Data Import Utility
=============================================
1. Import All Scraped Indicator Data
2. Import Fundamental Data File
3. Create Comprehensive Research for Symbol
4. Export Data for Backup
5. Search Data Catalog
6. Exit

Choose an option: `;

// Main function
async function main() {
    let running = true;
    
    while (running) {
        const choice = await askQuestion(menu);
        
        switch (choice) {
            case '1':
                await importIndicatorData();
                break;
            case '2':
                await importFundamental();
                break;
            case '3':
                await createSymbolResearch();
                break;
            case '4':
                await exportData();
                break;
            case '5':
                await searchCatalog();
                break;
            case '6':
                console.log('Exiting...');
                running = false;
                break;
            default:
                console.log('Invalid choice, please try again.');
        }
    }
    
    rl.close();
}

// Helper function for prompting user
function askQuestion(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

// Import all indicator data
async function importIndicatorData() {
    console.log('\nImporting all indicator data from scraped sources...');
    const result = dataAggregator.importAllScrapedData();
    
    console.log(`\nImported ${result.totalImported} indicators across ${result.categories.length} categories.`);
    
    for (const category of result.categories) {
        console.log(`- ${category.name}: ${category.count} indicators`);
    }
    
    console.log('\nPress Enter to continue...');
    await askQuestion('');
}

// Import fundamental data
async function importFundamental() {
    const dataPath = await askQuestion('\nEnter path to fundamental data file: ');
    
    if (!fs.existsSync(dataPath)) {
        console.log('File not found. Please check the path and try again.');
        console.log('\nPress Enter to continue...');
        await askQuestion('');
        return;
    }
    
    const dataType = await askQuestion('Enter data type (e.g., financials, earnings, profile): ');
    
    console.log(`\nImporting ${dataType} data from ${dataPath}...`);
    const result = dataAggregator.importFundamentalData(dataPath, dataType);
    
    console.log(`\nImported data for ${result.length} tickers.`);
    
    console.log('\nPress Enter to continue...');
    await askQuestion('');
}

// Create comprehensive research for a symbol
async function createSymbolResearch() {
    const symbol = await askQuestion('\nEnter symbol for comprehensive research: ');
    
    console.log(`\nCreating comprehensive research for ${symbol}...`);
    const result = dataAggregator.createComprehensiveResearch(symbol);
    
    console.log('\nResearch created successfully.');
    console.log(`Symbol: ${result.summary.symbol}`);
    console.log(`Fundamental Data Points: ${result.summary.fundamentalDataPoints}`);
    console.log(`Technical Data Points: ${result.summary.technicalDataPoints}`);
    console.log(`Recommended Indicators: ${result.summary.recommendedIndicators}`);
    console.log(`Research Path: ${result.researchPath}`);
    
    console.log('\nPress Enter to continue...');
    await askQuestion('');
}

// Export data for backup
async function exportData() {
    const exportPath = await askQuestion('\nEnter export directory path: ');
    const includeSecureStr = await askQuestion('Include secure data? (y/n): ');
    const includeSecure = includeSecureStr.toLowerCase() === 'y';
    
    console.log(`\nExporting data to ${exportPath}...`);
    const result = dataSafe.exportData(exportPath, includeSecure);
    
    console.log(`\nData exported successfully to ${result}`);
    
    console.log('\nPress Enter to continue...');
    await askQuestion('');
}

// Search catalog
async function searchCatalog() {
    console.log('\nSearch Options:');
    console.log('1. By Type (market_data, research, technical_analysis, fundamental, strategy)');
    console.log('2. By Asset/Symbol');
    console.log('3. By Category');
    
    const searchType = await askQuestion('\nChoose search type: ');
    let query = {};
    
    switch (searchType) {
        case '1':
            const type = await askQuestion('Enter data type: ');
            query.type = type;
            break;
        case '2':
            const symbol = await askQuestion('Enter asset/symbol: ');
            query.asset = symbol;
            // Also search for ticker which is used for fundamentals
            const results = [
                ...dataSafe.search({ asset: symbol }),
                ...dataSafe.search({ ticker: symbol })
            ];
            displaySearchResults(results);
            console.log('\nPress Enter to continue...');
            await askQuestion('');
            return;
        case '3':
            const category = await askQuestion('Enter category: ');
            query.category = category;
            break;
        default:
            console.log('Invalid choice.');
            return;
    }
    
    const results = dataSafe.search(query);
    displaySearchResults(results);
    
    console.log('\nPress Enter to continue...');
    await askQuestion('');
}

// Display search results
function displaySearchResults(results) {
    console.log(`\nFound ${results.length} results:`);
    
    for (let i = 0; i < Math.min(results.length, 20); i++) {
        const item = results[i];
        console.log(`\n[${i+1}] ID: ${item.id}`);
        console.log(`    Type: ${item.type}`);
        
        if (item.title) console.log(`    Title: ${item.title}`);
        if (item.asset) console.log(`    Asset: ${item.asset}`);
        if (item.ticker) console.log(`    Ticker: ${item.ticker}`);
        if (item.category) console.log(`    Category: ${item.category}`);
        if (item.timestamp) console.log(`    Timestamp: ${item.timestamp}`);
        
        console.log(`    Path: ${item.filePath}`);
    }
    
    if (results.length > 20) {
        console.log(`\n... and ${results.length - 20} more results.`);
    }
}

// Run the main function
main().catch(error => {
    console.error('An error occurred:', error);
    rl.close();
});