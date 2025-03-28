const DataAggregator = require('../utils/data-aggregator');

async function runScrapingPipeline() {
    console.log("Running scraping pipeline...");
    // Add scraping logic here
}

async function runImportPipeline() {
    console.log("Running import pipeline...");
    const dataAggregator = new DataAggregator();
    dataAggregator.importIndicatorAnalysis();
}

async function runDemoPipeline() {
    console.log("Running demo pipeline...");
    const dataAggregator = new DataAggregator();
    await dataAggregator.generateDemoResearch();
}

module.exports = { runScrapingPipeline, runImportPipeline, runDemoPipeline };