import * as https from 'https';
import { WebSocketServer } from 'ws';

export class Logger {
  info(message: string): void {
    console.log(`INFO: ${message}`);
  }

  error(message: string): void {
    console.error(`ERROR: ${message}`);
  }
}

class WebSocketService {
  private wss: WebSocketServer;
  private actualPort!: number;

  constructor(preferredPort: number) {
    const server = https.createServer();

    server.listen(preferredPort, () => {
      this.actualPort = preferredPort;
      const logger = new Logger();
      logger.info(`WebSocket server started on ws://localhost:${preferredPort}`);
    });

    server.on('error', (error: any) => {
        const logger = new Logger();
        if (error.code === 'EADDRINUSE') {
            logger.error(`Port ${preferredPort} is already in use.`);
            process.exit(1); // Exit gracefully
        } else {
            throw error;
        }
    });

    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (ws) => {
      const logger = new Logger();
      logger.info('New WebSocket client connected');
      ws.send(JSON.stringify({ message: 'Welcome to the WebSocket server!' }));

      ws.on('message', (message) => {
        const logger = new Logger();
        logger.info(`Received message: ${message}`);
        ws.send(`Echo: ${message}`);
      });

      ws.on('close', () => {
        const logger = new Logger();
        logger.info('WebSocket client disconnected');
      });
    });
  }

  public getPort(): number {
    return this.actualPort;
  }
}

export function startWebSocketServer(port: number = 3031): WebSocketService {
  return new WebSocketService(port);
}