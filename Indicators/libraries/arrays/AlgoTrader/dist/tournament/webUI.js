"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TournamentWebUI = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
class TournamentWebUI {
    constructor(tournament, port = 3000) {
        this.tournament = tournament;
        this.port = port;
        this.app = (0, express_1.default)();
        this.server = http_1.default.createServer(this.app);
        this.io = new socket_io_1.Server(this.server);
        this.setupRoutes();
        this.setupWebSockets();
        this.server.listen(port, () => {
            console.log(`Tournament UI available at http://localhost:${port}`);
        });
    }
    setupRoutes() {
        this.app.use(express_1.default.static('public'));
        this.app.get('/api/leaderboard', (req, res) => {
            res.json({
                leaderboard: this.tournament.getLeaderboard(),
                timestamp: new Date()
            });
        });
    }
    setupWebSockets() {
        setInterval(() => {
            this.io.emit('leaderboardUpdate', {
                leaderboard: this.tournament.getLeaderboard(),
                timestamp: new Date()
            });
        }, 5000);
        this.io.on('connection', (socket) => {
            console.log('Client connected to tournament UI');
            socket.emit('leaderboardUpdate', {
                leaderboard: this.tournament.getLeaderboard(),
                timestamp: new Date()
            });
            socket.on('adjustWeight', (data) => {
                this.tournament.manuallyAdjustWeight(data.agentId, data.adjustment);
            });
        });
    }
}
exports.TournamentWebUI = TournamentWebUI;
//# sourceMappingURL=webUI.js.map