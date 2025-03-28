const SignalsAgent = require('../src/signals/signals-agent');
const CryptoSignalOrchestrator = require('../src/signals/crypto-signal-orchestrator');
const ResearchRepository = require('../src/utils/research-repository');

/**
 * Generate signals for BTC and ETH with Portfolio Manager Consensus
 */
async function main() {
  console.log('Generating BTC and ETH signals with Portfolio Manager Consensus...');
  
  const repository = new ResearchRepository();
  const signalsAgent = new SignalsAgent({ repository });
  const orchestrator = new CryptoSignalOrchestrator({ repository });
  
  try {
    // Generate signals for BTC
    console.log('Generating raw signal for BTC...');
    const btcSignal = await signalsAgent.generateSignals('BTC');
    
    // Process through portfolio manager consensus
    console.log('Processing BTC signal through portfolio manager consensus...');
    const btcFinalSignal = await orchestrator.processSignal(btcSignal.signals);
    
    // Store the final signal
    const btcFilePath = repository.storeResearch(
      'BTC Final Signal with Portfolio Manager Consensus',
      'signals',
      btcFinalSignal,
      {
        type: 'consensus_signal',
        symbol: 'BTC',
        strength: btcFinalSignal.signal_strength,
        timestamp: new Date().toISOString()
      }
    );
    
    // Generate signals for ETH
    console.log('Generating raw signal for ETH...');
    const ethSignal = await signalsAgent.generateSignals('ETH');
    
    // Process through portfolio manager consensus
    console.log('Processing ETH signal through portfolio manager consensus...');
    const ethFinalSignal = await orchestrator.processSignal(ethSignal.signals);
    
    // Store the final signal
    const ethFilePath = repository.storeResearch(
      'ETH Final Signal with Portfolio Manager Consensus',
      'signals',
      ethFinalSignal,
      {
        type: 'consensus_signal',
        symbol: 'ETH',
        strength: ethFinalSignal.signal_strength,
        timestamp: new Date().toISOString()
      }
    );
    
    // Display results
    console.log('\n=== BTC Signal Results ===');
    console.log(`Raw Signal: ${btcSignal.signals.signal_strength} (${btcSignal.signals.overall_signal})`);
    console.log(`Consensus Signal: ${btcFinalSignal.signal_strength} (${btcFinalSignal.overall_signal})`);
    console.log(`Recommended Action: ${btcFinalSignal.recommended_action}`);
    
    if (btcFinalSignal.consensus_applied) {
      console.log('\nPortfolio Manager Perspectives:');
      btcFinalSignal.manager_consensus.discussions.forEach(discussion => {
        console.log(`- ${discussion.manager}: ${discussion.point}`);
      });
    }
    
    console.log(`\nDetailed signal saved to: ${btcFilePath}`);
    
    console.log('\n=== ETH Signal Results ===');
    console.log(`Raw Signal: ${ethSignal.signals.signal_strength} (${ethSignal.signals.overall_signal})`);
    console.log(`Consensus Signal: ${ethFinalSignal.signal_strength} (${ethFinalSignal.overall_signal})`);
    console.log(`Recommended Action: ${ethFinalSignal.recommended_action}`);
    
    if (ethFinalSignal.consensus_applied) {
      console.log('\nPortfolio Manager Perspectives:');
      ethFinalSignal.manager_consensus.discussions.forEach(discussion => {
        console.log(`- ${discussion.manager}: ${discussion.point}`);
      });
    }
    
    console.log(`\nDetailed signal saved to: ${ethFilePath}`);
    
  } catch (error) {
    console.error('Error generating signals:', error);
  }
}

// Run the main function
main().catch(console.error);