import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Create base directories
const baseDir = path.join(__dirname, 'indicators');
const analysisDir = path.join(baseDir, 'analysis');

// Ensure directories exist
if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });
if (!fs.existsSync(analysisDir)) fs.mkdirSync(analysisDir, { recursive: true });

// List of TradingView scripts to scrape
const tradingViewScripts = [
    {
        url: 'https://www.tradingview.com/script/bkvQ5hNF-CM-Ultimate-MA-MTF-V4/',
        category: 'moving_averages'
    },
    // Add more script URLs here
];

// List of GitHub repositories to clone
const githubRepos = [
    {
        url: 'https://github.com/harryguiacorn/TradingView-Proprietary-Indicators',
        category: 'proprietary'
    },
    {
        url: 'https://github.com/azerhouani/TradingView_PineScripts',
        category: 'general'
    },
    {
        url: 'https://github.com/hiPirate/TradingView',
        category: 'strategies'
    },
    {
        url: 'https://github.com/Anderson-ALGO/Anderson-ALGO.github.io',
        category: 'advanced_libraries',
        subPath: 'Pine/Pine Wizards/RicardoSantos/pinescript-master/beta/arrays'
    },
    {
        url: 'https://github.com/ricardosantos79/pinescript',
        category: 'advanced_libraries'
    },
    {
        url: 'https://github.com/SHAREM-TRADING-SYSTEMS/Trading-Core-Strategies',
        category: 'smart_money'
    },
    {
        url: 'https://github.com/alexgrover/tradingview-scripts',
        category: 'indicators'
    },
    {
        url: 'https://github.com/Sun-Sunich/awesome-utils-dev',
        category: 'meta_resources'
    // (Remove this line entirely as it is an extra closing brace)
    // More repositories can be added here
];
    {
        url: 'https://github.com/Anderson-ALGO/Anderson-ALGO.github.io',
        category: 'advanced_libraries',
        subPath: 'Pine/Pine Wizards/RicardoSantos/pinescript-master/beta/arrays'
    },
    {
        url: 'https://github.com/ricardosantos79/pinescript',
        category: 'advanced_libraries'
    },
    {
        url: 'https://github.com/SHAREM-TRADING-SYSTEMS/Trading-Core-Strategies',
        category: 'smart_money'
    },
    {
        url: 'https://github.com/alexgrover/tradingview-scripts',
        category: 'indicators'
    },
    {
        url: 'https://github.com/Sun-Sunich/awesome-utils-dev',
        category: 'meta_resources'
    }
    // More repositories can be added here
];

// Function to extract script name from URL
function extractScriptName(url) {
    const urlParts = url.split('/');
    const scriptPart = urlParts.find(part => part.includes('-'));
    if (scriptPart) {
        const nameParts = scriptPart.split('-');
        nameParts.shift(); // Remove the ID part
        return nameParts.join('-');
    }
    return `script-${Date.now()}`;
}

