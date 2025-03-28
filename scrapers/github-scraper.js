const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { analyzeScript } = require('../src/analyzers/script-analyzer');
const { extractAlgorithmicCore } = require('../src/analyzers/algorithm-extractor');

// Base directory for indicators
const baseDir = path.join(__dirname, '../../data/indicators');
const analysisDir = path.join(__dirname, '../../data/analysis/metadata');

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
    }
];

// Function to process GitHub repositories
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

module.exports = {
    processGithubRepos
};