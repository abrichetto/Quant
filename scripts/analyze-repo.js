const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Analyzes the repository structure and identifies integration points for IBKR
 */
function analyzeRepository() {
  console.log("\n=== AlgoTrader Pro Repository Analysis ===\n");
  
  // Repository statistics
  try {
    const gitStats = execSync('git log --pretty=format:"%h%x09%an%x09%ad%x09%s" --date=short').toString();
    const commitCount = gitStats.split('\n').length;
    console.log(`Total commits: ${commitCount}`);
    
    const contributors = new Set();
    gitStats.split('\n').forEach(line => {
      const parts = line.split('\t');
      if (parts.length >= 2) {
        contributors.add(parts[1]);
      }
    });
    console.log(`Contributors: ${contributors.size}`);
    
    const filesChanged = execSync('git ls-files | wc -l').toString().trim();
    console.log(`Total files: ${filesChanged}`);
  } catch (error) {
    console.log("Git stats unavailable. Repository may not be initialized.");
  }
  
  // Directory structure
  console.log("\n--- Directory Structure ---");
  const baseDir = path.resolve(__dirname, '..');
  const directories = [
    'src', 
    'scripts', 
    'research-repository', 
    'docs', 
    'tests'
  ];
  
  directories.forEach(dir => {
    const dirPath = path.join(baseDir, dir);
    if (fs.existsSync(dirPath)) {
      const fileCount = fs.readdirSync(dirPath).length;
      console.log(`${dir}: ${fileCount} items`);
    } else {
      console.log(`${dir}: Not found`);
    }
  });
  
  // Check for IBKR integration points
  console.log("\n--- IBKR Integration Points ---");
  
  // Proposed integration locations
  const integrationPoints = [
    {
      path: '/src/execution',
      purpose: 'Trade execution services',
      status: 'Required',
      files: ['ibkr-client.js', 'order-manager.js', 'position-tracker.js']
    },
    {
      path: '/src/data/market-data',
      purpose: 'Real-time market data feeds',
      status: 'Required',
      files: ['ibkr-market-feed.js']
    },
    {
      path: '/src/portfolio',
      purpose: 'Portfolio management and tracking',
      status: 'Required',
      files: ['portfolio-manager.js', 'position-sizing.js']
    },
    {
      path: '/research-repository/ibkr',
      purpose: 'IBKR specific research and documentation',
      status: 'Recommended',
      files: ['api-documentation.md', 'connection-guide.md']
    }
  ];
  
  integrationPoints.forEach(point => {
    const fullPath = path.join(baseDir, point.path);
    let status = 'Missing';
    
    if (fs.existsSync(fullPath)) {
      status = 'Found';
      
      // Check for required files
      const missingFiles = point.files.filter(file => {
        return !fs.existsSync(path.join(fullPath, file));
      });
      
      if (missingFiles.length > 0) {
        status += ` (missing: ${missingFiles.join(', ')})`;
      }
    }
    
    console.log(`${point.path}: ${status}`);
    console.log(`  Purpose: ${point.purpose}`);
    console.log(`  Status: ${point.status}`);
  });

  // Analyze implementation completeness
  console.log("\n--- Implementation Status ---");
  const components = [
    { name: 'Portfolio Manager Consensus Framework', path: '/src/signals/agents/portfolio-managers/portfolio-manager-framework.js' },
    { name: 'Signal Orchestrator', path: '/src/signals/signal-orchestrator.js' },
    { name: 'Alpha Vantage Integration', path: '/src/utils/alpha-vantage-client.js' },
    { name: 'Research Repository', path: '/src/utils/research-repository.js' },
    { name: 'IBKR Client', path: '/src/execution/ibkr-client.js' }
  ];
  
  components.forEach(component => {
    const fullPath = path.join(baseDir, component.path);
    let status = 'Not implemented';
    
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lineCount = content.split('\n').length;
      const functionCount = (content.match(/function /g) || []).length;
      status = `Implemented (${lineCount} lines, ${functionCount} functions)`;
    }
    
    console.log(`${component.name}: ${status}`);
  });
  
  // Next steps for IBKR integration
  console.log("\n--- IBKR Integration Next Steps ---");
  console.log("1. Create IBKR client module for API connectivity");
  console.log("2. Implement order execution framework");
  console.log("3. Add real-time market data subscription");
  console.log("4. Develop position and portfolio tracking");
  console.log("5. Integrate with existing signals framework");
  
  console.log("\n=== Analysis Complete ===\n");
}

// Run the analysis
analyzeRepository();