// Function to analyze a Pine Script and determine its quality/features
function analyzeScript(scriptContent, scriptName) {
    const analysis = {
        name: scriptName,
        complexityScore: 0,
        features: [],
        potentialAdvantages: []
    };
    
    // Check for multi-timeframe support
    if (scriptContent.includes('timeframe.') || scriptContent.includes('request.security')) {
        analysis.features.push('Multi-Timeframe Support');
        analysis.potentialAdvantages.push('Advanced time frame analysis capabilities');
        analysis.complexityScore += 3;
    }
    
    // Check for advanced MAs
    if (scriptContent.includes('ta.tema') || scriptContent.includes('ta.wma') || 
        scriptContent.includes('ta.hma') || scriptContent.includes('ta.vwma')) {
        analysis.features.push('Advanced Moving Averages');
        analysis.potentialAdvantages.push('Uses sophisticated MA calculations');
        analysis.complexityScore += 2;
    }
    
    // Check for Smart Money Concepts
    if (scriptContent.includes('liquidity') || scriptContent.includes('order block') || 
        scriptContent.includes('supply zone') || scriptContent.includes('demand zone') ||
        scriptContent.includes('breaker block')) {
        analysis.features.push('Smart Money Concepts');
        analysis.potentialAdvantages.push('Identifies key market structures');
        analysis.complexityScore += 4;
    }
    
    // Check for Advanced Array Processing
    if (scriptContent.includes('matrix.') && scriptContent.includes('for ')) {
        analysis.features.push('Advanced Array Processing');
        analysis.potentialAdvantages.push('Complex data structure manipulation and advanced analytics');
        analysis.complexityScore += 5;
    }
    
    // Check for divergence detection
    if (scriptContent.includes('divergence') || 
       (scriptContent.includes('osc[') && scriptContent.includes('price['))) {
        analysis.features.push('Divergence Detection');
        analysis.potentialAdvantages.push('Early trend reversal identification');
        analysis.complexityScore += 3;
    }
    
    // Check for Statistical Methods
    if (scriptContent.includes('regression') || scriptContent.includes('variance') || 
        scriptContent.includes('standard deviation') || scriptContent.includes('linreg')) {
        analysis.features.push('Statistical Methods');
        analysis.potentialAdvantages.push('More accurate price predictions');
        analysis.complexityScore += 3;
    }
// Removed unused extractAlgorithmicCore function
        
        for (const pattern of mathFunctionPatterns) {
            const regex = new RegExp(pattern, 'g');
            let match;
            while ((match = regex.exec(scriptContent)) !== null) {
                mathFunctions.add(match[0]);
            }
        }
        
        algorithmicCore.mathFunctions = Array.from(mathFunctions);
    }
    
    // Extract computational blocks
    const blockRegex = /(?:var\s+)?(\w+)\s*=\s*.*?;/g;
    while ((match = blockRegex.exec(scriptContent)) !== null) {
        algorithmicCore.computationalBlocks[match[1]] = match[0];
    }
    
    return algorithmicCore;
}

// Function to scrape TradingView scripts
async function scrapeTradingViewScripts() {
    const browser = await puppeteer.launch({ headless: true });
    
    for (const script of tradingViewScripts) {
        const page = await browser.newPage();
        
        try {
            console.log(`Navigating to ${script.url}...`);
            await page.goto(script.url, { waitUntil: 'networkidle2', timeout: 60000 });
            
            // Wait for the chart interface to load
            await page.waitForSelector('.roundTabButton-JbssaNvk.small-JbssaNvk', { timeout: 30000 });
            
            // Get script title
            const scriptTitle = await page.evaluate(() => {
                const titleElement = document.querySelector('h1.tv-chart-view__title');
                return titleElement ? titleElement.textContent.trim() : null;
            });
            
            // Click the "Source code" tab
            await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('.roundTabButton-JbssaNvk.small-JbssaNvk'));
                const sourceCodeButton = buttons.find(button => button.textContent.trim() === 'Source code');
                if (sourceCodeButton) {
                    sourceCodeButton.click();
                } else {
                    throw new Error('"Source code" tab not found.');
                }
            });
            
            // Wait for the Pine Script code to appear
            await page.waitForFunction(() => {
                const codeElement = document.querySelector('.tv-script__code');
                return codeElement && codeElement.innerText.trim().length > 0;
            }, { timeout: 10000 });
            
            // Extract the Pine Script code and description
            const scriptData = await page.evaluate(() => {
                const codeElement = document.querySelector('.tv-script__code');
                const descElement = document.querySelector('.tv-chart-view__description-wrap');
                return {
                    code: codeElement ? codeElement.innerText : null,
                    description: descElement ? descElement.textContent.trim() : null
                };
            });
            
            if (scriptData.code) {
                // Create category directory if it doesn't exist
                const categoryDir = path.join(baseDir, script.category);
                if (!fs.existsSync(categoryDir)) fs.mkdirSync(categoryDir, { recursive: true });
                
                // Generate a clean script name
                const scriptName = scriptTitle || extractScriptName(script.url);
                const safeName = scriptName.replace(/[^a-zA-Z0-9_-]/g, '_');
                
                // Save the Pine Script to a file
                const scriptPath = path.join(categoryDir, `${safeName}.pine`);
                fs.writeFileSync(scriptPath, scriptData.code);
                
                // Save the description if available
                if (scriptData.description) {
                    fs.writeFileSync(path.join(categoryDir, `${safeName}.md`), 
                        `# ${scriptName}\n\n${scriptData.description}`);
                }
                
                // Analyze the script
                const analysis = analyzeScript(scriptData.code, scriptName);
                fs.writeFileSync(
                    path.join(analysisDir, `${safeName}_analysis.json`), 
                    JSON.stringify(analysis, null, 2)
                );
                
                console.log(`Successfully scraped "${scriptName}" to ${scriptPath}`);
            } else {
                console.warn(`No code found for ${script.url}`);
            }
        } catch (error) {
            console.error(`Error scraping ${script.url}:`, error);
        } finally {
            await page.close();
        }
    }
    
    await browser.close();
}

