import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { TradingTournament } from './tournament';

export class TournamentWebUI {
  private app = express();
  private server = http.createServer(this.app);
  private io = new Server(this.server);
  
  constructor(private tournament: TradingTournament, private port = 3000) {
    this.setupRoutes();
    this.setupWebSockets();
    
    this.server.listen(port, () => {
      console.log(`Tournament UI available at http://localhost:${port}`);
    });
  }
  
  private setupRoutes(): void {
    // Serve static files
    this.app.use(express.static('public'));
    
    // API for tournament data
    this.app.get('/api/leaderboard', (req, res) => {
      res.json({
        leaderboard: this.tournament.getLeaderboard(),
        timestamp: new Date()
      });
    });
  }
  
  private setupWebSockets(): void {
    // Send updates every 5 seconds
    setInterval(() => {
      this.io.emit('leaderboardUpdate', {
        leaderboard: this.tournament.getLeaderboard(),
        timestamp: new Date()
      });
    }, 5000);
    
    // Handle client connections
    this.io.on('connection', (socket) => {
      console.log('Client connected to tournament UI');
      
      // Send initial data
      socket.emit('leaderboardUpdate', {
        leaderboard: this.tournament.getLeaderboard(),
        timestamp: new Date()
      });
      
      // Handle manual weight adjustments from UI
      socket.on('adjustWeight', (data: {agentId: string, adjustment: number}) => {
        this.tournament.manuallyAdjustWeight(data.agentId, data.adjustment);
      });
    });
  }
}