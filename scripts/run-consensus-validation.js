const ConsensusValidationFramework = require('../research-repository/testing/consensus-validation-methodology');
const fs = require('fs');
const path = require('path');

async function runValidation() {
  console.log("Running Portfolio Manager Consensus Validation...");
  
  const validator = new ConsensusValidationFramework({
    testPeriods: [
      { start: '2022-01-01', end: '2022-02-28' }, // Initial test with shorter period
    ],
    assets: ['BTC', 'ETH', 'AAPL'] // Start with limited assets
  });
  
  try {
    const results = await validator.runValidation();
    
    console.log("\n===== CONSENSUS VALIDATION RESULTS =====");
    console.log(`Signals Processed: ${results.signalsProcessed}`);
    console.log(`Average Noise Reduction: ${results.noiseReduction.average}%`);
    console.log(`False Positive Reduction: ${results.falsePositiveReduction}%`);
    console.log("\nNoise Reduction by Asset:");
    
    Object.entries(results.noiseReduction.byAsset).forEach(([asset, reduction]) => {
      console.log(`  ${asset}: ${reduction}%`);
    });
    
    // Save results
    const resultsDir = path.join(__dirname, '../research-repository/testing/results');
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });
    
    fs.writeFileSync(
      path.join(resultsDir, `consensus-validation-${new Date().toISOString().split('T')[0]}.json`),
      JSON.stringify(results, null, 2)
    );
    
    console.log(`\nResults saved to file.`);
    
  } catch (error) {
    console.error("Error running validation:", error);
  }
}

// Run the validation if executed directly
if (require.main === module) {
  runValidation().catch(console.error);
}

module.exports = runValidation;