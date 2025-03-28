const CryptoDataCollector = require('../src/data/crypto-collector');
const ResearchRepository = require('../src/utils/research-repository');
const path = require('path');
const fs = require('fs');

async function main() {
  // Define target cryptocurrencies
  const cryptocurrencies = [
    'BTC', 'ETH', 'AVAX', 'ADA', 'MATIC', 
    'SUI', 'DOGE', 'HBAR', 'ONE', 'UNI', 'SOL'
  ];
  
  console.log(`Starting data collection for ${cryptocurrencies.length} cryptocurrencies:`);
  console.log(cryptocurrencies.join(', '));
  
  const repository = new ResearchRepository();
  const collector = new CryptoDataCollector({ repository });
  
  try {
    // Collect comprehensive data
    const results = await collector.collectComprehensiveData(cryptocurrencies);
    
    console.log("\n=== Data Collection Complete ===");
    console.log(`Historical data sets: ${results.historical.length}`);
    console.log(`Market data sets: ${results.market.length}`);
    console.log(`Exchange data sets: ${results.exchange.length}`);
    
    // Generate initial reports
    console.log("\nGenerating initial analysis reports...");
    
    for (const crypto of cryptocurrencies) {
      try {
        const report = repository.generateDueDiligenceReport(crypto);
        console.log(`Generated report for ${crypto}: ${path.relative(process.cwd(), report.path)}`);
      } catch (error) {
        console.warn(`Could not generate report for ${crypto}:`, error.message);
      }
    }
    
    console.log("\nData collection and initial analysis complete!");
    console.log(`All data saved to: ${repository.baseDir}`);
    
  } catch (error) {
    console.error("Error during data collection:", error);
  }
}

main().catch(console.error);