const path = require('path');
const fs = require('fs');
const ResearchRepository = require('./research-repository');

class DataAggregator {
    constructor() {
        // Initialize research repository
        this.repository = new ResearchRepository();
        
        // Base directory for indicator data
        this.indicatorsDir = path.join(__dirname, '..', '..', 'indicators');
        this.analysisDir = path.join(this.indicatorsDir, 'analysis');
    }
    
    /**
     * Import all analyzed indicator data into the research repository
     */
    importIndicatorAnalysis() {
        if (!fs.existsSync(this.analysisDir)) {
            console.warn(`Analysis directory not found: ${this.analysisDir}`);
            return [];
        }
        
        const analysisFiles = fs.readdirSync(this.analysisDir)
                              .filter(file => file.endsWith('_analysis.json'));
        
        const imported = [];
        
        for (const file of analysisFiles) {
            try {
                const filePath = path.join(this.analysisDir, file);
                const analysis = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                
                // Determine indicator category based on features
                let category = 'general';
                if (analysis.features.includes('Smart Money Concepts')) {
                    category = 'smart_money';
                } else if (analysis.features.includes('Advanced Moving Averages')) {
                    category = 'moving_averages';
                } else if (analysis.features.includes('Statistical Methods')) {
                    category = 'statistical';
                }
                
                // Store as technical analysis research
                const result = this.repository.storeResearch(
                    analysis.name,
                    'analysis',
                    analysis,
                    {
                        category,
                        complexityScore: analysis.complexityScore,
                        features: analysis.features,
                        source: 'indicator_analysis'
                    }
                );
                
                imported.push({
                    name: analysis.name,
                    path: result,
                    category
                });
            } catch (error) {
                console.error(`Error importing analysis for ${file}:`, error);
            }
        }
        
        return imported;
    }
    
    /**
     * Import external data feed for fundamental analysis
     * @param {string} dataPath - Path to data file
     * @param {string} dataType - Type of fundamental data
     */
    importFundamentalData(dataPath, dataType) {
        try {
            const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
            
            const imported = [];
            
            // Process each ticker in the data
            for (const ticker in rawData) {
                // Store the fundamental data
                const result = this.dataSafe.storeFundamental(
                    ticker,
                    dataType,
                    rawData[ticker],
                    {
                        source: path.basename(dataPath),
                        importDate: new Date().toISOString()
                    }
                );
                
                imported.push({
                    ticker,
                    path: result,
                    dataType
                });
            }
            
            return imported;
        } catch (error) {
            console.error(`Error importing fundamental data from ${dataPath}:`, error);
            return [];
        }
    }
    
    /**
     * Import all data from script scraper into organized structure
     */
    importAllScrapedData() {
        console.log('Importing all scraped indicator data...');
        
        // Import indicator analysis
        const analysisResults = this.importIndicatorAnalysis();
        console.log(`Imported ${analysisResults.length} indicator analyses`);
        
        // Group by category
        const byCategory = analysisResults.reduce((acc, item) => {
            if (!acc[item.category]) acc[item.category] = [];
            acc[item.category].push(item);
            return acc;
        }, {});
        
        // Create a summary report
        const summary = {
            totalImported: analysisResults.length,
            categories: Object.keys(byCategory).map(category => ({
                name: category,
                count: byCategory[category].length,
                indicators: byCategory[category].map(item => item.name)
            })),
            importDate: new Date().toISOString()
        };
        
        // Store the summary report
        this.repository.storeResearch(
            'Indicator Import Summary',
            'reports',
            summary,
            {
                source: 'scraper',
                totalCount: analysisResults.length
            }
        );
        
        return summary;
    }
    
