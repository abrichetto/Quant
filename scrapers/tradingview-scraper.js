const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { baseDir, analysisDir } = require('../config/config');
const { analyzeScript } = require('../utils/script-analysis-utils');

// Function to ensure a directory exists
function ensureDirectoryExists(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

// Ensure base directories exist
// List of TradingView scripts to scrape
const tradingViewScripts = [
    {
        url: 'https://www.tradingview.com/script/bkvQ5hNF-CM-Ultimate-MA-MTF-V4/',
        category: 'moving_averages'
    }
    // Add more script URLs here
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
        features: [],
        potentialAdvantages: [],
        complexityScore: 0,
    };

    if (scriptContent.includes('liquidity') || scriptContent.includes('order block')) {
        analysis.features.push('Smart Money Concepts');
        analysis.potentialAdvantages.push('Identifies key market structures');
        analysis.complexityScore += 4;
    }

    if (scriptContent.includes('matrix.') && scriptContent.includes('for ')) {
        analysis.features.push('Advanced Array Processing');
        analysis.potentialAdvantages.push('Complex data structure manipulation');
        analysis.complexityScore += 5;
    }

    return analysis;
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
                ensureDirectoryExists(categoryDir);
                
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
                const analysis = await analyzeScript(scriptData.code, scriptName);
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

// Export the scraping function
module.exports = {
    scrapeTradingViewScripts,
    analyzeScript

};
module.exports = { analyzeScript };