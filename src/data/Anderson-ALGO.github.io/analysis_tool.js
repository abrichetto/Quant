const fs = require('fs');
const path = require('path');

const inputFilePath = path.join(__dirname, 'data/input.json');

// Define the folders to analyze
const foldersToAnalyze = [
  '/path/to/Anderson-ALGO.github.io/Pine/Pine Wizards/Balipur',
  '/path/to/Anderson-ALGO.github.io/Pine/Pine Wizards/Madrid',
];

// Keywords to look for in Pine Script files
const keywordsToFlag = [
  'correlation', // Statistical methods
  'machine learning', // Advanced techniques
  'neural network',
  'regression',
  'Sharpe', // Risk-adjusted return
  'Sortino',
  'volatility',
  'breakout', // Trend-following logic
  'mean reversion', // Mean-reversion strategies
  'custom function', // Unique custom logic
];

// Function to analyze a single file
function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const findings = [];

  // Check for flagged keywords
  keywordsToFlag.forEach((keyword) => {
    if (content.toLowerCase().includes(keyword.toLowerCase())) {
      findings.push(`Keyword found: "${keyword}"`);
    }
  });

  // Check for script length (longer scripts may indicate complexity)
  const lineCount = content.split('\n').length;
  if (lineCount > 200) {
    findings.push(`Long script detected (${lineCount} lines)`);
  }

  // Return findings
  return findings;
}

// Function to analyze all files in a folder
function analyzeFolder(folderPath) {
  const results = [];
  const files = fs.readdirSync(folderPath);

  files.forEach((file) => {
    const filePath = path.join(folderPath, file);
    if (fs.statSync(filePath).isFile() && file.endsWith('.pine')) {
      console.log(`Analyzing file: ${file}`);
      const findings = analyzeFile(filePath);
      if (findings.length > 0) {
        results.push({
          file: filePath,
          findings,
        });
      }
    }
  });

  return results;
}

// Main function to analyze all folders
function analyzeFolders() {
  const allResults = [];

  foldersToAnalyze.forEach((folder) => {
    console.log(`Analyzing folder: ${folder}`);
    const folderResults = analyzeFolder(folder);
    allResults.push(...folderResults);
  });

  // Log results
  if (allResults.length > 0) {
    console.log('\n=== Analysis Results ===');
    allResults.forEach((result) => {
      console.log(`\nFile: ${result.file}`);
      result.findings.forEach((finding) => {
        console.log(`  - ${finding}`);
      });
    });

    // Save results to a file for further review
    fs.writeFileSync(
      './analysis_results.json',
      JSON.stringify(allResults, null, 2)
    );
    console.log('\nAnalysis results saved to analysis_results.json');
  } else {
    console.log('\nNo significant findings. All scripts appear standard.');
  }
}

// Run the analysis
analyzeFolders();