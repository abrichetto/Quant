/**
 * Turtle Trading Rules Indicator
 * Adapted for AlgoTrader Pro
 * Calculates breakout levels and generates entry/exit signals for custom charts.
 */

// Configurable parameters
const config = {
    entryLength: 20, // Lookback period for entry signals
    exitLength: 10,  // Lookback period for exit signals
  };
  
  /**
   * Calculate the highest and lowest prices over a given period.
   * @param {Array<number>} prices - Array of historical prices.
   * @param {number} length - Lookback period.
   * @returns {Object} - { highest, lowest }
   */
  function calculateBreakoutLevels(prices, length) {
    const highest = Math.max(...prices.slice(-length));
    const lowest = Math.min(...prices.slice(-length));
    return { highest, lowest };
  }
  
  /**
   * Generate Turtle Trading signals based on breakout levels.
   * @param {Array<number>} prices - Array of historical prices.
   * @param {number} entryLength - Lookback period for entry signals.
   * @param {number} exitLength - Lookback period for exit signals.
   * @returns {Object} - Signals and breakout levels.
   */
  function generateTurtleSignals(prices, entryLength, exitLength) {
    const { highest: entryHigh, lowest: entryLow } = calculateBreakoutLevels(prices, entryLength);
    const { highest: exitHigh, lowest: exitLow } = calculateBreakoutLevels(prices, exitLength);
  
    const currentPrice = prices[prices.length - 1];
    const signals = {
      buySignal: currentPrice >= entryHigh,
      sellSignal: currentPrice <= entryLow,
      buyExit: currentPrice <= exitLow,
      sellExit: currentPrice >= exitHigh,
    };
  
    return {
      entryHigh,
      entryLow,
      exitHigh,
      exitLow,
      signals,
    };
  }
  
  /**
   * Visualize Turtle Trading breakout levels and signals using Chart.js.
   * @param {Array<number>} prices - Array of historical prices.
   * @param {Object} turtleData - Breakout levels and signals.
   */
  function visualizeTurtleTrading(prices, turtleData) {
    const ctx = document.getElementById('turtleChart').getContext('2d');
  
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: prices.map((_, index) => `Day ${index + 1}`),
        datasets: [
          {
            label: 'Price',
            data: prices,
            borderColor: 'blue',
            borderWidth: 2,
            fill: false,
          },
          {
            label: 'Entry High',
            data: Array(prices.length - config.entryLength).fill(null).concat(
              Array(config.entryLength).fill(turtleData.entryHigh)
            ),
            borderColor: 'green',
            borderWidth: 1,
            borderDash: [5, 5],
          },
          {
            label: 'Entry Low',
            data: Array(prices.length - config.entryLength).fill(null).concat(
              Array(config.entryLength).fill(turtleData.entryLow)
            ),
            borderColor: 'red',
            borderWidth: 1,
            borderDash: [5, 5],
          },
          {
            label: 'Exit High',
            data: Array(prices.length - config.exitLength).fill(null).concat(
              Array(config.exitLength).fill(turtleData.exitHigh)
            ),
            borderColor: 'purple',
            borderWidth: 1,
            borderDash: [5, 5],
          },
          {
            label: 'Exit Low',
            data: Array(prices.length - config.exitLength).fill(null).concat(
              Array(config.exitLength).fill(turtleData.exitLow)
            ),
            borderColor: 'orange',
            borderWidth: 1,
            borderDash: [5, 5],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                return `${context.dataset.label}: ${context.raw}`;
              },
            },
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Time',
            },
          },
          y: {
            title: {
              display: true,
              text: 'Price',
            },
          },
        },
      },
    });
  }
  
  // Example usage
  const historicalPrices = [100, 102, 104, 103, 105, 107, 110, 108, 107, 109, 112, 115, 113, 116, 118, 120, 119, 121, 123, 125];
  const turtleData = generateTurtleSignals(historicalPrices, config.entryLength, config.exitLength);
  
  // Visualize the Turtle Trading strategy
  document.addEventListener('DOMContentLoaded', () => {
    visualizeTurtleTrading(historicalPrices, turtleData);
  });