    /**
     * Create comprehensive research for a symbol combining all data
     * @param {string} symbol - The symbol to analyze
     */
    createComprehensiveResearch(symbol) {
        console.log(`Creating comprehensive research for ${symbol}...`);
        
        // Collect all data for this symbol
        const research = {
            symbol,
            timestamp: new Date().toISOString(),
            fundamental: {},
            technical: {},
            indicators: {},
            strategies: []
        };
        
        // Try to find fundamental data
        try {
            const fundamentalData = this.dataSafe.search({ 
                type: 'fundamental', 
                ticker: symbol 
            });
            
            if (fundamentalData.length > 0) {
                for (const item of fundamentalData) {
                    const data = this.dataSafe.retrieveById(item.id);
                    research.fundamental[item.dataType] = data.data;
                }
            }
        } catch (error) {
            console.warn(`No fundamental data found for ${symbol}`);
        }
        
        // Try to find technical analysis
        try {
            const technicalData = this.dataSafe.search({ 
                type: 'technical_analysis', 
                asset: symbol 
            });
            
            if (technicalData.length > 0) {
                for (const item of technicalData) {
                    const data = this.dataSafe.retrieveById(item.id);
                    research.technical[item.analysisType] = data.data;
                }
            }
        } catch (error) {
            console.warn(`No technical analysis found for ${symbol}`);
        }
        
        // Find appropriate indicators
        try {
            const indicatorAnalyses = this.dataSafe.search({ 
                type: 'research',
                'metadata.source': 'indicator_analysis'
            });
            
            if (indicatorAnalyses.length > 0) {
                // Get the top 5 indicators by complexity score
                const topIndicators = indicatorAnalyses
                    .sort((a, b) => 
                        b.metadata.complexityScore - a.metadata.complexityScore
                    )
                    .slice(0, 5);
                
                for (const item of topIndicators) {
                    const data = this.dataSafe.retrieveById(item.id);
                    research.indicators[data.title] = {
                        features: data.data.features,
                        score: data.data.complexityScore,
                        advantages: data.data.potentialAdvantages
                    };
                }
            }
        } catch (error) {
            console.warn(`Error finding indicators: ${error.message}`);
        }
        
        // Store the comprehensive research
        const result = this.dataSafe.storeResearch(
            `Comprehensive Analysis - ${symbol}`,
            'reports',
            research,
            {
                symbol,
                comprehensive: true,
                dataSources: [
                    Object.keys(research.fundamental).length > 0 ? 'fundamental' : null,
                    Object.keys(research.technical).length > 0 ? 'technical' : null,
                    Object.keys(research.indicators).length > 0 ? 'indicators' : null
                ].filter(Boolean)
            }
        );
        
        return {
            researchPath: result,
            summary: {
                symbol,
                fundamentalDataPoints: Object.keys(research.fundamental).length,
                technicalDataPoints: Object.keys(research.technical).length,
                recommendedIndicators: Object.keys(research.indicators).length
            }
        };
    }

    /**
     * Create a sample investment thesis
     */
    createSampleThesis(symbol) {
        const thesis = {
            summary: `This thesis presents our analysis of ${symbol} as an algorithmic trading opportunity.`,
            key_points: [
                "Significant technical patterns identified by our proprietary indicators",
                "Statistical arbitrage opportunity based on correlation analysis",
                "Smart money concepts show potential accumulation pattern"
            ],
            risk_factors: [
                "Higher than average volatility",
                "Potential for sudden price movements due to news events",
                "Historical pattern breakdown during market stress"
            ],
            time_horizon: "Medium-term (3-6 months)",
            confidence_level: "Medium-high",
            supporting_indicators: []
        };
        
        // Find top indicators to support the thesis
        const indicators = this.repository.search({ 
            type: 'research',
            category: 'analysis'
        });
        
        if (indicators.length > 0) {
            const topIndicators = indicators
                .sort((a, b) => 
                    (b.metadata && b.metadata.complexityScore ? b.metadata.complexityScore : 0) - 
                    (a.metadata && a.metadata.complexityScore ? a.metadata.complexityScore : 0)
                )
                .slice(0, 3);
                
            for (const indicator of topIndicators) {
                const data = this.repository._retrieveFile(indicator);
                thesis.supporting_indicators.push({
                    name: data.title,
                    strengths: data.data.potentialAdvantages || []
                });
            }
        }
        
        return this.repository.createInvestmentThesis(symbol, thesis);
    }
    
    /**
     * Generate a complete research dataset for a demo
     */
    generateDemoResearch() {
        const symbols = ['AAPL', 'MSFT', 'TSLA', 'AMZN', 'GOOGL'];
        const results = [];
        
        for (const symbol of symbols) {
            // Create a sample thesis
            this.createSampleThesis(symbol);
            
            // Generate a complete due diligence report
            const report = this.repository.generateDueDiligenceReport(symbol);
            results.push({
                symbol,
                report: report.path
            });
        }
        
        return results;
    }
}

module.exports = new DataAggregator();