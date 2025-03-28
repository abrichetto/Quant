# AlgoTrader

Algorithmic trading application for cryptocurrency futures markets.

## Features

- Automated trading using OCR-based signal detection
- Support for multiple trading platforms (IntentX, ApolloX)
- Web interface for monitoring and control
- Enhanced TradingView strategy integration
- Automated region detection and calibration
- Robust error handling and graceful shutdown
## GUI and Dashboard Features

- Advanced real-time trading dashboards with WebSocket updates
- Dark mode support across extension and web interfaces 
- ReactJS-based monitoring with performance graphs
- Agent performance metrics and PnL tracking
- Risk management alerts and position visualization
- Multi-source signal strength indicators
- Pattern recognition with TensorFlow.js analysis
- Integrated news feed with sentiment scoring
- LLM-powered hourly market analysis reports

## Trading Agents

- Risk Management Agent: Real-time portfolio monitoring and auto-hedging
- Signal Detection Agent: OCR-based multi-source signal processing
- News Analysis Agent: Real-time market sentiment analysis
- Pattern Recognition Agent: TensorFlow.js technical analysis
- LLM Consensus Agent: Hourly market trend evaluation

## Signal Processing

- Dynamic confidence threshold automation
- Multi-indicator correlation analysis
- ML-enhanced signal weighting system
- Historical pattern matching with TensorFlow.js
- Real-time market sentiment integration

## Requirements


- Node.js 18 or higher
- Tesseract OCR
- Platform-specific dependencies (see Installation)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure your environment:
```bash
cp .env.example .env
```

3. Update configuration in `config/default.json`

## Usage

Start the application:
```bash
npm start
```

Development mode:
```bash
npm run dev
```

## Configuration

The application can be configured using the `config/default.json` file. Here are some common configuration options:

- `server.port`: The port on which the web interface runs (default: 2325).
- `platform`: The trading platform to use (e.g., "intentx", "apollox").
- `platforms.intentx.apiKey`: Your IntentX API key.
- `platforms.intentx.apiSecret`: Your IntentX API secret.
- `platforms.apollox.apiKey`: Your ApolloX API key.
- `platforms.apollox.apiSecret`: Your ApolloX API secret.
- `strategies.tradingview.webhookUrl`: The webhook URL for TradingView alerts.
- `strategies.tradingview.apiKey`: Your TradingView API key.
- `ocr.language`: The language for OCR processing (default: "eng").
- `ocr.confidenceThreshold`: The confidence threshold for OCR results (default: 50).
- `logging.level`: The logging level (default: "info").
- `logging.file`: The file path for log output (default: "logs/algotrade.log").

## Troubleshooting

If you encounter issues, here are some common troubleshooting steps:

- Ensure that all dependencies are installed correctly.
- Verify that the configuration file (`config/default.json`) is set up properly.
- Check the log file (`logs/algotrade.log`) for error messages.
- Make sure that the Tesseract OCR is installed and accessible from your system's PATH.
- Ensure that the correct API keys and secrets are provided for the selected trading platform.

## License

MIT License - See LICENSE file for details
