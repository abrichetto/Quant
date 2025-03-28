# Data Directory

## Overview
AlgoTrader Pro is a comprehensive tool designed for scraping, analyzing, and managing Pine Scripts from TradingView and GitHub. This project aims to facilitate the development and organization of trading indicators and strategies by providing a structured approach to data collection and analysis.

## Features
- **Scraping TradingView Scripts**: Functions to navigate to TradingView script URLs, extract script code and descriptions, and save the data in organized directories.
- **Cloning GitHub Repositories**: Ability to clone specified GitHub repositories, search for Pine Script files, and analyze them for features and complexity.
- **Script Analysis**: Evaluation of Pine Scripts for various features such as multi-timeframe support, advanced moving averages, smart money concepts, and more.
- **Algorithmic Core Extraction**: Extraction of the mathematical core of Pine Scripts for potential reimplementation in other programming languages.
- **Utility Functions**: Helper functions for file operations and path handling to streamline the workflow.

## Project Structure
```
algotrader-pro
├── src
│   ├── scrapers
│   │   ├── tradingview-scraper.js
│   │   └── github-scraper.js
│   ├── analyzers
│   │   ├── script-analyzer.js
│   │   └── algorithm-extractor.js
│   ├── utils
│   │   ├── file-utils.js
│   │   └── path-utils.js
│   ├── config
│   │   ├── sources.js
│   │   └── categories.js
│   └── index.js
├── data
│   ├── indicators
│   │   ├── moving_averages
│   │   ├── smart_money
│   │   └── advanced_libraries
│   └── analysis
│       └── metadata
├── tests
│   ├── scrapers
│   ├── analyzers
│   └── utils
├── package.json
├── .gitignore
├── .eslintrc.js
└── README.md
```

## Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd algotrader-pro
   ```
3. Install dependencies:
   ```
   npm install
   ```

## Usage
- To scrape TradingView scripts, run the appropriate scraper script located in the `src/scrapers` directory.
- Analyze the scraped scripts using the functions provided in the `src/analyzers` directory.
- Utilize utility functions from the `src/utils` directory for file and path operations.

## Contribution
Contributions are welcome! Please fork the repository and submit a pull request with your changes. Ensure that your code adheres to the project's coding standards and includes appropriate tests.

## License
This project is licensed under the MIT License. See the LICENSE file for more details.

# AlgoTrader Pro: Data Directory

## Overview
This directory contains all the data assets used by the AlgoTrader Pro system. It serves as a centralized repository for market data, scraped indicators, analysis results, and reference datasets that power the trading algorithms and visualization components.

## Data Categories

### Market Data
- **Historical Prices**: OHLCV data for various instruments
- **Volume Profiles**: Trading volume distributions by price levels
- **Liquidity Data**: Order book snapshots and market depth information

### Indicators
- **Moving Averages**: Standard and custom moving average implementations
- **Smart Money**: Order block and liquidity indicators
- **Volatility**: Statistical volatility measures and bands
- **Custom**: Ricardo Santos' regression and statistical models

### Analysis Results
- **Indicator Performance**: Backtesting results and metrics
- **Pattern Recognition**: Identified chart patterns and their statistics
- **Statistical Studies**: Market correlation and regression analysis outputs

## Directory Structure