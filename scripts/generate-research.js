const path = require('path');
const fs = require('fs');
const dataAggregator = require('../src/utils/data-aggregator');
const ResearchRepository = require('../src/utils/research-repository');

const repository = new ResearchRepository();

async function main() {
    const command = process.argv[2] || 'help';
    
    switch(command) {
        case 'import':
            await importIndicators();
            break;
        case 'demo':
            await generateDemo();
            break;
        case 'report':
            await generateReport();
            break;
        case 'export':
            await exportData();
            break;
        case 'help':
        default:
            showHelp();
            break;
    }
}

async function importIndicators() {
    console.log('Importing indicator data from scraper...');
    const result = dataAggregator.importAllScrapedData();
    
    console.log(`\nImported ${result.totalImported} indicators across ${result.categories.length} categories.`);
    console.log('\nCategory breakdown:');
    
    for (const category of result.categories) {
        console.log(`- ${category.name}: ${category.count} indicators`);
    }
}

async function generateDemo() {
    console.log('Generating demo research datasets...');
    const results = dataAggregator.generateDemoResearch();
    
    console.log(`\nGenerated research for ${results.length} symbols:`);
    for (const result of results) {
        console.log(`- ${result.symbol}: ${result.report}`);
    }
    
    console.log('\nResearch presentations have been created in:');
    console.log(path.join(repository.baseDir, 'presentations'));
}

async function generateReport() {
    const symbol = process.argv[3];
    if (!symbol) {
        console.error('Please specify a symbol: node generate-research.js report SYMBOL');
        return;
    }
    
    console.log(`Generating due diligence report for ${symbol}...`);
    const result = repository.generateDueDiligenceReport(symbol);
    
    console.log(`\nReport generated at: ${result.path}`);
    console.log(`\nPresentation created in: ${repository.directories.presentations}`);
}

async function exportData() {
    const exportPath = process.argv[3] || path.join(__dirname, '..', 'export');
    
    console.log(`Exporting all research data to ${exportPath}...`);
    const result = repository.exportData(exportPath);
    
    console.log(`\nAll data exported to: ${result}`);
    console.log(`\nOpen ${path.join(result, 'index.html')} in a browser to view the repository.`);
}

function showHelp() {
    console.log(`
AlgoTrader Pro Research Generator

Usage:
  node generate-research.js <command> [options]

Commands:
  import               Import all indicator analysis from the scraper
  demo                 Generate demo research datasets for sample symbols
  report <symbol>      Generate a due diligence report for a specific symbol
  export [path]        Export all research data to the specified path
  help                 Show this help message

Examples:
  node generate-research.js import
  node generate-research.js report AAPL
  node generate-research.js export ./investor-presentation
    `);
}

main().catch(error => {
    console.error('Error:', error);
});