// Update your processGithubRepos function to handle subpaths

async function processGithubRepos() {
    for (const repo of githubRepos) {
        const repoName = repo.url.split('/').pop();
        const repoDir = path.join(baseDir, repo.category, repoName);
        
        // Create repository directory
        if (!fs.existsSync(repoDir)) fs.mkdirSync(repoDir, { recursive: true });
        
        try {
            console.log(`Cloning ${repo.url}...`);
            execSync(`git clone ${repo.url} ${repoDir}`, { stdio: 'inherit' });
            
            // Determine which directory to scan
            const scanDir = repo.subPath ? path.join(repoDir, repo.subPath) : repoDir;
            
            // Find all Pine Script files in the repository
            const findPineScripts = (dir) => {
                if (!fs.existsSync(dir)) {
                    console.warn(`Warning: Directory does not exist: ${dir}`);
                    return [];
                }
                const items = fs.readdirSync(dir);
                let results = [];
                for (const item of items) {
                    const itemPath = path.join(dir, item);
                    const stat = fs.statSync(itemPath);
                    if (stat.isDirectory()) {
                        results = results.concat(findPineScripts(itemPath));
                    } else if (item.endsWith('.pine') || 
                              item.endsWith('.txt') || 
                              item.endsWith('.pinescript') || 
                              (item.endsWith('.md') && fs.readFileSync(itemPath, 'utf-8').includes('//@version='))) {
                        results.push(itemPath);
                    }
                }
                return results;
            };
            
            const pineScriptFiles = findPineScripts(scanDir);
            console.log(`Found ${pineScriptFiles.length} Pine Script files in ${repoName}${repo.subPath ? ' (subpath: '+repo.subPath+')' : ''}`);
            
            // Analyze each Pine Script as before
            for (const filePath of pineScriptFiles) {
                const scriptContent = fs.readFileSync(filePath, 'utf-8');
                const scriptName = path.basename(filePath, path.extname(filePath));
                const analysis = analyzeScript(scriptContent, scriptName);
                fs.writeFileSync(
                    path.join(analysisDir, `${scriptName}_analysis.json`), 
                    JSON.stringify(analysis, null, 2)
                );
            }
        } catch (error) {
            console.error(`Error processing repository ${repo.url}:`, error);
        }
    }
}

// Add after your existing code

// Import the research repository utilities
const ResearchRepository = require('./src/utils/research-repository');
const dataAggregator = require('./src/utils/data-aggregator');

// Function to import scraped data into the research repository
async function importToResearchRepository() {
    console.log("Importing scraped data into research repository...");
    const summary = dataAggregator.importAllScrapedData();
    console.log(`Imported ${summary.totalImported} indicators into research repository.`);
    return summary;
}

// Function to run the complete pipeline
async function runPipeline() {
    // Scrape scripts if needed
    if (tradingViewScripts.length > 0) {
        console.log("Scraping TradingView scripts...");
        await scrapeTradingViewScripts();
    }
    
    // Process GitHub repos if needed
    if (githubRepos.length > 0) {
        console.log("Processing GitHub repositories...");
        await processGithubRepos();
    }
    
    // Import data into research repository
    await importToResearchRepository();
    
    // Generate demo research for sample symbols
    console.log("Generating sample research presentations...");
    await dataAggregator.generateDemoResearch();
    
    console.log("Pipeline completed successfully!");
}

// Expose functions for CLI use
module.exports = {
    scrapeTradingViewScripts,
    processGithubRepos,
    importToResearchRepository,
// Removed unused ResearchRepository import
};

// If run directly, execute the pipeline
if (require.main === module) {
    runPipeline().catch(error => {
        console.error("Error in pipeline:", error);
    });
}
    dataAggregator.generateDemoResearch();
