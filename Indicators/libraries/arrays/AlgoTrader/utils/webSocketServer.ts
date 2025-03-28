import * as https from 'https';
import { WebSocketServer } from 'ws';
import { Logger } from './logger';

const logger = new Logger();

class WebSocketService {
  private wss: WebSocketServer;
  private actualPort!: number;

  constructor(preferredPort: number) {
    const server = https.createServer();

    server.listen(preferredPort, () => {
      this.actualPort = preferredPort;
      logger.info(`WebSocket server started on ws://localhost:${preferredPort}`);
    });

    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${preferredPort} is already in use.`);
        process.exit(1); // Exit gracefully
      } else {
        throw error;
      }
    });

    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (ws) => {
      logger.info('New WebSocket client connected');
      ws.send(JSON.stringify({ message: 'Welcome to the WebSocket server!' }));

      ws.on('message', (message) => {
        logger.info(`Received message: ${message}`);
        ws.send(`Echo: ${message}`);
      });

      ws.on('close', () => {
        logger.info('WebSocket client disconnected');
      });
    });
  }

  public getPort(): number {
    return this.actualPort;
  }
}

export function startWebSocketServer(port: number = 5010): WebSocketService  {
  return new WebSocketService(port);
}