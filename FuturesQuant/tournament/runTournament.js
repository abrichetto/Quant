/**
 * runTournament
 * 
 * Script to run the tournament.
 */

const TournamentManager = require('./TournamentManager');
const ExampleAgent = require('../agents/ExampleAgent');

// Create agents
const agents = [
  new ExampleAgent({ name: 'CathyWoodAgent' }),
  new ExampleAgent({ name: 'WarrenBuffetAgent' })
];

// Create tournament manager
const tournamentManager = new TournamentManager({
  agents,
  indicatorConfig: { period: 14 }
});

// Start the tournament
tournamentManager.startTournament();